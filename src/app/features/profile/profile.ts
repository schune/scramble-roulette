import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeader } from '../../shared/page-header/page-header';
import { Card, Round } from '../../core/models';
import { CardDeckService } from '../../core/services/card-deck.service';
import {
  AuthService,
  ProfileService,
  ScoreService,
  SocialService,
  describeSignInError,
} from '../../core/services';

interface StatCard {
  label: string;
  value: string;
}

@Component({
  selector: 'app-profile',
  imports: [RouterLink, PageHeader],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class Profile {
  private readonly profile = inject(ProfileService);
  private readonly score = inject(ScoreService);
  private readonly social = inject(SocialService);
  private readonly deck = inject(CardDeckService);
  private readonly auth = inject(AuthService);
  private readonly host = inject(ElementRef<HTMLElement>);

  protected readonly menuOpen = signal(false);
  protected readonly deckExpanded = signal(false);
  protected readonly deckCards: readonly Card[] = this.deck.getPack().cards;
  protected readonly packName = this.deck.getPack().name;

  protected readonly initials = this.profile.initials;
  protected readonly avatar = this.profile.avatar;
  protected readonly displayName = this.profile.displayName;
  protected readonly socialEnabled = this.social.enabled;
  protected readonly followingCount = this.social.followingCount;

  /* ---------- Account ---------- */
  protected readonly isResolving = this.auth.isResolving;
  protected readonly isSignedIn = this.auth.isSignedIn;
  protected readonly email = this.auth.email;
  protected readonly signingIn = signal(false);
  protected readonly authError = signal<string | null>(null);

  protected readonly nameDraft = signal(this.profile.displayName());
  protected readonly avatarError = signal<string | null>(null);

  protected readonly canSaveName = computed(() => {
    const draft = this.nameDraft().trim();
    return draft.length > 0 && draft !== this.profile.displayName();
  });

  protected readonly stats = computed<StatCard[]>(() => {
    const s = this.profile.stats();
    return [
      { label: 'Rounds Played', value: `${s.roundsPlayed || '—'}` },
      { label: 'Holes Played', value: `${s.holesPlayed || '—'}` },
      {
        label: 'Best To Par',
        value: s.bestScoreToPar === null ? '—' : this.score.formatToPar(s.bestScoreToPar),
      },
      {
        label: 'Avg To Par',
        value:
          s.averageScoreToPar === null ? '—' : this.score.formatToPar(s.averageScoreToPar),
      },
    ];
  });

  protected readonly recentRounds = this.profile.recentRounds;

  constructor() {
    // Keep the editable name field in sync with the active profile (e.g. the
    // Google name after sign-in, or the guest name after signing out).
    effect(() => {
      this.nameDraft.set(this.profile.displayName());
    });
  }

  /* ---------- Account actions ---------- */

  async signIn(): Promise<void> {
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

  async signOut(): Promise<void> {
    await this.auth.signOut();
  }

  /* ---------- Name & avatar ---------- */

  protected onNameInput(value: string): void {
    this.nameDraft.set(value);
  }

  protected saveName(): void {
    if (!this.canSaveName()) {
      return;
    }
    this.profile.setDisplayName(this.nameDraft());
  }

  protected onAvatarSelected(event: Event): void {
    this.avatarError.set(null);
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.avatarError.set('Please choose an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.avatarError.set('Image must be under 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        this.profile.setAvatar(reader.result);
      }
    };
    reader.onerror = () => this.avatarError.set("Couldn't read that image.");
    reader.readAsDataURL(file);
    input.value = '';
  }

  protected removeAvatar(): void {
    this.profile.clearAvatar();
  }

  protected toPar(round: Round): string {
    return this.score.formatToPar(this.score.totalScoreToPar(round));
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  /* ---------- Overflow menu ---------- */

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
    if (!this.menuOpen()) {
      this.deckExpanded.set(false);
    }
  }

  protected toggleDeck(): void {
    this.deckExpanded.update((open) => !open);
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen()) {
      return;
    }
    const target = event.target as Node | null;
    if (target && this.host.nativeElement.contains(target)) {
      return;
    }
    this.menuOpen.set(false);
    this.deckExpanded.set(false);
  }

  protected onEscape(): void {
    this.menuOpen.set(false);
    this.deckExpanded.set(false);
  }
}
