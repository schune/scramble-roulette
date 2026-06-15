import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';
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
export class Rules implements OnInit {
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.applyRouteStructuredData({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: this.officialRules.map((rule) => ({
        '@type': 'Question',
        name: rule.title,
        acceptedAnswer: {
          '@type': 'Answer',
          text: rule.copy,
        },
      })),
    });
  }

  protected close(): void {
    if (typeof history !== 'undefined' && history.length > 1) {
      this.location.back();
      return;
    }
    void this.router.navigate(['/new-round']);
  }

  protected readonly officialRules: Rule[] = [
    {
      title: 'Rule #1: Draw Before Teeing Off',
      copy: 'One card shall be drawn before the first shot on every hole. Once drawn, the card remains in effect for the duration of that hole and must be followed.',
    },
    {
      title: 'Rule #2: Team by Default',
      copy: 'Unless a card specifically references a single player, the card applies to the entire team.',
    },
    {
      title: 'Rule #3: Designated Driver Exemption',
      copy: 'The designated driver may be exempt from drinking challenges. Another player must drink in his place. The designated driver chooses the substitute.',
    },
    {
      title: 'Rule #4: Mulligan Commitment',
      copy: 'If a player elects to use a mulligan, the original shot is immediately void. The mulligan becomes the only playable ball.',
    },
    {
      title: 'Rule #5: Delayed Consumption',
      copy: 'If a drinking challenge cannot be immediately completed (ranger nearby, clubhouse proximity, etc.), it shall be completed at the first available opportunity.',
    },
  ];

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
  ];
}
