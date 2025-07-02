import React, { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { BaseNode, DateFormat, TextNode } from './nodes';
import { RenderNodeTree, NodeSpaceCallbacks } from './hierarchy';
import { countAllNodes } from './utils';
import { useCollapsedStatePersistence } from './hooks/useCollapsedStatePersistence';
import { CollapsedStateLoader } from './components/CollapsedStateLoader';
import { NodeCRUDManager, NodeFactory } from './utils/crudOperations';
import { VirtualNodeManager } from './utils/virtualNodeManager';
import { ContentPersistenceManager } from './utils/contentPersistence';
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

  // NEW: Unified CRUD Operations (NS-121)
  enableUnifiedCRUD?: boolean;

  // NEW: Virtual Node Management (NS-117)
  enableVirtualNodes?: boolean;

  // Keep other existing props...
  onFocus?: (nodeId: string) => void;
  onBlur?: () => void;
  onRemoveNode?: (node: BaseNode) => void;
  className?: string;
  collapsibleNodeTypes?: Set<string>;
}

/**
 * Unified CRUD Operations Interface (NS-121)
 * Exposed through ref for programmatic access
 */
export interface NodeSpaceEditorRef {
  // Create Pattern
  createNode: (nodeType: string, content?: string, parentId?: string, afterSiblingId?: string) => Promise<{ success: boolean; nodeId?: string; error?: string }>;
  
  // Update Pattern  
  updateNode: (updatedNode: BaseNode) => { success: boolean; nodeId?: string; error?: string };
  
  // Delete Pattern
  deleteNode: (nodeId: string, preserveChildren?: boolean) => { success: boolean; nodeId?: string; error?: string };
  
  // Move Pattern - Change parent
  moveNode: (nodeId: string, newParentId?: string, afterSiblingId?: string) => { success: boolean; nodeId?: string; error?: string };
  
  // Reorder Pattern - Change sibling position
  reorderNode: (nodeId: string, afterSiblingId?: string) => { success: boolean; nodeId?: string; error?: string };

  // Type-safe node constructors
  createTextNode: (content?: string, nodeId?: string) => BaseNode;
  createTaskNode: (content?: string, nodeId?: string) => BaseNode;
  createImageNode: (imageData?: Uint8Array, metadata?: any, description?: string, nodeId?: string) => BaseNode;
  createDateNode: (date: Date, dateFormat?: string, nodeId?: string) => BaseNode;
  createEntityNode: (entityType: string, content?: string, properties?: Record<string, any>, nodeId?: string) => BaseNode;
}

/**
 * NodeSpaceEditor - Main component for hierarchical block editing
 * 
 * This is the primary export of the nodespace-core-ui library.
 * It provides a complete hierarchical block editor with keyboard navigation,
 * collapsible nodes, and advanced editing features.
 * 
 * NEW: Supports unified CRUD operations (NS-121) through ref interface
 */
