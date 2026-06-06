import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeader } from '../../shared/page-header/page-header';
import { ProfileService, RoundStateService, ScoreService } from '../../core/services';
import { Round } from '../../core/models';

interface StatCard {
  label: string;
  value: string;
  hint: string;
}

interface QuickLink {
  label: string;
  description: string;
  path: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, PageHeader],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly roundState = inject(RoundStateService);
  private readonly profile = inject(ProfileService);
  private readonly score = inject(ScoreService);

  protected readonly displayName = this.profile.displayName;
  protected readonly activeRound = this.roundState.activeRound;
  protected readonly hasActiveRound = this.roundState.hasActiveRound;

  private readonly profileStats = this.profile.getStats();
  protected readonly recentRounds = this.profile.getRecentRounds(3);

  protected readonly stats = computed<StatCard[]>(() => {
    const s = this.profileStats;
    return [
      { label: 'Rounds Played', value: s.roundsPlayed ? `${s.roundsPlayed}` : '—', hint: 'Career total' },
      {
        label: 'Best Score',
        value: s.bestScoreToPar === null ? '—' : this.score.formatToPar(s.bestScoreToPar),
        hint: 'Relative to par',
      },
      { label: 'Holes Played', value: s.holesPlayed ? `${s.holesPlayed}` : '—', hint: 'All-time' },
    ];
  });

  protected readonly quickLinks: QuickLink[] = [
    { label: 'Profile', description: 'Your name, avatar, and stats', path: '/profile' },
    { label: 'Clubhouse History', description: 'Revisit past rounds', path: '/previous-rounds' },
    { label: 'How to Play', description: 'Rules and house etiquette', path: '/rules' },
  ];

  protected toPar(round: Round): string {
    return this.score.formatToPar(this.score.totalScoreToPar(round));
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}
