import { describe, it, expect } from "vitest";
import { slugifyTag } from "../blog-posts";

describe("slugifyTag", () => {
  it("converts spaces to hyphens", () => {
    expect(slugifyTag("hello world")).toBe("hello-world");
  });

  it("handles uppercase letters", () => {
    expect(slugifyTag("Hello World")).toBe("hello-world");
  });

  it("removes accents", () => {
    expect(slugifyTag("résumé")).toBe("resume");
  });

  it("removes non-alphanumeric characters", () => {
    expect(slugifyTag("hello! world?")).toBe("hello-world");
  });

  it("handles multiple spaces and special characters", () => {
    expect(slugifyTag("  hello   _world_  ")).toBe("hello-world");
  });

  it("handles empty string", () => {
    expect(slugifyTag("")).toBe("");
  });

  it("handles undefined/null", () => {
    expect(slugifyTag(undefined as any)).toBe("");
    expect(slugifyTag(null as any)).toBe("");
  });

  it("removes leading and trailing hyphens", () => {
    expect(slugifyTag("-hello-world-")).toBe("hello-world");
  });
});
