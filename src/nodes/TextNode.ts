import { BaseNode } from './BaseNode';

/**
 * Text node for text content with text extraction capability.
 * Supports markdown formatting and provides clean text for RAG/backend processing.
 */
export class TextNode extends BaseNode {
  constructor(content: string = '', nodeId?: string) {
    super('text', content, nodeId);
  }

  createIndicator(): HTMLElement {
    const indicator = document.createElement('span');
    indicator.className = 'node-indicator-text';
    indicator.innerHTML = '•';
    indicator.style.color = '#6b7280';
    indicator.style.fontSize = '16px';
    indicator.style.marginRight = '8px';
    return indicator;
  }

  getIndicatorClass(): string {
    return 'node-indicator-text';
  }

  getDefaultProperties(): Record<string, any> {
    return {
      type: 'text',
      supportsMarkdown: true,
      extractable: true
    };
  }

  /**
   * Extract plain text content for RAG/backend processing.
   * Strips markdown formatting and returns clean text.
   */
  getPlainTextContent(): string {
    return this.getContent().trim();
  }

  /**
   * Check if this node has meaningful content for text extraction.
   */
  hasTextContent(): boolean {
    return this.getPlainTextContent().length > 0;
  }
}