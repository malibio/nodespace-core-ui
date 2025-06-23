# CLAUDE.md - NodeSpace Core UI Development

## 🎯 FINDING YOUR NEXT TASK

**See [development-workflow.md](../nodespace-system-design/docs/development-workflow.md)** for task management workflow.

## 🚀 Quick Start: "Work on the next task"

1. **📖 Architecture Context**: Read [NodeSpace System Design](../nodespace-system-design) for distributed system understanding
2. **🤖 Autonomous Development**: Follow the workflow below for self-directed implementation

## 🏗️ Repository Context in Distributed Architecture

### This Repository's Role
- **Independent React Library** - Pure UI components with no backend dependencies
- **Used by Desktop App** - Imported by `nodespace-desktop-app` for hierarchical block editing
- **Loosely Coupled** - Can be used independently or in other React applications
- **Highly Aligned** - Follows NodeSpace entity-centric design patterns

## Repository-Specific Information

**Repository**: nodespace-core-ui
**Purpose**: React component library for hierarchical block editor used by NodeSpace desktop application
**Architecture**: Component library with default export pattern
**Interface Pattern**: Independent component library with clear props-based API

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
- **Independent**: No direct dependencies on other NodeSpace repositories
- **Clean API**: Component props provide all needed integration points

### Current Status
- **Independent Library** - No dependencies on other NodeSpace repositories
- **MVP Component Support** - TextNode editing functional, AIChatNode component needed

## 🤖 Autonomous Development Workflow

### Task Implementation Process
1. **📋 Task Discovery**: From Linear issue, identify specific component/feature to implement
2. **🎯 Implementation Scope**: Focus only on React component functionality (no backend logic)
3. **🧪 Development Pattern**:
   ```bash
   # 1. Start demo environment
   npm run demo
   
   # 2. Implement component following existing patterns
   # - Follow naming conventions below
   # - Extend from BaseNode if applicable
   # - Add to nodeUtils factory if new node type
   
   # 3. Test component behavior
   npm test
   
   # 4. Validate integration in demo
   # - Test in demo app
   # - Verify component props API
   # - Check styling and responsive behavior
   ```

### Implementation Patterns
- **New Node Types**: Extend `BaseNode` → Add to `nodeUtils` factory → Create editor component
- **UI Components**: Follow existing component structure and naming conventions
- **Styling**: Use CSS modules or add to `nodeSpace.css` 
- **State Management**: Component-level state, no global state dependencies

### Testing Strategy
- **Component Tests**: Focus on React component behavior and props
- **Demo Validation**: Use demo app to verify integration patterns
- **No Backend Tests**: This library is pure React, no backend testing needed

## 🔧 Development Notes

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