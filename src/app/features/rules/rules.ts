import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { OFFICIAL_GOLF_RULES } from '../../core/data/official-rules';
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

  protected readonly steps: Rule[] = [
    {
      title: 'Set up your golf foursome',
      copy: 'Pick 9 or 18 holes for your scramble format golf round and add at least two players. One phone runs the whole golf scramble game.',
    },
    {
      title: 'Draw one card per hole',
      copy: 'Before you tee off, draw the card. It dictates the scramble rules for that hole on the golf course. Follow it.',
    },
    {
      title: 'No repeats per round',
      copy: 'Every card is dealt once. Once it has been drawn, it is gone until the next round. The deck resets each round.',
    },
    {
      title: 'Enter par and score',
      copy: 'Lock in the hole par and your team score before moving on. We compute your result and running total.',
    },
    {
      title: 'Monitor live scores on the Feed',
      copy: 'Sign in and open the Feed tab to follow every group\'s live scores during rounds and posted scorecards when they finish. Your round shows up there automatically while you play.',
    },
  ];
}
