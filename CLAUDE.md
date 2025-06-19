# CLAUDE.md

## 🎯 CRITICAL: Read System Design First

**BEFORE working on this repository, you MUST read:**
- `../nodespace-system-design/CLAUDE.md` - Complete development guidance
- `../nodespace-system-design/README.md` - Architecture overview
- `../nodespace-system-design/docs/development-workflow.md` - Process

This repository is part of the NodeSpace distributed system and follows centralized contracts and workflows defined in `nodespace-system-design`.

## Repository-Specific Information

**Repository**: nodespace-core-ui
**Purpose**: React component library for hierarchical block editor used by NodeSpace desktop application
**Architecture**: Component library with default export pattern
**Contract Implementation**: `../nodespace-system-design/contracts/tauri-commands.rs`

## Component Library Architecture

### Library Structure
This repository is a **React component library**, not a standalone application:
- Exports a single main component: `NodeSpaceEditor`
- Used by `nodespace-desktop-app` via: `import NodeSpaceEditor from 'nodespace-core-ui'`
- No Tauri dependencies - those belong in the desktop app
- CSS styles bundled automatically with component imports
- Clean architecture: Editor manages UI state, nodes are pure data models

### Default Export Pattern
```tsx
// Desktop app usage
import NodeSpaceEditor from 'nodespace-core-ui';

function App() {
  return <NodeSpaceEditor nodes={nodes} callbacks={callbacks} />;
}
```

### Development Commands
```bash
# Install dependencies
npm install

# Start demo development server  
npm run demo

# Build component library
npm run build

# Run component tests
npm test

# Lint code
npm run lint

# Type checking
npm run type-check
```

### Key Files
- `src/lib.ts` - Main library export and CSS imports
- `src/index.tsx` - Demo app entry point (react-scripts)
- `src/NodeSpaceEditor.tsx` - Default export component (main library interface)
- `src/hierarchy/RenderNodeTree.tsx` - Core hierarchical rendering logic
- `src/hierarchy/NodeComponent.tsx` - Individual node component
- `src/nodes/` - Node class definitions (BaseNode, TextNode, TaskNode, etc.)
- `src/editors/` - Node-specific editor components
- `src/utils/nodeUtils.ts` - Utility functions
- `src/nodeSpace.css` - Component styles (auto-bundled)
- `src/demo/` - Demo application for development and testing

### Integration Points
- **Used by**: `nodespace-desktop-app` (imports this component library)
- **Future Integration**: Will integrate with `nodespace-core-types` for shared TypeScript types
- **No Direct Tauri Integration**: Desktop app handles Tauri command integration

### Current Status
- **Task Tracking**: [Linear workspace](https://linear.app/nodespace) (filter: `nodespace-core-ui`)
- **Contract Compliance**: Run validation from `../nodespace-system-design/validation/`

## Development Notes

### Naming Conventions
**React Components (return JSX)**:
- **PascalCase**: `NodeComponent`, `RenderNodeTree`, `NodeEditor`
- **File names**: Match component name (`NodeComponent.tsx`)

**Utility Functions (no JSX)**:
- **camelCase**: `countAllNodes`, `getIconNames`, `nodeUtils`
- **File names**: Descriptive camelCase (`nodeUtils.ts`)

**Classes**:
- **PascalCase**: `BaseCollapsibleNode`, `TaskNode`

**CSS Files**:
- **camelCase**: `nodeSpace.css`, `demo.css`

**Constants**:
- **UPPER_SNAKE_CASE**: `DEFAULT_SLASH_OPTIONS`

### Component Library Development
- No Tauri dependencies in this repository
- Focus on pure React component functionality
- Desktop app handles all data integration and Tauri commands
- Use demo app for development and testing

### UI/UX Guidelines
- Optimize for desktop application usage patterns
- Implement responsive design for different window sizes
- Ensure accessibility compliance (WCAG 2.1 AA)
- Use consistent design system across all components

### Performance Considerations
- Lazy load components and routes where appropriate
- Optimize bundle size for fast application startup
- Use React DevTools for performance profiling
- Implement virtual scrolling for large lists

### Testing Strategy
- Unit tests for individual components
- Integration tests for Tauri command interactions
- Visual regression tests for UI consistency
- Accessibility testing with automated tools

---

**Remember**: All major architectural decisions, contracts, and workflows are in `nodespace-system-design`. This file only contains repository-specific implementation details.