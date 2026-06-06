import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

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
}
