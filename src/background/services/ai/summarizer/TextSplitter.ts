/**
 * Text Splitter - Splits large text into chunks for summarization
 * Implements recursive character splitting similar to LangChain's approach
 */

export interface TextSplitterOptions {
  chunkSize: number;
  chunkOverlap: number;
  separators?: string[];
}

/**
 * Recursively splits text at logical boundaries
 * Prioritizes splitting at paragraphs, then sentences, then words
 */
export class RecursiveTextSplitter {
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;
  private readonly separators: string[];

  constructor(options: TextSplitterOptions) {
    this.chunkSize = options.chunkSize;
    this.chunkOverlap = options.chunkOverlap;
    this.separators = options.separators ?? [
      '\n\n', // Paragraphs
      '\n', // Lines
      '. ', // Sentences
      '! ',
      '? ',
      '; ',
      ', ', // Clauses
      ' ', // Words
      '', // Characters (last resort)
    ];
  }

  /**
   * Split text into chunks
   */
  splitText(text: string): string[] {
    if (text.length <= this.chunkSize) {
      return [text];
    }

    return this.recursiveSplit(text, this.separators);
  }

  private recursiveSplit(text: string, separators: string[]): string[] {
    if (text.length <= this.chunkSize) {
      return [text];
    }

    if (separators.length === 0) {
      // Last resort: split by character count
      return this.splitBySize(text);
    }

    const [separator, ...remainingSeparators] = separators;
    const splits = separator ? text.split(separator) : [text];

    const chunks: string[] = [];
    let currentChunk = '';

    for (const piece of splits) {
      const testChunk =
        currentChunk + (currentChunk && separator ? separator : '') + piece;

      if (testChunk.length <= this.chunkSize) {
        currentChunk = testChunk;
      } else {
        // Current chunk is full
        if (currentChunk) {
          chunks.push(currentChunk);
          // Add overlap from the end of current chunk
          currentChunk = this.getOverlap(currentChunk) + piece;
        } else {
          // Single piece is too large, split it further
          const subChunks = this.recursiveSplit(piece, remainingSeparators);
          chunks.push(...subChunks.slice(0, -1));
          currentChunk = subChunks[subChunks.length - 1];
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  private splitBySize(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + this.chunkSize, text.length);
      chunks.push(text.slice(start, end));

      // Prevent infinite loop if chunkOverlap >= chunkSize
      const nextStart = end - this.chunkOverlap;
      if (nextStart <= start) {
        start = end;
      } else {
        start = nextStart;
      }

      // Safety check to prevent infinite loops
      if (chunks.length > 10000) {
        throw new Error('Text splitting exceeded maximum chunk limit');
      }
    }

    return chunks;
  }

  private getOverlap(text: string): string {
    if (this.chunkOverlap === 0 || text.length <= this.chunkOverlap) {
      return '';
    }
    return text.slice(-this.chunkOverlap);
  }
}
