/**
 * DOM Adapter - Abstracts DOM operations
 * Supports Dependency Inversion Principle (DIP) - depend on abstractions
 */

import type { IDOMAdapter } from '../interfaces';

/**
 * Default DOM adapter implementation using the browser's document
 */
export class BrowserDOMAdapter implements IDOMAdapter {
  constructor(private readonly doc: Document = document) {}

  querySelector(selector: string): Element | null {
    return this.doc.querySelector(selector);
  }

  querySelectorAll(selector: string): NodeListOf<Element> {
    return this.doc.querySelectorAll(selector);
  }

  getLocationHref(): string {
    return this.doc.location.href;
  }

  getTitle(): string {
    return this.doc.title;
  }

  getBody(): HTMLElement | null {
    return this.doc.body;
  }

  cloneElement(element: HTMLElement): HTMLElement {
    return element.cloneNode(true) as HTMLElement;
  }
}
