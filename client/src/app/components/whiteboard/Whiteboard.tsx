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

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 1200,
      height: 800,
      backgroundColor: '#ffffff',
      selection: selectedTool === 'select'
    });

    fabricCanvasRef.current = canvas;

    // Set up canvas events
    setupCanvasEvents(canvas);

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  // Update canvas selection mode when tool changes
  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.selection = selectedTool === 'select';
      fabricCanvasRef.current.isDrawingMode = selectedTool === 'pen';
      
      if (selectedTool === 'pen' && fabricCanvasRef.current.freeDrawingBrush) {
        fabricCanvasRef.current.freeDrawingBrush.width = strokeWidth;
        fabricCanvasRef.current.freeDrawingBrush.color = strokeColor;
      }
    }
  }, [selectedTool, strokeWidth, strokeColor]);

  const setupCanvasEvents = useCallback((canvas: fabric.Canvas) => {
    // Drawing events
    canvas.on('path:created', (e: any) => {
      if (socket && selectedTool === 'pen') {
        const pathData = e.path?.toObject();
        socket.emit('whiteboard:draw', {
          roomId,
          username,
          type: 'path',
          data: pathData,
          timestamp: Date.now()
        });
      }
      saveToHistory();
    });

    canvas.on('object:added', (e: any) => {
      if (e.target && socket && selectedTool !== 'pen') {
        const objectData = e.target.toObject();
        socket.emit('whiteboard:draw', {
          roomId,
          username,
          type: 'object',
          data: objectData,
          timestamp: Date.now()
        });
      }
    });

    // Mouse events for tracking
    canvas.on('mouse:move', (e: any) => {
      if (socket && isActive) {
        const pointer = canvas.getPointer(e.e);
        socket.emit('mouse:pointer_move', {
          roomId,
          username,
          x: pointer.x,
          y: pointer.y,
          timestamp: Date.now()
        });
      }
    });

    canvas.on('mouse:down', () => setIsDrawing(true));
    canvas.on('mouse:up', () => setIsDrawing(false));

  }, [socket, roomId, username, selectedTool, isActive]);

  const saveToHistory = useCallback(() => {
    if (fabricCanvasRef.current) {
      const canvasState = JSON.stringify(fabricCanvasRef.current.toJSON());
      setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(canvasState);
        return newHistory.slice(-20); // Keep last 20 states
      });
      setHistoryIndex(prev => prev + 1);
    }
  }, [historyIndex]);

  const handleToolChange = (tool: DrawingTool) => {
    setSelectedTool(tool);
    
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      
      // Reset modes
      canvas.isDrawingMode = false;
      canvas.selection = false;
      
      switch (tool) {
        case 'pen':
          canvas.isDrawingMode = true;
          if (canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush.width = strokeWidth;
            canvas.freeDrawingBrush.color = strokeColor;
          }
          break;
        case 'select':
          canvas.selection = true;
          break;
        case 'eraser':
          canvas.isDrawingMode = true;
          if (canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush.width = strokeWidth * 2;
            canvas.freeDrawingBrush.color = '#ffffff'; // Same as background
          }
          break;
      }
    }
  };

  const addShape = (shapeType: 'rectangle' | 'circle') => {
    if (!fabricCanvasRef.current) return;

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
    saveToHistory();
  };

  const addText = () => {
    if (!fabricCanvasRef.current) return;

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
    saveToHistory();
  };

  const handleUndo = () => {
    if (historyIndex > 0 && fabricCanvasRef.current) {
      const prevState = history[historyIndex - 1];
      fabricCanvasRef.current.loadFromJSON(prevState, () => {
        fabricCanvasRef.current?.renderAll();
      });
      setHistoryIndex(prev => prev - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1 && fabricCanvasRef.current) {
      const nextState = history[historyIndex + 1];
      fabricCanvasRef.current.loadFromJSON(nextState, () => {
        fabricCanvasRef.current?.renderAll();
      });
      setHistoryIndex(prev => prev + 1);
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const newZoom = direction === 'in' ? zoom * 1.1 : zoom / 1.1;
    const clampedZoom = Math.max(0.1, Math.min(5, newZoom));
    
    canvas.setZoom(clampedZoom);
    setZoom(clampedZoom);
  };

  const clearCanvas = () => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();
      fabricCanvasRef.current.backgroundColor = '#ffffff';
      
      if (socket) {
        socket.emit('whiteboard:clear', {
          roomId,
          username,
          timestamp: Date.now()
        });
      }
      
      saveToHistory();
    }
  };

  const exportCanvas = (format: 'png' | 'svg' | 'pdf') => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    
    if (format === 'png') {
      const dataURL = canvas.toDataURL({
        multiplier: 1,
        format: 'png' as any
      });
      const link = document.createElement('a');
      link.download = `whiteboard-${roomId}-${Date.now()}.png`;
      link.href = dataURL;
      link.click();
    }
    // TODO: Implement SVG and PDF export
  };

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
            {/* History Controls */}
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="btn btn-sm join-item btn-ghost"
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="btn btn-sm join-item btn-ghost"
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </button>
            
            {/* Zoom Controls */}
            <button
              onClick={() => handleZoom('out')}
              className="btn btn-sm join-item btn-ghost"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            
            <span className="btn btn-sm join-item btn-ghost cursor-default">
              {Math.round(zoom * 100)}%
            </span>
            
            <button
              onClick={() => handleZoom('in')}
              className="btn btn-sm join-item btn-ghost"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            
            {/* Export & Clear */}
            <button
              onClick={() => exportCanvas('png')}
              className="btn btn-sm join-item btn-ghost"
              title="Export PNG"
            >
              <Download className="w-4 h-4" />
            </button>
            
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