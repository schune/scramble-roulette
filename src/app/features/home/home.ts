import { afterNextRender, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

interface Feature {
  title: string;
  copy: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly router = inject(Router);

  protected readonly features: Feature[] = [
    {
      title: 'Draw the Lineup',
      copy: 'A deck of cards decides whose drive counts. No favorites, no mercy — just the luck of the cut.',
    },
    {
      title: 'Live Scorecard',
      copy: 'Track every hole on an elegant card built for the back nine and the back porch alike.',
    },
    {
      title: 'A Tradition Unlike Any Other',
      copy: 'Relive past rounds, crown your champions, and keep the green jacket in the family.',
    },
  ];

  constructor() {
    // Mobile uses the dashboard as the app home — skip this marketing page.
    afterNextRender(() => {
      if (window.matchMedia('(max-width: 860px)').matches) {
        void this.router.navigateByUrl('/', { replaceUrl: true });
      }
    });
  }
}
