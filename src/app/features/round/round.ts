import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PageHeader } from '../../shared/page-header/page-header';
import { RoundStateService, ScoreService, SoundService } from '../../core/services';

@Component({
  selector: 'app-round',
  imports: [RouterLink, PageHeader],
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
  protected readonly confirmingUndo = signal(false);
  /** True while the draw animation plays — blocks double-click draws. */
  protected readonly dealing = signal(false);

  private drawTimer: ReturnType<typeof setTimeout> | null = null;

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
    this.destroyRef.onDestroy(() => {
      if (this.drawTimer) {
        clearTimeout(this.drawTimer);
      }
    });
  }

  /**
   * Draw the card for the current hole with a short reveal animation.
   * Guarded against double-clicks and an exhausted deck.
   */
  protected draw(): void {
    if (this.dealing() || !this.canDraw()) {
      return;
    }
    this.dealing.set(true);
    this.sound.play('draw');

    this.drawTimer = setTimeout(() => {
      const card = this.roundState.drawCard();
      if (card) {
        this.sound.play('reveal');
        this.editing.set(true);
        this.parInput.set(null);
        this.scoreInput.set(null);
      }
      this.dealing.set(false);
      this.drawTimer = null;
    }, 480);
  }

  protected setPar(par: number): void {
    this.parInput.set(par);
  }

  protected adjustScore(delta: number): void {
    const next = (this.scoreInput() ?? 0) + delta;
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
    this.syncFromHole();
  }

  protected finish(): void {
    const completed = this.roundState.finishRound();
    if (completed) {
      this.sound.play('roundComplete');
      this.router.navigate(['/scorecard'], { queryParams: { round: completed.id } });
    }
  }

  protected requestUndo(): void {
    this.confirmingUndo.set(true);
  }

  protected cancelUndo(): void {
    this.confirmingUndo.set(false);
  }

  protected confirmUndo(): void {
    this.confirmingUndo.set(false);
    this.roundState.previousHole();
    // Reopen the restored hole with its card + score data ready to edit.
    if (this.currentHoleResult()) {
      this.edit();
    } else {
      this.syncFromHole();
    }
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
