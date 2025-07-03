import React from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { BaseNode } from '../nodes';
import { NodeSpaceCallbacks } from '../types';

/**
 * Props for node-specific editors
 */
export interface NodeEditorProps {
  node: BaseNode;
  nodeId: string;
  focused: boolean;
  textareaRefs: React.MutableRefObject<{ [key: string]: HTMLTextAreaElement | null }>;
  onFocus: (nodeId: string) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onContentChange: (content: string) => void;
  onClick?: () => void;
  callbacks?: NodeSpaceCallbacks;
}

/**
 * Editor component specifically for text nodes
 * Contains the current textarea logic extracted from NodeEditor.tsx
 */
export function TextNodeEditor({
  node,
  nodeId,
  textareaRefs,
  onFocus,
  onBlur,
  onKeyDown,
  onContentChange,
  onClick
}: NodeEditorProps) {
  
  const hasChildren = node.children.length > 0;
  const renderCircle = () => {
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
            r="2.5" 
            fill="var(--ns-circle-color, black)"
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="ns-text-editor-container" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
      <div 
        className="ns-text-indicator"
        style={{
          marginTop: '10px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '12px',
          height: '12px'
        }}
      >
        {renderCircle()}
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
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
        }}
      />
    </div>
  );
}