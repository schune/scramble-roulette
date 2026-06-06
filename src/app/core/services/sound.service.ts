import { Injectable, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';

export type SoundEffect = 'draw' | 'reveal' | 'holeComplete' | 'roundComplete';

interface Note {
  freq: number;
  /** Start offset in seconds from now. */
  at: number;
  /** Duration in seconds. */
  dur: number;
}

/**
 * Lightweight, dependency-free sound effects using the Web Audio API.
 *
 * Tones are synthesized at runtime, so there are no audio files to ship or
 * go missing. Everything is wrapped in try/catch and feature checks, so the
 * app never breaks if audio is unavailable or blocked. Mute preference is
 * persisted via StorageService.
 */
@Injectable({ providedIn: 'root' })
export class SoundService {
  private readonly storage = inject(StorageService);

  private readonly _muted = signal<boolean>(this.storage.getSoundMuted());
  readonly muted = this._muted.asReadonly();

  private context: AudioContext | null = null;

  private static readonly EFFECTS: Record<SoundEffect, Note[]> = {
    draw: [{ freq: 320, at: 0, dur: 0.09 }, { freq: 480, at: 0.07, dur: 0.09 }],
    reveal: [
      { freq: 523.25, at: 0, dur: 0.12 },
      { freq: 783.99, at: 0.1, dur: 0.18 },
    ],
    holeComplete: [
      { freq: 659.25, at: 0, dur: 0.12 },
      { freq: 880, at: 0.1, dur: 0.16 },
    ],
    roundComplete: [
      { freq: 523.25, at: 0, dur: 0.14 },
      { freq: 659.25, at: 0.13, dur: 0.14 },
      { freq: 783.99, at: 0.26, dur: 0.14 },
      { freq: 1046.5, at: 0.39, dur: 0.26 },
    ],
  };

  toggleMute(): void {
    this.setMuted(!this._muted());
  }

  setMuted(muted: boolean): void {
    this._muted.set(muted);
    this.storage.saveSoundMuted(muted);
  }

  /** Play a named effect. No-ops when muted or audio is unavailable. */
  play(effect: SoundEffect): void {
    if (this._muted()) {
      return;
    }
    try {
      const ctx = this.ensureContext();
      if (!ctx) {
        return;
      }
      const now = ctx.currentTime;
      for (const note of SoundService.EFFECTS[effect]) {
        this.playNote(ctx, note, now);
      }
    } catch {
      // Audio is best-effort; never let it break the app.
    }
  }

  private playNote(ctx: AudioContext, note: Note, base: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = note.freq;

    const start = base + note.at;
    const end = start + note.dur;
    const peak = 0.07;

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(end + 0.02);
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') {
      return null;
    }
    if (!this.context) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) {
        return null;
      }
      this.context = new Ctor();
    }
    // Browsers suspend the context until a user gesture; resume on demand.
    if (this.context.state === 'suspended') {
      void this.context.resume();
    }
    return this.context;
  }
}
