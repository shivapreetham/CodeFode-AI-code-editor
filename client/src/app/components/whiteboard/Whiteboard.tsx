import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { 
  Pen, 
  Eraser, 
  Square, 
  Circle, 
  Type, 
  Palette, 
  Undo, 
  Redo, 
  Download, 
  Trash2,
  ZoomIn,
  ZoomOut,
  Move
} from 'lucide-react';
import { ChromePicker } from 'react-color';
import { ACTIONS } from '@/app/helpers/Actions';

interface WhiteboardProps {
  roomId: string;
  username: string;
  socket?: any;
  isActive?: boolean;
}

type DrawingTool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'text' | 'select' | 'pan';

const Whiteboard: React.FC<WhiteboardProps> = ({ 
  roomId, 
  username, 
  socket,
  isActive = false 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [selectedTool, setSelectedTool] = useState<DrawingTool>('pen');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  // Flag to prevent event loops
  const preventBroadcast = useRef(false);

  // Initialize Fabric.js canvas with proper error handling
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    let canvas: fabric.Canvas;

    try {
      // Create canvas with optimized settings
      canvas = new fabric.Canvas(canvasRef.current, {
        width: 1200,
        height: 800,
        backgroundColor: '#ffffff',
        selection: false,
        preserveObjectStacking: true,
        renderOnAddRemove: true,
        skipTargetFind: false,
        allowTouchScrolling: false
      });

      fabricCanvasRef.current = canvas;

      // Basic canvas event handlers
      canvas.on('mouse:down', () => setIsDrawing(true));
      canvas.on('mouse:up', () => setIsDrawing(false));

      // Set initial state
      setIsReady(true);
      setIsLoading(false);

      console.log('✅ Canvas initialized successfully');

      return () => {
        try {
          if (canvas) {
            canvas.dispose();
          }
        } catch (error) {
          console.error('Error disposing canvas:', error);
        }
        fabricCanvasRef.current = null;
      };
    } catch (error) {
      console.error('❌ Canvas initialization failed:', error);
      setIsLoading(false);
    }
  }, []);

  // Handle tool configuration when canvas is ready
  useEffect(() => {
    if (!fabricCanvasRef.current || !isReady) return;

    const canvas = fabricCanvasRef.current;

    try {
      // Configure tool settings
      canvas.selection = selectedTool === 'select';
      canvas.isDrawingMode = selectedTool === 'pen' || selectedTool === 'eraser';

      if (canvas.isDrawingMode && canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = selectedTool === 'eraser' ? strokeWidth * 2 : strokeWidth;
        canvas.freeDrawingBrush.color = selectedTool === 'eraser' ? '#ffffff' : strokeColor;
      }

      canvas.renderAll();
    } catch (error) {
      console.error('Error configuring tool:', error);
    }
  }, [selectedTool, strokeWidth, strokeColor, isReady]);

  // Set up real-time collaboration events
  useEffect(() => {
    if (!fabricCanvasRef.current || !socket || !isReady) return;

    const canvas = fabricCanvasRef.current;

    // Handle path created (drawing)
    const handlePathCreated = (e: fabric.IEvent) => {
      if (preventBroadcast.current) return;

      try {
        const path = e.path;
        if (path && socket) {
          socket.emit(ACTIONS.WHITEBOARD_DRAW, {
            roomId,
            username,
            type: 'path',
            data: path.toObject(),
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error('Error broadcasting path:', error);
      }
    };

    // Handle object added (shapes, text)
    const handleObjectAdded = (e: fabric.IEvent) => {
      if (preventBroadcast.current || !e.target) return;

      try {
        if (socket && selectedTool !== 'pen') {
          socket.emit(ACTIONS.WHITEBOARD_DRAW, {
            roomId,
            username,
            type: 'object',
            data: e.target.toObject(),
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error('Error broadcasting object:', error);
      }
    };

    // Mouse tracking for collaborative cursors
    const handleMouseMove = (e: fabric.IEvent) => {
      if (!socket || !isActive) return;

      try {
        const pointer = canvas.getPointer(e.e as MouseEvent);
        socket.emit(ACTIONS.MOUSE_POINTER_MOVE, {
          roomId,
          username,
          x: pointer.x,
          y: pointer.y,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Error tracking mouse:', error);
      }
    };

    // Attach event listeners
    canvas.on('path:created', handlePathCreated);
    canvas.on('object:added', handleObjectAdded);
    canvas.on('mouse:move', handleMouseMove);

    // Load existing whiteboard data
    if (socket) {
      socket.emit(ACTIONS.WHITEBOARD_LOAD, { roomId });
    }

    return () => {
      // Clean up event listeners
      canvas.off('path:created', handlePathCreated);
      canvas.off('object:added', handleObjectAdded);
      canvas.off('mouse:move', handleMouseMove);
    };
  }, [socket, roomId, username, selectedTool, isActive, isReady]);

  // Handle incoming collaborative events
  useEffect(() => {
    if (!socket || !fabricCanvasRef.current || !isReady) return;

    const canvas = fabricCanvasRef.current;

    const handleRemoteWhiteboardDraw = (data: any) => {
      if (data.username === username) return; // Ignore own events

      try {
        preventBroadcast.current = true;

        if (data.type === 'path') {
          fabric.Path.fromObject(data.data, (path: fabric.Path) => {
            canvas.add(path);
            canvas.renderAll();
            preventBroadcast.current = false;
          });
        } else if (data.type === 'object') {
          fabric.util.enlivenObjects([data.data], (objects: fabric.Object[]) => {
            objects.forEach(obj => canvas.add(obj));
            canvas.renderAll();
            preventBroadcast.current = false;
          });
        } else {
          preventBroadcast.current = false;
        }
      } catch (error) {
        console.error('Error handling remote draw:', error);
        preventBroadcast.current = false;
      }
    };

    const handleRemoteWhiteboardClear = (data: any) => {
      if (data.username === username) return; // Ignore own events

      try {
        preventBroadcast.current = true;
        canvas.clear();
        canvas.backgroundColor = '#ffffff';
        canvas.renderAll();
        preventBroadcast.current = false;
      } catch (error) {
        console.error('Error handling remote clear:', error);
        preventBroadcast.current = false;
      }
    };

    socket.on(ACTIONS.WHITEBOARD_DRAW, handleRemoteWhiteboardDraw);
    socket.on(ACTIONS.WHITEBOARD_CLEAR, handleRemoteWhiteboardClear);

    return () => {
      socket.off(ACTIONS.WHITEBOARD_DRAW, handleRemoteWhiteboardDraw);
      socket.off(ACTIONS.WHITEBOARD_CLEAR, handleRemoteWhiteboardClear);
    };
  }, [socket, username, isReady]);

  // Tool change handler
  const handleToolChange = useCallback((tool: DrawingTool) => {
    setSelectedTool(tool);
  }, []);

  // Add shape
  const addShape = useCallback((shapeType: 'rectangle' | 'circle') => {
    if (!fabricCanvasRef.current) return;

    try {
      const canvas = fabricCanvasRef.current;
      let shape: fabric.Object;

      if (shapeType === 'rectangle') {
        shape = new fabric.Rect({
          left: 100,
          top: 100,
          width: 100,
          height: 80,
          fill: 'transparent',
          stroke: strokeColor,
          strokeWidth: strokeWidth
        });
      } else {
        shape = new fabric.Circle({
          left: 100,
          top: 100,
          radius: 50,
          fill: 'transparent',
          stroke: strokeColor,
          strokeWidth: strokeWidth
        });
      }

      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
    } catch (error) {
      console.error('Error adding shape:', error);
    }
  }, [strokeColor, strokeWidth]);

  // Add text
  const addText = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    try {
      const canvas = fabricCanvasRef.current;
      const text = new fabric.IText('Click to edit', {
        left: 100,
        top: 100,
        fontSize: 20,
        fill: strokeColor,
        fontFamily: 'Arial'
      });

      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
    } catch (error) {
      console.error('Error adding text:', error);
    }
  }, [strokeColor]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    try {
      const canvas = fabricCanvasRef.current;
      
      preventBroadcast.current = true;
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
      preventBroadcast.current = false;

      // Broadcast clear event
      if (socket) {
        socket.emit(ACTIONS.WHITEBOARD_CLEAR, {
          roomId,
          username,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error clearing canvas:', error);
      preventBroadcast.current = false;
    }
  }, [socket, roomId, username]);

  // Export canvas
  const exportCanvas = useCallback((format: 'png' | 'svg') => {
    if (!fabricCanvasRef.current) return;

    try {
      const canvas = fabricCanvasRef.current;
      
      if (format === 'png') {
        const dataURL = canvas.toDataURL({
          multiplier: 2,
          format: 'png',
          quality: 1
        });
        const link = document.createElement('a');
        link.download = `whiteboard-${roomId}-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === 'svg') {
        const svgData = canvas.toSVG();
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `whiteboard-${roomId}-${new Date().toISOString().slice(0, 10)}.svg`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting canvas:', error);
    }
  }, [roomId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-base-100">
        <div className="flex items-center justify-center h-full">
          <div className="loading loading-spinner loading-lg"></div>
          <span className="ml-4 text-lg">Loading whiteboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-base-100">
      {/* Toolbar */}
      <div className="navbar bg-base-200 min-h-16 px-4 border-b border-base-300">
        <div className="navbar-start">
          <div className="join">
            {/* Drawing Tools */}
            <button
              onClick={() => handleToolChange('select')}
              className={`btn btn-sm join-item ${selectedTool === 'select' ? 'btn-primary' : 'btn-ghost'}`}
              title="Select"
            >
              <Move className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => handleToolChange('pen')}
              className={`btn btn-sm join-item ${selectedTool === 'pen' ? 'btn-primary' : 'btn-ghost'}`}
              title="Pen"
            >
              <Pen className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => handleToolChange('eraser')}
              className={`btn btn-sm join-item ${selectedTool === 'eraser' ? 'btn-primary' : 'btn-ghost'}`}
              title="Eraser"
            >
              <Eraser className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => addShape('rectangle')}
              className="btn btn-sm join-item btn-ghost"
              title="Rectangle"
            >
              <Square className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => addShape('circle')}
              className="btn btn-sm join-item btn-ghost"
              title="Circle"
            >
              <Circle className="w-4 h-4" />
            </button>
            
            <button
              onClick={addText}
              className="btn btn-sm join-item btn-ghost"
              title="Text"
            >
              <Type className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="navbar-center">
          <div className="flex items-center gap-4">
            {/* Color Picker */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="btn btn-sm btn-ghost"
                title="Color"
              >
                <Palette className="w-4 h-4" />
                <div 
                  className="w-4 h-4 ml-1 rounded border border-base-300"
                  style={{ backgroundColor: strokeColor }}
                />
              </button>
              
              {showColorPicker && (
                <div className="absolute top-12 left-0 z-50">
                  <div 
                    className="fixed inset-0"
                    onClick={() => setShowColorPicker(false)}
                  />
                  <ChromePicker
                    color={strokeColor}
                    onChange={(color: any) => setStrokeColor(color.hex)}
                  />
                </div>
              )}
            </div>
            
            {/* Brush Size */}
            <div className="flex items-center gap-2">
              <span className="text-sm">Size:</span>
              <input
                type="range"
                min="1"
                max="20"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="range range-primary range-sm w-20"
              />
              <span className="text-sm w-6">{strokeWidth}</span>
            </div>
          </div>
        </div>
        
        <div className="navbar-end">
          <div className="join">
            {/* Export & Clear */}
            <div className="dropdown dropdown-top dropdown-end">
              <button
                tabIndex={0}
                className="btn btn-sm join-item btn-ghost"
                title="Export"
              >
                <Download className="w-4 h-4" />
              </button>
              <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-32">
                <li><a onClick={() => exportCanvas('png')}>PNG</a></li>
                <li><a onClick={() => exportCanvas('svg')}>SVG</a></li>
              </ul>
            </div>
            
            <button
              onClick={clearCanvas}
              className="btn btn-sm join-item btn-error"
              title="Clear All"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Canvas Container */}
      <div className="flex-1 overflow-auto bg-base-100 p-4">
        <div className="relative bg-white border border-base-300 rounded-lg shadow-lg inline-block">
          <canvas
            ref={canvasRef}
            className="block"
          />
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;