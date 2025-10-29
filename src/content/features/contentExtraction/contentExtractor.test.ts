/**
 * Unit tests for ContentExtractor
 * Tests content extraction heuristics with sample HTML
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ContentExtractor } from './contentExtractor';
import { JSDOM } from 'jsdom';

describe('ContentExtractor', () => {
  let extractor: ContentExtractor;
  let dom: JSDOM;

  beforeEach(() => {
    // Create a fresh DOM for each test
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'https://example.com/article',
    });
    extractor = new ContentExtractor(dom.window.document);
  });

  describe('extractMainContent', () => {
    it('should extract content from article tag', () => {
      dom.window.document.body.innerHTML = `
        <nav>Navigation menu</nav>
        <article>
          <h1>Article Title</h1>
          <p>This is the main article content that should be extracted.</p>
          <p>It contains multiple paragraphs of valuable information.</p>
        </article>
        <footer>Footer content</footer>
      `;

      const content = extractor.extractMainContent();
      expect(content.text).toContain('main article content');
      expect(content.text).not.toContain('Navigation menu');
      expect(content.text).not.toContain('Footer content');
    });

    it('should extract content from main tag', () => {
      dom.window.document.body.innerHTML = `
        <header>Header</header>
        <main>
          <p>Main content area with important information.</p>
        </main>
        <aside>Sidebar</aside>
      `;

      const content = extractor.extractMainContent();
      expect(content.text).toContain('Main content area');
      expect(content.text).not.toContain('Sidebar');
    });

    it('should exclude navigation elements', () => {
      dom.window.document.body.innerHTML = `
        <nav class="menu">
          <a href="/">Home</a>
          <a href="/about">About</a>
        </nav>
        <article>
          <p>Article content here.</p>
        </article>
      `;

      const content = extractor.extractMainContent();
      expect(content.text).toContain('Article content');
      expect(content.text).not.toContain('Home');
      expect(content.text).not.toContain('About');
    });

    it('should exclude advertisement elements', () => {
      dom.window.document.body.innerHTML = `
        <article>
          <p>Real content.</p>
          <div class="advertisement">Buy our product!</div>
          <p>More real content.</p>
        </article>
      `;

      const content = extractor.extractMainContent();
      expect(content.text).toContain('Real content');
      expect(content.text).not.toContain('Buy our product');
    });

    it('should calculate word count correctly', () => {
      dom.window.document.body.innerHTML = `
        <article>
          <p>One two three four five six seven eight nine ten.</p>
        </article>
      `;

      const content = extractor.extractMainContent();
      expect(content.wordCount).toBe(10);
    });

    it('should include URL in extracted content', () => {
      dom.window.document.body.innerHTML = `
        <article><p>Content</p></article>
      `;

      const content = extractor.extractMainContent();
      expect(content.url).toBe('https://example.com/article');
    });
  });

  describe('extractTitle', () => {
    it('should extract title from document.title', () => {
      dom.window.document.title = 'Test Article Title';
      dom.window.document.body.innerHTML = '<article><p>Content</p></article>';

      const content = extractor.extractMainContent();
      expect(content.title).toBe('Test Article Title');
    });

    it('should extract title from og:title meta tag', () => {
      dom.window.document.head.innerHTML = `
        <meta property="og:title" content="OpenGraph Title">
      `;
      dom.window.document.body.innerHTML = '<article><p>Content</p></article>';

      const content = extractor.extractMainContent();
      expect(content.title).toBe('OpenGraph Title');
    });

    it('should extract title from h1 tag as fallback', () => {
      dom.window.document.body.innerHTML = `
        <article>
          <h1>H1 Title</h1>
          <p>Content</p>
        </article>
      `;

      const content = extractor.extractMainContent();
      expect(content.title).toBe('H1 Title');
    });
  });

  describe('getPageMetadata', () => {
    it('should extract page metadata', () => {
      dom.window.document.title = 'Test Page';
      const metadata = extractor.getPageMetadata();

      expect(metadata.title).toBe('Test Page');
      expect(metadata.url).toBe('https://example.com/article');
      expect(metadata.domain).toBe('example.com');
      expect(metadata.timestamp).toBeGreaterThan(0);
    });
  });

  describe('checkTokenLimit', () => {
    it('should detect when content exceeds token limit', () => {
      // Create content with ~4000 tokens (3000 words)
      const longText = 'word '.repeat(3000);
      dom.window.document.body.innerHTML = `
        <article><p>${longText}</p></article>
      `;

      const content = extractor.extractMainContent();
      const { exceeds, tokens } = extractor.checkTokenLimit(content);

      expect(exceeds).toBe(true);
      expect(tokens).toBeGreaterThan(3000);
    });

    it('should not flag short content as exceeding limit', () => {
      dom.window.document.body.innerHTML = `
        <article><p>Short content with just a few words.</p></article>
      `;

      const content = extractor.extractMainContent();
      const { exceeds } = extractor.checkTokenLimit(content);

      expect(exceeds).toBe(false);
    });
  });

  describe('getTruncatedContent', () => {
    it('should truncate content that exceeds token limit', () => {
      const longText = 'word '.repeat(3000);
      dom.window.document.body.innerHTML = `
        <article><p>${longText}</p></article>
      `;

      const content = extractor.extractMainContent();
      const truncated = extractor.getTruncatedContent(content);

      expect(truncated.text.length).toBeLessThan(content.text.length);
      expect(truncated.text).toContain('...');
    });

    it('should not truncate content within token limit', () => {
      dom.window.document.body.innerHTML = `
        <article><p>Short content.</p></article>
      `;

      const content = extractor.extractMainContent();
      const truncated = extractor.getTruncatedContent(content);

      expect(truncated.text).toBe(content.text);
    });
  });

  describe('caching', () => {
    it('should cache extracted content', () => {
      dom.window.document.body.innerHTML = `
        <article><p>Content</p></article>
      `;

      const content1 = extractor.extractMainContent();
      const content2 = extractor.extractMainContent();

      expect(content1).toBe(content2); // Same object reference
    });

    it('should clear cache when requested', () => {
      dom.window.document.body.innerHTML = `
        <article><p>Content</p></article>
      `;

      const content1 = extractor.extractMainContent();
      extractor.clearCache();
      const content2 = extractor.extractMainContent();

      expect(content1).not.toBe(content2); // Different object references
    });
  });
});
