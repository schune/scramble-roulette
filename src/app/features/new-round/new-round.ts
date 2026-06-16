import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PageHeader } from '../../shared/page-header/page-header';
import { ProfileService, RoundStateService, SoundService } from '../../core/services';
import { HoleCount } from '../../core/models';

type TeeOffPhase = 'charge' | 'fairway' | 'reveal';
type PlayPhase = 'landing' | 'setup';

/** Treats whitespace-only values as empty. */
function nonBlank(control: AbstractControl): ValidationErrors | null {
  return (control.value ?? '').trim().length > 0 ? null : { required: true };
}

@Component({
  selector: 'app-new-round',
  imports: [RouterLink, ReactiveFormsModule, PageHeader],
  templateUrl: './new-round.html',
  styleUrl: './new-round.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewRound {
  /** Standard scramble foursome — stop refocusing the name field once reached. */
  private static readonly MAX_TEAM_SIZE = 4;

  private readonly roundState = inject(RoundStateService);
  private readonly profile = inject(ProfileService);
  private readonly sound = inject(SoundService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly holeOptions: HoleCount[] = [9, 18];
  protected readonly sparkles = Array.from({ length: 16 }, (_, i) => i);

  protected readonly displayName = this.profile.displayName;
  protected readonly activeRound = this.roundState.activeRound;
  protected readonly holeCount = this.roundState.holeCount;
  protected readonly players = this.roundState.draftPlayers;
  protected readonly canStart = this.roundState.canStart;
  protected readonly teamIsFull = computed(
    () => this.players().length >= NewRound.MAX_TEAM_SIZE,
  );

  private readonly playerNameInput = viewChild<ElementRef<HTMLInputElement>>('playerNameInput');

  protected readonly playPhase = signal<PlayPhase>('landing');
  protected readonly teeOffPhase = signal<TeeOffPhase | null>(null);

  protected readonly courseNameControl = new FormControl('', { nonNullable: true });

  protected readonly nameControl = new FormControl('', {
    nonNullable: true,
    validators: [nonBlank],
  });

  protected readonly editingId = signal<string | null>(null);
  protected readonly confirmingDiscard = signal(false);
  protected readonly editControl = new FormControl('', {
    nonNullable: true,
    validators: [nonBlank],
  });

  private teeOffTimers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    this.destroyRef.onDestroy(() => this.clearTeeOffTimers());
  }

  protected beginSetup(): void {
    if (this.activeRound() || this.playPhase() !== 'landing') {
      return;
    }

    if (this.prefersReducedMotion()) {
      this.playPhase.set('setup');
      return;
    }

    this.clearTeeOffTimers();
    this.teeOffPhase.set('charge');
    this.sound.play('draw');

    this.scheduleTeeOff(() => this.teeOffPhase.set('fairway'), 480);
    this.scheduleTeeOff(() => this.teeOffPhase.set('reveal'), 1200);
    this.scheduleTeeOff(() => {
      this.teeOffPhase.set(null);
      this.playPhase.set('setup');
      this.sound.play('reveal');
    }, 1950);
  }

  protected onCourseNameInput(value: string): void {
    this.roundState.setCourseName(value);
  }

  protected selectHoles(count: HoleCount): void {
    this.roundState.setHoleCount(count);
  }

  protected addPlayer(): void {
    if (this.nameControl.invalid) {
      this.nameControl.markAsTouched();
      return;
    }
    this.roundState.addPlayer(this.nameControl.value);
    this.nameControl.reset('');
    this.nameControl.markAsUntouched();

    if (!this.teamIsFull()) {
      this.focusPlayerNameInput();
    }
  }

  protected startEdit(id: string, name: string): void {
    this.editingId.set(id);
    this.editControl.setValue(name);
    this.editControl.markAsUntouched();
  }

  protected saveEdit(id: string): void {
    if (this.editControl.invalid) {
      this.editControl.markAsTouched();
      return;
    }
    this.roundState.updatePlayer(id, this.editControl.value);
    this.editingId.set(null);
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
  }

  protected removePlayer(id: string): void {
    if (this.editingId() === id) {
      this.editingId.set(null);
    }
    this.roundState.removePlayer(id);
  }

  protected startRound(): void {
    const round = this.roundState.startRound();
    if (round) {
      this.router.navigate(['/round']);
    }
  }

  protected requestDiscard(): void {
    this.confirmingDiscard.set(true);
  }

  protected cancelDiscard(): void {
    this.confirmingDiscard.set(false);
  }

  protected confirmDiscard(): void {
    this.confirmingDiscard.set(false);
    this.roundState.endRound(false);
  }

  protected initials(name: string): string {
    return name.trim().charAt(0).toUpperCase() || '?';
  }

  private scheduleTeeOff(fn: () => void, ms: number): void {
    const id = setTimeout(fn, ms);
    this.teeOffTimers.push(id);
  }

  private clearTeeOffTimers(): void {
    for (const id of this.teeOffTimers) {
      clearTimeout(id);
    }
    this.teeOffTimers = [];
  }

  private prefersReducedMotion(): boolean {
    return (
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  private focusPlayerNameInput(): void {
    queueMicrotask(() => this.playerNameInput()?.nativeElement.focus());
  }
}
