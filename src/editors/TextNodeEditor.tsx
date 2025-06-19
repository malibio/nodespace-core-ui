import TextareaAutosize from 'react-textarea-autosize';
import { BaseNode } from '../nodes';

/**
 * Props for node-specific editors
 */
export interface NodeEditorProps {
  node: BaseNode;
  nodeId: string;
  focused: boolean;
  textareaRefs: React.MutableRefObject<{ [key: string]: HTMLTextAreaElement | null }>;
  onFocus: (nodeId: string) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onContentChange: (content: string) => void;
  onClick?: () => void;
}

/**
 * Editor component specifically for text nodes
 * Contains the current textarea logic extracted from NodeEditor.tsx
 */
export function TextNodeEditor({
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