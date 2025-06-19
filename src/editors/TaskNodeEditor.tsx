import TextareaAutosize from 'react-textarea-autosize';
import { NodeEditorProps } from './TextNodeEditor';

/**
 * Editor component specifically for task nodes
 * Demonstrates different UI for TaskNode vs TextNode
 */
export function TaskNodeEditor({
  node,
  nodeId,
  textareaRefs,
  onFocus,
  onBlur,
  onKeyDown,
  onContentChange,
  onClick
}: NodeEditorProps) {
  
  return (
    <TextareaAutosize
      ref={(el) => {
        textareaRefs.current[nodeId] = el;
      }}
      className="ns-node-textarea"
      value={node.getContent()}
      onChange={(e) => {
        node.setContent(e.target.value);
        onContentChange(e.target.value);
      }}
      onFocus={() => onFocus(nodeId)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onClick={onClick}
      minRows={1}
      style={{
        resize: 'none',
        overflow: 'hidden',
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
      }}
    />
  );
}