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
 * Mobile bottom nav — Play (home), Feed, Profile.
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
    { label: 'Play', path: '/', icon: 'play', primary: true },
    { label: 'Feed', path: '/feed', icon: 'feed' },
    { label: 'Profile', path: '/profile', icon: 'profile' },
  ];

  protected goPlay(event: Event): void {
    event.preventDefault();
    this.roundState.requestPlayLanding();
    void this.router.navigate(['/']);
  }
}
