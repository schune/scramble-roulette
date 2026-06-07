import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeader } from '../../shared/page-header/page-header';
import { ProfileService, ScoreService, StorageService } from '../../core/services';
import { HoleResult, Round } from '../../core/models';

interface StatCard {
  label: string;
  value: string;
  hint: string;
}

@Component({
  selector: 'app-previous-rounds',
  imports: [RouterLink, PageHeader],
  templateUrl: './previous-rounds.html',
  styleUrl: './previous-rounds.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviousRounds {
  private readonly storage = inject(StorageService);
  private readonly score = inject(ScoreService);
  private readonly profile = inject(ProfileService);

  protected readonly rounds = signal<Round[]>(this.storage.getRoundHistory());
  private readonly profileStats = this.profile.getStats();

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
  /** Round pending deletion (drives the confirmation modal). */
  protected readonly pendingDelete = signal<Round | null>(null);

  protected totalScore(round: Round): number {
    return this.score.totalScore(round);
  }

  protected toPar(round: Round): string {
    return this.score.formatToPar(this.score.totalScoreToPar(round));
  }

  protected playerNames(round: Round): string {
    return round.players.map((player) => player.name).join(', ');
  }

  protected holesPlayed(round: Round): number {
    return round.holes.length;
  }

  protected sortedHoles(round: Round): HoleResult[] {
    return [...round.holes].sort((a, b) => a.holeNumber - b.holeNumber);
  }

  protected holeScoreSummary(hole: HoleResult): string {
    if (hole.par !== undefined && hole.score !== undefined) {
      return `Par ${hole.par} · Score ${hole.score}`;
    }
    if (hole.par !== undefined) {
      return `Par ${hole.par} · Score —`;
    }
    if (hole.score !== undefined) {
      return `Par — · Score ${hole.score}`;
    }
    return 'Score not entered';
  }

  protected formatDate(iso: string): string {
    const date = new Date(iso);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  protected requestDelete(round: Round): void {
    this.pendingDelete.set(round);
  }

  protected cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  protected confirmDelete(): void {
    const round = this.pendingDelete();
    if (!round) {
      return;
    }
    this.storage.removeRoundFromHistory(round.id);
    this.rounds.set(this.storage.getRoundHistory());
    this.pendingDelete.set(null);
  }
}
