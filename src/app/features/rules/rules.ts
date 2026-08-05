import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { OFFICIAL_GOLF_RULES, OFFICIAL_RULING_NOTE } from '../../core/data/official-rules';
import { PageHeader } from '../../shared/page-header/page-header';

interface Rule {
  title: string;
  copy: string;
}

@Component({
  selector: 'app-rules',
  imports: [PageHeader],
  templateUrl: './rules.html',
  styleUrl: './rules.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Rules {
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  protected close(): void {
    if (typeof history !== 'undefined' && history.length > 1) {
      this.location.back();
      return;
    }
    void this.router.navigate(['/']);
  }

  protected readonly officialRules: Rule[] = OFFICIAL_GOLF_RULES;
  protected readonly rulingNote = OFFICIAL_RULING_NOTE;

  protected readonly steps: Rule[] = [
    {
      title: 'Set up your team',
      copy: 'Pick 9 or 18 holes for your scramble round and add your team — at least two players. Each team runs its own round on its own phone, so the rival team sets up the same way on theirs.',
    },
    {
      title: 'Draw one card per hole',
      copy: 'Before your team tees off, draw the card. It dictates the scramble rules for that hole. The other team draws from their own deck, so no two matchups play the same.',
    },
    {
      title: 'No repeats per round',
      copy: 'Every card is dealt once. Once it has been drawn, it is gone until the next round. Each team\'s deck resets each round.',
    },
    {
      title: 'Enter par and score',
      copy: 'Lock in the hole par and your team score before moving on. We compute your result and running total — the lowest team score wins the matchup.',
    },
    {
      title: 'Scout the other team on the Feed',
      copy: 'Sign in and open the Feed tab to follow the rival team\'s live scores while you play, plus posted scorecards when everyone finishes. Your team\'s round shows up there automatically.',
    },
  ];
}
