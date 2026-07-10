import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, ProfileService, SoundService, describeSignInError } from '../../core/services';

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
    { label: 'History', path: '/previous-rounds' },
    { label: 'Official Rules', path: '/rules' },
    { label: 'Profile', path: '/profile' },
  ];

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
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
