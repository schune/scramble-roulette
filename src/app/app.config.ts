import { ApplicationConfig, APP_INITIALIZER, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';

import { routes } from './app.routes';
import { provideFirebase } from './core/firebase/firebase.providers';
import { AuthService } from './core/services';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withRouterConfig({ onSameUrlNavigation: 'reload' })),
    provideFirebase(),
    {
      provide: APP_INITIALIZER,
      useFactory: (auth: AuthService) => () => auth.authReady,
      deps: [AuthService],
      multi: true,
    },
  ],
};
