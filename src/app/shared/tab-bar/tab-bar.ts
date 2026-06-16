import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface TabItem {
  label: string;
  path: string;
  icon: string;
  primary?: boolean;
}

/**
 * Mobile bottom nav — History, Play (home), Profile.
 */
@Component({
  selector: 'app-tab-bar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './tab-bar.html',
  styleUrl: './tab-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabBar {
  protected readonly tabs: TabItem[] = [
    { label: 'History', path: '/previous-rounds', icon: '☰' },
    { label: 'Play', path: '/', icon: '⛳', primary: true },
    { label: 'Profile', path: '/profile', icon: '◎' },
  ];
}
