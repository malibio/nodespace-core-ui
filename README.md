# NodeSpace Core UI

**React component library for hierarchical block editing**

This repository provides a React component library that implements a hierarchical block editor for NodeSpace applications. It serves as a pure UI layer with no backend dependencies, designed to be imported and used by the NodeSpace desktop application.

## Overview

NodeSpace Core UI delivers a complete hierarchical block editing experience as a reusable React component library. It provides sophisticated node management, visual hierarchy representation, and comprehensive keyboard interactions while maintaining clean separation between UI components and business logic.

## Key Features

- **Hierarchical Block Editor** - Complete tree-based content editing with visual hierarchy
- **Multiple Node Types** - Text, task, AI chat, and date nodes with extensible architecture
- **Advanced Keyboard Navigation** - Full keyboard support with intelligent content manipulation
- **Visual Hierarchy Indicators** - Connecting lines, collapse triangles, and type-specific indicators
- **Dark Mode Support** - Complete theming system compatible with desktop applications
- **Pure React Architecture** - No backend dependencies, clean component library design

## Recent Updates

### Component Library Optimization

Major cleanup and optimization of the component library:

- **Performance Improvements** - Removed debug logging and optimized rendering paths
- **Enhanced Dark Mode** - Fixed CSS specificity issues for seamless desktop app integration
- **Visual Hierarchy** - Improved triangle positioning and vertical line connections
- **Code Quality** - Comprehensive cleanup removing unnecessary files and debug code
- **TypeScript Compliance** - Full type safety with zero compilation errors

## Architecture Context

Part of the NodeSpace system architecture:

1. [nodespace-core-types](https://github.com/malibio/nodespace-core-types) - Shared data structures and interfaces
2. [nodespace-data-store](https://github.com/malibio/nodespace-data-store) - LanceDB vector storage implementation
3. [nodespace-nlp-engine](https://github.com/malibio/nodespace-nlp-engine) - AI/ML processing and LLM integration
4. [nodespace-core-logic](https://github.com/malibio/nodespace-core-logic) - Business logic orchestration
5. **[nodespace-core-ui](https://github.com/malibio/nodespace-core-ui)** ← **You are here**
6. [nodespace-desktop-app](https://github.com/malibio/nodespace-desktop-app) - Tauri application shell

**Component Dependencies:**
- Pure React with TypeScript
- No backend service dependencies
- Designed for integration with desktop applications

## Installation & Usage

### Desktop App Integration

```tsx
import NodeSpaceEditor from 'nodespace-core-ui';

function App() {
  return (
    <NodeSpaceEditor 
      nodes={nodes}
      callbacks={callbacks}
      focusedNodeId={focusedNodeId}
      className={isDarkMode ? 'ns-dark-mode' : ''}
    />
  );
}
```

### Component API

```tsx
interface NodeSpaceEditorProps {
  nodes: BaseNode[];
  focusedNodeId?: string | null;
  callbacks?: NodeSpaceCallbacks;
  onFocus?: (nodeId: string) => void;
  onBlur?: () => void;
  className?: string;
  collapsibleNodeTypes?: Set<string>;
}
```

### Node Types

```tsx
// Text content with markdown support
const textNode = new TextNode("Content here");

// Task management with completion states
const taskNode = new TaskNode("Task description", TaskStatus.Todo);

// AI chat interactions
const chatNode = new AIChatNode("AI conversation title");

// All nodes support hierarchical relationships
textNode.addChild(taskNode);
```

## Development

```bash
# Start development demo
npm run demo

# Build component library
npm run build

# Run tests
npm test

# Type checking and linting
npm run type-check && npm run lint
```

The repository includes:
- **Comprehensive demo application** - Full feature showcase with examples
- **Complete test suite** - Component behavior and integration testing
- **TypeScript definitions** - Full type safety and IntelliSense support

## Testing

```bash
# Component unit tests
npm test

# TypeScript compilation
npm run type-check

# ESLint validation
npm run lint
```

## Technology Stack

- **Language**: TypeScript with React 18
- **Component Architecture**: Hierarchical composition with pure function components
- **State Management**: Component-level state with callback patterns
- **Styling**: CSS with CSS custom properties for theming
- **Build System**: React Scripts with TypeScript compilation
- **Testing**: Jest with React Testing Library

## Node Type System

The library provides an extensible node type system:

```tsx
// Base node with hierarchical capabilities
abstract class BaseNode {
  addChild(child: BaseNode): void;
  removeChild(child: BaseNode): void;
  getParent(): BaseNode | null;
  // ... hierarchy management
}

// Specialized node types
class TextNode extends BaseNode { /* markdown content */ }
class TaskNode extends BaseNode { /* task management */ }
class AIChatNode extends BaseNode { /* AI interactions */ }
```

## Keyboard Interactions

- **Enter** - Split content and create new sibling node
- **Shift+Enter** - Add newline within current node
- **Backspace at start** - Join with previous node
- **Delete at end** - Join with next node
- **Tab** - Indent node (make child of previous sibling)
- **Shift+Tab** - Outdent node (make sibling of parent)

## Visual Hierarchy

The component provides sophisticated visual hierarchy representation:
- **Type indicators** - Circles, squares, and icons for different node types
- **Connecting lines** - Dotted lines showing parent-child relationships
- **Collapse triangles** - Interactive controls for tree navigation
- **Indentation levels** - Visual depth representation

## Related Documentation

For more details on the overall system architecture, see the complete NodeSpace ecosystem above in [Architecture Context](#architecture-context).

---

*NodeSpace Core UI provides the sophisticated hierarchical editing interface that makes NodeSpace's AI-powered knowledge management system intuitive and powerful to use.*