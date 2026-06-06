import { Injectable } from '@angular/core';
import { HoleResult, Round } from '../models';

/** Score classification relative to par. */
export type ScoreTone = 'under' | 'par' | 'over';

/** Derived scoring fields for a single hole. */
export interface HoleScore {
  scoreToPar: number;
  resultLabel: string;
}

/**
 * Pure scoring helpers: classifies a hole relative to par and rolls up
 * totals for a round. No state — safe to call from anywhere.
 */
@Injectable({ providedIn: 'root' })
export class ScoreService {
  /** Strokes relative to par for a single hole (negative is under par). */
  scoreToPar(par: number, score: number): number {
    return score - par;
  }

  /**
   * Label for a hole relative to par:
   * Albatross, Eagle, Birdie, Par, Bogey, Double Bogey, Triple Bogey+.
   */
  resultLabel(par: number, score: number): string {
    const diff = score - par;

    if (diff <= -3) {
      return 'Albatross';
    }

    switch (diff) {
      case -2:
        return 'Eagle';
      case -1:
        return 'Birdie';
      case 0:
        return 'Par';
      case 1:
        return 'Bogey';
      case 2:
        return 'Double Bogey';
      default:
        return 'Triple Bogey+';
    }
  }

  /** Compute both derived fields for a hole at once. */
  computeHole(par: number, score: number): HoleScore {
    return {
      scoreToPar: this.scoreToPar(par, score),
      resultLabel: this.resultLabel(par, score),
    };
  }

  /** Holes that have a recorded score so far. */
  private scoredHoles(round: Round): HoleResult[] {
    return round.holes.filter((hole) => hole.score !== undefined && hole.par !== undefined);
  }

  /** Total strokes across scored holes. */
  totalScore(round: Round): number {
    return this.scoredHoles(round).reduce((sum, hole) => sum + (hole.score ?? 0), 0);
  }

  /** Total par across scored holes. */
  totalPar(round: Round): number {
    return this.scoredHoles(round).reduce((sum, hole) => sum + (hole.par ?? 0), 0);
  }

  /** Total strokes relative to par across scored holes. */
  totalScoreToPar(round: Round): number {
    return this.totalScore(round) - this.totalPar(round);
  }

  /** Display string for a relative score: "E", "+3", "-2". */
  formatToPar(value: number): string {
    if (value === 0) {
      return 'E';
    }
    return value > 0 ? `+${value}` : `${value}`;
  }

  /** Visual tone for a relative score (used for color coding). */
  tone(scoreToPar: number): ScoreTone {
    if (scoreToPar < 0) {
      return 'under';
    }
    return scoreToPar > 0 ? 'over' : 'par';
  }
}
