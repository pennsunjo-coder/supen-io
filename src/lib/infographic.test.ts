import { canGenerateInfographic } from "./infographic";

describe("canGenerateInfographic", () => {
  it("allows LinkedIn posts", () => {
    expect(canGenerateInfographic("linkedin", "Post")).toBe(true);
    expect(canGenerateInfographic("LinkedIn", "Post")).toBe(true); // display name
  });

  it("allows Facebook posts and Facebook threads", () => {
    expect(canGenerateInfographic("facebook", "Post")).toBe(true);
    expect(canGenerateInfographic("facebook", "Thread")).toBe(true);
  });

  it("allows X threads but not X tweets", () => {
    expect(canGenerateInfographic("x", "Thread")).toBe(true);
    expect(canGenerateInfographic("X (Twitter)", "Thread")).toBe(true);
    expect(canGenerateInfographic("x", "Tweet")).toBe(false);
  });

  it("rejects Instagram, TikTok and YouTube content", () => {
    expect(canGenerateInfographic("instagram", "Post")).toBe(false);
    expect(canGenerateInfographic("instagram", "Reel (script)")).toBe(false);
    expect(canGenerateInfographic("tiktok", "Caption")).toBe(false);
    expect(canGenerateInfographic("tiktok", "Video script")).toBe(false);
    expect(canGenerateInfographic("youtube", "Script long")).toBe(false);
    expect(canGenerateInfographic("youtube", "Script Shorts")).toBe(false);
  });

  it("rejects missing platform or format", () => {
    expect(canGenerateInfographic("", "")).toBe(false);
    expect(canGenerateInfographic(null, null)).toBe(false);
    expect(canGenerateInfographic(undefined, undefined)).toBe(false);
    expect(canGenerateInfographic("linkedin", "")).toBe(false);
  });
});
