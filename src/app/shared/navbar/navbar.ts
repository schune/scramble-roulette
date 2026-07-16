import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  AuthService,
  ProfileService,
  RoundStateService,
  SoundService,
  bindRedirectAuthError,
  describeSignInError,
} from '../../core/services';

interface NavLink {
  label: string;
  path: string;
}

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'closeAccountMenu()',
    '(document:keydown.escape)': 'closeAccountMenu()',
  },
})
export class Navbar {
  private readonly sound = inject(SoundService);
  private readonly auth = inject(AuthService);
  private readonly profile = inject(ProfileService);
  private readonly roundState = inject(RoundStateService);
  private readonly router = inject(Router);

  protected readonly menuOpen = signal(false);
  protected readonly muted = this.sound.muted;

  /* ---------- Account ---------- */
  protected readonly isResolving = this.auth.isResolving;
  protected readonly isSignedIn = this.auth.isSignedIn;
  protected readonly avatar = this.profile.avatar;
  protected readonly initials = this.profile.initials;
  protected readonly displayName = this.profile.displayName;
  protected readonly email = this.auth.email;

  protected readonly accountMenuOpen = signal(false);
  protected readonly signingIn = signal(false);
  protected readonly authError = signal<string | null>(null);

  protected readonly links: NavLink[] = [
    { label: 'Play', path: '/' },
    { label: 'Feed', path: '/feed' },
    { label: 'Official Rules', path: '/rules' },
    { label: 'Profile', path: '/profile' },
  ];

  constructor() {
    bindRedirectAuthError(this.auth, this.authError);
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  /** Go to play setup — discards an in-progress round when confirmed. */
  protected goNewRound(event: Event): void {
    event.stopPropagation();
    this.closeMenu();
    this.closeAccountMenu();

    if (this.roundState.hasActiveRound()) {
      const discard = confirm(
        'You have a round in progress. Discard it and start a new one?',
      );
      if (!discard) {
        return;
      }
      this.roundState.endRound(false);
    }

    this.roundState.requestPlaySetup();
    void this.router.navigate(['/']);
  }

  /** Return to the Tee It Up landing (clears in-progress setup). */
  protected goHome(event: Event): void {
    event.preventDefault();
    this.closeMenu();
    this.roundState.requestPlayLanding();
    void this.router.navigate(['/']);
  }

  protected toggleMute(): void {
    this.sound.toggleMute();
  }

  /* ---------- Account actions ---------- */

  async signIn(): Promise<void> {
    if (this.signingIn()) {
      return;
    }
    this.authError.set(null);
    this.signingIn.set(true);
    const result = await this.auth.signInWithGoogle();
    if (result.ok && result.redirecting) {
      return;
    }
    this.signingIn.set(false);
    if (result.ok) {
      this.closeAccountMenu();
      this.closeMenu();
    } else if (result.reason !== 'popup-closed') {
      this.authError.set(describeSignInError(result.reason));
    }
  }

  async signOut(): Promise<void> {
    this.closeAccountMenu();
    await this.auth.signOut();
  }

  toggleAccountMenu(event: Event): void {
    event.stopPropagation();
    this.authError.set(null);
    this.accountMenuOpen.update((open) => !open);
  }

  closeAccountMenu(): void {
    this.accountMenuOpen.set(false);
  }
}
