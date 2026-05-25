import { describe, it, expect } from 'vitest';
import { countMarkdownWords } from './blog-posts';

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

		// "My", "Awesome", "Post" -> 3
		// "This", "is", "a", "post", "about", "bold", "ideas", "and", "italicized", "thoughts." -> 10
		// "Some", "quote", "here" -> 3
		// "Here", "is", "a", "list:" -> 4
		// "-", "Item", "1" -> 3
		// "-", "Item", "2" -> 3
		// "Check", "out", "this", "link" -> 4
		// "The", "end." -> 2
		// Sum: 3 + 10 + 3 + 4 + 3 + 3 + 4 + 2 = 32
		expect(wordCount).toBe(32);
	});
});
