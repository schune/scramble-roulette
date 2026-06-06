import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Consistent page heading used across feature pages.
 * Project content into the default slot for supporting actions/notes.
 */
@Component({
  selector: 'app-page-header',
  template: `
    <header class="page-header">
      <p class="sr-eyebrow">{{ eyebrow() }}</p>
      <h1 class="page-header__title">{{ title() }}</h1>
      @if (subtitle()) {
        <p class="sr-lead">{{ subtitle() }}</p>
      }
      <div class="page-header__actions">
        <ng-content />
      </div>
    </header>
  `,
  styles: `
    .page-header {
      margin-bottom: clamp(1.5rem, 4vw, 2.5rem);
    }

    .page-header__title {
      font-size: clamp(2.1rem, 6vw, 3.25rem);
      margin-bottom: 0.35em;
    }

    .page-header__actions:empty {
      display: none;
    }

    .page-header__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.85rem;
      margin-top: 1.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeader {
  readonly eyebrow = input('Scramble Roulette');
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
