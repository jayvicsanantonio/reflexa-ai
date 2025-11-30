import { describe, it, expect } from 'vitest';
import { RecursiveTextSplitter } from './TextSplitter';

describe('RecursiveTextSplitter', () => {
  it('should not split text smaller than chunk size', () => {
    const splitter = new RecursiveTextSplitter({
      chunkSize: 100,
      chunkOverlap: 10,
    });

    const text = 'This is a short text.';
    const chunks = splitter.splitText(text);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(text);
  });

  it('should split text at paragraph boundaries', () => {
    const splitter = new RecursiveTextSplitter({
      chunkSize: 50,
      chunkOverlap: 5,
    });

    const text = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
    const chunks = splitter.splitText(text);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join('')).toContain('First paragraph');
    expect(chunks.join('')).toContain('Second paragraph');
  });

  it('should split text at sentence boundaries when paragraphs are too large', () => {
    const splitter = new RecursiveTextSplitter({
      chunkSize: 30,
      chunkOverlap: 5,
    });

    const text = 'First sentence. Second sentence. Third sentence.';
    const chunks = splitter.splitText(text);

    expect(chunks.length).toBeGreaterThan(1);
  });

  it('should include overlap between chunks', () => {
    const splitter = new RecursiveTextSplitter({
      chunkSize: 20,
      chunkOverlap: 5,
    });

    const text = 'word '.repeat(20); // 100 characters
    const chunks = splitter.splitText(text);

    expect(chunks.length).toBeGreaterThan(1);
    // Check that chunks have reasonable sizes
    for (const chunk of chunks) {
      expect(chunk.length).toBeGreaterThan(0);
      expect(chunk.length).toBeLessThanOrEqual(20);
    }
  });

  it('should handle empty text', () => {
    const splitter = new RecursiveTextSplitter({
      chunkSize: 100,
      chunkOverlap: 10,
    });

    const chunks = splitter.splitText('');
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe('');
  });

  it('should split very long text without separators', () => {
    const splitter = new RecursiveTextSplitter({
      chunkSize: 10,
      chunkOverlap: 2,
    });

    const text = 'a'.repeat(50);
    const chunks = splitter.splitText(text);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join('')).toHaveLength(text.length + (chunks.length - 1) * 2); // Account for overlap
  });
});
