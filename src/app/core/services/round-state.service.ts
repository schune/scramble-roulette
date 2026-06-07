import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Card, HoleCount, HoleResult, Player, Round } from '../models';
import { StorageService } from './storage.service';
import { CardDeckService } from './card-deck.service';
import { ScoreService } from './score.service';

/**
 * Orchestrates round setup, the per-hole play loop, and round completion.
 *
 * Setup ("draft") state backs the New Round screen. {@link startRound}
 * promotes the draft into a live {@link Round}. During play, a card is drawn
 * per hole (no repeats), par/score are recorded, and the team advances. The
 * active round is persisted via {@link StorageService} so a reload mid-round
 * is safe; completed rounds are written to local history.
 *
 * Cloud sync (Firestore) can be layered on later behind this same surface.
 */
@Injectable({ providedIn: 'root' })
export class RoundStateService {
  private readonly storage = inject(StorageService);
  private readonly deck = inject(CardDeckService);
  private readonly score = inject(ScoreService);

  /* ---------- Draft setup state ---------- */
  private readonly _courseName = signal('');
  private readonly _holeCount = signal<HoleCount | null>(null);
  private readonly _draftPlayers = signal<Player[]>([]);

  readonly draftCourseName = this._courseName.asReadonly();
  readonly holeCount = this._holeCount.asReadonly();
  readonly draftPlayers = this._draftPlayers.asReadonly();
  readonly canStart = computed(
    () => this._holeCount() !== null && this._draftPlayers().length >= 2,
  );

  /* ---------- Active round state ---------- */
  private readonly _activeRound = signal<Round | null>(null);
  readonly activeRound = this._activeRound.asReadonly();
  readonly hasActiveRound = computed(() => this._activeRound() !== null);
  readonly currentHole = computed(() => this._activeRound()?.currentHole ?? null);

  /** Card ids already used this round (across all drawn holes). */
  private readonly usedCardIds = computed(() =>
    (this._activeRound()?.holes ?? []).map((hole) => hole.card.id),
  );

  /** The HoleResult for the hole currently in play, if it has been drawn. */
  readonly currentHoleResult = computed<HoleResult | null>(() => {
    const round = this._activeRound();
    if (!round) {
      return null;
    }
    return round.holes.find((hole) => hole.holeNumber === round.currentHole) ?? null;
  });

  /** The card drawn for the current hole, or null before drawing. */
  readonly currentCard = computed(() => this.currentHoleResult()?.card ?? null);

  /** Whether a card can be drawn for the current hole. */
  readonly canDraw = computed(() => {
    const round = this._activeRound();
    if (!round || this.currentHoleResult()) {
      return false;
    }
    return !this.deck.isExhausted(this.usedCardIds(), round.packId);
  });

  /** Whether the current hole has a complete score and play can advance. */
  readonly canAdvance = computed(() => {
    const hole = this.currentHoleResult();
    return !!hole && hole.score !== undefined && hole.par !== undefined;
  });

  /** Whether the current hole is the final hole of the round. */
  readonly isFinalHole = computed(() => {
    const round = this._activeRound();
    return !!round && round.currentHole >= round.holeCount;
  });

  constructor() {
    const saved = this.storage.getActiveRound();
    if (saved) {
      this._activeRound.set(saved);
    }

    effect(() => {
      const round = this._activeRound();
      if (round) {
        this.storage.saveActiveRound(round);
      } else {
        this.storage.clearActiveRound();
      }
    });
  }

  /* ---------- Draft mutations ---------- */
  setCourseName(name: string): void {
    this._courseName.set(name.trim());
  }

  setHoleCount(count: HoleCount): void {
    this._holeCount.set(count);
  }

  addPlayer(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    this._draftPlayers.update((players) => [
      ...players,
      { id: this.createId(), name: trimmed },
    ]);
  }

  updatePlayer(id: string, name: string): void {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    this._draftPlayers.update((players) =>
      players.map((player) => (player.id === id ? { ...player, name: trimmed } : player)),
    );
  }

  removePlayer(id: string): void {
    this._draftPlayers.update((players) => players.filter((player) => player.id !== id));
  }

  resetDraft(): void {
    this._courseName.set('');
    this._holeCount.set(null);
    this._draftPlayers.set([]);
  }

  /* ---------- Round lifecycle ---------- */

