import React, { useState, useCallback } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { NodeEditorProps } from './TextNodeEditor';
import { AIChatNode } from '../nodes';

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
  
  // Local state for UI updates
  const [, forceUpdate] = useState({});
  const triggerUpdate = useCallback(() => forceUpdate({}), []);

  // Handle question input changes
  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newQuestion = e.target.value;
    chatNode.setQuestion(newQuestion);
    onContentChange(newQuestion);
    triggerUpdate();
  };

  // Handle Ask button click
  const handleAsk = async () => {
    if (!chatNode.getQuestion().trim()) return;
    
    triggerUpdate(); // Update UI to show loading
    try {
      await chatNode.simulateAIResponse();
    } catch (error) {
      console.error('Failed to get AI response:', error);
    }
    triggerUpdate(); // Update UI with response
  };

  // Handle Clear button click
  const handleClear = () => {
    chatNode.setQuestion('');
    chatNode.setResponse('');
    chatNode.setError(null);
    chatNode.setSources([]);
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
    <div className="ns-ai-chat-editor">
      {/* Question Input Section */}
      <div className="ns-ai-chat-input-section">
        <TextareaAutosize
          ref={(el) => {
            textareaRefs.current[nodeId] = el;
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
          {error && (
            <div className="ns-ai-chat-error">
              <strong>Error:</strong> {error}
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

              {/* Sources Section (Placeholder) */}
              {sources.length > 0 && (
                <div className="ns-ai-chat-sources">
                  <div className="ns-ai-chat-sources-header">
                    <strong>Sources:</strong>
                  </div>
                  <div className="ns-ai-chat-sources-list">
                    {sources.map((source, index) => (
                      <div key={index} className="ns-ai-chat-source-item">
                        <span className="ns-ai-chat-source-icon">
                          {source.type === 'task' ? '✓' : '📄'}
                        </span>
                        <span className="ns-ai-chat-source-title">
                          {source.title}
                        </span>
                        <span className="ns-ai-chat-source-type">
                          ({source.type})
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="ns-ai-chat-sources-note">
                    <em>Note: Source linking not yet implemented</em>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      {!response && !error && !isLoading && (
        <div className="ns-ai-chat-help">
          <span className="ns-ai-chat-shortcut">Tip: Press Ctrl+Enter to ask</span>
        </div>
      )}
    </div>
  );
}