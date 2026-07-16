import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FIRESTORE } from './core/firebase/firebase.providers';
import { AuthService } from './core/services';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    const authServiceMock = {
      user: signal<null>(null).asReadonly(),
      isResolving: signal(false).asReadonly(),
      isSignedIn: signal(false).asReadonly(),
      uid: signal<null>(null).asReadonly(),
      displayName: signal<null>(null).asReadonly(),
      email: signal<null>(null).asReadonly(),
      photoURL: signal<null>(null).asReadonly(),
      redirectError: signal<null>(null).asReadonly(),
      authReady: Promise.resolve(),
      signInWithGoogle: async () => ({ ok: true as const }),
      signOut: async () => undefined,
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: FIRESTORE, useValue: {} },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the navbar brand', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand__name')?.textContent).toContain('Scramble Roulette');
  });
});
