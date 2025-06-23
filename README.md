# ⚠️ BEFORE STARTING ANY WORK
👉 **ALL development workflows are in**: `../nodespace-system-design`
👉 **This README.md only contains**: Repository-specific React and TypeScript patterns

# NodeSpace Core UI

**React Component Library for Hierarchical Block Editor**

This repository provides a React component library that implements a hierarchical block editor for NodeSpace. It's designed to be imported and used by the `nodespace-desktop-app`.

## 🎯 Purpose

- **Component Library** - Reusable React components for hierarchical block editing
- **Default Export** - Single import provides complete editor functionality  
- **Pure React** - No Tauri dependencies (handled by desktop app)
- **CSS Bundled** - Styles automatically included with component imports

## 📦 Installation & Usage

### For NodeSpace Desktop App
```tsx
import NodeSpaceEditor from 'nodespace-core-ui';

function App() {
  return (
    <NodeSpaceEditor 
      nodes={nodes}
      callbacks={callbacks}
      focusedNodeId={focusedNodeId}
      // ... other props
    />
  );
}
```

That's it! CSS and all functionality included automatically.

### For Development
```bash
# Install dependencies
npm install

# Start demo application
npm run demo

# Build component library
npm run build

# Run tests
npm test
```

## 🔧 Component API

### Main Component: `NodeSpaceEditor`

```tsx
interface NodeSpaceEditorProps {
  nodes: BaseNode[];
  focusedNodeId?: string | null;
  callbacks: NodeSpaceCallbacks;
  onFocus?: (nodeId: string) => void;
  onBlur?: () => void;
  onRemoveNode?: (node: BaseNode) => void;
  // Collapsed state management
  collapsedNodes?: Set<string>;
  collapsibleNodeTypes?: Set<string>;
  onCollapseChange?: (nodeId: string, collapsed: boolean) => void;
  className?: string;
}
```

### Node Types
- `BaseNode` - Base class for all hierarchical nodes
- `TextNode` - Text content with markdown support
- `TaskNode` - Task items with completion state
- `DateNode` - Date/time-based content organization
- `EntityNode` - User-defined custom node types

### Utilities Exported
- `countAllNodes` - Count total nodes in tree
- `nodeUtils` - Various node manipulation utilities
- `keyboardHandlers` - Keyboard interaction logic

## 🏗️ Features

### ✅ Hierarchical Block Editor
- **Collapsible nodes** - Editor-level collapsed state management
- **Visual hierarchy** - Indentation and connecting lines
- **Keyboard navigation** - Full keyboard support
- **Rich editing** - Multiple node types (text, tasks, dates, entities)
- **Clean architecture** - Separation of data model and UI state

### ✅ Keyboard Shortcuts
- **Enter**: Split content and create new sibling node
- **Shift+Enter**: Add newline within current node
- **Backspace at start**: Join with previous node (intelligent child transfer)
- **Delete at end**: Join with next node (intelligent child transfer)
- **Tab**: Indent node (make child of previous sibling)
- **Shift+Tab**: Outdent node (make sibling of parent)

### ✅ Visual Features
- **Dark mode support** - Toggle between light/dark themes
- **Circle indicators** - Visual hierarchy indicators
- **Connecting lines** - Show parent-child relationships
- **Responsive design** - Works across different screen sizes

## 📁 File Structure

```
src/
├── lib.ts                    # Main library export + CSS import
├── index.tsx                 # Demo app entry point
├── NodeSpaceEditor.tsx       # Default export component
├── hierarchy/                # Core rendering components
│   ├── RenderNodeTree.tsx    # Tree rendering logic
│   ├── NodeComponent.tsx     # Individual node component
│   └── NodeEditor.tsx        # Node editing interface
├── editors/                  # Node-specific editors
│   ├── TextNodeEditor.tsx    # Text node editor
│   ├── TaskNodeEditor.tsx    # Task node editor
│   └── NodeEditorFactory.tsx # Editor selection logic
├── nodes/                    # Node class definitions
│   ├── BaseNode.ts           # Base hierarchical node
│   ├── TextNode.ts           # Text content nodes
│   ├── TaskNode.ts           # Task management nodes
│   ├── DateNode.ts           # Date-based organization
│   └── EntityNode.ts         # User-defined nodes
├── utils/                    # Utility functions
│   ├── nodeUtils.ts          # Node manipulation
│   └── keyboardHandlers.ts   # Keyboard interaction
├── icons/                    # Icon definitions
├── nodeSpace.css             # Component styles (auto-bundled)
└── demo/                     # Demo application
    ├── App.tsx               # Demo app with examples
    └── demo.css              # Demo-specific styles
```

## 🎨 Naming Conventions

### React Components (return JSX)
- **PascalCase**: `NodeComponent`, `RenderNodeTree`, `NodeEditor`
- **File names**: Match component name (`NodeComponent.tsx`)

### Utility Functions (no JSX)
- **camelCase**: `countAllNodes`, `getIconNames`, `nodeUtils`  
- **File names**: Descriptive camelCase (`nodeUtils.ts`)

### Classes
- **PascalCase**: `BaseNode`, `TextNode`, `TaskNode`, `EntityNode`

### CSS Files
- **camelCase**: `nodeSpace.css`, `demo.css`

### Constants
- **UPPER_SNAKE_CASE**: `DEFAULT_SLASH_OPTIONS`

## 🧪 Demo Application

The `src/demo/` folder contains a complete demo application showcasing all features:

```bash
npm run demo
```

**Demo Features:**
- Complex test scenarios for hierarchy behavior
- Dark mode toggle
- Keyboard shortcut help
- Examples of all node types
- Test cases for edge behaviors

## 🔗 NodeSpace System Integration

### Architecture Context
This repository is part of the **NodeSpace distributed system** - an entity-centric, AI-powered knowledge management platform. 

**📖 Full System Overview**: See [NodeSpace System Design](../nodespace-system-design) for complete architecture, development workflow, and coordination.

### This Repository's Role
- **Independent Component Library** - Pure React components with no backend dependencies
- **Used by Desktop App** - Imported by `nodespace-desktop-app` for the main application UI
- **Hierarchical Block Editor** - Specialized for NodeSpace's entity-centric content model

### Integration Pattern
- **This library**: Provides pure React components and editor logic
- **Desktop app**: Handles Tauri integration, data persistence, AI processing
- **Clear separation**: UI components remain independent of business logic

### Distributed Architecture
- **Loosely coupled** - This library works independently and can be used in other React apps
- **Highly aligned** - Follows NodeSpace design patterns and entity-centric model

## 📋 Contributing

### For Contributors
1. **🏗️ System Context**: Read [NodeSpace System Design](../nodespace-system-design) for full architecture understanding
2. **📋 Find Tasks**: Check [Linear workspace](https://linear.app/nodespace) for current work (filter: `nodespace-core-ui`)
3. **🤖 Development**: See [CLAUDE.md](./CLAUDE.md) for autonomous development workflow
4. **🧪 Testing**: Run `npm test` to validate component behavior

### For Users
- **Installation**: `npm install nodespace-core-ui`
- **Usage**: Import the main `NodeSpaceEditor` component
- **Documentation**: Component APIs documented above

### Testing
```bash
# Component unit tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

### Building for Distribution
```bash
# Build component library
npm run build

# Output in dist/ directory for import by desktop app
```

---

**Project Management:** All tasks tracked in [Linear workspace](https://linear.app/nodespace)