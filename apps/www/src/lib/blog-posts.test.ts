import { describe, it, expect } from "vitest";
import { slugifyTag, countMarkdownWords, stripMarkdownInline, renderInlineMarkdown } from "./blog-posts";

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

describe('countMarkdownWords', () => {
	it('counts words in plain text', () => {
		expect(countMarkdownWords('hello world')).toBe(2);
		expect(countMarkdownWords('this is a simple sentence')).toBe(5);
	});

	it('returns 0 for empty or falsy inputs', () => {
		expect(countMarkdownWords('')).toBe(0);
		// @ts-expect-error testing invalid inputs
		expect(countMarkdownWords(null)).toBe(0);
		// @ts-expect-error testing invalid inputs
		expect(countMarkdownWords(undefined)).toBe(0);
	});

	it('strips code blocks', () => {
		const markdown = `
Here is some text.
\`\`\`typescript
const a = 1;
const b = 2;
console.log(a + b);
\`\`\`
And more text here.
		`;
		expect(countMarkdownWords(markdown)).toBe(8);
	});

	it('strips inline code', () => {
		expect(countMarkdownWords('Use the `countMarkdownWords` function.')).toBe(3);
	});

	it('strips image markdown', () => {
		expect(countMarkdownWords('Look at this ![beautiful image](https://example.com/image.png) here.')).toBe(4);
	});

	it('extracts text from links', () => {
		expect(countMarkdownWords('Click [this link](https://example.com) to read more.')).toBe(6);
	});

	it('strips special markdown characters', () => {
		expect(countMarkdownWords('# Heading 1')).toBe(2);
		expect(countMarkdownWords('## Heading 2')).toBe(2);
		expect(countMarkdownWords('> Blockquote text')).toBe(2);
		expect(countMarkdownWords('**Bold text**')).toBe(2);
		expect(countMarkdownWords('_Italic text_')).toBe(2);
		expect(countMarkdownWords('~~Strikethrough text~~')).toBe(2);
		expect(countMarkdownWords('| Column 1 | Column 2 |')).toBe(4);
	});

	it('handles extra whitespaces properly', () => {
		expect(countMarkdownWords('  Too   many    spaces  here.  ')).toBe(4);
		expect(countMarkdownWords('Newlines\n\nand\ttabs')).toBe(3);
	});

	it('handles a complex markdown document', () => {
		const doc = `
# My Awesome Post

This is a post about **bold** ideas and _italicized_ thoughts.

> Some quote here

Here is a list:
- Item 1
- Item 2

Check out [this link](http://example.com).

![An image](http://example.com/img.jpg)

\`\`\`js
console.log("hello");
\`\`\`

The end.
		`;

		const wordCount = countMarkdownWords(doc);
		expect(wordCount).toBe(32);
	});
});

describe('stripMarkdownInline', () => {
	it('strips markdown images', () => {
		expect(stripMarkdownInline('Here is an image ![alt text](https://example.com/image.png)')).toBe('Here is an image');
		expect(stripMarkdownInline('![alt](url) Image at start')).toBe('Image at start');
	});

	it('converts markdown links to just the link text', () => {
		expect(stripMarkdownInline('Check out [OpenAI](https://openai.com) for more info.')).toBe('Check out OpenAI for more info.');
		expect(stripMarkdownInline('[Link Only](https://example.com)')).toBe('Link Only');
	});

	it('removes inline code backticks', () => {
		expect(stripMarkdownInline('Use the `stripMarkdownInline` function.')).toBe('Use the stripMarkdownInline function.');
		expect(stripMarkdownInline('`code` at start')).toBe('code at start');
	});

	it('removes formatting characters like asterisks, underscores, and tildes', () => {
		expect(stripMarkdownInline('This is **bold** and *italic* and ~~strikethrough~~.')).toBe('This is bold and italic and strikethrough.');
		expect(stripMarkdownInline('__underlined__ and _italic_')).toBe('underlined and italic');
	});

	it('condenses multiple spaces and trims leading/trailing whitespace', () => {
		expect(stripMarkdownInline('  Too   many   spaces   ')).toBe('Too many spaces');
		expect(stripMarkdownInline('\tTabs\t \tand\nnewlines\n')).toBe('Tabs and newlines');
	});

	it('handles combined usage', () => {
		expect(stripMarkdownInline('![img](url) [**Link**](url) to `code` with ~~strike~~')).toBe('Link to code with strike');
	});

	it('handles plain text without modifications', () => {
		expect(stripMarkdownInline('Just some plain text without any markdown formatting.')).toBe('Just some plain text without any markdown formatting.');
	});

	it('handles empty string', () => {
		expect(stripMarkdownInline('')).toBe('');
	});
});

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
