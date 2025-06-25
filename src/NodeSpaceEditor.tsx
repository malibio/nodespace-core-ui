import React, { useRef, useState, useCallback } from 'react';
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
  // Optional external collapse state management
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
  collapsedNodes: externalCollapsedNodes,
  collapsibleNodeTypes = new Set(['text', 'task', 'date', 'entity']),
  onCollapseChange: externalOnCollapseChange
}) => {
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});
  const totalNodeCount = countAllNodes(nodes);

  // Internal collapse state management
  const [internalCollapsedNodes, setInternalCollapsedNodes] = useState<Set<string>>(new Set());
  
  // Use external state if provided, otherwise use internal state
  const collapsedNodes = externalCollapsedNodes || internalCollapsedNodes;
  
  // Handle collapse changes - use external handler if provided, otherwise update internal state
  const handleCollapseChange = useCallback((nodeId: string, collapsed: boolean) => {
    if (externalOnCollapseChange) {
      externalOnCollapseChange(nodeId, collapsed);
    } else {
      setInternalCollapsedNodes(prev => {
        const newSet = new Set(prev);
        if (collapsed) {
          newSet.add(nodeId);
        } else {
          newSet.delete(nodeId);
        }
        return newSet;
      });
    }
  }, [externalOnCollapseChange]);

  const handleRemoveNode = (node: BaseNode) => {
    const nodeId = node.getNodeId();
    
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
    
    // Fire semantic deletion event
    if (callbacks.onNodeDelete) {
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
        callbacks={callbacks}
        onFocus={handleFocus}
        onBlur={handleBlur}
        collapsedNodes={collapsedNodes}
        collapsibleNodeTypes={collapsibleNodeTypes}
        onCollapseChange={handleCollapseChange}
        onFocusedNodeIdChange={handleFocusedNodeIdChange}
      />
    </div>
  );
};

export default NodeSpaceEditor;