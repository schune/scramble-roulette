import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Card } from '../../core/models';
import { RoundStateService, ScoreService, SoundService } from '../../core/services';

type DrawCinematicPhase = 'charge' | 'shuffle' | 'flip' | 'exit';

@Component({
  selector: 'app-round',
  imports: [RouterLink],
  templateUrl: './round.html',
  styleUrl: './round.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Round {
  private readonly roundState = inject(RoundStateService);
  private readonly score = inject(ScoreService);
  private readonly sound = inject(SoundService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly round = this.roundState.activeRound;
  protected readonly currentCard = this.roundState.currentCard;
  protected readonly currentHoleResult = this.roundState.currentHoleResult;
  protected readonly canDraw = this.roundState.canDraw;
  protected readonly canAdvance = this.roundState.canAdvance;
  protected readonly isFinalHole = this.roundState.isFinalHole;

  protected readonly editing = signal(false);
  protected readonly parInput = signal<number | null>(null);
  protected readonly scoreInput = signal<number | null>(null);
  protected readonly confirmingEnd = signal(false);
  /** Full-screen draw cinematic phase, or null when idle. */
  protected readonly drawCinematic = signal<DrawCinematicPhase | null>(null);
  /** Card revealed mid-cinematic before the main UI takes over. */
  protected readonly cinematicCard = signal<Card | null>(null);
  /** Skips the in-page flip when the cinematic already handled the reveal. */
  protected readonly skipCardEntrance = signal(false);
  /** Flip finished — card stays face-up until the player dismisses. */
  protected readonly cinematicRevealed = signal(false);

  protected readonly sparkles = Array.from({ length: 28 }, (_, i) => i);

  private cinematicTimers: ReturnType<typeof setTimeout>[] = [];

  protected readonly parOptions = [3, 4, 5];

  protected readonly canSave = computed(
    () => this.parInput() !== null && (this.scoreInput() ?? 0) >= 1,
  );

  protected readonly resultPreview = computed(() => {
    const par = this.parInput();
    const score = this.scoreInput();
    if (par === null || score === null || score < 1) {
      return null;
    }
    return this.score.computeHole(par, score);
  });

  protected readonly totalScore = computed(() => {
    const round = this.round();
    return round ? this.score.totalScore(round) : 0;
  });

  protected readonly toPar = computed(() => {
    const round = this.round();
    return round ? this.score.totalScoreToPar(round) : 0;
  });

  constructor() {
    this.syncFromHole();
    this.destroyRef.onDestroy(() => this.clearCinematicTimers());
  }

  protected isDrawing(): boolean {
    return this.drawCinematic() !== null;
  }

  /**
   * Draw the card for the current hole with a full-screen cinematic reveal.
   * Guarded against double-clicks and an exhausted deck.
   */
  protected draw(): void {
    if (this.drawCinematic() || !this.canDraw()) {
      return;
    }

    if (this.prefersReducedMotion()) {
      this.completeDraw(this.roundState.drawCard());
      return;
    }

    this.clearCinematicTimers();
    this.cinematicCard.set(null);
    this.cinematicRevealed.set(false);
    this.skipCardEntrance.set(false);
    this.drawCinematic.set('charge');
    this.sound.play('draw');

    this.scheduleCinematic(() => this.drawCinematic.set('shuffle'), 520);
    this.scheduleCinematic(() => {
      this.drawCinematic.set('flip');
      const card = this.roundState.drawCard();
      if (card) {
        this.cinematicCard.set(card);
      }
    }, 1350);
    this.scheduleCinematic(() => {
      this.cinematicRevealed.set(true);
      this.sound.play('reveal');
    }, 2100);
  }

  /** Dismiss the reveal overlay and return to the play page. */
  protected dismissCinematic(): void {
    if (!this.cinematicRevealed() || !this.cinematicCard()) {
      return;
    }
    this.drawCinematic.set('exit');
    this.scheduleCinematic(() => this.finishCinematic(), 500);
  }

  private finishCinematic(): void {
    const hadCard = !!this.cinematicCard();
    this.drawCinematic.set(null);
    this.cinematicCard.set(null);
    this.cinematicRevealed.set(false);
    this.clearCinematicTimers();
    if (hadCard) {
      this.skipCardEntrance.set(true);
      this.editing.set(true);
      this.parInput.set(null);
      this.scoreInput.set(null);
    }
  }

  private completeDraw(card: Card | null): void {
    if (!card) {
      return;
    }
    this.sound.play('reveal');
    this.editing.set(true);
    this.parInput.set(null);
    this.scoreInput.set(null);
  }

  private scheduleCinematic(fn: () => void, ms: number): void {
    const id = setTimeout(fn, ms);
    this.cinematicTimers.push(id);
  }

  private clearCinematicTimers(): void {
    for (const id of this.cinematicTimers) {
      clearTimeout(id);
    }
    this.cinematicTimers = [];
  }

  private prefersReducedMotion(): boolean {
    return (
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  protected setPar(par: number): void {
    const prevPar = this.parInput();
    const score = this.scoreInput();
    this.parInput.set(par);
    if (score === null || score === prevPar) {
      this.scoreInput.set(par);
    }
  }

  protected adjustScore(delta: number): void {
    const next = (this.scoreInput() ?? this.parInput() ?? 0) + delta;
    this.scoreInput.set(Math.max(1, next));
  }

  protected onScoreInput(value: string): void {
    const parsed = Number(value);
    this.scoreInput.set(Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : null);
  }

  protected saveScore(): void {
    const par = this.parInput();
    const score = this.scoreInput();
    if (par === null || score === null || score < 1) {
      return;
    }
    this.roundState.recordCurrentHole(par, score);
    this.editing.set(false);
    this.sound.play('holeComplete');
  }

  protected edit(): void {
    const hole = this.currentHoleResult();
    this.parInput.set(hole?.par ?? null);
    this.scoreInput.set(hole?.score ?? null);
    this.editing.set(true);
  }

  protected next(): void {
    this.roundState.nextHole();
    this.skipCardEntrance.set(false);
    this.syncFromHole();
  }

  protected finish(): void {
    const completed = this.roundState.finishRound();
    if (completed) {
      this.sound.play('roundComplete');
      this.router.navigate(['/scorecard'], { queryParams: { round: completed.id } });
    }
  }

  protected previousHole(): void {
    this.roundState.previousHole();
    this.skipCardEntrance.set(false);
    this.syncFromHole();
  }

  protected requestEnd(): void {
    this.confirmingEnd.set(true);
  }

  protected cancelEnd(): void {
    this.confirmingEnd.set(false);
  }

  protected saveEnd(): void {
    this.confirmingEnd.set(false);
    const saved = this.roundState.endRound(true);
    if (saved) {
      this.sound.play('roundComplete');
      void this.router.navigate(['/scorecard'], { queryParams: { round: saved.id } });
    }
  }

  protected discardEnd(): void {
    this.confirmingEnd.set(false);
    this.roundState.endRound(false);
    void this.router.navigate(['/']);
  }

  protected holesPlayed(): number {
    return this.round()?.holes.length ?? 0;
  }

  protected formatToPar(value: number): string {
    return this.score.formatToPar(value);
  }

  protected tone(scoreToPar: number): string {
    return this.score.tone(scoreToPar);
  }

  protected initials(name: string): string {
    return name.trim().charAt(0).toUpperCase() || '?';
  }

  private syncFromHole(): void {
    const hole = this.currentHoleResult();
    if (hole && hole.par !== undefined && hole.score !== undefined) {
      this.editing.set(false);
      this.parInput.set(hole.par);
      this.scoreInput.set(hole.score);
    } else if (hole) {
      this.editing.set(true);
      this.parInput.set(null);
      this.scoreInput.set(null);
    } else {
      this.editing.set(false);
      this.parInput.set(null);
      this.scoreInput.set(null);
    }
  }
}
