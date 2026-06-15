import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { PageHeader } from '../../shared/page-header/page-header';
import { RoundStateService, ScoreService, StorageService } from '../../core/services';

@Component({
  selector: 'app-scorecard',
  imports: [RouterLink, PageHeader],
  templateUrl: './scorecard.html',
  styleUrl: './scorecard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Scorecard {
  private readonly roundState = inject(RoundStateService);
  private readonly score = inject(ScoreService);
  private readonly storage = inject(StorageService);
  private readonly route = inject(ActivatedRoute);

  /** Optional ?round=<id> selects a specific completed round from history. */
  private readonly requestedId = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('round'))),
    { initialValue: null },
  );

  /**
   * The round to display: the explicitly requested completed round, else
   * the active round, else the most recent completed round from history.
   */
  protected readonly round = computed(() => {
    const id = this.requestedId();
    if (id) {
      const fromHistory = this.storage.getRoundHistory().find((r) => r.id === id);
      if (fromHistory) {
        return fromHistory;
      }
    }
    return this.roundState.activeRound() ?? this.storage.getRoundHistory()[0] ?? null;
  });

  protected readonly subtitle = computed(
    () =>
      this.round()?.courseName ??
      'Every golf scramble hole — score, par, to par, and the card that changed the round.',
  );

  protected readonly isComplete = computed(() => this.round()?.status === 'complete');
  protected readonly holes = computed(() => this.round()?.holes ?? []);
  protected readonly players = computed(() => this.round()?.players ?? []);
  protected readonly hasScores = computed(() =>
    this.holes().some((hole) => hole.score !== undefined),
  );

  protected readonly totalScore = computed(() => {
    const round = this.round();
    return round ? this.score.totalScore(round) : 0;
  });

  protected readonly totalPar = computed(() => {
    const round = this.round();
    return round ? this.score.totalPar(round) : 0;
  });

  protected readonly toPar = computed(() => {
    const round = this.round();
    return round ? this.score.totalScoreToPar(round) : 0;
  });

  protected formatToPar(value: number): string {
    return this.score.formatToPar(value);
  }

  protected tone(scoreToPar: number): string {
    return this.score.tone(scoreToPar);
  }

  protected initials(name: string): string {
    return name.trim().charAt(0).toUpperCase() || '?';
  }

  protected formatDate(iso?: string): string {
    if (!iso) {
      return '';
    }
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
