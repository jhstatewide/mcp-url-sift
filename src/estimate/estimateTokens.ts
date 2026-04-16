export interface TokenEstimator {
  estimate(text: string): number;
}

export class RoughTokenEstimator implements TokenEstimator {
  private readonly safetyMultiplier: number;

  constructor(safetyMarginPercent: number) {
    this.safetyMultiplier = 1 + safetyMarginPercent / 100;
  }

  estimate(text: string): number {
    return Math.ceil((text.length / 4) * this.safetyMultiplier);
  }
}
