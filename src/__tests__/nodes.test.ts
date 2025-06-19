import { 
  TextNode, 
  TaskNode, 
  DateNode
} from '../nodes';

describe('BaseNode', () => {
  test('node ID generation and uniqueness', () => {
    const node1 = new TextNode('test content');
    const node2 = new TextNode('test content');
    
    expect(node1.getNodeId()).toBeTruthy();
    expect(node2.getNodeId()).toBeTruthy();
    expect(node1.getNodeId()).not.toBe(node2.getNodeId());
  });

  test('metadata management', () => {
    const node = new TextNode('test');
    
    node.setCustomMetadata('key1', 'value1');
    node.setCustomMetadata('key2', { nested: 'object' });
    
    expect(node.getCustomMetadata('key1')).toBe('value1');
    expect(node.getCustomMetadata('key2')).toEqual({ nested: 'object' });
  });

  test('tag system functionality', () => {
    const node = new TextNode('test');
    
    node.addTag('important');
    node.addTag('work');
    expect(node.getTags()).toEqual(['important', 'work']);
    
    node.removeTag('work');
    expect(node.getTags()).toEqual(['important']);
  });

  test('content management', () => {
    const node = new TextNode('test');
    
    expect(node.getContent()).toBe('test');
    node.setContent('updated content');
    expect(node.getContent()).toBe('updated content');
  });
});

describe('TextNode', () => {
  test('text extraction accuracy', () => {
    const node = new TextNode('# Hello **World**');
    
    expect(node.getPlainTextContent()).toBe('# Hello **World**');
    expect(node.hasTextContent()).toBe(true);
  });

  test('empty content handling', () => {
    const node = new TextNode('');
    
    expect(node.getPlainTextContent()).toBe('');
    expect(node.hasTextContent()).toBe(false);
  });
});

describe('TaskNode', () => {
  test('status cycling (pending → in-progress → completed)', () => {
    const node = new TaskNode('Test task');
    
    expect(node.getStatus()).toBe('pending');
    
    node.cycleThroughStatus();
    expect(node.getStatus()).toBe('in-progress');
    
    node.cycleThroughStatus();
    expect(node.getStatus()).toBe('completed');
    
    node.cycleThroughStatus();
    expect(node.getStatus()).toBe('pending');
  });

  test('metadata serialization', () => {
    const node = new TaskNode('Test task');
    node.setStatus('completed');
    node.setDueDate('2024-12-31');
    node.setAssignedTo('John Doe');
    node.setPriority('high');
    
    const serialized = node.toJSON();
    
    expect(serialized.status).toBe('completed');
    expect(serialized.dueDate).toBe('2024-12-31');
    expect(serialized.assignedTo).toBe('John Doe');
    expect(serialized.priority).toBe('high');
  });
});

describe('DateNode', () => {
  test('date formatting options', () => {
    const date = new Date('2024-06-04');
    const node = new DateNode(date, 'full');
    
    expect(node.getDate()).toEqual(date);
    expect(node.getDateFormat()).toBe('full');
    expect(node.getContent()).toContain('2024');
  });
});
