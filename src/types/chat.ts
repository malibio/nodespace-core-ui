// TypeScript interfaces for RAG-enhanced AIChatNode functionality
// As defined in Linear task NS-64

// Basic node identifier type
export type NodeId = string;

// Core Chat Types

export interface AIChatNodeData {
  id: NodeId;
  session_id: string | null;           // Links to chat session
  title: string;                       // User-editable chat title
  is_minimized: boolean;              // UI state for collapsed/expanded
  last_message_at?: Date;             // Last activity timestamp
  message_count: number;              // Total messages in conversation
  date_time_created: Date;            // Node creation timestamp
  date_time_modified: Date;           // Node modification timestamp
  content: string;                    // Node content (initial question)
  node_type: 'ai-chat';              // Node type identifier
  parent_id?: NodeId;                 // Parent node reference
}

export interface ChatSession {
  id: string;
  node_id: string;                    // Links to AIChatNode
  parent_date_node_id: string;        // DateNode where chat exists
  title: string;                      // Session title
  created_at: Date;
  updated_at: Date;
  messages: ChatMessage[];            // Conversation history
  metadata?: ChatSessionMetadata;     // Additional session data
}

export interface ChatSessionMetadata {
  total_tokens_used: number;
  average_response_time_ms: number;
  knowledge_sources_count: number;
  last_rag_query_at?: Date;
}

// Message and RAG Types

export interface ChatMessage {
  id: string;
  session_id: string;
  content: string;
  role: MessageRole;
  timestamp: Date;
  sequence_number: number;
  rag_context?: RAGMessageContext;    // RAG-specific metadata
}

export enum MessageRole {
  User = 'user',
  Assistant = 'assistant',
  System = 'system'  // For future system messages
}

export interface RAGMessageContext {
  sources_used: NodeId[];             // Knowledge sources referenced
  retrieval_score: number;            // Relevance confidence (0-1)
  context_tokens: number;             // Tokens used for context
  generation_time_ms: number;         // Response generation time
  knowledge_summary: string;          // Brief summary of used knowledge
}

// RAG Processing Types

export interface RAGQueryRequest {
  query: string;
  session_id: string;
  conversation_history: ChatMessage[];
  options?: RAGQueryOptions;
}

export interface RAGQueryOptions {
  max_retrieval_results?: number;     // Default: 5
  relevance_threshold?: number;       // Default: 0.7
  date_scope?: DateScope;             // Temporal filtering
  include_sources?: boolean;          // Include source attribution
  context_window_size?: number;       // Token limit for context
}

export interface DateScope {
  start_date?: Date;
  end_date?: Date;
  relative_days?: number;             // e.g., last 30 days
}

// RAG Response Types

export interface RAGQueryResponse {
  message_id: string;
  content: string;
  rag_context: RAGMessageContext;
  status: RAGResponseStatus;
  error_message?: string;
}

export enum RAGResponseStatus {
  Success = 'success',
  PartialSuccess = 'partial_success',  // Some sources failed
  NoRelevantSources = 'no_relevant_sources',
  Error = 'error'
}

// Knowledge Source Types

export interface KnowledgeSource {
  node_id: NodeId;
  title: string;
  node_type: string;
  excerpt: string;                    // Relevant content snippet
  relevance_score: number;            // 0-1 confidence
  last_modified: Date;
}

// UI State Types

export interface ChatUIState {
  is_expanded: boolean;
  show_sources: boolean;
  show_metadata: boolean;
  input_focus: boolean;
  loading_state: ChatLoadingState;
}

export enum ChatLoadingState {
  Idle = 'idle',
  Processing = 'processing',
  Generating = 'generating',
  Error = 'error'
}

// Event Types for Chat Operations

export interface ChatEvent {
  type: ChatEventType;
  session_id: string;
  timestamp: Date;
  data: any;
}

export enum ChatEventType {
  MessageSent = 'message_sent',
  ResponseReceived = 'response_received',
  SessionCreated = 'session_created',
  SessionUpdated = 'session_updated',
  RAGContextRetrieved = 'rag_context_retrieved',
  ErrorOccurred = 'error_occurred'
}

// Integration Types for Desktop App

export interface TauriChatCommand {
  command: string;
  session_id: string;
  payload: any;
}

export interface ChatCallbacks {
  onMessageSent?: (message: ChatMessage) => void;
  onResponseReceived?: (response: RAGQueryResponse) => void;
  onSessionCreated?: (session: ChatSession) => void;
  onSessionUpdated?: (session: ChatSession) => void;
  onRAGContextRetrieved?: (context: RAGMessageContext) => void;
  onError?: (error: string) => void;
}

// Search and Discovery Types

export interface ChatSearchResult {
  session_id: string;
  message_id: string;
  content_snippet: string;
  relevance_score: number;
  timestamp: Date;
  rag_sources?: KnowledgeSource[];
}

export interface ChatSearchRequest {
  query: string;
  date_range?: DateScope;
  message_types?: MessageRole[];
  min_relevance?: number;
  max_results?: number;
}

// Export all types for easy importing
export type {
  // Core types already exported above
};