import { describe, it, expect } from "vitest";
import { renderInlineMarkdown } from "./blog-posts";

describe("renderInlineMarkdown", () => {
	it("should escape HTML tags", () => {
		expect(renderInlineMarkdown("<script>alert(1)</script>")).toBe(
			"&lt;script&gt;alert(1)&lt;/script&gt;"
		);
	});

	it("should render bold text", () => {
		expect(renderInlineMarkdown("This is **bold** text")).toBe(
			"This is <strong>bold</strong> text"
		);
	});

	it("should render italic text", () => {
		expect(renderInlineMarkdown("This is *italic* text")).toBe(
			"This is <em>italic</em> text"
		);
	});

	it("should render inline code", () => {
		expect(renderInlineMarkdown("Use the `renderInlineMarkdown` function")).toBe(
			"Use the <code>renderInlineMarkdown</code> function"
		);
	});

	it("should render combinations of formatting", () => {
		expect(renderInlineMarkdown("This is **bold**, *italic*, and `code`")).toBe(
			"This is <strong>bold</strong>, <em>italic</em>, and <code>code</code>"
		);
	});

	it("should handle null or undefined input gracefully", () => {
		// @ts-expect-error testing invalid input
		expect(renderInlineMarkdown(null)).toBe("");
		// @ts-expect-error testing invalid input
		expect(renderInlineMarkdown(undefined)).toBe("");
	});

	it("should handle empty strings and whitespace", () => {
		expect(renderInlineMarkdown("")).toBe("");
		expect(renderInlineMarkdown("   ")).toBe("");
	});

	it("should escape HTML within formatting", () => {
		expect(renderInlineMarkdown("**<bold>**")).toBe("<strong>&lt;bold&gt;</strong>");
		expect(renderInlineMarkdown("`<script>`")).toBe("<code>&lt;script&gt;</code>");
	});
});
