import { BaseNode } from './BaseNode';
import { 
  AIChatNodeData, 
  ChatSession, 
  ChatMessage, 
  MessageRole, 
  RAGMessageContext,
  ChatLoadingState
} from '../types/chat';

// Legacy interface for backward compatibility
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
 * Enhanced with RAG functionality and comprehensive chat session management
 * Implements the new AIChatNodeData interface while maintaining backward compatibility
 */
export class AIChatNode extends BaseNode {
  private chatData: AIChatData;
  private enhancedData: Partial<AIChatNodeData>;
  private session: ChatSession | null = null;
  private messages: ChatMessage[] = [];
  private loadingState: ChatLoadingState = ChatLoadingState.Idle;

  constructor(content: string = '', nodeId?: string) {
    super('ai-chat', content, nodeId);
    
    // Initialize legacy chat data for backward compatibility
    this.chatData = {
      question: content,
      response: '',
      isLoading: false,
      error: null,
      sources: []
    };
    
    // Initialize enhanced data structure
    this.enhancedData = {
      id: this.getNodeId(),
      session_id: null,
      title: content || 'Untitled Chat',
      is_minimized: false,
      message_count: 0,
      date_time_created: new Date(),
      date_time_modified: new Date(),
      content: content,
      node_type: 'ai-chat' as const
    };
  }

  createIndicator(): HTMLElement {
    const indicator = document.createElement('div');
    indicator.className = 'ns-node-indicator ns-ai-chat-indicator';
    indicator.setAttribute('data-node-type', 'ai-chat');
    
    // Create SVG element for robot icon
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '12');
    svg.setAttribute('height', '12');
    svg.setAttribute('viewBox', '0 -960 960 960');
    svg.style.fill = 'currentColor';
    svg.style.display = 'block';
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    // AI icon - "AI" text with underline, same as used in slash command modal
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
    this.enhancedData.content = content;
    this.enhancedData.title = content || 'Untitled Chat';
    this.enhancedData.date_time_modified = new Date();
  }

  // Enhanced RAG-aware methods

  /**
   * Get enhanced chat node data conforming to AIChatNodeData interface
   */
  getEnhancedData(): AIChatNodeData {
    return {
      id: this.getNodeId(),
      session_id: this.enhancedData.session_id || null,
      title: this.enhancedData.title || 'Untitled Chat',
      is_minimized: this.enhancedData.is_minimized || false,
      last_message_at: this.messages.length > 0 ? this.messages[this.messages.length - 1].timestamp : undefined,
      message_count: this.messages.length,
      date_time_created: this.enhancedData.date_time_created || new Date(),
      date_time_modified: this.enhancedData.date_time_modified || new Date(),
      content: this.enhancedData.content || '',
      node_type: 'ai-chat' as const,
      parent_id: this.parent?.getNodeId()
    };
  }

  /**
   * Set/create chat session for this node
   */
  setSession(session: ChatSession): void {
    this.session = session;
    this.enhancedData.session_id = session.id;
    this.messages = session.messages;
    this.enhancedData.message_count = session.messages.length;
  }

  /**
   * Get current chat session
   */
  getSession(): ChatSession | null {
    return this.session;
  }

  /**
   * Add a message to the chat session
   */
  addMessage(message: ChatMessage): void {
    this.messages.push(message);
    this.enhancedData.message_count = this.messages.length;
    this.enhancedData.last_message_at = message.timestamp;
    this.enhancedData.date_time_modified = new Date();
    
    if (this.session) {
      this.session.messages = this.messages;
      this.session.updated_at = new Date();
    }
  }

  /**
   * Get all messages in chronological order
   */
  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  /**
   * Get current loading state
   */
  getLoadingState(): ChatLoadingState {
    return this.loadingState;
  }

  /**
   * Set loading state
   */
  setLoadingState(state: ChatLoadingState): void {
    this.loadingState = state;
    this.chatData.isLoading = state === ChatLoadingState.Processing || state === ChatLoadingState.Generating;
  }

  /**
   * Create a chat message from current question
   */
  createUserMessage(): ChatMessage {
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      session_id: this.enhancedData.session_id || '',
      content: this.getQuestion(),
      role: MessageRole.User,
      timestamp: new Date(),
      sequence_number: this.messages.length + 1
    };
  }

  /**
   * Enhanced RAG response simulation with proper typing
   */
  async simulateRAGResponse(): Promise<ChatMessage> {
    this.setLoadingState(ChatLoadingState.Processing);
    this.setError(null);

    // Simulate RAG processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const question = this.getQuestion().toLowerCase();
      let response = '';
      let ragContext: RAGMessageContext;

      if (question.includes('hello') || question.includes('hi')) {
        response = 'Hello! I\'m NodeSpace AI. I can help you find information from your knowledge base and answer questions about your content.';
        ragContext = {
          sources_used: [],
          retrieval_score: 0.95,
          context_tokens: 50,
          generation_time_ms: 1200,
          knowledge_summary: 'No specific knowledge retrieved for greeting'
        };
      } else if (question.includes('what') || question.includes('how') || question.includes('?')) {
        response = `Based on your question about "${this.getQuestion()}", here's what I found:\n\nThis is a placeholder AI response with RAG context. The actual AI integration will connect to your NodeSpace knowledge base and provide contextual answers with real source attribution.\n\n**Key Points:**\n- AI responses will be generated from your actual content\n- Source nodes will be properly linked\n- Responses will include relevant context and citations`;
        
        ragContext = {
          sources_used: ['mock-1', 'mock-2', 'mock-3'],
          retrieval_score: 0.87,
          context_tokens: 245,
          generation_time_ms: 1850,
          knowledge_summary: 'Retrieved content from 3 relevant knowledge sources'
        };
      } else {
        response = `I understand you're asking about "${this.getQuestion()}". This is a placeholder response from the NodeSpace AI system.\n\nOnce integrated with the backend, I'll be able to:\n- Search through your knowledge base\n- Provide contextual answers\n- Show relevant source materials\n- Generate insights from your content`;
        
        ragContext = {
          sources_used: ['mock-4'],
          retrieval_score: 0.72,
          context_tokens: 180,
          generation_time_ms: 1400,
          knowledge_summary: 'Limited relevant content found'
        };
      }

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        session_id: this.enhancedData.session_id || '',
        content: response,
        role: MessageRole.Assistant,
        timestamp: new Date(),
        sequence_number: this.messages.length + 1,
        rag_context: ragContext
      };

      this.setResponse(response);
      this.setSources(ragContext.sources_used.map(id => ({
        nodeId: id,
        title: `Knowledge Source ${id}`,
        type: 'text'
      })));

      this.setLoadingState(ChatLoadingState.Idle);
      return assistantMessage;

    } catch (error) {
      this.setError('Failed to get AI response. Please try again.');
      this.setLoadingState(ChatLoadingState.Error);
      throw error;
    }
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