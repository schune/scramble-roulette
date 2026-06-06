import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RoundStateService } from '../services';

/**
 * Protects the /round route: if there's no active round (e.g. a fresh visit
 * or after finishing), send the user to New Round instead of showing a dead
 * play screen.
 */
export const activeRoundGuard: CanActivateFn = () => {
  const roundState = inject(RoundStateService);
  const router = inject(Router);

  if (roundState.hasActiveRound()) {
    return true;
  }
  return router.createUrlTree(['/new-round']);
};
