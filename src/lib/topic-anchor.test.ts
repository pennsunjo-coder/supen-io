import { buildTopicAnchor } from "./topic-anchor";

describe("buildTopicAnchor", () => {
  it("returns an empty string when there is no topic", () => {
    expect(buildTopicAnchor("")).toBe("");
    expect(buildTopicAnchor("   ")).toBe("");
    expect(buildTopicAnchor(null)).toBe("");
    expect(buildTopicAnchor(undefined)).toBe("");
  });

  it("embeds the topic and the non-negotiable rules", () => {
    const block = buildTopicAnchor("meal prep for athletes");
    expect(block).toContain('THE TOPIC: "meal prep for athletes"');
    expect(block).toContain("All 5 variations are about THIS exact topic");
    expect(block).toContain("STRUCTURE, CADENCE and HOOK SHAPE only");
  });

  it("includes niche and audience only when provided", () => {
    const full = buildTopicAnchor("budgeting", "personal finance", "young parents");
    expect(full).toContain("Creator niche: personal finance");
    expect(full).toContain("Audience: young parents");

    const bare = buildTopicAnchor("budgeting");
    expect(bare).not.toContain("Creator niche:");
    expect(bare).not.toContain("Audience:");
  });

  it("trims the topic for the heading and rules", () => {
    const block = buildTopicAnchor("  yoga for beginners  ");
    expect(block).toContain('THE TOPIC: "yoga for beginners"');
    expect(block).not.toContain('"  yoga for beginners  "');
  });
});
