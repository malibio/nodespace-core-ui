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
  const taskNode = node as TaskNode;
  const hasChildren = node.children.length > 0;
  const [, forceUpdate] = useState({});
  const triggerUpdate = useCallback(() => forceUpdate({}), []);

  const renderCheckbox = () => {
    const status = taskNode.getStatus();
    return (
      <div style={{ 
        position: 'relative', 
        width: '12px', 
        height: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {hasChildren && (
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
            <rect 
              x="1" 
              y="1" 
              width="10" 
              height="10" 
              rx="2"
              fill="transparent"
              stroke="var(--ns-parent-border-color, #808080)"
              strokeWidth="1"
            />
          </svg>
        )}
        
        <svg 
          width={9} 
          height={9} 
          viewBox="0 0 9 9"
          style={{ 
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2
          }}
        >
          
          <rect 
            x="0.5" 
            y="0.5" 
            width="8" 
            height="8" 
            rx="1"
            fill={status === 'pending' ? 'transparent' : 'var(--ns-circle-color, black)'}
            stroke="var(--ns-circle-color, black)"
            strokeWidth="1"
          />
          
          {status === 'in-progress' && (
            <line 
              x1="2.5" 
              y1="4.5" 
              x2="6.5" 
              y2="4.5" 
              stroke="white" 
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          )}
          
          {status === 'completed' && (
            <path 
              d="M2.5 4.5l1.5 1.5 2.5-2.5" 
              stroke="white" 
              strokeWidth="1.2" 
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>
    );
  };

  
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
          marginTop: '10px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '12px',
          height: '12px'
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