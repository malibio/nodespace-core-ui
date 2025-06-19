import React, { useRef } from 'react';
import { BaseNode } from './nodes';
import { RenderNodeTree, NodeSpaceCallbacks } from './hierarchy';
import { countAllNodes } from './utils';

export interface NodeSpaceEditorProps {
  nodes: BaseNode[];
  focusedNodeId?: string | null;
  callbacks: NodeSpaceCallbacks;
  onFocus?: (nodeId: string) => void;
  onBlur?: () => void;
  onRemoveNode?: (node: BaseNode) => void;
  className?: string;
  // Collapsed state management
  collapsedNodes?: Set<string>;
  collapsibleNodeTypes?: Set<string>;
  onCollapseChange?: (nodeId: string, collapsed: boolean) => void;
}

/**
 * NodeSpaceEditor - Main component for hierarchical block editing
 * 
 * This is the primary export of the nodespace-core-ui library.
 * It provides a complete hierarchical block editor with keyboard navigation,
 * collapsible nodes, and advanced editing features.
 */
const NodeSpaceEditor: React.FC<NodeSpaceEditorProps> = ({
  nodes,
  focusedNodeId = null,
  callbacks,
  onFocus,
  onBlur,
  onRemoveNode,
  className = '',
  collapsedNodes = new Set(),
  collapsibleNodeTypes = new Set(['text', 'task', 'date', 'entity']),
  onCollapseChange
}) => {
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});
  const totalNodeCount = countAllNodes(nodes);

  const handleRemoveNode = (node: BaseNode) => {
    if (onRemoveNode) {
      onRemoveNode(node);
    } else {
      // Default behavior if no onRemoveNode handler provided
      if (totalNodeCount > 1) {
        if (node.parent) {
          node.parent.removeChild(node);
          if (callbacks.onNodesChange) {
            callbacks.onNodesChange([...nodes]);
          }
        } else {
          const newNodes = nodes.filter(n => n.getNodeId() !== node.getNodeId());
          if (callbacks.onNodesChange) {
            callbacks.onNodesChange(newNodes);
          }
        }
      }
    }
  };

  const handleFocus = (nodeId: string) => {
    if (onFocus) {
      onFocus(nodeId);
    }
  };

  const handleBlur = () => {
    if (onBlur) {
      onBlur();
    }
  };

  return (
    <div className={`ns-editor-container ${className}`}>
      <RenderNodeTree
        nodes={nodes}
        focusedNodeId={focusedNodeId}
        textareaRefs={textareaRefs}
        onRemoveNode={handleRemoveNode}
        totalNodeCount={totalNodeCount}
        callbacks={callbacks}
        onFocus={handleFocus}
        onBlur={handleBlur}
        collapsedNodes={collapsedNodes}
        collapsibleNodeTypes={collapsibleNodeTypes}
        onCollapseChange={onCollapseChange}
      />
    </div>
  );
};

export default NodeSpaceEditor;