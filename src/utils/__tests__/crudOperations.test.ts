import { NodeCRUDManager, NodeFactory } from '../crudOperations';
import { TextNode, TaskNode, ImageNode, DateNode, EntityNode, BaseNode } from '../../nodes';
import { NodeSpaceCallbacks } from '../../types';

describe('NodeFactory', () => {
  describe('createTextNode', () => {
    it('should create TextNode with default content', () => {
      const node = NodeFactory.createTextNode();
      expect(node).toBeInstanceOf(TextNode);
      expect(node.getContent()).toBe('');
      expect(node.getNodeType()).toBe('text');
    });

    it('should create TextNode with custom content', () => {
      const content = 'Test content';
      const node = NodeFactory.createTextNode(content);
      expect(node.getContent()).toBe(content);
    });

    it('should create TextNode with custom ID', () => {
      const customId = 'custom-id-123';
      const node = NodeFactory.createTextNode('content', customId);
      expect(node.getNodeId()).toBe(customId);
    });
  });

  describe('createTaskNode', () => {
    it('should create TaskNode with default properties', () => {
      const node = NodeFactory.createTaskNode();
      expect(node).toBeInstanceOf(TaskNode);
      expect(node.getNodeType()).toBe('task');
      expect(node.getContent()).toBe('');
    });

    it('should create TaskNode with custom content', () => {
      const content = 'Test task';
      const node = NodeFactory.createTaskNode(content);
      expect(node.getContent()).toBe(content);
    });
  });

  describe('createImageNode', () => {
    it('should create ImageNode with default properties', () => {
      const node = NodeFactory.createImageNode();
      expect(node).toBeInstanceOf(ImageNode);
      expect(node.getNodeType()).toBe('image');
    });

    it('should create ImageNode with image data and metadata', () => {
      const imageData = new Uint8Array([1, 2, 3, 4]);
      const metadata = { width: 100, height: 200, filename: 'test.jpg' };
      const description = 'Test image';
      
      const node = NodeFactory.createImageNode(imageData, metadata, description);
      expect(node.getContent()).toBe(description);
    });
  });

  describe('createDateNode', () => {
    it('should create DateNode with default properties', () => {
      const date = new Date('2023-01-01');
      const node = NodeFactory.createDateNode(date);
      expect(node).toBeInstanceOf(DateNode);
      expect(node.getNodeType()).toBe('date');
    });

    it('should create DateNode with custom format', () => {
      const date = new Date('2023-01-01');
      const node = NodeFactory.createDateNode(date, 'short');
      expect(node).toBeInstanceOf(DateNode);
    });
  });

  describe('createEntityNode', () => {
    it('should create EntityNode with default properties', () => {
      const entityType = 'person';
      const content = 'John Doe';
      const node = NodeFactory.createEntityNode(entityType, content);
      
      expect(node).toBeInstanceOf(EntityNode);
      expect(node.getNodeType()).toBe('entity');
      expect(node.getContent()).toBe(content);
    });

    it('should create EntityNode with custom properties', () => {
      const entityType = 'company';
      const content = 'Acme Corp';
      const properties = { industry: 'tech', size: 'large' };
      
      const node = NodeFactory.createEntityNode(entityType, content, properties);
      expect(node.getContent()).toBe(content);
    });
  });

  describe('createNodeByType', () => {
    it('should create correct node type for each supported type', () => {
      expect(NodeFactory.createNodeByType('text')).toBeInstanceOf(TextNode);
      expect(NodeFactory.createNodeByType('task')).toBeInstanceOf(TaskNode);
      expect(NodeFactory.createNodeByType('image')).toBeInstanceOf(ImageNode);
      expect(NodeFactory.createNodeByType('date')).toBeInstanceOf(DateNode);
      expect(NodeFactory.createNodeByType('entity')).toBeInstanceOf(EntityNode);
    });

    it('should fallback to TextNode for unknown types', () => {
      const node = NodeFactory.createNodeByType('unknown-type');
      expect(node).toBeInstanceOf(TextNode);
    });

    it('should handle case insensitive node types', () => {
      expect(NodeFactory.createNodeByType('TEXT')).toBeInstanceOf(TextNode);
      expect(NodeFactory.createNodeByType('Task')).toBeInstanceOf(TaskNode);
    });
  });
});

