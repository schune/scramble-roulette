import { bootstrapApplication } from '@angular/platform-browser';
import { bootstrapFirebaseAuth } from './app/core/firebase/firebase-init';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Capture Google redirect result before Angular/router/Firestore initialize.
bootstrapFirebaseAuth();

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
