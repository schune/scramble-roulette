import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeader } from '../../shared/page-header/page-header';
import { FeedItem } from '../../core/models';
import {
  AuthService,
  FeedService,
  RoundStateService,
  ScoreService,
  describeSignInError,
} from '../../core/services';

@Component({
  selector: 'app-feed',
  imports: [RouterLink, PageHeader],
  templateUrl: './feed.html',
  styleUrl: './feed.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Feed {
  private readonly feed = inject(FeedService);
  private readonly auth = inject(AuthService);
  private readonly score = inject(ScoreService);
  private readonly roundState = inject(RoundStateService);

  protected readonly isResolving = this.auth.isResolving;
  protected readonly isSignedIn = this.auth.isSignedIn;
  protected readonly items = this.feed.items;
  protected readonly liveRounds = this.feed.liveRounds;
  protected readonly completedPosts = this.feed.completedPosts;
  protected readonly hasActiveRound = this.roundState.hasActiveRound;
  protected readonly currentUid = this.auth.uid;

  protected readonly signingIn = signal(false);
  protected readonly authError = signal<string | null>(null);

  protected isLiveItem(item: FeedItem): item is Extract<FeedItem, { kind: 'live' }> {
    return item.kind === 'live';
  }

  protected isCompletedItem(item: FeedItem): item is Extract<FeedItem, { kind: 'completed' }> {
    return item.kind === 'completed';
  }

  protected isOwnUser(userId: string): boolean {
    return this.currentUid() === userId;
  }

  protected formatToPar(value: number): string {
    return this.score.formatToPar(value);
  }

  protected playerSummary(names: string[]): string {
    return names.join(', ');
  }

  protected initials(name: string): string {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p.charAt(0).toUpperCase()).join('') || '?';
  }

  protected formatWhen(iso: string): string {
    const date = new Date(iso);
    const now = new Date();
    const sameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    if (sameDay) {
      return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    }

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  protected async signIn(): Promise<void> {
    if (this.signingIn()) {
      return;
    }
    this.authError.set(null);
    this.signingIn.set(true);
    const result = await this.auth.signInWithGoogle();
    this.signingIn.set(false);
    if (!result.ok && result.reason !== 'popup-closed') {
      this.authError.set(describeSignInError(result.reason));
    }
  }
}
