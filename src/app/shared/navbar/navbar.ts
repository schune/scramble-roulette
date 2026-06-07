import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SoundService } from '../../core/services';

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
})
export class Navbar {
  private readonly sound = inject(SoundService);

  protected readonly menuOpen = signal(false);
  protected readonly muted = this.sound.muted;

  protected readonly links: NavLink[] = [
    { label: 'Play', path: '/new-round' },
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
}
