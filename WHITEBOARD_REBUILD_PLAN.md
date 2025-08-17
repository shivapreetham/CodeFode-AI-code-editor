# Whiteboard Rebuild Plan

## Current Issues
- Fabric.js causing infinite loading loops
- Complex context management blocking UI render
- Backend dependency preventing frontend from loading
- Overly complex socket event handling

## Recommended Solution: Tldraw Integration

### Why Tldraw?
1. **Modern**: Built for React/Next.js in 2024-2025
2. **Performance**: Optimized infinite canvas
3. **Collaboration**: Built-in real-time collaboration
4. **Simple**: Drop-in component, minimal setup
5. **Maintained**: Active development, great docs

### Step 1: Remove Current Whiteboard
```bash
npm uninstall fabric @types/fabric react-color @types/react-color
```

### Step 2: Install Tldraw
```bash
npm install tldraw
```

### Step 3: Replace Whiteboard Component
```tsx
// Simple Tldraw integration
import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'

interface WhiteboardProps {
  roomId: string;
  username: string;
}

export default function Whiteboard({ roomId, username }: WhiteboardProps) {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw />
    </div>
  )
}
```

### Step 4: Add Collaboration (Optional)
- Tldraw has built-in collaboration
- Can integrate with your existing socket.io for room management
- Or use Tldraw's collaboration backend

### Step 5: Fix Context Issues
- Remove workspace loading dependency from UI render
- Simplify socket initialization
- Add proper error boundaries

## Alternative: Konva Approach

If you prefer to stick with a canvas library:

### Install Konva
```bash
npm install konva react-konva
npm install @types/konva
```

### Simple Konva Whiteboard
```tsx
import { Stage, Layer, Line } from 'react-konva'
import { useState, useRef } from 'react'

export default function KonvaWhiteboard() {
  const [lines, setLines] = useState([])
  const isDrawing = useRef(false)

  const handleMouseDown = (e) => {
    isDrawing.current = true
    const pos = e.target.getStage().getPointerPosition()
    setLines([...lines, { points: [pos.x, pos.y] }])
  }

  const handleMouseMove = (e) => {
    if (!isDrawing.current) return
    
    const stage = e.target.getStage()
    const point = stage.getPointerPosition()
    let lastLine = lines[lines.length - 1]
    
    lastLine.points = lastLine.points.concat([point.x, point.y])
    lines.splice(lines.length - 1, 1, lastLine)
    setLines([...lines])
  }

  const handleMouseUp = () => {
    isDrawing.current = false
  }

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseDown={handleMouseDown}
      onMousemove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <Layer>
        {lines.map((line, i) => (
          <Line
            key={i}
            points={line.points}
            stroke="#000"
            strokeWidth={2}
            tension={0.5}
            lineCap="round"
            globalCompositeOperation="source-over"
          />
        ))}
      </Layer>
    </Stage>
  )
}
```

## Critical Context Fixes Needed

### 1. Remove Workspace Dependency
```tsx
// In RoomContext.tsx - Line 722
isInitialized: isInitialized // Remove && workspaceLoaded
```

### 2. Add Loading Timeouts
```tsx
// Add to socket initialization
useEffect(() => {
  const timeout = setTimeout(() => {
    if (!isInitialized) {
      setIsInitialized(true) // Force initialization after timeout
      toast.error('Connection timeout - using offline mode')
    }
  }, 5000)
  
  return () => clearTimeout(timeout)
}, [])
```

### 3. Simplify Component Loading
- Remove complex loading states from whiteboard
- Use React Suspense for async components
- Add error boundaries

## Immediate Actions

1. **Backup current code**
2. **Choose approach** (Tldraw recommended)
3. **Remove Fabric.js** completely
4. **Fix context loading** issues
5. **Implement new whiteboard**
6. **Test collaboration**

## Benefits of Rebuild

✅ **Modern stack** - 2024/2025 best practices
✅ **Better performance** - No more infinite loops
✅ **Simpler codebase** - Less complexity
✅ **Active maintenance** - Updated libraries
✅ **Better UX** - Faster loading, responsive
✅ **Easier debugging** - Clear error messages

Would you like me to start with the Tldraw approach?