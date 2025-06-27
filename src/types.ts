import { BaseNode, ImageMetadata } from './nodes';

export interface NodeSpaceCallbacks {
  onNodesChange?: (newNodes: BaseNode[]) => void;
  onNodeChange?: (nodeId: string, content: string) => void;
  onNodeCreate?: (content: string, parentId?: string, nodeType?: string) => Promise<string>;
  onNodeDelete?: (nodeId: string) => void;
  onNodeStructureChange?: (operation: string, nodeId: string, details?: any) => void;
  onCollapseStateChange?: (nodeId: string, collapsed: boolean) => void;
  
  // NEW: Image node callbacks
  onImageNodeCreate?: (imageData: Uint8Array, metadata: ImageMetadata, parentId?: string) => Promise<string>;
  onImageNodeSelect?: (nodeId: string) => void;
  onImagePreview?: (nodeId: string) => void;
}
