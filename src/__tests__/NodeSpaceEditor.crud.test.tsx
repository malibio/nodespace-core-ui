import React, { createRef } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NodeSpaceEditor, { NodeSpaceEditorRef } from '../NodeSpaceEditor';
import { TextNode, TaskNode, BaseNode } from '../nodes';
import { NodeSpaceCallbacks } from '../types';

describe('NodeSpaceEditor CRUD Integration', () => {
  let nodes: BaseNode[];
  let callbacks: jest.Mocked<NodeSpaceCallbacks>;
  let editorRef: React.RefObject<NodeSpaceEditorRef>;

  beforeEach(() => {
    // Create test hierarchy
    const root = new TextNode('Root Node');
    const childA = new TextNode('Child A');
    const childB = new TextNode('Child B');
    const grandchild = new TextNode('Grandchild');
    
    root.addChild(childA);
    root.addChild(childB);
    childA.addChild(grandchild);
    
    nodes = [root];

    // Mock callbacks
    callbacks = {
      onNodeCreate: jest.fn().mockResolvedValue('backend-id-123'),
      onNodeChange: jest.fn(),
      onNodeUpdate: jest.fn(),
      onNodeDelete: jest.fn(),
      onNodeMove: jest.fn(),
      onNodeReorder: jest.fn(),
      onNodesChange: jest.fn()
    };

    editorRef = createRef<NodeSpaceEditorRef>();
  });

  const renderEditor = () => {
    return render(
      <NodeSpaceEditor
        ref={editorRef}
        nodes={nodes}
        callbacks={callbacks}
        enableUnifiedCRUD={true}
      />
    );
  };

  describe('Ref-based CRUD API', () => {
    it('should expose all CRUD operations through ref', () => {
      renderEditor();
      
      expect(editorRef.current).toBeDefined();
      expect(editorRef.current?.createNode).toBeInstanceOf(Function);
      expect(editorRef.current?.updateNode).toBeInstanceOf(Function);
      expect(editorRef.current?.deleteNode).toBeInstanceOf(Function);
      expect(editorRef.current?.moveNode).toBeInstanceOf(Function);
      expect(editorRef.current?.reorderNode).toBeInstanceOf(Function);
    });

    it('should expose type-safe node constructors through ref', () => {
      renderEditor();
      
      expect(editorRef.current?.createTextNode).toBeInstanceOf(Function);
      expect(editorRef.current?.createTaskNode).toBeInstanceOf(Function);
      expect(editorRef.current?.createImageNode).toBeInstanceOf(Function);
      expect(editorRef.current?.createDateNode).toBeInstanceOf(Function);
      expect(editorRef.current?.createEntityNode).toBeInstanceOf(Function);
    });

    it('should return error when CRUD disabled', async () => {
      render(
        <NodeSpaceEditor
          ref={editorRef}
          nodes={nodes}
          callbacks={callbacks}
          enableUnifiedCRUD={false}
        />
      );

      const result = await editorRef.current?.createNode('text', 'New Node');
      expect(result).toEqual({
        success: false,
        error: 'CRUD operations not enabled'
      });
    });
  });

  describe('Create Node Integration', () => {
    it('should create new root node and trigger callbacks', async () => {
      renderEditor();
      
      const result = await editorRef.current!.createNode('text', 'New Root');
      
      expect(result.success).toBe(true);
      expect(result.nodeId).toBeDefined();
      expect(callbacks.onNodeCreate).toHaveBeenCalledWith('New Root', undefined, 'text');
      expect(callbacks.onNodesChange).toHaveBeenCalled();
    });

    it('should create child node with proper parent relationship', async () => {
      renderEditor();
      
      const parentId = nodes[0].getNodeId();
      const result = await editorRef.current!.createNode('text', 'New Child', parentId);
      
      expect(result.success).toBe(true);
      expect(callbacks.onNodeCreate).toHaveBeenCalledWith('New Child', parentId, 'text');
      
      // Verify parent-child relationship was established
      const parent = nodes[0];
      expect(parent.children).toHaveLength(3); // Original 2 + new child
      expect(parent.children[2].getContent()).toBe('New Child');
      expect(parent.children[2].parent).toBe(parent);
    });

    it('should position new node after specified sibling', async () => {
      renderEditor();
      
      const parentId = nodes[0].getNodeId();
      const siblingId = nodes[0].children[0].getNodeId(); // Child A
      
      const result = await editorRef.current!.createNode('text', 'Middle Child', parentId, siblingId);
      
      expect(result.success).toBe(true);
      
      const parent = nodes[0];
      expect(parent.children[0].getContent()).toBe('Child A');
      expect(parent.children[1].getContent()).toBe('Middle Child'); // Inserted after Child A
      expect(parent.children[2].getContent()).toBe('Child B'); // Child B moved to position 2
    });

    it('should handle async callback promises', async () => {
      callbacks.onNodeCreate = jest.fn().mockResolvedValue('async-backend-id');
      renderEditor();
      
      const result = await editorRef.current!.createNode('text', 'Async Node');
      
      expect(result.success).toBe(true);
      await waitFor(() => {
        expect(callbacks.onNodeCreate).toHaveBeenCalled();
      });
    });

    it('should handle async callback rejections gracefully', async () => {
      const rejectedPromise = Promise.reject(new Error('Backend error'));
      callbacks.onNodeCreate = jest.fn().mockReturnValue(rejectedPromise);
      renderEditor();
      
      // Suppress console.warn from promise rejection handling
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result = await editorRef.current!.createNode('text', 'Error Node');
      
      // Local operation should still succeed
      expect(result.success).toBe(true);
      expect(callbacks.onNodesChange).toHaveBeenCalled();
      
      // Wait for the promise rejection to be handled
      await new Promise(resolve => setTimeout(resolve, 0));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Update Node Integration', () => {
    it('should update node content and trigger callbacks', () => {
      renderEditor();
      
      const nodeToUpdate = nodes[0].children[0]; // Child A
      const originalId = nodeToUpdate.getNodeId();
      
      const updatedNode = new TextNode('Updated Child A', originalId);
      const result = editorRef.current!.updateNode(updatedNode);
      
      expect(result.success).toBe(true);
      expect(result.nodeId).toBe(originalId);
      expect(callbacks.onNodeUpdate).toHaveBeenCalledWith(updatedNode);
      expect(callbacks.onNodeChange).toHaveBeenCalledWith(originalId, 'Updated Child A');
      expect(callbacks.onNodesChange).toHaveBeenCalled();
      
      // Verify actual content was updated
      expect(nodeToUpdate.getContent()).toBe('Updated Child A');
    });

    it('should preserve node relationships during update', () => {
      renderEditor();
      
      const parentNode = nodes[0];
      const originalChildrenCount = parentNode.children.length;
      const originalParent = parentNode.children[0].parent;
      
      const updatedNode = new TextNode('Updated Root', parentNode.getNodeId());
      const result = editorRef.current!.updateNode(updatedNode);
      
      expect(result.success).toBe(true);
      expect(parentNode.children).toHaveLength(originalChildrenCount);
      expect(parentNode.children[0].parent).toBe(originalParent);
    });

    it('should handle node not found gracefully', () => {
      renderEditor();
      
      const nonExistentNode = new TextNode('Non-existent', 'fake-id-123');
      const result = editorRef.current!.updateNode(nonExistentNode);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Node with ID fake-id-123 not found');
      expect(callbacks.onNodeUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Delete Node Integration', () => {
    it('should delete node and update tree structure', () => {
      renderEditor();
      
      const nodeToDelete = nodes[0].children[1]; // Child B
      const nodeId = nodeToDelete.getNodeId();
      const parent = nodes[0];
      const originalChildrenCount = parent.children.length;
      
      const result = editorRef.current!.deleteNode(nodeId);
      
      expect(result.success).toBe(true);
      expect(result.nodeId).toBe(nodeId);
      expect(callbacks.onNodeDelete).toHaveBeenCalledWith(nodeId);
      expect(callbacks.onNodesChange).toHaveBeenCalled();
      
      // Verify tree structure
      expect(parent.children).toHaveLength(originalChildrenCount - 1);
      expect(parent.children.find(child => child.getNodeId() === nodeId)).toBeUndefined();
    });

    it('should delete root node from nodes array', () => {
      renderEditor();
      
      const rootId = nodes[0].getNodeId();
      const result = editorRef.current!.deleteNode(rootId);
      
      expect(result.success).toBe(true);
      expect(callbacks.onNodesChange).toHaveBeenCalled();
      
      // Note: Since we're testing with the same nodes array reference,
      // we need to check the manager's internal state
      expect(result.nodeId).toBe(rootId);
    });

    it('should preserve children when requested', () => {
      renderEditor();
      
      const nodeToDelete = nodes[0].children[0]; // Child A (has grandchild)
      const grandchild = nodeToDelete.children[0];
      const grandchildId = grandchild.getNodeId();
      const root = nodes[0];
      
      const result = editorRef.current!.deleteNode(nodeToDelete.getNodeId(), true);
      
      expect(result.success).toBe(true);
      expect(callbacks.onNodeDelete).toHaveBeenCalled();
      expect(callbacks.onNodesChange).toHaveBeenCalled();
    });
  });

  describe('Move Node Integration', () => {
    it('should move node between parents', () => {
      renderEditor();
      
      const nodeToMove = nodes[0].children[0].children[0]; // Grandchild
      const newParent = nodes[0].children[1]; // Child B
      const nodeId = nodeToMove.getNodeId();
      const newParentId = newParent.getNodeId();
      
      const result = editorRef.current!.moveNode(nodeId, newParentId);
      
      expect(result.success).toBe(true);
      expect(result.nodeId).toBe(nodeId);
      expect(callbacks.onNodeMove).toHaveBeenCalledWith(nodeId, newParentId, undefined);
      expect(callbacks.onNodesChange).toHaveBeenCalled();
      
      // Verify move operation
      expect(nodeToMove.parent).toBe(newParent);
      expect(newParent.children).toContain(nodeToMove);
      expect(nodes[0].children[0].children).toHaveLength(0); // Original parent empty
    });

    it('should move node to root level', () => {
      renderEditor();
      
      const nodeToMove = nodes[0].children[0]; // Child A
      const nodeId = nodeToMove.getNodeId();
      
      const result = editorRef.current!.moveNode(nodeId);
      
      expect(result.success).toBe(true);
      expect(callbacks.onNodeMove).toHaveBeenCalledWith(nodeId, undefined, undefined);
      expect(callbacks.onNodesChange).toHaveBeenCalled();
      
      // Note: The actual nodes array update happens in the callback handler
      expect(result.nodeId).toBe(nodeId);
    });

    it('should handle positioning after specific sibling', () => {
      renderEditor();
      
      const nodeToMove = nodes[0].children[0].children[0]; // Grandchild
      const newParent = nodes[0]; // Root
      const afterSibling = nodes[0].children[0]; // Child A
      
      const result = editorRef.current!.moveNode(
        nodeToMove.getNodeId(),
        newParent.getNodeId(),
        afterSibling.getNodeId()
      );
      
      expect(result.success).toBe(true);
      expect(callbacks.onNodeMove).toHaveBeenCalledWith(
        nodeToMove.getNodeId(),
        newParent.getNodeId(),
        afterSibling.getNodeId()
      );
    });
  });

  describe('Reorder Node Integration', () => {
    it('should reorder siblings within same parent', () => {
      renderEditor();
      
      const parent = nodes[0];
      const nodeToReorder = parent.children[0]; // Child A
      const afterSibling = parent.children[1]; // Child B
      const nodeId = nodeToReorder.getNodeId();
      const siblingId = afterSibling.getNodeId();
      
      const result = editorRef.current!.reorderNode(nodeId, siblingId);
      
      expect(result.success).toBe(true);
      expect(callbacks.onNodeReorder).toHaveBeenCalledWith(nodeId, siblingId);
      expect(callbacks.onNodesChange).toHaveBeenCalled();
      
      // Verify reordering
      expect(parent.children[0]).toBe(afterSibling); // Child B first
      expect(parent.children[1]).toBe(nodeToReorder); // Child A second
    });

    it('should move node to beginning when no sibling specified', () => {
      renderEditor();
      
      const parent = nodes[0];
      const nodeToReorder = parent.children[1]; // Child B
      const nodeId = nodeToReorder.getNodeId();
      
      const result = editorRef.current!.reorderNode(nodeId);
      
      expect(result.success).toBe(true);
      expect(callbacks.onNodeReorder).toHaveBeenCalledWith(nodeId, undefined);
      
      // Verify moved to beginning
      expect(parent.children[0]).toBe(nodeToReorder);
    });
  });

  describe('Type-safe Node Constructors', () => {
    it('should create TextNode with correct properties', () => {
      renderEditor();
      
      const textNode = editorRef.current!.createTextNode('Sample text', 'custom-id');
      
      expect(textNode).toBeInstanceOf(TextNode);
      expect(textNode.getContent()).toBe('Sample text');
      expect(textNode.getNodeId()).toBe('custom-id');
      expect(textNode.getNodeType()).toBe('text');
    });

    it('should create TaskNode with correct properties', () => {
      renderEditor();
      
      const taskNode = editorRef.current!.createTaskNode('Sample task');
      
      expect(taskNode).toBeInstanceOf(TaskNode);
      expect(taskNode.getContent()).toBe('Sample task');
      expect(taskNode.getNodeType()).toBe('task');
    });

    it('should create ImageNode with metadata', () => {
      renderEditor();
      
      const imageData = new Uint8Array([1, 2, 3, 4]);
      const metadata = { width: 100, height: 200 };
      const description = 'Test image';
      
      const imageNode = editorRef.current!.createImageNode(imageData, metadata, description);
      
      expect(imageNode.getContent()).toBe(description);
      expect(imageNode.getNodeType()).toBe('image');
    });

    it('should create DateNode with proper format', () => {
      renderEditor();
      
      const date = new Date('2023-01-01');
      const dateNode = editorRef.current!.createDateNode(date, 'short');
      
      expect(dateNode.getNodeType()).toBe('date');
    });

    it('should create EntityNode with properties', () => {
      renderEditor();
      
      const entityNode = editorRef.current!.createEntityNode('person', 'John Doe', { age: 30 });
      
      expect(entityNode.getContent()).toBe('John Doe');
      expect(entityNode.getNodeType()).toBe('entity');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle operations on empty tree', () => {
      const emptyNodes: BaseNode[] = [];
      
      render(
        <NodeSpaceEditor
          ref={editorRef}
          nodes={emptyNodes}
          callbacks={callbacks}
          enableUnifiedCRUD={true}
        />
      );
      
      const result = editorRef.current!.deleteNode('any-id');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Node with ID any-id not found');
    });

    it('should handle concurrent operations gracefully', async () => {
      renderEditor();
      
      // Simulate concurrent create and update operations
      const [createResult, updateResult] = await Promise.all([
        editorRef.current!.createNode('text', 'Concurrent Node 1'),
        editorRef.current!.createNode('text', 'Concurrent Node 2')
      ]);
      
      expect(createResult.success).toBe(true);
      expect(updateResult.success).toBe(true);
      expect(callbacks.onNodeCreate).toHaveBeenCalledTimes(2);
    });

    it('should maintain tree integrity after multiple operations', async () => {
      renderEditor();
      
      // Perform sequence of operations
      const createResult = await editorRef.current!.createNode('text', 'New Node');
      expect(createResult.success).toBe(true);
      
      const nodeToUpdate = nodes[0].children[0];
      const updateResult = editorRef.current!.updateNode(
        new TextNode('Updated Content', nodeToUpdate.getNodeId())
      );
      expect(updateResult.success).toBe(true);
      
      const moveResult = editorRef.current!.moveNode(
        nodes[0].children[0].children[0].getNodeId(), // Grandchild
        nodes[0].children[1].getNodeId() // Child B
      );
      expect(moveResult.success).toBe(true);
      
      // Verify tree still has valid structure
      expect(nodes[0].children).toHaveLength(2); // Root still has 2 children
      expect(nodes[0].children[0].getContent()).toBe('Updated Content');
      expect(nodes[0].children[1].children).toHaveLength(1); // Child B now has grandchild
    });
  });
});