import React, { useEffect, useState, useCallback } from 'react';
import { ACTIONS } from '@/app/helpers/Actions';

interface MousePointer {
  username: string;
  x: number;
  y: number;
  timestamp: number;
  color: string;
}

interface MousePointerTrackerProps {
  socket?: any;
  roomId: string;
  username: string;
  isCodeEditorActive?: boolean;
}

const MousePointerTracker: React.FC<MousePointerTrackerProps> = ({
  socket,
  roomId,
  username,
  isCodeEditorActive = false
}) => {
  const [mousePointers, setMousePointers] = useState<Map<string, MousePointer>>(new Map());
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });

  // Generate a consistent color for each user
  const getUserColor = useCallback((username: string) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    const hash = username.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  }, []);

  // Handle mouse movement
  const handleMouseMove = useCallback((e: MouseEvent) => {
    // Don't track mouse in code editor to avoid conflicts with cursor tracking
    if (isCodeEditorActive) return;

    const x = e.clientX;
    const y = e.clientY;
    
    setLastMousePosition({ x, y });

    if (socket && roomId && username) {
      // Throttle mouse events to avoid spam
      socket.emit(ACTIONS.MOUSE_POINTER_MOVE, {
        roomId,
        username,
        x,
        y,
        timestamp: Date.now()
      });
    }
  }, [socket, roomId, username, isCodeEditorActive]);

  // Set up mouse tracking
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleMousePointerMove = (data: any) => {
      if (data.username === username) return; // Don't show our own pointer

      const color = getUserColor(data.username);
      
      setMousePointers(prev => {
        const newPointers = new Map(prev);
        newPointers.set(data.username, {
          username: data.username,
          x: data.x,
          y: data.y,
          timestamp: data.timestamp,
          color
        });
        return newPointers;
      });

      // Remove pointer after 5 seconds of inactivity
      setTimeout(() => {
        setMousePointers(prev => {
          const newPointers = new Map(prev);
          const pointer = newPointers.get(data.username);
          if (pointer && pointer.timestamp === data.timestamp) {
            newPointers.delete(data.username);
          }
          return newPointers;
        });
      }, 5000);
    };

    socket.on(ACTIONS.MOUSE_POINTER_MOVE, handleMousePointerMove);

    return () => {
      socket.off(ACTIONS.MOUSE_POINTER_MOVE, handleMousePointerMove);
    };
  }, [socket, username, getUserColor]);

  // Clean up old pointers
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setMousePointers(prev => {
        const newPointers = new Map();
        prev.forEach((pointer, username) => {
          if (now - pointer.timestamp < 10000) { // Keep for 10 seconds
            newPointers.set(username, pointer);
          }
        });
        return newPointers;
      });
    }, 2000);

    return () => clearInterval(cleanup);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {Array.from(mousePointers.values()).map((pointer) => (
        <div
          key={pointer.username}
          className="absolute transition-all duration-100 ease-out"
          style={{
            left: pointer.x,
            top: pointer.y,
            transform: 'translate(-2px, -2px)'
          }}
        >
          {/* Mouse pointer icon */}
          <svg
            width="16"
            height="20"
            viewBox="0 0 16 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
          >
            <path
              d="M0 0L0 14L4.5 10L7 15L9 14L6.5 9L11 9L0 0Z"
              fill={pointer.color}
              stroke="white"
              strokeWidth="1"
            />
          </svg>
          
          {/* Username label */}
          <div
            className="absolute top-5 left-3 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap"
            style={{
              backgroundColor: pointer.color,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            {pointer.username}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MousePointerTracker;