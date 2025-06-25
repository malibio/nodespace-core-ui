import React, { useRef, useState, useCallback, useEffect } from 'react';
import { BaseNode } from './nodes';
import { RenderNodeTree, NodeSpaceCallbacks } from './hierarchy';
import { countAllNodes } from './utils';

export interface NodeSpaceEditorProps {
  nodes: BaseNode[];
  focusedNodeId?: string | null;
  callbacks?: NodeSpaceCallbacks;

  // NEW: Support for collapsed state restoration
  initialCollapsedNodes?: Set<string>;

  // Keep other existing props...
  onFocus?: (nodeId: string) => void;
  onBlur?: () => void;
  onRemoveNode?: (node: BaseNode) => void;
  className?: string;
  collapsibleNodeTypes?: Set<string>;
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
  initialCollapsedNodes,
  onFocus,
  onBlur,
  onRemoveNode,
  className = '',
  collapsibleNodeTypes = new Set(['text', 'task', 'date', 'entity'])
}) => {
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});
  const totalNodeCount = countAllNodes(nodes);

  const [internalCollapsedNodes, setInternalCollapsedNodes] = useState<Set<string>>(
    initialCollapsedNodes || new Set()
  );

  // Apply initial collapsed state when nodes change
  useEffect(() => {
    if (initialCollapsedNodes && initialCollapsedNodes.size > 0) {
      setInternalCollapsedNodes(initialCollapsedNodes);
    }
  }, [initialCollapsedNodes]);

  const handleNodeCollapseToggle = useCallback((nodeId: string, collapsed: boolean) => {
    // Update internal state
    setInternalCollapsedNodes(prev => {
      const newSet = new Set(prev);
      if (collapsed) {
        newSet.add(nodeId);
      } else {
        newSet.delete(nodeId);
      }
      return newSet;
    });

    // Notify parent component through modern callback
    if (callbacks?.onCollapseStateChange) {
      callbacks.onCollapseStateChange(nodeId, collapsed);
    }
  }, [callbacks]);

  const handleRemoveNode = (node: BaseNode) => {
    const nodeId = node.getNodeId();
    
    if (onRemoveNode) {
      onRemoveNode(node);
    } else {
      // Default behavior if no onRemoveNode handler provided
      if (totalNodeCount > 1) {
        if (node.parent) {
          node.parent.removeChild(node);
          if (callbacks?.onNodesChange) {
            callbacks.onNodesChange([...nodes]);
          }
        } else {
          const newNodes = nodes.filter(n => n.getNodeId() !== node.getNodeId());
          if (callbacks?.onNodesChange) {
            callbacks.onNodesChange(newNodes);
          }
        }
      }
    }
    
    // Fire semantic deletion event
    if (callbacks?.onNodeDelete) {
      callbacks.onNodeDelete(nodeId);
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

  const handleFocusedNodeIdChange = useCallback((newFocusedNodeId: string | null) => {
    // If we have an external onFocus handler, use it to update focused node
    if (newFocusedNodeId && onFocus) {
      onFocus(newFocusedNodeId);
    } else if (!newFocusedNodeId && onBlur) {
      onBlur();
    }
  }, [onFocus, onBlur]);

  return (
    <div className={`ns-editor-container ${className}`}>
      <RenderNodeTree
        nodes={nodes}
        focusedNodeId={focusedNodeId}
        textareaRefs={textareaRefs}
        onRemoveNode={handleRemoveNode}
        totalNodeCount={totalNodeCount}
        callbacks={callbacks || {}}
        onFocus={handleFocus}
        onBlur={handleBlur}
        collapsedNodes={internalCollapsedNodes}
        collapsibleNodeTypes={collapsibleNodeTypes}
        onCollapseChange={handleNodeCollapseToggle}
        onFocusedNodeIdChange={handleFocusedNodeIdChange}
      />
    </div>
  );
};

export default NodeSpaceEditor;