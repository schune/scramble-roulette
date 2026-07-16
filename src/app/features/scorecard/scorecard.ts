import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { isMulliganCard, MULLIGAN_RULE } from '../../core/data/official-rules';
import { Card, Round } from '../../core/models';
import { PageHeader } from '../../shared/page-header/page-header';
import {
  AuthService,
  FeedService,
  RoundHistoryService,
  RoundStateService,
  ScoreService,
  ScrollLockService,
} from '../../core/services';

@Component({
  selector: 'app-scorecard',
  imports: [RouterLink, PageHeader],
  templateUrl: './scorecard.html',
  styleUrl: './scorecard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class Scorecard {
  private readonly roundState = inject(RoundStateService);
  private readonly score = inject(ScoreService);
  private readonly roundHistory = inject(RoundHistoryService);
  private readonly feed = inject(FeedService);
  private readonly auth = inject(AuthService);
  private readonly scrollLock = inject(ScrollLockService);
  private readonly route = inject(ActivatedRoute);

  protected readonly selectedCard = signal<Card | null>(null);
  protected readonly selectedHole = signal<number | null>(null);
  protected readonly mulliganRulesOpen = signal(false);
  protected readonly mulliganRule = MULLIGAN_RULE;
  private readonly fetchedFeedRound = signal<Round | null>(null);
  protected readonly feedRoundLoading = signal(false);
  private readonly feedRoundFetched = signal(false);

  constructor() {
    effect((onCleanup) => {
      if (this.selectedCard() || this.mulliganRulesOpen()) {
        const release = this.scrollLock.lock();
        onCleanup(release);
      }
    });

    effect((onCleanup) => {
      const id = this.requestedId();
      const userId = this.requestedUserId();
      if (!id || !userId) {
        this.fetchedFeedRound.set(null);
        this.feedRoundLoading.set(false);
        this.feedRoundFetched.set(true);
        return;
      }

      if (this.feed.getFeedRound(userId, id)) {
        this.fetchedFeedRound.set(null);
        this.feedRoundLoading.set(false);
        this.feedRoundFetched.set(true);
        return;
      }

      this.feedRoundLoading.set(true);
      this.feedRoundFetched.set(false);
      let cancelled = false;
      void this.feed.fetchFeedRound(userId, id).then((round) => {
        if (!cancelled) {
          this.fetchedFeedRound.set(round);
          this.feedRoundLoading.set(false);
          this.feedRoundFetched.set(true);
        }
      });

      onCleanup(() => {
        cancelled = true;
      });
    });
  }

  /** Optional ?round=<id> selects a specific completed round from history. */
  private readonly requestedId = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('round'))),
    { initialValue: null },
  );

  /** Optional ?user=<uid> loads a feed-backed round (live or posted). */
  protected readonly requestedUserId = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('user'))),
    { initialValue: null },
  );

  /**
   * The round to display: the explicitly requested completed round, else
   * the active round, else the most recent completed round from history.
   */
  protected readonly round = computed(() => {
    const id = this.requestedId();
    const userId = this.requestedUserId();
    const currentUid = this.auth.uid();

    if (id && userId) {
      if (currentUid === userId) {
        const fromHistory = this.roundHistory.history().find((r) => r.id === id);
        if (fromHistory) {
          return fromHistory;
        }
        const active = this.roundState.activeRound();
        if (active?.id === id) {
          return active;
        }
      }
      return this.feed.getFeedRound(userId, id) ?? this.fetchedFeedRound();
    }

    if (id) {
      const fromHistory = this.roundHistory.history().find((r) => r.id === id);
      if (fromHistory) {
        return fromHistory;
      }
      return null;
    }
    return this.roundState.activeRound() ?? this.roundHistory.history()[0] ?? null;
  });

  protected readonly isSpectatorView = computed(() => {
    const userId = this.requestedUserId();
    const currentUid = this.auth.uid();
    return !!userId && userId !== currentUid;
  });

  protected readonly isLiveView = computed(
    () => this.round()?.status !== 'complete' && !!this.round(),
  );

  protected readonly waitingForFeedRound = computed(
    () => !!this.requestedUserId() && !!this.requestedId() && this.feedRoundLoading(),
  );

  protected readonly missingRequestedRound = computed(() => {
    const id = this.requestedId();
    if (!id || this.round()) {
      return false;
    }
    const userId = this.requestedUserId();
    if (userId) {
      return this.feedRoundFetched() && !this.feedRoundLoading();
    }
    return true;
  });

  protected readonly subtitle = computed(
    () =>
      this.round()?.courseName ??
      'Every golf scramble hole — score, par, to par, and the card that changed the round.',
  );

  protected readonly isComplete = computed(() => this.round()?.status === 'complete');
  protected readonly holes = computed(() => this.round()?.holes ?? []);
  protected readonly players = computed(() => this.round()?.players ?? []);
  protected readonly scoredHoleCount = computed(() => {
    const round = this.round();
    return round ? this.score.scoredHoleCount(round) : 0;
  });
  protected readonly hasScores = computed(() => this.scoredHoleCount() > 0);

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

  protected openCard(card: Card, holeNumber: number): void {
    this.selectedCard.set(card);
    this.selectedHole.set(holeNumber);
  }

  protected closeCard(): void {
    this.selectedCard.set(null);
    this.selectedHole.set(null);
    this.mulliganRulesOpen.set(false);
  }

  protected showsMulliganRulesLink(card: Card): boolean {
    return isMulliganCard(card.id);
  }

  protected openMulliganRules(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.mulliganRulesOpen.set(true);
  }

  protected closeMulliganRules(): void {
    this.mulliganRulesOpen.set(false);
  }

  protected onEscape(): void {
    if (this.mulliganRulesOpen()) {
      this.closeMulliganRules();
    } else if (this.selectedCard()) {
      this.closeCard();
    }
  }
}
