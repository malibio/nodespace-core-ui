import { BaseNode, ImageMetadata } from './nodes';

export interface HierarchyContext {
  parentId?: string;
  indentLevel: number;
  position: number;
  insertionPoint: 'before' | 'after' | 'child';
}

export interface ImageUploadResult {
  imageData: Uint8Array;
  metadata: ImageMetadata;
}

export interface NodeSpaceCallbacks {
  // Current semantic callbacks
  onNodesChange?: (nodes: BaseNode[]) => void;
  onNodeChange?: (nodeId: string, content: string) => void;
  
  // Content-based node creation (only called when content has non-whitespace characters)
  onNodeCreateWithId?: (nodeId: string, content: string, parentId?: string, nodeType?: string) => Promise<void> | void;
  
  onNodeDelete?: (nodeId: string, deletionContext?: {
    type: 'empty_removal' | 'content_merge';
    parentId?: string;
    childrenIds: string[];
    childrenTransferredTo?: string;
    contentLost?: string;
    siblingPosition: number;
    mergedIntoNode?: string;
  }) => void;
  onNodeStructureChange?: (operation: 'indent' | 'outdent' | 'move', nodeId: string, details?: any) => void;

  // Collapsed state management
  onCollapseStateChange?: (nodeId: string, collapsed: boolean) => void;

  // NEW: Async persistence callbacks
  onLoadCollapsedState?: () => Promise<Set<string>>;
  onSaveCollapsedState?: (collapsedNodes: Set<string>) => Promise<void>;

  // NEW: Batch operations for performance
  onBatchCollapseChange?: (changes: Array<{nodeId: string, collapsed: boolean}>) => Promise<void>;
  
  // NEW: Image node callbacks
  onImageNodeCreate?: (imageData: Uint8Array, metadata: ImageMetadata, parentId?: string) => Promise<string>;
  onImageNodeSelect?: (nodeId: string) => void;
  onImagePreview?: (nodeId: string) => void;

  // NEW: Unified CRUD Operations (NS-121)
  // Move Pattern - Change parent
  onNodeMove?: (nodeId: string, newParentId?: string, afterSiblingId?: string) => void;
  
  // Reorder Pattern - Change sibling position  
  onNodeReorder?: (nodeId: string, afterSiblingId?: string) => void;

  // Update Pattern - Enhanced for node objects
  onNodeUpdate?: (updatedNode: BaseNode) => void;
}
