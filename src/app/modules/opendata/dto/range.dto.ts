export class Range {
  constructor(
    public readonly from: string,
    public readonly to: string,
    public readonly unit: string,
    public readonly min: number = 0
  ) {}
}
