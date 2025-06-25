import React, { useState, useCallback } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { NodeEditorProps } from './TextNodeEditor';
import { TaskNode } from '../nodes';

/**
 * Editor component specifically for task nodes
 * Demonstrates different UI for TaskNode vs TextNode
 */
export function TaskNodeEditor({
  node,
  nodeId,
  textareaRefs,
  onFocus,
  onBlur,
  onKeyDown,
  onContentChange,
  onClick
}: NodeEditorProps) {
  // Cast to TaskNode for type safety
  const taskNode = node as TaskNode;
  
  // Check if this node has children
  const hasChildren = node.children.length > 0;
  
  // Local state for UI updates
  const [, forceUpdate] = useState({});
  const triggerUpdate = useCallback(() => forceUpdate({}), []);

  // Render custom solid box checkbox
  const renderCheckbox = () => {
    const status = taskNode.getStatus();
    
    return (
      <div style={{ position: 'relative', width: '10px', height: '10px' }}>
        {/* 10x10 box behind - only show if node has children */}
        {hasChildren && (
          <svg 
            width={10} 
            height={10} 
            viewBox="0 0 10 10"
            style={{ position: 'absolute', top: 0, left: '1px' }}
          >
            <rect 
              x="0.5" 
              y="0.5" 
              width="9" 
              height="9" 
              rx="2"
              fill="transparent"
              stroke="var(--ns-parent-border-color, #808080)"
              strokeWidth="2"
            />
          </svg>
        )}
        
        {/* 8x8 checkbox in front */}
        <svg 
          width={8} 
          height={8} 
          viewBox="0 0 8 8"
          style={{ position: 'absolute', top: '1px', left: '2px' }}
        >
          {/* Solid box background */}
          <rect 
            x="0.5" 
            y="0.5" 
            width="7" 
            height="7" 
            rx="0.5"
            fill={status === 'pending' ? 'transparent' : 'var(--ns-circle-color, black)'}
            stroke="var(--ns-circle-color, black)"
            strokeWidth="0.8"
          />
          
          {/* Content based on status */}
          {status === 'in-progress' && (
            <line 
              x1="2" 
              y1="4" 
              x2="6" 
              y2="4" 
              stroke="white" 
              strokeWidth="1"
              strokeLinecap="round"
            />
          )}
          
          {status === 'completed' && (
            <path 
              d="M2 4l1.5 1.5 2.5-2.5" 
              stroke="white" 
              strokeWidth="1" 
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>
    );
  };

  // Handle checkbox click to cycle through statuses
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent textarea focus
    taskNode.cycleThroughStatus();
    triggerUpdate();
  };

  return (
    <div className="ns-task-editor-container" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
      <div 
        className="ns-task-checkbox"
        onClick={handleCheckboxClick}
        style={{
          cursor: 'pointer',
          marginTop: '10px', // Align with textarea text (adjusted for overlapped boxes)
          flexShrink: 0
        }}
      >
{renderCheckbox()}
      </div>
      <TextareaAutosize
        ref={(el) => {
          textareaRefs.current[nodeId] = el;
        }}
        className="ns-node-textarea"
        value={node.getContent()}
        onChange={(e) => {
          node.setContent(e.target.value);
          onContentChange(e.target.value);
        }}
        onFocus={() => onFocus(nodeId)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        onClick={onClick}
        minRows={1}
        style={{
          resize: 'none',
          overflow: 'hidden',
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          flex: 1
        }}
      />
    </div>
  );
}