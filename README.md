# NodeSpace Core UI

**React components and user interface for NodeSpace**

This repository implements the React frontend components that provide the user interface for NodeSpace. It connects to the Tauri backend through commands and provides a seamless desktop application experience.

## 🎯 Purpose

- **React components** - Reusable UI components for NodeSpace functionality
- **Tauri integration** - Frontend commands that call Rust backend services
- **User experience** - Intuitive interface for text capture and RAG queries
- **Component library** - Shared UI components for plugin development

## 📦 Key Features

- **Text editor** - Rich text input for note capture and editing
- **Search interface** - Semantic and full-text search with results display
- **RAG query UI** - Question input with contextual AI responses
- **Node management** - Browse, organize, and manage stored content
- **Responsive design** - Optimized for desktop application usage

## 🔗 Dependencies

- **React ecosystem** - React, TypeScript, and modern frontend tools
- **Tauri frontend APIs** - Integration with Rust backend commands
- **UI framework** - Component library (TailwindCSS, Material-UI, etc.)

## 🏗️ Architecture Context

Part of the [NodeSpace system architecture](../nodespace-system-design/README.md):

1. `nodespace-core-types` - Shared data structures and interfaces
2. `nodespace-data-store` - Database and vector storage
3. `nodespace-nlp-engine` - AI/ML processing and LLM integration
4. `nodespace-workflow-engine` - Automation and event processing
5. `nodespace-core-logic` - Business logic orchestration
6. **`nodespace-core-ui`** ← **You are here**
7. `nodespace-desktop-app` - Tauri application shell

## 🚀 Getting Started

### **New to NodeSpace? Start Here:**
1. **Read [NodeSpace System Design](../nodespace-system-design/README.md)** - Understand the full architecture
2. **Check [Linear workspace](https://linear.app/nodespace)** - Find your current tasks (filter by `nodespace-core-ui`)
3. **Review [Development Workflow](../nodespace-system-design/docs/development-workflow.md)** - Process and procedures
4. **Study [Key Contracts](../nodespace-system-design/contracts/)** - Interface definitions you'll implement
5. **See [MVP User Flow](../nodespace-system-design/examples/mvp-user-flow.md)** - What you're building

### **Development Setup:**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## 🔄 MVP Implementation

The core UI implements the complete user workflow:

1. **Text capture** - Rich text editor for content input
2. **Content display** - View and organize stored nodes
3. **Search interface** - Query interface with results display
4. **RAG queries** - Question input with AI-generated responses
5. **Error handling** - User-friendly error messages and recovery

## 🧪 Testing

```bash
# Run component tests
npm test

# Run integration tests with Tauri
npm run test:integration

# Visual regression tests
npm run test:visual
```

## 📋 Current Status

**All tasks tracked in [Linear workspace](https://linear.app/nodespace)**

Filter by label: `nodespace-core-ui` to see issues for this repository.

---

**Project Management:** All tasks tracked in [Linear workspace](https://linear.app/nodespace)
