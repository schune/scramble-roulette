import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeader } from '../../shared/page-header/page-header';

interface Rule {
  title: string;
  copy: string;
}

@Component({
  selector: 'app-rules',
  imports: [RouterLink, PageHeader],
  templateUrl: './rules.html',
  styleUrl: './rules.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Rules {
  protected readonly steps: Rule[] = [
    {
      title: 'Set up your foursome',
      copy: 'Pick 9 or 18 holes and add at least two players. One phone runs the round for the whole team.',
    },
    {
      title: 'Draw one card per hole',
      copy: 'Before you tee off, draw the card. It dictates the rules of engagement for that hole. Follow it.',
    },
    {
      title: 'No repeats per round',
      copy: 'Every card is dealt once. Once it has been drawn, it is gone until the next round. The deck resets each round.',
    },
    {
      title: 'Enter par and score',
      copy: 'Lock in the hole par and your team score before moving on. We compute your result and running total.',
    },
  ];

  protected readonly warnings: Rule[] = [
    {
      title: 'No take-backs',
      copy: 'Going back a hole exists only for genuine mistakes — not because you hate the card you drew. The card is the card.',
    },
    {
      title: 'Drink responsibly. DD is sacred.',
      copy: 'Drinking cards are optional and always skippable for the designated driver. Know your limits; the DD is a hero, not a target.',
    },
    {
      title: 'Keep pace of play',
      copy: 'Let faster groups play through. The course is not your living room. Nobody likes a five-hour nine.',
    },
    {
      title: "Don't be an idiot on the course",
      copy: 'Respect the staff, the turf, the other golfers, and your own dignity. Have fun, but read the room.',
    },
  ];
}
