# Room Components

This directory contains the modular components for the room page, which has been refactored from a single large file into smaller, focused components.

## Components

### Sidebar.tsx
Handles the left sidebar navigation with icons and tab switching functionality.
- **Props**: `activeTab`, `isCollapsed`, `onTabChange`, `onToggleCollapse`
- **Features**: Tab navigation, collapse/expand functionality, hover effects

### SidebarPanel.tsx
Manages the content area of the sidebar that shows different panels based on the active tab.
- **Props**: All the props needed for different panel types (FileExplorer, Chat, Users, etc.)
- **Features**: Conditional rendering based on active tab, responsive design

### FileTabs.tsx
Handles the file tabs at the top of the editor area.
- **Props**: `files`, `activeFile`, `onFileChange`, `onFileClose`
- **Features**: File switching, tab closing, active tab highlighting

### CodeEditor.tsx
Manages the Monaco editor and its related functionality.
- **Props**: `activeFile`, `isOutputExpand`, `isCollapsed`, `theme`, `fontSize`, etc.
- **Features**: Monaco editor integration, theme support, responsive sizing

### CodeOutput.tsx
Handles the output panel at the bottom of the editor.
- **Props**: `isOutputExpand`, `codeOutput`, `loading`, `codeStatus`, etc.
- **Features**: Expandable output panel, copy functionality, run button

## Hooks

### useRoomState.ts
Custom hook to manage all room state and related operations.
- **Features**: File management, workspace loading/saving, notifications, code execution

### useRoomSocket.ts
Custom hook to handle all socket-related functionality for the room.
- **Features**: Socket connection, event handling, real-time updates

### useCursorManagement.ts
Custom hook to handle remote cursor management for collaborative editing.
- **Features**: Remote cursor display, cursor position tracking

### useKeyboardShortcuts.ts
Enhanced keyboard shortcuts hook with additional functionality.
- **Features**: Tab switching, code execution, sidebar toggle

## Benefits of Modularization

1. **Maintainability**: Each component has a single responsibility
2. **Reusability**: Components can be reused in other parts of the application
3. **Testability**: Smaller components are easier to test
4. **Performance**: Better code splitting and lazy loading opportunities
5. **Developer Experience**: Easier to understand and modify individual features

## File Structure

```
room/
├── README.md
├── Sidebar.tsx
├── SidebarPanel.tsx
├── FileTabs.tsx
├── CodeEditor.tsx
└── CodeOutput.tsx
```

## Usage

The main room page (`page.tsx`) now imports and uses these components:

```tsx
import Sidebar from "@/app/components/room/Sidebar";
import SidebarPanel from "@/app/components/room/SidebarPanel";
import FileTabs from "@/app/components/room/FileTabs";
import CodeEditor from "@/app/components/room/CodeEditor";
import CodeOutput from "@/app/components/room/CodeOutput";
```

## State Management

The room state is managed through custom hooks:
- `useRoomState`: Main state management
- `useRoomSocket`: Socket communication
- `useCursorManagement`: Collaborative cursor features
- `useKeyboardShortcuts`: Keyboard interactions

## Styling

The components use Tailwind CSS classes and custom CSS for:
- Responsive design
- Dark theme support
- Smooth transitions
- Hover effects
- Focus states

## Future Improvements

1. Add TypeScript strict mode
2. Implement error boundaries
3. Add unit tests for each component
4. Optimize performance with React.memo
5. Add accessibility features (ARIA labels, keyboard navigation) 