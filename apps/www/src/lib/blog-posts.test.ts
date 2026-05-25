import { describe, it, expect } from 'vitest';
import { stripMarkdownInline } from './blog-posts';

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
