import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PageHeader } from '../../shared/page-header/page-header';
import { RoundStateService } from '../../core/services';
import { HoleCount } from '../../core/models';

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
  private readonly roundState = inject(RoundStateService);
  private readonly router = inject(Router);

  protected readonly holeOptions: HoleCount[] = [9, 18];

  protected readonly holeCount = this.roundState.holeCount;
  protected readonly players = this.roundState.draftPlayers;
  protected readonly canStart = this.roundState.canStart;

  protected readonly nameControl = new FormControl('', {
    nonNullable: true,
    validators: [nonBlank],
  });

  protected readonly editingId = signal<string | null>(null);
  protected readonly editControl = new FormControl('', {
    nonNullable: true,
    validators: [nonBlank],
  });

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

  protected initials(name: string): string {
    return name.trim().charAt(0).toUpperCase() || '?';
  }
}
