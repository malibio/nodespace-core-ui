import React, { useState, useCallback } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { NodeEditorProps } from './TextNodeEditor';
import { AIChatNode } from '../nodes';
import { ChatMessage } from '../types/chat';
import { RAGSourcePreview } from '../components/RAGSourcePreview';

/**
 * Editor component specifically for AI chat nodes
 * Provides chat interface with question input, response area, and source attribution
 */
export function AIChatNodeEditor({
  node,
  nodeId,
  textareaRefs,
  onFocus,
  onBlur,
  onKeyDown,
  onContentChange,
  onClick
}: NodeEditorProps) {
  // Cast to AIChatNode for type safety
  const chatNode = node as AIChatNode;
  
  // Local state for UI updates and RAG context tracking
  const [, forceUpdate] = useState({});
  const [currentAssistantMessage, setCurrentAssistantMessage] = useState<ChatMessage | null>(null);
  const triggerUpdate = useCallback(() => forceUpdate({}), []);

  // Handle title/name changes
  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTitle = e.target.value;
    chatNode.setTitle(newTitle);
    onContentChange(newTitle); // Title changes are the main content
    triggerUpdate();
  };

  // Handle question input changes
  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newQuestion = e.target.value;
    chatNode.setQuestion(newQuestion);
    // Don't call onContentChange for question - it's separate from main content
    triggerUpdate();
  };

  // Handle Ask button click
  const handleAsk = async () => {
    if (!chatNode.getQuestion().trim()) return;
    
    // Add user message to session
    const userMessage = chatNode.createUserMessage();
    chatNode.addMessage(userMessage);
    
    triggerUpdate(); // Update UI to show loading
    try {
      // Use enhanced RAG functionality instead of legacy simulateAIResponse
      const assistantMessage = await chatNode.simulateRAGResponse();
      chatNode.addMessage(assistantMessage);
      setCurrentAssistantMessage(assistantMessage);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      setCurrentAssistantMessage(null);
    }
    triggerUpdate(); // Update UI with response
  };

  // Handle Clear button click
  const handleClear = () => {
    chatNode.setQuestion('');
    chatNode.setResponse('');
    chatNode.setError(null);
    chatNode.setSources([]);
    setCurrentAssistantMessage(null);
    onContentChange('');
    triggerUpdate();
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAsk();
      return;
    }
    onKeyDown(e);
  };

  const question = chatNode.getQuestion();
  const response = chatNode.getResponse();
  const isLoading = chatNode.isLoading();
  const error = chatNode.getError();
  const sources = chatNode.getSources();

  return (
    <div className="ns-ai-chat-container">
      {/* Title/Name Section - Outside chat area, like TextNode */}
      <div className="ns-ai-chat-editor-container" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <div 
          className="ns-ai-chat-indicator ns-node-indicator"
          style={{
            position: 'relative',
            marginTop: '10px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '12px',
            height: '12px'
          }}
        >
          {node.children.length > 0 && (
            <svg 
              width={12} 
              height={12} 
              viewBox="0 0 12 12"
              style={{ 
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              <circle 
                cx="6" 
                cy="6" 
                r="3.25" 
                fill="transparent"
                stroke="var(--ns-parent-border-color, #808080)"
                strokeWidth="1.5"
              />
            </svg>
          )}
          
          <svg 
            width={12} 
            height={12} 
            viewBox="0 -960 960 960"
            style={{ 
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <path 
              d="M80-120v-80h800v80H80Zm680-160v-560h60v560h-60Zm-600 0 210-560h100l210 560h-96l-50-144H308l-52 144h-96Zm176-224h168l-82-232h-4l-82 232Z"
              fill="var(--ns-circle-color, black)"
            />
          </svg>
        </div>
        <TextareaAutosize
          ref={(el) => {
            textareaRefs.current[nodeId] = el; // Use main nodeId for focus management
          }}
          className="ns-node-textarea"
          value={chatNode.getTitle()}
          onChange={handleTitleChange}
          onFocus={() => onFocus(nodeId)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          onClick={onClick}
          placeholder="AI Chat Title..."
          minRows={1}
          style={{
            resize: 'none',
            overflow: 'hidden',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
          }}
        />
      </div>

      {/* Chat Area - Separate container below title */}
      <div className="ns-ai-chat-editor">
        {/* Question Input Section */}
        <div className="ns-ai-chat-input-section">
        <TextareaAutosize
          ref={(el) => {
            textareaRefs.current[`${nodeId}-question`] = el;
          }}
          className="ns-node-textarea ns-ai-chat-question"
          value={question}
          onChange={handleQuestionChange}
          onFocus={() => onFocus(nodeId)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          onClick={onClick}
          placeholder="Ask NodeSpace AI..."
          minRows={1}
          disabled={isLoading}
          style={{
            resize: 'none',
            overflow: 'hidden',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            marginBottom: '8px'
          }}
        />
        
        {/* Action Buttons */}
        <div className="ns-ai-chat-actions">
          <button
            className="ns-ai-chat-button ns-ai-chat-ask"
            onClick={handleAsk}
            disabled={isLoading || !question.trim()}
          >
            {isLoading ? (
              <>
                <span className="ns-ai-chat-spinner">⟳</span>
                Thinking...
              </>
            ) : (
              'Ask'
            )}
          </button>
          
          <button
            className="ns-ai-chat-button ns-ai-chat-clear"
            onClick={handleClear}
            disabled={isLoading}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Response Section */}
      {(response || error || isLoading) && (
        <div className="ns-ai-chat-response-section">
          {/* Enhanced Loading States */}
          {isLoading && (
            <div className="ns-ai-chat-loading">
              <div className="ns-loading-indicator">
                <span className="ns-loading-spinner">⟳</span>
                <span className="ns-loading-text">
                  {chatNode.getLoadingState() === 'processing' ? 'Searching knowledge base...' : 
                   chatNode.getLoadingState() === 'generating' ? 'Generating response...' : 
                   'Processing...'}
                </span>
              </div>
              <div className="ns-loading-context-info">
                <small>Using RAG to find relevant information</small>
              </div>
            </div>
          )}

          {/* Enhanced Error Handling */}
          {error && (
            <div className="ns-ai-chat-error enhanced">
              <div className="ns-error-icon">⚠️</div>
              <div className="ns-error-content">
                <strong>RAG Query Failed:</strong> {error}
                <div className="ns-error-suggestions">
                  <small>Try rephrasing your question or check if your knowledge base has relevant content.</small>
                </div>
              </div>
              <button 
                className="ns-ai-chat-retry"
                onClick={handleAsk}
                disabled={isLoading}
              >
                Retry
              </button>
            </div>
          )}
          
          {response && !error && (
            <div className="ns-ai-chat-response">
              <div className="ns-ai-chat-response-content">
                {/* Simple markdown-like formatting */}
                {response.split('\n').map((line, index) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return (
                      <strong key={index} className="ns-ai-chat-heading">
                        {line.slice(2, -2)}
                      </strong>
                    );
                  } else if (line.startsWith('- ')) {
                    return (
                      <div key={index} className="ns-ai-chat-bullet">
                        • {line.slice(2)}
                      </div>
                    );
                  } else if (line.trim() === '') {
                    return <br key={index} />;
                  } else {
                    return (
                      <div key={index} className="ns-ai-chat-paragraph">
                        {line}
                      </div>
                    );
                  }
                })}
              </div>

              {/* Enhanced Sources Section with RAG Context */}
              {(sources.length > 0 || currentAssistantMessage?.rag_context) && (
                <div className="ns-ai-chat-sources">
                  <div className="ns-ai-chat-sources-header">
                    <strong>Knowledge Sources:</strong>
                    {currentAssistantMessage?.rag_context && (
                      <span className="ns-rag-indicator">
                        RAG Enhanced
                      </span>
                    )}
                  </div>
                  
                  {/* Enhanced Source Attribution List */}
                  {sources.length > 0 && (
                    <div className="ns-ai-chat-sources-list">
                      {sources.map((source, index) => (
                        <RAGSourcePreview
                          key={index}
                          source={source}
                          relevanceScore={currentAssistantMessage?.rag_context?.retrieval_score}
                          onSourceClick={(nodeId) => {
                            // Source navigation to be implemented
                          }}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* RAG Context Metadata */}
                  {currentAssistantMessage?.rag_context && (
                    <div className="ns-rag-context-metadata">
                      <div className="ns-rag-context-summary">
                        <em>{currentAssistantMessage.rag_context.knowledge_summary}</em>
                      </div>
                      <div className="ns-rag-context-stats">
                        <span className="ns-rag-stat">
                          <strong>Context Tokens:</strong> {currentAssistantMessage.rag_context.context_tokens}
                        </span>
                        <span className="ns-rag-stat">
                          <strong>Generation Time:</strong> {currentAssistantMessage.rag_context.generation_time_ms}ms
                        </span>
                        <span className="ns-rag-stat">
                          <strong>Confidence:</strong> {Math.round(currentAssistantMessage.rag_context.retrieval_score * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {sources.length === 0 && currentAssistantMessage?.rag_context?.sources_used.length === 0 && (
                    <div className="ns-ai-chat-sources-note">
                      <em>No knowledge sources used for this response</em>
                    </div>
                  )}
                  
                  {sources.length > 0 && (
                    <div className="ns-ai-chat-sources-note">
                      <em>Note: Source linking will be available in the full implementation</em>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      </div>
    </div>
  );
}