import { Routes } from '@angular/router';
import { activeRoundGuard } from './core/guards/active-round.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Scramble Roulette — Free Golf Scramble Card Game',
    loadComponent: () => import('./features/new-round/new-round').then((m) => m.NewRound),
  },
  {
    path: 'new-round',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: 'profile',
    title: 'Golf Profile & Stats · Scramble Roulette',
    loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
  },
  {
    path: 'round',
    title: 'Live Golf Scramble Round · Scramble Roulette',
    canActivate: [activeRoundGuard],
    loadComponent: () => import('./features/round/round').then((m) => m.Round),
  },
  {
    path: 'rules',
    title: 'Official Golf Scramble Rules · Scramble Roulette',
    loadComponent: () => import('./features/rules/rules').then((m) => m.Rules),
  },
  {
    path: 'scorecard',
    title: 'Golf Scramble Scorecard · Scramble Roulette',
    loadComponent: () => import('./features/scorecard/scorecard').then((m) => m.Scorecard),
  },
  {
    path: 'previous-rounds',
    title: 'Golf Scramble Round History · Scramble Roulette',
    loadComponent: () =>
      import('./features/previous-rounds/previous-rounds').then((m) => m.PreviousRounds),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
