import { filterByRelevance, TRIGRAM_RELEVANCE_FLOOR } from "./embeddings";

const r = (similarity: number) => ({ similarity });

describe("filterByRelevance", () => {
  it("returns the input unchanged for 0 or 1 result", () => {
    expect(filterByRelevance([])).toEqual([]);
    expect(filterByRelevance([r(0.2)])).toEqual([r(0.2)]);
  });

  it("trims the long tail relative to the best match", () => {
    // top 0.8, ratio 0.5 → floor 0.4 → drops 0.3
    const out = filterByRelevance([r(0.8), r(0.5), r(0.3)]);
    expect(out).toEqual([r(0.8), r(0.5)]);
  });

  it("does NOT starve uniformly-low scores (short keyword queries)", () => {
    // top 0.32, floor 0.16 → keeps everything
    const input = [r(0.32), r(0.31), r(0.3)];
    expect(filterByRelevance(input)).toEqual(input);
  });

  it("applies an absolute floor to cut near-zero trigram noise", () => {
    // top 0.5, ratio 0.5 → relative floor 0.25; absolute floor 0.08 is lower,
    // so 0.07 is dropped by the relative floor anyway
    const out = filterByRelevance([r(0.5), r(0.07)], 0.5, TRIGRAM_RELEVANCE_FLOOR);
    expect(out).toEqual([r(0.5)]);
  });

  it("absolute floor dominates when scores are all low", () => {
    // top 0.1, relative floor 0.05; absolute floor 0.2 dominates → all dropped
    // → safety keeps the single best match
    const out = filterByRelevance([r(0.1), r(0.05)], 0.5, 0.2);
    expect(out).toEqual([r(0.1)]);
  });

  it("never returns empty when given input", () => {
    const out = filterByRelevance([r(0.01), r(0.005)], 0.5, 0.9);
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual(r(0.01));
  });
});
