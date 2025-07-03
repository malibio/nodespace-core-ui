import { BaseNode, ImageMetadata } from './nodes';
import { RAGQueryRequest, RAGQueryResponse, ChatMessage } from './types/chat';

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
  // Single unified callback for all node updates
  onNodeUpdate?: (nodeId: string, nodeData: {
    content: string;              // Current content (for vector embedding)
    parentId?: string;           // Current parent UUID (null for root nodes)
    beforeSiblingId?: string;    // Sibling immediately before this node (null for first child)
    nodeType: string;           // 'text', 'ai-chat', 'task', etc.
    metadata?: any;             // Node-specific data (null for TextNode)
  }) => void;

  // RAG integration (unchanged)
  onAIChatQuery?: (request: RAGQueryRequest) => Promise<RAGQueryResponse>;
  onAIChatMessageSent?: (message: ChatMessage, nodeId: string) => void;
  onAIChatResponseReceived?: (response: RAGQueryResponse, nodeId: string) => void;
  onAIChatError?: (error: string, nodeId: string) => void;

  // Node tree management (still needed for UI updates)
  onNodesChange?: (nodes: BaseNode[]) => void;

  // Collapsed state management (unchanged)
  onCollapseStateChange?: (nodeId: string, collapsed: boolean) => void;
  onLoadCollapsedState?: () => Promise<Set<string>>;
  onSaveCollapsedState?: (collapsedNodes: Set<string>) => Promise<void>;
  onBatchCollapseChange?: (changes: Array<{nodeId: string, collapsed: boolean}>) => Promise<void>;
  
  // Image node callbacks (unchanged)
  onImageNodeCreate?: (imageData: Uint8Array, metadata: ImageMetadata, parentId?: string) => Promise<string>;
  onImageNodeSelect?: (nodeId: string) => void;
  onImagePreview?: (nodeId: string) => void;

  // Node deletion (unchanged)
  onNodeDelete?: (nodeId: string, deletionContext?: {
    type: 'empty_removal' | 'content_merge';
    parentId?: string;
    childrenIds: string[];
    childrenTransferredTo?: string;
    contentLost?: string;
    siblingPosition: number;
    mergedIntoNode?: string;
  }) => void;

  // DEPRECATED: Legacy callbacks kept for compatibility
  // These will be removed once all files are migrated to onNodeUpdate
  /** @deprecated Use onNodeUpdate instead */
  onNodeCreateWithId?: (nodeId: string, content: string, parentId?: string, nodeType?: string, afterSiblingId?: string, metadata?: any) => Promise<void> | void;
  /** @deprecated Use onNodeUpdate instead */
  onNodeChange?: (nodeId: string, content: string, metadata?: any) => void;
  /** @deprecated Use onNodeUpdate instead */
  onNodeMove?: (nodeId: string, newParentId?: string, afterSiblingId?: string) => void;
  /** @deprecated Use onNodeUpdate instead */
  onNodeReorder?: (nodeId: string, afterSiblingId?: string) => void;
  /** @deprecated Use onNodeUpdate instead */
  onNodeStructureChange?: (operation: 'indent' | 'outdent' | 'move', nodeId: string, details?: any) => void;
}
