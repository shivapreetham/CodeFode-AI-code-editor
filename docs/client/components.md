# Components Guide

## 🧩 Component Architecture

CodeFode uses a modular component architecture with clear separation of concerns and reusable UI elements.

## 📁 Component Structure

### Core Editor Components

#### CodeEditor (`/components/room/CodeEditor.tsx`)
The main code editing interface powered by Monaco Editor.

**Props:**
- `language`: Programming language for syntax highlighting
- `value`: Current file content
- `onChange`: Callback for content changes
- `theme`: Editor theme (light/dark)

**Features:**
- Syntax highlighting for 30+ languages
- IntelliSense and auto-completion
- Multi-cursor support
- Real-time collaborative editing
- Custom themes and font sizing

**Usage:**
```typescript
<CodeEditor
  language="typescript"
  value={fileContent}
  onChange={handleContentChange}
  theme={currentTheme}
/>
```

#### FileTabs (`/components/room/FileTabs.tsx`)
Tab management for open files with close functionality.

**Props:**
- `tabs`: Array of open file objects
- `activeTab`: Currently selected tab ID
- `onTabSelect`: Tab selection handler
- `onTabClose`: Tab close handler

**Features:**
- Drag and drop reordering
- Modified file indicators
- Context menu options
- Keyboard navigation support

#### FileExplorer (`/components/room/FileExplorer.tsx`)
Tree-view file system navigation component.

**Props:**
- `rootDirectory`: Root folder structure
- `onFileSelect`: File selection callback
- `onFileCreate`: New file creation handler
- `onFileDelete`: File deletion handler

**Features:**
- Expandable/collapsible folders
- File type icons
- Context menu for file operations
- Search and filter functionality

### Communication Components

#### Chat (`/components/chat/Chat.tsx`)
Real-time messaging component for collaboration.

**Props:**
- `roomId`: Current room identifier
- `messages`: Chat message array
- `onSendMessage`: Message send handler

**Features:**
- Real-time message delivery
- User avatars and timestamps
- Emoji support
- Message history
- Typing indicators

#### Peoples (`/components/Peoples.tsx`)
User presence and activity display component.

**Props:**
- `users`: Array of connected users
- `currentUser`: Current user information
- `showActivity`: Toggle activity log display

**Features:**
- Live user presence indicators
- User avatars and status
- Activity timeline
- Cursor position tracking

### AI Integration Components

#### AiSidebar (`/components/aiSidebar/AiSidebar.tsx`)
AI-powered code assistance panel.

**Props:**
- `isOpen`: Sidebar visibility state
- `onClose`: Close handler
- `currentCode`: Active code context

**Features:**
- Code suggestion generation
- Error detection and fixes
- Code explanation
- Optimization recommendations
- Interactive chat interface

#### CodeBlock (`/components/aiSidebar/codeBlock.tsx`)
Syntax-highlighted code display for AI responses.

**Props:**
- `code`: Code content to display
- `language`: Programming language
- `copyable`: Enable copy functionality

**Features:**
- Syntax highlighting
- Copy to clipboard
- Language detection
- Line numbering

### Layout Components

#### Header (`/components/ui/header/Header.tsx`)
Main navigation and user interface header.

**Props:**
- `user`: Current user object
- `onLogout`: Logout handler
- `showRoomInfo`: Display room information

**Features:**
- User authentication status
- Room navigation
- Theme toggle
- User menu dropdown
- Responsive design

#### Sidebar (`/components/room/Sidebar.tsx`)
Collapsible sidebar container with multiple panels.

**Props:**
- `isCollapsed`: Sidebar state
- `onToggle`: Toggle handler
- `activePanel`: Currently selected panel

**Features:**
- Panel switching (files, chat, AI, activity)
- Resize functionality
- Keyboard shortcuts
- Responsive behavior

#### SidebarPanel (`/components/room/SidebarPanel.tsx`)
Individual sidebar panel wrapper component.

**Props:**
- `title`: Panel title
- `icon`: Panel icon component
- `isActive`: Active state
- `children`: Panel content

### Authentication Components

#### Login/Register Forms (`/app/(auth)/`)
Authentication form components with validation.

**Features:**
- Form validation with error messages
- Social login integration (Google OAuth)
- Password strength indicators
- Two-factor authentication support
- Forgot password functionality

### Utility Components

#### Loading (`/components/ui/loading/Loading.tsx`)
Loading states and spinners for various scenarios.

**Props:**
- `type`: Loading animation type
- `size`: Spinner size
- `message`: Optional loading message

**Variants:**
- Spinner for general loading
- Skeleton for content loading
- Progress bar for file operations

#### ThemeComp (`/components/ui/theme/ThemeComp.tsx`)
Theme switching component with persistence.

**Features:**
- Light/dark theme toggle
- Theme persistence in localStorage
- Smooth theme transitions
- System theme detection

#### Terminal (`/components/terminal.tsx`)
Integrated terminal component for code execution.

**Props:**
- `onCommand`: Command execution handler
- `history`: Command history array
- `workingDirectory`: Current directory

**Features:**
- Command execution
- Output display
- Command history
- Auto-completion

## 🎨 Styling Guidelines

### Design System
- **Primary Colors**: Blue variants for interactive elements
- **Secondary Colors**: Gray scale for text and backgrounds
- **Accent Colors**: Green for success, red for errors, yellow for warnings

### Component Styling
- TailwindCSS utility classes for rapid development
- Material-UI components for complex interactions
- Custom CSS modules for component-specific styles
- Responsive design with mobile-first approach

### Theme Support
All components support both light and dark themes through:
- CSS custom properties for color values
- Theme-aware conditional classes
- Material-UI theme provider integration

## 🔄 State Management in Components

### Local State
Components use React's `useState` and `useReducer` for local state management.

### Global State
Shared state is managed through React Context:
- User authentication state
- Current file and workspace state
- Theme preferences
- Socket connection state

### Props Drilling Prevention
Context providers and custom hooks prevent excessive props drilling:
```typescript
// Instead of passing props through multiple levels
const useActiveFile = () => {
  const context = useContext(ActiveFileContext);
  if (!context) {
    throw new Error('useActiveFile must be used within ActiveFileProvider');
  }
  return context;
};
```

## 🧪 Component Testing

### Testing Strategy
- Unit tests for individual component logic
- Integration tests for component interactions
- Visual regression tests for UI consistency

### Mock Dependencies
Components are tested with mocked external dependencies:
- Socket.IO connections
- API calls
- File system operations
- Authentication state

## 📱 Responsive Behavior

### Breakpoints
- **Mobile**: 0px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+

### Adaptive Components
Components adapt to screen size by:
- Hiding non-essential UI elements on mobile
- Stacking layouts vertically on smaller screens
- Adjusting font sizes and spacing
- Optimizing touch targets for mobile interaction

## 🔧 Performance Considerations

### Optimization Techniques
- React.memo for preventing unnecessary re-renders
- useMemo and useCallback for expensive calculations
- Lazy loading for heavy components
- Virtual scrolling for large lists

### Bundle Splitting
Components are split into logical chunks:
- Critical path components loaded immediately
- Feature-specific components loaded on demand
- Vendor libraries in separate chunks