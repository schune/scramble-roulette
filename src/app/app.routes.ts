import { Routes } from '@angular/router';
import { activeRoundGuard } from './core/guards/active-round.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'new-round',
  },
  {
    path: 'dashboard',
    redirectTo: 'new-round',
  },
  {
    path: 'profile',
    title: 'Profile · Scramble Roulette',
    loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
  },
  {
    path: 'new-round',
    title: 'New Round · Scramble Roulette',
    loadComponent: () => import('./features/new-round/new-round').then((m) => m.NewRound),
  },
  {
    path: 'round',
    title: 'Round · Scramble Roulette',
    canActivate: [activeRoundGuard],
    loadComponent: () => import('./features/round/round').then((m) => m.Round),
  },
  {
    path: 'rules',
    title: 'Official Rules · Scramble Roulette',
    loadComponent: () => import('./features/rules/rules').then((m) => m.Rules),
  },
  {
    path: 'scorecard',
    title: 'Scorecard · Scramble Roulette',
    loadComponent: () => import('./features/scorecard/scorecard').then((m) => m.Scorecard),
  },
  {
    path: 'previous-rounds',
    title: 'Previous Rounds · Scramble Roulette',
    loadComponent: () =>
      import('./features/previous-rounds/previous-rounds').then((m) => m.PreviousRounds),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