  /**
   * Promote the current draft into a live, in-progress round.
   * Returns the created round, or `null` if the draft isn't valid.
   */
  startRound(): Round | null {
    const courseName = this._courseName().trim();
    const holeCount = this._holeCount();
    const players = this._draftPlayers();

    if (holeCount === null || players.length < 2) {
      return null;
    }

    const round: Round = {
      id: this.createId(),
      createdAt: new Date().toISOString(),
      holeCount,
      status: 'in-progress',
      players: players.map((player) => ({ ...player })),
      holes: [],
      currentHole: 1,
      packId: this.deck.defaultPackId,
      ...(courseName ? { courseName } : {}),
    };

    this._activeRound.set(round);
    return round;
  }

  /**
   * Draw a card for the current hole. No-ops if a card is already drawn or
   * the deck is exhausted. Returns the drawn card (or null).
   */
  drawCard(): Card | null {
    const round = this._activeRound();
    if (!round || !this.canDraw()) {
      return null;
    }

    const drawn = this.deck.draw(this.usedCardIds(), round.packId);
    if (!drawn) {
      return null;
    }

    const card = this.deck.personalize(drawn, round.players);
    const hole: HoleResult = { holeNumber: round.currentHole, card };
    this.updateRound((current) => ({ ...current, holes: [...current.holes, hole] }));
    return card;
  }

  /**
   * Record par and score for the current hole and classify the result.
   * Requires a card to have been drawn first.
   */
  recordCurrentHole(par: number, score: number): void {
    const round = this._activeRound();
    if (!round || !this.currentHoleResult()) {
      return;
    }

    const { scoreToPar, resultLabel } = this.score.computeHole(par, score);
    const completedAt = new Date().toISOString();
    this.updateRound((current) => ({
      ...current,
      holes: current.holes.map((hole) =>
        hole.holeNumber === current.currentHole
          ? { ...hole, par, score, scoreToPar, resultLabel, completedAt }
          : hole,
      ),
    }));
  }

  /** Advance to the next hole. Requires the current hole to be scored. */
  nextHole(): void {
    const round = this._activeRound();
    if (!round || !this.canAdvance() || this.isFinalHole()) {
      return;
    }
    this.updateRound((current) => ({ ...current, currentHole: current.currentHole + 1 }));
  }

  /**
   * Go back to the previous hole. Hole history is preserved — once a card is
   * drawn for a hole it stays tied to that hole, even when navigating back
   * and forward again.
   */
  previousHole(): void {
    const round = this._activeRound();
    if (!round || round.currentHole <= 1) {
      return;
    }
    this.updateRound((current) => ({
      ...current,
      currentHole: current.currentHole - 1,
    }));
  }

  /**
   * Finish the round: mark complete, save to local history, and clear the
   * active round. Returns the completed round (or null if invalid).
   */
  finishRound(): Round | null {
    const round = this._activeRound();
    if (!round || !this.canAdvance() || !this.isFinalHole()) {
      return null;
    }

    const completed: Round = {
      ...round,
      status: 'complete',
      completedAt: new Date().toISOString(),
    };

    this.storage.saveCompletedRound(completed);
    this._activeRound.set(null);
    this.resetDraft();
    return completed;
  }

  /**
   * End the active round early. When `save` is true, persists progress to
   * history (including partial rounds). When false, discards without saving.
   */
  endRound(save: boolean): Round | null {
    const round = this._activeRound();
    if (!round) {
      return null;
    }

    if (!save) {
      this._activeRound.set(null);
      this.resetDraft();
      return null;
    }

    const endedEarly = !this.isRoundFullyComplete(round);
    const completed: Round = {
      ...round,
      status: 'complete',
      completedAt: new Date().toISOString(),
      ...(endedEarly ? { endedEarly: true } : {}),
    };

    this.storage.saveCompletedRound(completed);
    this._activeRound.set(null);
    this.resetDraft();
    return completed;
  }

  /** Abandon the active round without saving it to history. */
  clear(): void {
    this._activeRound.set(null);
  }

  setActiveRound(round: Round | null): void {
    this._activeRound.set(round);
  }

  /* ---------- Helpers ---------- */
  private updateRound(mutator: (round: Round) => Round): void {
    this._activeRound.update((round) => (round ? mutator(round) : round));
  }

  private isRoundFullyComplete(round: Round): boolean {
    const scoredHoles = round.holes.filter(
      (hole) => hole.par !== undefined && hole.score !== undefined,
    );
    return scoredHoles.length >= round.holeCount && round.currentHole >= round.holeCount;
  }

  private createId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
