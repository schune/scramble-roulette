import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { RoundStateService } from '../../core/services';

interface TabItem {
  label: string;
  path: string;
  icon: 'feed' | 'play' | 'profile';
  primary?: boolean;
}

/**
 * Mobile bottom nav — Feed, Play (home), Profile.
 */
@Component({
  selector: 'app-tab-bar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './tab-bar.html',
  styleUrl: './tab-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabBar {
  private readonly router = inject(Router);
  private readonly roundState = inject(RoundStateService);

  protected readonly tabs: TabItem[] = [
    { label: 'Feed', path: '/feed', icon: 'feed' },
    { label: 'Play', path: '/', icon: 'play', primary: true },
    { label: 'Profile', path: '/profile', icon: 'profile' },
  ];

  protected onTabClick(tab: TabItem, event: Event): void {
    if (tab.path === '/') {
      this.goPlay(event);
    }
  }

  protected goPlay(event: Event): void {
    event.preventDefault();
    if (this.roundState.hasActiveRound()) {
      void this.router.navigate(['/round']);
      return;
    }
    void this.router.navigate(['/']);
  }
}
