import { describe, it, expect, vi } from 'vitest';
import { parseRssItems } from '../blog';

describe('parseRssItems', () => {
	it('should parse valid RSS items with normal text', () => {
		const xml = `
			<rss>
				<channel>
					<item>
						<title>Normal Post</title>
						<description>This is a normal post description.</description>
						<link>https://example.com/normal-post</link>
						<pubDate>Mon, 01 Jan 2024 12:00:00 GMT</pubDate>
					</item>
					<item>
						<title>Another Post</title>
						<description>Another description here.</description>
						<link>https://example.com/another-post</link>
						<pubDate>Tue, 02 Jan 2024 15:30:00 GMT</pubDate>
					</item>
				</channel>
			</rss>
		`;

		const items = parseRssItems(xml);

		expect(items).toHaveLength(2);
		expect(items[0]).toEqual({
			title: 'Normal Post',
			description: 'This is a normal post description.',
			excerpt: 'This is a normal post description.',
			link: 'https://example.com/normal-post',
			pubDate: 'Mon, 01 Jan 2024 12:00:00 GMT',
			imageSrc: null,
			tags: [],
		});
		expect(items[1]).toEqual({
			title: 'Another Post',
			description: 'Another description here.',
			excerpt: 'Another description here.',
			link: 'https://example.com/another-post',
			pubDate: 'Tue, 02 Jan 2024 15:30:00 GMT',
			imageSrc: null,
			tags: [],
		});
	});

	it('should parse RSS items with CDATA sections', () => {
		const xml = `
			<rss>
				<channel>
					<item>
						<title><![CDATA[Post with CDATA Title]]></title>
						<description><![CDATA[Description with <b>HTML</b> inside CDATA.]]></description>
						<link>https://example.com/cdata-post</link>
						<pubDate>Wed, 03 Jan 2024 08:15:00 GMT</pubDate>
					</item>
				</channel>
			</rss>
		`;

		const items = parseRssItems(xml);

		expect(items).toHaveLength(1);
		expect(items[0]).toMatchObject({
			title: 'Post with CDATA Title',
			description: 'Description with <b>HTML</b> inside CDATA.',
			excerpt: 'Description with <b>HTML</b> inside CDATA.',
			link: 'https://example.com/cdata-post',
			pubDate: 'Wed, 03 Jan 2024 08:15:00 GMT',
		});
	});

	it('should handle HTML entities in title and description', () => {
		const xml = `
			<rss>
				<channel>
					<item>
						<title>Tom &amp; Jerry&#39;s &quot;Adventures&quot;</title>
						<description>If x &lt; 5 &amp;&amp; y &gt; 10</description>
						<link>https://example.com/entities</link>
						<pubDate>Thu, 04 Jan 2024 10:00:00 GMT</pubDate>
					</item>
				</channel>
			</rss>
		`;

		const items = parseRssItems(xml);

		expect(items).toHaveLength(1);
		expect(items[0]).toMatchObject({
			title: 'Tom & Jerry\'s "Adventures"',
			description: 'If x < 5 && y > 10',
			excerpt: 'If x < 5 && y > 10',
			link: 'https://example.com/entities',
			pubDate: 'Thu, 04 Jan 2024 10:00:00 GMT',
		});
	});

	it('should gracefully handle missing fields and ignore items without title or link', () => {
		const xml = `
			<rss>
				<channel>
					<item>
						<!-- Missing title -->
						<description>No title here</description>
						<link>https://example.com/no-title</link>
					</item>
					<item>
						<!-- Missing link -->
						<title>No Link</title>
						<description>No link here</description>
					</item>
					<item>
						<!-- Minimal valid item -->
						<title>Minimal</title>
						<link>https://example.com/minimal</link>
					</item>
				</channel>
			</rss>
		`;

		const items = parseRssItems(xml);

		// Only the minimal valid item should be parsed successfully.
		// normalizeBlogPost requires both title and link.
		expect(items).toHaveLength(1);
		expect(items[0]).toMatchObject({
			title: 'Minimal',
			description: '',
			excerpt: '',
			link: 'https://example.com/minimal',
			pubDate: '',
		});
	});

	it('should return empty array if no items found', () => {
		const xml = `
			<rss>
				<channel>
					<title>Empty Feed</title>
					<description>This feed has no items</description>
				</channel>
			</rss>
		`;

		const items = parseRssItems(xml);
		expect(items).toHaveLength(0);
	});
});
