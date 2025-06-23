import { BaseNode } from './BaseNode';

export interface AIChatData {
  question: string;
  response: string;
  isLoading: boolean;
  error: string | null;
  sources: Array<{
    nodeId: string;
    title: string;
    type: string;
  }>;
}

/**
 * Node for AI chat interactions
 * Stores both user questions and AI responses with source attribution
 */
export class AIChatNode extends BaseNode {
  private chatData: AIChatData;

  constructor(content: string = '', nodeId?: string) {
    super('ai-chat', content, nodeId);
    
    // Initialize chat-specific data
    this.chatData = {
      question: content,
      response: '',
      isLoading: false,
      error: null,
      sources: []
    };
  }

  createIndicator(): HTMLElement {
    const indicator = document.createElement('div');
    indicator.className = 'ns-node-indicator ns-ai-chat-indicator';
    indicator.setAttribute('data-node-type', 'ai-chat');
    
    // Create SVG element for sparkles icon
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '12');
    svg.setAttribute('height', '12');
    svg.setAttribute('viewBox', '0 -960 960 960');
    svg.style.fill = 'currentColor';
    svg.style.display = 'block';
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M80-120v-80h800v80H80Zm680-160v-560h60v560h-60Zm-600 0 210-560h100l210 560h-96l-50-144H308l-52 144h-96Zm176-224h168l-82-232h-4l-82 232Z');
    
    svg.appendChild(path);
    indicator.appendChild(svg);
    
    return indicator;
  }

  getIndicatorClass(): string {
    return 'ns-ai-chat-indicator';
  }

  getDefaultProperties(): Record<string, any> {
    return {
      question: '',
      response: '',
      isLoading: false,
      error: null,
      sources: []
    };
  }

  // Chat-specific methods
  getQuestion(): string {
    return this.chatData.question;
  }

  setQuestion(question: string): void {
    this.chatData.question = question;
    this.setContent(question); // Keep base content in sync
  }

  getResponse(): string {
    return this.chatData.response;
  }

  setResponse(response: string): void {
    this.chatData.response = response;
  }

  isLoading(): boolean {
    return this.chatData.isLoading;
  }

  setLoading(loading: boolean): void {
    this.chatData.isLoading = loading;
  }

  getError(): string | null {
    return this.chatData.error;
  }

  setError(error: string | null): void {
    this.chatData.error = error;
  }

  getSources(): Array<{ nodeId: string; title: string; type: string }> {
    return [...this.chatData.sources];
  }

  setSources(sources: Array<{ nodeId: string; title: string; type: string }>): void {
    this.chatData.sources = sources;
  }

  // Override content methods to work with question
  getContent(): string {
    return this.chatData.question;
  }

  setContent(content: string): void {
    super.setContent(content);
    this.chatData.question = content;
  }

  // Mock AI response for development
  async simulateAIResponse(): Promise<void> {
    this.setLoading(true);
    this.setError(null);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // Mock response based on question content
      const question = this.getQuestion().toLowerCase();
      let response = '';
      let sources: Array<{ nodeId: string; title: string; type: string }> = [];

      if (question.includes('hello') || question.includes('hi')) {
        response = 'Hello! I\'m NodeSpace AI. I can help you find information from your knowledge base and answer questions about your content.';
      } else if (question.includes('what') || question.includes('how') || question.includes('?')) {
        response = `Based on your question about "${this.getQuestion()}", here's what I found:\n\nThis is a placeholder AI response. The actual AI integration will connect to your NodeSpace knowledge base and provide contextual answers with real source attribution.\n\n**Key Points:**\n- AI responses will be generated from your actual content\n- Source nodes will be properly linked\n- Responses will include relevant context and citations`;
        
        // Mock sources
        sources = [
          { nodeId: 'mock-1', title: 'Introduction to NodeSpace', type: 'text' },
          { nodeId: 'mock-2', title: 'Getting Started Guide', type: 'text' },
          { nodeId: 'mock-3', title: 'Research Notes', type: 'task' }
        ];
      } else {
        response = `I understand you're asking about "${this.getQuestion()}". This is a placeholder response from the NodeSpace AI system.\n\nOnce integrated with the backend, I'll be able to:\n- Search through your knowledge base\n- Provide contextual answers\n- Show relevant source materials\n- Generate insights from your content`;
        
        sources = [
          { nodeId: 'mock-4', title: 'Related Content', type: 'text' }
        ];
      }

      this.setResponse(response);
      this.setSources(sources);
    } catch (error) {
      this.setError('Failed to get AI response. Please try again.');
    } finally {
      this.setLoading(false);
    }
  }

  // Enhanced serialization to include chat data
  toJSON(): any {
    return {
      ...super.toJSON(),
      chatData: this.chatData
    };
  }

  // Method to restore from JSON (for deserialization)
  static fromJSON(data: any): AIChatNode {
    const node = new AIChatNode(data.content || '', data.id);
    if (data.chatData) {
      node.chatData = { ...data.chatData };
    }
    if (data.tags) {
      data.tags.forEach((tag: string) => node.addTag(tag));
    }
    if (data.customMetadata) {
      Object.entries(data.customMetadata).forEach(([key, value]) => {
        node.setCustomMetadata(key, value);
      });
    }
    return node;
  }
}