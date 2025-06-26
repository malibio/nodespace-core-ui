import React, { useRef, useCallback, useEffect } from 'react';
import { BaseNode } from './nodes';
import { RenderNodeTree, NodeSpaceCallbacks } from './hierarchy';
import { countAllNodes } from './utils';
import { useCollapsedStatePersistence } from './hooks/useCollapsedStatePersistence';
import { CollapsedStateLoader } from './components/CollapsedStateLoader';
import type { CollapsePersistenceConfig } from './types/persistence';

export interface NodeSpaceEditorProps {
  nodes: BaseNode[];
  focusedNodeId?: string | null;
  callbacks?: NodeSpaceCallbacks;

  // Support for collapsed state restoration
  initialCollapsedNodes?: Set<string>;

  // NEW: Persistence configuration
  persistenceConfig?: CollapsePersistenceConfig;

  // NEW: Loading state management
  isLoadingCollapsedState?: boolean;
  onCollapsedStateLoaded?: () => void;

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
  persistenceConfig,
  isLoadingCollapsedState = false,
  onCollapsedStateLoaded,
  onFocus,
  onBlur,
  onRemoveNode,
  className = '',
  collapsibleNodeTypes = new Set(['text', 'task', 'date', 'entity'])
}) => {
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});
  const totalNodeCount = countAllNodes(nodes);

  // Replace current state management with persistence hook
  const {
    collapsedNodes,
    toggleNodeCollapse,
    isLoading: isPersistenceLoading,
    lastSaveError,
    retryLoad
  } = useCollapsedStatePersistence({
    callbacks,
    config: persistenceConfig,
    initialNodes: initialCollapsedNodes
  });

  // Handle loading state
  const isActuallyLoading = isLoadingCollapsedState || isPersistenceLoading;

  // Notify parent when loading completes
  useEffect(() => {
    if (!isPersistenceLoading && onCollapsedStateLoaded) {
      onCollapsedStateLoaded();
    }
  }, [isPersistenceLoading, onCollapsedStateLoaded]);

  // Update collapse handler to use persistence hook
  const handleNodeCollapseToggle = useCallback((nodeId: string, collapsed: boolean) => {
    toggleNodeCollapse(nodeId);
  }, [toggleNodeCollapse]);

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
    <CollapsedStateLoader
      isLoading={isActuallyLoading}
      error={lastSaveError}
      onRetry={retryLoad}
    >
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
          collapsedNodes={collapsedNodes}
          collapsibleNodeTypes={collapsibleNodeTypes}
          onCollapseChange={handleNodeCollapseToggle}
          onFocusedNodeIdChange={handleFocusedNodeIdChange}
        />
      </div>
    </CollapsedStateLoader>
  );
};

export default NodeSpaceEditor;