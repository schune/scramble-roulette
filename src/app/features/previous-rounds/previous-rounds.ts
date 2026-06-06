import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeader } from '../../shared/page-header/page-header';
import { ScoreService, StorageService } from '../../core/services';
import { Round } from '../../core/models';

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

  protected readonly rounds = signal<Round[]>(this.storage.getRoundHistory());
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

  protected cardNames(round: Round): string[] {
    return round.holes.map((hole) => hole.card.name);
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
