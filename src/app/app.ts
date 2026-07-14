import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { seoForPath } from './core/seo/route-seo.config';
import { LiveRoundSyncService, SeoService, SocialService } from './core/services';
import { Navbar } from './shared/navbar/navbar';
import { TabBar } from './shared/tab-bar/tab-bar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, Navbar, TabBar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  /** Bootstrap social + live-round sync listeners for the session. */
  private readonly _social = inject(SocialService);
  private readonly _liveSync = inject(LiveRoundSyncService);

  ngOnInit(): void {
    this.seo.initialize();

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const path = event.urlAfterRedirects.split('?')[0];
        const config = seoForPath(path);
        this.seo.apply(config);
        this.seo.applyRouteStructuredData(config.structuredData);
      });
  }
}
