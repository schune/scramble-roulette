import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { PageHeader } from '../../shared/page-header/page-header';
import { PublicProfile } from '../../core/models';
import {
  AuthService,
  ScoreService,
  SocialService,
  describeSignInError,
} from '../../core/services';

@Component({
  selector: 'app-friends',
  imports: [PageHeader],
  templateUrl: './friends.html',
  styleUrl: './friends.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Friends {
  private readonly social = inject(SocialService);
  private readonly auth = inject(AuthService);
  private readonly score = inject(ScoreService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isResolving = this.auth.isResolving;
  protected readonly isSignedIn = this.auth.isSignedIn;
  protected readonly following = this.social.following;
  protected readonly searchResults = this.social.searchResults;
  protected readonly searching = this.social.searching;
  protected readonly followingLiveRounds = this.social.followingLiveRounds;

  protected readonly searchTerm = signal('');
  protected readonly signingIn = signal(false);
  protected readonly authError = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly busyIds = signal<Set<string>>(new Set());

  protected readonly hasSearchTerm = computed(() => this.searchTerm().trim().length > 0);
  protected readonly showEmptySearch = computed(
    () => this.hasSearchTerm() && !this.searching() && this.searchResults().length === 0,
  );

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }
      this.social.clearSearch();
    });
  }

  protected onSearchInput(value: string): void {
    this.searchTerm.set(value);
    this.actionError.set(null);

    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    const trimmed = value.trim();
    if (!trimmed) {
      this.social.clearSearch();
      return;
    }

    this.searchTimer = setTimeout(() => {
      void this.social.search(trimmed);
    }, 300);
  }

  protected isFollowing(profile: PublicProfile): boolean {
    return this.social.isFollowing(profile.id);
  }

  protected isBusy(id: string): boolean {
    return this.busyIds().has(id);
  }

  protected async toggleFollow(profile: PublicProfile): Promise<void> {
    if (this.isBusy(profile.id)) {
      return;
    }

    this.actionError.set(null);
    this.busyIds.update((set) => new Set(set).add(profile.id));

    try {
      if (this.isFollowing(profile)) {
        await this.social.unfollow(profile.id);
      } else {
        await this.social.follow(profile);
      }
    } catch {
      this.actionError.set('Could not update follow — try again.');
    } finally {
      this.busyIds.update((set) => {
        const next = new Set(set);
        next.delete(profile.id);
        return next;
      });
    }
  }

  protected async unfollowById(followeeId: string): Promise<void> {
    if (this.isBusy(followeeId)) {
      return;
    }

    this.actionError.set(null);
    this.busyIds.update((set) => new Set(set).add(followeeId));

    try {
      await this.social.unfollow(followeeId);
    } catch {
      this.actionError.set('Could not update follow — try again.');
    } finally {
      this.busyIds.update((set) => {
        const next = new Set(set);
        next.delete(followeeId);
        return next;
      });
    }
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

  protected formatToPar(value: number | null): string {
    if (value === null) {
      return '—';
    }
    return this.score.formatToPar(value);
  }

  protected initials(name: string): string {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p.charAt(0).toUpperCase()).join('') || '?';
  }
}
