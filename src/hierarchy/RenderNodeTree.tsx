import React from 'react';
import { BaseNode } from '../nodes';
import { NodeComponent } from './NodeComponent';
import { NodeSpaceCallbacks } from '../types';
import { VirtualNodeManager } from '../utils/virtualNodeManager';
import { ContentPersistenceManager } from '../utils/contentPersistence';

interface RenderNodeTreeProps {
  nodes: BaseNode[];
  focusedNodeId: string | null;
  textareaRefs: React.MutableRefObject<{ [key: string]: HTMLTextAreaElement | null }>;
  onRemoveNode: (node: BaseNode) => void;
  totalNodeCount: number;
  callbacks: NodeSpaceCallbacks;
  onFocus: (nodeId: string) => void;
  onBlur: () => void;
  collapsedNodes: Set<string>;
  collapsibleNodeTypes: Set<string>;
  onCollapseChange?: (nodeId: string, collapsed: boolean) => void;
  onFocusedNodeIdChange: (nodeId: string | null) => void;
  virtualNodeManager?: VirtualNodeManager; // NEW: For NS-117
  contentPersistenceManager?: ContentPersistenceManager; // NEW: Content-based persistence
}

export function RenderNodeTree(props: RenderNodeTreeProps) {
  const { nodes, totalNodeCount, focusedNodeId, textareaRefs, onRemoveNode, callbacks, onFocus, onBlur, collapsedNodes, collapsibleNodeTypes, onCollapseChange, onFocusedNodeIdChange, virtualNodeManager, contentPersistenceManager } = props;
  const isRemoveDisabled = totalNodeCount <= 1;
  
  // Shared navigation state using React Context or a simple ref
  const navigationStateRef = React.useRef<{ preferredColumn: number | null; resetCounter: number }>({
    preferredColumn: null,
    resetCounter: 0
  });

  // Only render root nodes (nodes without parents) to avoid duplicates
  const rootNodes = nodes.filter(node => !node.parent);
  
  console.log('🎨 RENDER DEBUG: Total nodes received:', nodes.length);
  console.log('🎨 RENDER DEBUG: All nodes:', nodes.map(n => ({ 
    id: n.getNodeId().slice(-8), 
    content: `"${n.getContent()}"`, 
    hasParent: !!n.parent,
    parentId: n.parent?.getNodeId().slice(-8),
    childrenCount: n.children.length 
  })));
  console.log('🎨 RENDER DEBUG: Root nodes to render:', rootNodes.length);
  console.log('🎨 RENDER DEBUG: Root nodes:', rootNodes.map(n => ({ 
    id: n.getNodeId().slice(-8), 
    content: `"${n.getContent()}"`,
    childrenCount: n.children.length,
    children: n.children.map(c => ({ id: c.getNodeId().slice(-8), content: `"${c.getContent()}"` }))
  })));
  
  return (
    <div className="ns-nodes-container">
      {rootNodes.map((node, index) => (
        <NodeComponent
          key={`root-${node.getNodeId()}-${index}`}
          node={node}
          depth={0}
          focusedNodeId={focusedNodeId}
          textareaRefs={textareaRefs}
          onRemoveNode={onRemoveNode}
          isRemoveDisabled={isRemoveDisabled}
          nodes={nodes}
          callbacks={callbacks}
          onFocus={onFocus}
          onBlur={onBlur}
          navigationStateRef={navigationStateRef}
          collapsedNodes={collapsedNodes}
          collapsibleNodeTypes={collapsibleNodeTypes}
          onCollapseChange={onCollapseChange}
          onFocusedNodeIdChange={onFocusedNodeIdChange}
          virtualNodeManager={virtualNodeManager}
          contentPersistenceManager={contentPersistenceManager}
        />
      ))}
    </div>
  );
}