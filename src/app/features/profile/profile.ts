import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeader } from '../../shared/page-header/page-header';
import { ProfileService, ScoreService, SocialService } from '../../core/services';
import { Round } from '../../core/models';

interface StatCard {
  label: string;
  value: string;
}

@Component({
  selector: 'app-profile',
  imports: [RouterLink, PageHeader],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile {
  private readonly profile = inject(ProfileService);
  private readonly score = inject(ScoreService);
  private readonly social = inject(SocialService);

  protected readonly initials = this.profile.initials;
  protected readonly avatar = this.profile.avatar;
  protected readonly socialEnabled = this.social.enabled;

  protected readonly nameDraft = signal(this.profile.displayName());
  protected readonly avatarError = signal<string | null>(null);

  protected readonly canSaveName = computed(() => {
    const draft = this.nameDraft().trim();
    return draft.length > 0 && draft !== this.profile.displayName();
  });

  private readonly profileStats = this.profile.getStats();
  protected readonly recentRounds = this.profile.getRecentRounds(5);

  protected readonly stats: StatCard[] = [
    { label: 'Rounds Played', value: `${this.profileStats.roundsPlayed || '—'}` },
    { label: 'Holes Played', value: `${this.profileStats.holesPlayed || '—'}` },
    {
      label: 'Best To Par',
      value:
        this.profileStats.bestScoreToPar === null
          ? '—'
          : this.score.formatToPar(this.profileStats.bestScoreToPar),
    },
    {
      label: 'Avg To Par',
      value:
        this.profileStats.averageScoreToPar === null
          ? '—'
          : this.score.formatToPar(this.profileStats.averageScoreToPar),
    },
    { label: 'Favorite Card', value: this.profileStats.favoriteCategory ?? '—' },
  ];

  protected onNameInput(value: string): void {
    this.nameDraft.set(value);
  }

  protected saveName(): void {
    if (!this.canSaveName()) {
      return;
    }
    this.profile.setDisplayName(this.nameDraft());
  }

  protected onAvatarSelected(event: Event): void {
    this.avatarError.set(null);
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.avatarError.set('Please choose an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.avatarError.set('Image must be under 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        this.profile.setAvatar(reader.result);
      }
    };
    reader.onerror = () => this.avatarError.set("Couldn't read that image.");
    reader.readAsDataURL(file);
    input.value = '';
  }

  protected removeAvatar(): void {
    this.profile.clearAvatar();
  }

  protected toPar(round: Round): string {
    return this.score.formatToPar(this.score.totalScoreToPar(round));
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}
