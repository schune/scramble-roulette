import { Injectable } from '@angular/core';

/**
 * Locks the mobile scroll container while overlays/modals are open.
 * Uses a refcount so nested locks (e.g. modal over cinematic) stay safe.
 */
@Injectable({ providedIn: 'root' })
export class ScrollLockService {
  private depth = 0;
  private readonly className = 'scroll-locked';

  /** Acquire a lock. Call the returned function to release. */
  lock(): () => void {
    this.depth++;
    if (this.depth === 1) {
      document.documentElement.classList.add(this.className);
    }

    let released = false;
    return () => {
      if (released) {
        return;
      }
      released = true;
      this.depth = Math.max(0, this.depth - 1);
      if (this.depth === 0) {
        document.documentElement.classList.remove(this.className);
      }
    };
  }
}