describe('NodeCRUDManager', () => {
  let nodes: BaseNode[];
  let callbacks: NodeSpaceCallbacks;
  let crudManager: NodeCRUDManager;
  let mockCallbacks: jest.Mocked<NodeSpaceCallbacks>;

  beforeEach(() => {
    // Create test node hierarchy
    const rootNode = new TextNode('Root Node');
    const childA = new TextNode('Child A');
    const childB = new TextNode('Child B');
    const grandchild = new TextNode('Grandchild');
    
    rootNode.addChild(childA);
    rootNode.addChild(childB);
    childA.addChild(grandchild);
    
    nodes = [rootNode];

    // Mock callbacks
    mockCallbacks = {
      onNodeCreate: jest.fn().mockResolvedValue('backend-id-123'),
      onNodeChange: jest.fn(),
      onNodeUpdate: jest.fn(),
      onNodeDelete: jest.fn(),
      onNodeMove: jest.fn(),
      onNodeReorder: jest.fn(),
      onNodesChange: jest.fn()
    };

    callbacks = mockCallbacks;
    crudManager = new NodeCRUDManager(nodes, callbacks);
  });

  describe('createNode', () => {
    it('should create new root node when no parent specified', async () => {
      const result = await crudManager.createNode('text', 'New Root');
      
      expect(result.success).toBe(true);
      expect(result.nodeId).toBeDefined();
      expect(mockCallbacks.onNodeCreate).toHaveBeenCalledWith('New Root', undefined, 'text');
      expect(mockCallbacks.onNodesChange).toHaveBeenCalled();
      
      const updatedNodes = crudManager.getNodes();
      expect(updatedNodes).toHaveLength(2); // Original root + new root
    });

    it('should create child node when parent specified', async () => {
      const parentId = nodes[0].getNodeId();
      const result = await crudManager.createNode('text', 'New Child', parentId);
      
      expect(result.success).toBe(true);
      expect(mockCallbacks.onNodeCreate).toHaveBeenCalledWith('New Child', parentId, 'text');
      
      const parent = nodes[0];
      expect(parent.children).toHaveLength(3); // Original 2 children + new child
      expect(parent.children[2].getContent()).toBe('New Child');
    });

    it('should insert node after specific sibling', async () => {
      const parentId = nodes[0].getNodeId();
      const siblingId = nodes[0].children[0].getNodeId(); // Child A
      
      const result = await crudManager.createNode('text', 'New Middle Child', parentId, siblingId);
      
      expect(result.success).toBe(true);
      
      const parent = nodes[0];
      expect(parent.children).toHaveLength(3);
      expect(parent.children[1].getContent()).toBe('New Middle Child'); // Inserted after Child A
      expect(parent.children[2].getContent()).toBe('Child B'); // Child B moved to position 2
    });

    it('should handle parent not found error', async () => {
      const result = await crudManager.createNode('text', 'Content', 'non-existent-id');
      
      expect(result.success).toBe(true); // Still creates the node, just not attached
      expect(mockCallbacks.onNodeCreate).toHaveBeenCalled();
    });

    it('should handle callback promise rejection gracefully', async () => {
      const rejectedPromise = Promise.reject(new Error('Backend error'));
      mockCallbacks.onNodeCreate = jest.fn().mockReturnValue(rejectedPromise);
      
      // Suppress console.warn from promise rejection handling
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result = await crudManager.createNode('text', 'Content');
      
      expect(result.success).toBe(true); // Local operation still succeeds
      expect(mockCallbacks.onNodesChange).toHaveBeenCalled();
      
      // Wait for the promise rejection to be handled
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(consoleSpy).toHaveBeenCalledWith('Node creation callback failed:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('updateNode', () => {
    it('should update existing node content', () => {
      const nodeToUpdate = nodes[0].children[0]; // Child A
      const originalId = nodeToUpdate.getNodeId();
      
      // Create updated version
      const updatedNode = new TextNode('Updated Child A', originalId);
      
      const result = crudManager.updateNode(updatedNode);
      
      expect(result.success).toBe(true);
      expect(result.nodeId).toBe(originalId);
      expect(mockCallbacks.onNodeUpdate).toHaveBeenCalledWith(updatedNode);
      expect(mockCallbacks.onNodeChange).toHaveBeenCalledWith(originalId, 'Updated Child A');
      expect(mockCallbacks.onNodesChange).toHaveBeenCalled();
      
      // Verify content was updated
      expect(nodeToUpdate.getContent()).toBe('Updated Child A');
    });

    it('should handle node not found error', () => {
      const nonExistentNode = new TextNode('Non-existent', 'fake-id');
      
      const result = crudManager.updateNode(nonExistentNode);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Node with ID fake-id not found');
      expect(mockCallbacks.onNodeUpdate).not.toHaveBeenCalled();
    });

    it('should preserve node structure during update', () => {
      const parentNode = nodes[0];
      const originalChildrenCount = parentNode.children.length;
      
      const updatedNode = new TextNode('Updated Root', parentNode.getNodeId());
      const result = crudManager.updateNode(updatedNode);
      
      expect(result.success).toBe(true);
      expect(parentNode.children).toHaveLength(originalChildrenCount);
      expect(parentNode.getContent()).toBe('Updated Root');
    });
  });

  describe('deleteNode', () => {
    it('should delete node and remove from parent', () => {
      const childToDelete = nodes[0].children[1]; // Child B
      const childId = childToDelete.getNodeId();
      const parent = nodes[0];
      const originalChildrenCount = parent.children.length;
      
      const result = crudManager.deleteNode(childId);
      
      expect(result.success).toBe(true);
      expect(result.nodeId).toBe(childId);
      expect(mockCallbacks.onNodeDelete).toHaveBeenCalledWith(childId);
      expect(mockCallbacks.onNodesChange).toHaveBeenCalled();
      expect(parent.children).toHaveLength(originalChildrenCount - 1);
      expect(parent.children.find(child => child.getNodeId() === childId)).toBeUndefined();
    });

    it('should delete root node from nodes array', () => {
      const rootId = nodes[0].getNodeId();
      const originalNodesCount = nodes.length;
      
      const result = crudManager.deleteNode(rootId);
      
      expect(result.success).toBe(true);
      expect(crudManager.getNodes()).toHaveLength(originalNodesCount - 1);
    });

    it('should preserve children when preserveChildren=true', () => {
      const nodeToDelete = nodes[0].children[0]; // Child A (has grandchild)
      const grandchild = nodeToDelete.children[0];
      const grandchildId = grandchild.getNodeId();
      const parent = nodes[0];
      
      const result = crudManager.deleteNode(nodeToDelete.getNodeId(), true);
      
      expect(result.success).toBe(true);
      
      // Grandchild should now be child of root
      const foundGrandchild = parent.children.find(child => child.getNodeId() === grandchildId);
      expect(foundGrandchild).toBeDefined();
      expect(foundGrandchild?.parent).toBe(parent);
    });

    it('should handle node not found error', () => {
      const result = crudManager.deleteNode('non-existent-id');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Node with ID non-existent-id not found');
      expect(mockCallbacks.onNodeDelete).not.toHaveBeenCalled();
    });
  });

  describe('moveNode', () => {
    it('should move node to new parent', () => {
      const nodeToMove = nodes[0].children[0].children[0]; // Grandchild
      const newParent = nodes[0].children[1]; // Child B
      const nodeId = nodeToMove.getNodeId();
      const newParentId = newParent.getNodeId();
      
      const result = crudManager.moveNode(nodeId, newParentId);
      
      expect(result.success).toBe(true);
      expect(result.nodeId).toBe(nodeId);
      expect(result.newParentId).toBe(newParentId);
      expect(mockCallbacks.onNodeMove).toHaveBeenCalledWith(nodeId, newParentId, undefined);
      expect(mockCallbacks.onNodesChange).toHaveBeenCalled();
      
      // Verify move
      expect(nodeToMove.parent).toBe(newParent);
      expect(newParent.children).toContain(nodeToMove);
      expect(nodes[0].children[0].children).toHaveLength(0); // Original parent should be empty
    });

    it('should move node to root level when no parent specified', () => {
      const nodeToMove = nodes[0].children[0]; // Child A
      const nodeId = nodeToMove.getNodeId();
      
      const result = crudManager.moveNode(nodeId);
      
      expect(result.success).toBe(true);
      expect(nodeToMove.parent).toBeNull();
      expect(crudManager.getNodes()).toContain(nodeToMove);
      expect(nodes[0].children).not.toContain(nodeToMove);
    });

    it('should insert after specific sibling when specified', () => {
      const nodeToMove = nodes[0].children[0].children[0]; // Grandchild
      const newParent = nodes[0]; // Root
      const afterSibling = nodes[0].children[0]; // Child A
      
      const result = crudManager.moveNode(
        nodeToMove.getNodeId(),
        newParent.getNodeId(),
        afterSibling.getNodeId()
      );
      
      expect(result.success).toBe(true);
      
      // Should be inserted after Child A
      const childIndex = newParent.children.indexOf(nodeToMove);
      const siblingIndex = newParent.children.indexOf(afterSibling);
      expect(childIndex).toBe(siblingIndex + 1);
    });

    it('should handle node not found error', () => {
      const result = crudManager.moveNode('non-existent-id', nodes[0].getNodeId());
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Node with ID non-existent-id not found');
      expect(mockCallbacks.onNodeMove).not.toHaveBeenCalled();
    });

    it('should handle parent not found error', () => {
      const nodeId = nodes[0].children[0].getNodeId();
      
      const result = crudManager.moveNode(nodeId, 'non-existent-parent');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Parent node with ID non-existent-parent not found');
      expect(mockCallbacks.onNodeMove).not.toHaveBeenCalled();
    });
  });

  describe('reorderNode', () => {
    it('should reorder node within same parent', () => {
      const parent = nodes[0];
      const nodeToReorder = parent.children[0]; // Child A
      const afterSibling = parent.children[1]; // Child B
      const nodeId = nodeToReorder.getNodeId();
      const siblingId = afterSibling.getNodeId();
      
      const result = crudManager.reorderNode(nodeId, siblingId);
      
      expect(result.success).toBe(true);
      expect(mockCallbacks.onNodeReorder).toHaveBeenCalledWith(nodeId, siblingId);
      expect(mockCallbacks.onNodesChange).toHaveBeenCalled();
      
      // Child A should now be after Child B
      expect(parent.children[0]).toBe(afterSibling);
      expect(parent.children[1]).toBe(nodeToReorder);
    });

    it('should move node to beginning when no afterSibling specified', () => {
      const parent = nodes[0];
      const nodeToReorder = parent.children[1]; // Child B
      const nodeId = nodeToReorder.getNodeId();
      
      const result = crudManager.reorderNode(nodeId);
      
      expect(result.success).toBe(true);
      expect(parent.children[0]).toBe(nodeToReorder); // Should be first now
    });

    it('should handle node not found error', () => {
      const result = crudManager.reorderNode('non-existent-id');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Node with ID non-existent-id not found');
      expect(mockCallbacks.onNodeReorder).not.toHaveBeenCalled();
    });

    it('should handle invalid sibling gracefully', () => {
      const nodeId = nodes[0].children[0].getNodeId();
      
      const result = crudManager.reorderNode(nodeId, 'non-existent-sibling');
      
      expect(result.success).toBe(true); // Should still succeed, just append to end
      expect(mockCallbacks.onNodeReorder).toHaveBeenCalled();
    });
  });

  describe('edge cases and error handling', () => {
    it('should prevent circular dependencies in move operations', () => {
      const parent = nodes[0]; // Root
      const child = parent.children[0]; // Child A
      
      // Try to move parent under its own child
      const result = crudManager.moveNode(parent.getNodeId(), child.getNodeId());
      
      // The move fails because the parent would not be found after being removed from nodes array
      expect(result.success).toBe(false); 
      expect(result.error).toBe('Parent node with ID ' + child.getNodeId() + ' not found');
    });

    it('should handle empty nodes array gracefully', () => {
      const emptyManager = new NodeCRUDManager([], callbacks);
      
      const result = emptyManager.deleteNode('any-id');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Node with ID any-id not found');
    });

    it('should handle single node deletion', () => {
      const singleNode = new TextNode('Only Node');
      const singleManager = new NodeCRUDManager([singleNode], callbacks);
      
      const result = singleManager.deleteNode(singleNode.getNodeId());
      
      expect(result.success).toBe(true);
      expect(singleManager.getNodes()).toHaveLength(0);
    });
  });

  describe('setNodes and getNodes', () => {
    it('should update nodes reference', () => {
      const newNodes = [new TextNode('New Root')];
      crudManager.setNodes(newNodes);
      
      expect(crudManager.getNodes()).toBe(newNodes);
      expect(crudManager.getNodes()).toHaveLength(1);
    });

    it('should return current nodes', () => {
      const currentNodes = crudManager.getNodes();
      expect(currentNodes).toBe(nodes);
    });
  });
});