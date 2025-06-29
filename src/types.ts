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
  onNodeCreate?: (content: string, parentId?: string, nodeType?: string) => Promise<string> | string;
  onNodeDelete?: (nodeId: string) => void;
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
}
