import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { RoundStateService } from '../../core/services';

interface TabItem {
  label: string;
  path: string;
  icon: 'history' | 'play' | 'friends' | 'profile';
  primary?: boolean;
}

/**
 * Mobile bottom nav — History, Play (home), Friends, Profile.
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
    { label: 'History', path: '/previous-rounds', icon: 'history' },
    { label: 'Play', path: '/', icon: 'play', primary: true },
    { label: 'Friends', path: '/friends', icon: 'friends' },
    { label: 'Profile', path: '/profile', icon: 'profile' },
  ];

  protected goPlay(event: Event): void {
    event.preventDefault();
    this.roundState.requestPlayLanding();
    void this.router.navigate(['/']);
  }
}