const NodeSpaceEditor = React.forwardRef<NodeSpaceEditorRef, NodeSpaceEditorProps>(({
  nodes,
  focusedNodeId = null,
  callbacks = {},
  initialCollapsedNodes,
  persistenceConfig,
  isLoadingCollapsedState = false,
  onCollapsedStateLoaded,
  enableUnifiedCRUD = true,
  enableVirtualNodes = false,
  onFocus,
  onBlur,
  onRemoveNode,
  className = '',
  collapsibleNodeTypes = new Set(['text', 'task', 'date', 'entity', 'image'])
}, ref) => {
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});
  
  // Empty state handling - auto-create first TextNode when nodes array is empty
  const [displayNodes, setDisplayNodes] = useState<BaseNode[]>(() => {
    if (nodes.length === 0) {
      // Create initial empty TextNode (no backend call yet)
      const initialNode = new TextNode('');
      return [initialNode];
    }
    return nodes;
  });

  // Update display nodes when props change
  useEffect(() => {
    if (nodes.length === 0) {
      // Always create empty node when nodes are empty - simpler logic
      const initialNode = new TextNode('');
      setDisplayNodes([initialNode]);
    } else {
      setDisplayNodes(nodes);
    }
  }, [nodes]);

  const totalNodeCount = countAllNodes(displayNodes);
  
  // Content persistence manager - create once and update callbacks as needed
  const contentPersistenceManager = useMemo(() => {
    return new ContentPersistenceManager(callbacks, 500); // 500ms debounce
  }, []); // Empty deps = create once, never recreate

  // Update callbacks when they change, preserving debounce state
  useEffect(() => {
    contentPersistenceManager.updateCallbacks(callbacks);
    
    // Development warning for excessive callback changes
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Core-UI: Callbacks updated, debounce state preserved');
    }
  }, [callbacks, contentPersistenceManager]);

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

  // NEW: Unified CRUD Manager (NS-121)
  const crudManager = useMemo(() => {
    if (enableUnifiedCRUD) {
      return new NodeCRUDManager(displayNodes, callbacks);
    }
    return null;
  }, [displayNodes, callbacks, enableUnifiedCRUD]);

  // NEW: Virtual Node Manager (NS-117)
  const virtualNodeManager = useMemo(() => {
    if (enableVirtualNodes) {
      const handleTreeUpdate = (updatedNodes: BaseNode[]) => {
        if (callbacks.onNodesChange) {
          callbacks.onNodesChange(updatedNodes.length > 0 ? updatedNodes : displayNodes);
        }
      };
      return new VirtualNodeManager(callbacks, handleTreeUpdate);
    }
    return null;
  }, [enableVirtualNodes, callbacks, displayNodes]);

  // Update CRUD manager when nodes or callbacks change
  useEffect(() => {
    if (crudManager) {
      crudManager.setNodes(displayNodes);
    }
  }, [displayNodes, crudManager]);

  // Cleanup virtual node manager on unmount
  useEffect(() => {
    return () => {
      if (virtualNodeManager) {
        virtualNodeManager.destroy();
      }
    };
  }, [virtualNodeManager]);

  // Expose unified CRUD operations through ref (NS-121)
  React.useImperativeHandle(ref, () => ({
    // Create Pattern
    createNode: async (nodeType: string, content?: string, parentId?: string, afterSiblingId?: string) => {
      if (!crudManager) {
        return { success: false, error: 'CRUD operations not enabled' };
      }
      return await crudManager.createNode(nodeType, content || '', parentId, afterSiblingId);
    },

    // Update Pattern
    updateNode: (updatedNode: BaseNode) => {
      if (!crudManager) {
        return { success: false, error: 'CRUD operations not enabled' };
      }
      return crudManager.updateNode(updatedNode);
    },

    // Delete Pattern
    deleteNode: (nodeId: string, preserveChildren?: boolean) => {
      if (!crudManager) {
        return { success: false, error: 'CRUD operations not enabled' };
      }
      return crudManager.deleteNode(nodeId, preserveChildren);
    },

    // Move Pattern - Change parent
    moveNode: (nodeId: string, newParentId?: string, afterSiblingId?: string) => {
      if (!crudManager) {
        return { success: false, error: 'CRUD operations not enabled' };
      }
      return crudManager.moveNode(nodeId, newParentId, afterSiblingId);
    },

    // Reorder Pattern - Change sibling position
    reorderNode: (nodeId: string, afterSiblingId?: string) => {
      if (!crudManager) {
        return { success: false, error: 'CRUD operations not enabled' };
      }
      return crudManager.reorderNode(nodeId, afterSiblingId);
    },

    // Type-safe node constructors
    createTextNode: (content?: string, nodeId?: string) => NodeFactory.createTextNode(content, nodeId),
    createTaskNode: (content?: string, nodeId?: string) => NodeFactory.createTaskNode(content, nodeId),
    createImageNode: (imageData?: Uint8Array, metadata: any = {}, description?: string, nodeId?: string) => NodeFactory.createImageNode(imageData, metadata, description, nodeId),
    createDateNode: (date: Date, dateFormat: string = 'full', nodeId?: string) => NodeFactory.createDateNode(date, dateFormat as DateFormat, nodeId),
    createEntityNode: (entityType: string, content?: string, properties: Record<string, any> = {}, nodeId?: string) => NodeFactory.createEntityNode(entityType, content, properties, nodeId)
  }), [crudManager]);

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
          nodes={displayNodes}
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
          virtualNodeManager={virtualNodeManager || undefined}
          contentPersistenceManager={contentPersistenceManager}
        />
      </div>
    </CollapsedStateLoader>
  );
});

// Set display name for better debugging
NodeSpaceEditor.displayName = 'NodeSpaceEditor';

export default NodeSpaceEditor;