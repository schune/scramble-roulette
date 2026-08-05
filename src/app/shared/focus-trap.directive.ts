import { AfterViewInit, Directive, ElementRef, OnDestroy, inject } from '@angular/core';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Keeps keyboard focus inside a modal dialog: moves focus in on open, cycles
 * Tab / Shift+Tab within the element, and restores focus to the previously
 * focused element on close. Apply to the element carrying `role="dialog"`.
 */
@Directive({
  selector: '[srFocusTrap]',
  host: {
    '(keydown)': 'onKeydown($event)',
  },
})
export class FocusTrap implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private previouslyFocused: HTMLElement | null = null;

  ngAfterViewInit(): void {
    if (typeof document === 'undefined') {
      return;
    }
    const active = document.activeElement;
    this.previouslyFocused = active instanceof HTMLElement ? active : null;

    queueMicrotask(() => {
      const targets = this.focusable();
      const preferred =
        this.host.nativeElement.querySelector<HTMLElement>('[data-autofocus]') ?? targets[0];
      if (preferred) {
        preferred.focus();
      } else {
        this.host.nativeElement.setAttribute('tabindex', '-1');
        this.host.nativeElement.focus();
      }
    });
  }

  ngOnDestroy(): void {
    this.previouslyFocused?.focus?.();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return;
    }

    const targets = this.focusable();
    if (targets.length === 0) {
      event.preventDefault();
      return;
    }

    const first = targets[0];
    const last = targets[targets.length - 1];
    const active = document.activeElement;

    if (!this.host.nativeElement.contains(active)) {
      event.preventDefault();
      first.focus();
      return;
    }

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusable(): HTMLElement[] {
    return Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter((el) => el.offsetParent !== null || el.getClientRects().length > 0);
  }
}
