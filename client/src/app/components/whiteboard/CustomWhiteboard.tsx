import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getStroke } from 'perfect-freehand';
import {
  Pen,
  Eraser,
  Square,
  Circle as CircleIcon,
  Type,
  Palette,
  Download,
  Trash2,
  Move,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';

interface Point {
  x: number;
  y: number;
  pressure?: number;
}

interface DrawingPath {
  id: string;
  points: Point[];
  color: string;
  size: number;
  tool: DrawingTool;
  timestamp: number;
}

interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  color: string;
  strokeWidth: number;
  timestamp: number;
}

type DrawingTool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'text' | 'select';

interface WhiteboardProps {
  roomId: string;
  username: string;
  socket?: any;
  isActive?: boolean;
}

const CustomWhiteboard: React.FC<WhiteboardProps> = ({
  roomId,
  username,
  socket,
  isActive = false
}) => {
  const [isClient, setIsClient] = useState(false);
  const [selectedTool, setSelectedTool] = useState<DrawingTool>('pen');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [history, setHistory] = useState<{ paths: DrawingPath[]; shapes: Shape[] }[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [tempShape, setTempShape] = useState<Shape | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push({ paths: [...paths], shapes: [...shapes] });
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  }, [history, historyStep, paths, shapes]);

  const drawPath = useCallback((ctx: CanvasRenderingContext2D, path: DrawingPath) => {
    if (path.points.length < 2) return;

    const stroke = getStroke(path.points, {
      size: path.size,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
    });

    if (stroke.length === 0) return;

    ctx.save();
    ctx.fillStyle = path.tool === 'eraser' ? '#ffffff' : path.color;
    ctx.globalCompositeOperation = path.tool === 'eraser' ? 'destination-out' : 'source-over';

    ctx.beginPath();
    ctx.moveTo(stroke[0][0], stroke[0][1]);

    for (let i = 1; i < stroke.length; i++) {
      ctx.lineTo(stroke[i][0], stroke[i][1]);
    }

    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, []);

  const drawShape = useCallback((ctx: CanvasRenderingContext2D, shape: Shape) => {
    ctx.save();
    ctx.strokeStyle = shape.color;
    ctx.lineWidth = shape.strokeWidth;

    switch (shape.type) {
      case 'rectangle':
        if (shape.width && shape.height) {
          ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        }
        break;
      case 'circle':
        if (shape.radius) {
          ctx.beginPath();
          ctx.arc(shape.x, shape.y, shape.radius, 0, 2 * Math.PI);
          ctx.stroke();
        }
        break;
      case 'text':
        if (shape.text) {
          ctx.font = `${shape.strokeWidth * 8}px Arial`;
          ctx.fillStyle = shape.color;
          ctx.fillText(shape.text, shape.x, shape.y);
        }
        break;
    }

    ctx.restore();
  }, []);

  const redraw = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(pan.x, pan.y);

    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-pan.x / zoom, -pan.y / zoom, canvas.width / zoom, canvas.height / zoom);

    // Draw all paths
    paths.forEach(path => drawPath(ctx, path));

    // Draw all shapes
    shapes.forEach(shape => drawShape(ctx, shape));

    // Draw temporary shape while drawing
    if (tempShape) {
      drawShape(ctx, tempShape);
    }

    // Draw current path while drawing
    if (currentPath.length > 0) {
      const tempPath: DrawingPath = {
        id: 'temp',
        points: currentPath,
        color: strokeColor,
        size: strokeWidth,
        tool: selectedTool,
        timestamp: Date.now()
      };
      drawPath(ctx, tempPath);
    }

    ctx.restore();
  }, [zoom, pan, paths, shapes, currentPath, strokeColor, strokeWidth, selectedTool, tempShape, drawPath, drawShape]);

  useEffect(() => {
    if (!isClient || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      redraw();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isClient, redraw]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const getPointFromEvent = (e: React.MouseEvent): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 };

    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom,
      pressure: 0.5
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const point = getPointFromEvent(e);

    if (selectedTool === 'select') {
      setDragStart(point);
      return;
    }

    if (selectedTool === 'pen' || selectedTool === 'eraser') {
      setIsDrawing(true);
      setCurrentPath([point]);
      saveToHistory();
    } else if (selectedTool === 'rectangle' || selectedTool === 'circle') {
      setIsDrawing(true);
      setDragStart(point);
      saveToHistory();
    } else if (selectedTool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        const newShape: Shape = {
          id: `shape-${Date.now()}`,
          type: 'text',
          x: point.x,
          y: point.y,
          text,
          color: strokeColor,
          strokeWidth: strokeWidth,
          timestamp: Date.now()
        };
        setShapes(prev => [...prev, newShape]);
        saveToHistory();

        if (socket) {
          socket.emit('whiteboard-shape', { roomId, shape: newShape, username });
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !canvasRef.current) return;

    const point = getPointFromEvent(e);

    if (selectedTool === 'pen' || selectedTool === 'eraser') {
      setCurrentPath(prev => [...prev, point]);
    } else if ((selectedTool === 'rectangle' || selectedTool === 'circle') && dragStart) {
      if (selectedTool === 'rectangle') {
        setTempShape({
          id: 'temp',
          type: 'rectangle',
          x: Math.min(dragStart.x, point.x),
          y: Math.min(dragStart.y, point.y),
          width: Math.abs(point.x - dragStart.x),
          height: Math.abs(point.y - dragStart.y),
          color: strokeColor,
          strokeWidth: strokeWidth,
          timestamp: Date.now()
        });
      } else if (selectedTool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(point.x - dragStart.x, 2) + Math.pow(point.y - dragStart.y, 2)
        );
        setTempShape({
          id: 'temp',
          type: 'circle',
          x: dragStart.x,
          y: dragStart.y,
          radius,
          color: strokeColor,
          strokeWidth: strokeWidth,
          timestamp: Date.now()
        });
      }
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;

    if (selectedTool === 'pen' || selectedTool === 'eraser') {
      if (currentPath.length > 0) {
        const newPath: DrawingPath = {
          id: `path-${Date.now()}`,
          points: [...currentPath],
          color: strokeColor,
          size: strokeWidth,
          tool: selectedTool,
          timestamp: Date.now()
        };
        setPaths(prev => [...prev, newPath]);
        setCurrentPath([]);

        if (socket) {
          socket.emit('whiteboard-path', { roomId, path: newPath, username });
        }
      }
    } else if ((selectedTool === 'rectangle' || selectedTool === 'circle') && tempShape) {
      const newShape: Shape = { ...tempShape, id: `shape-${Date.now()}` };
      setShapes(prev => [...prev, newShape]);
      setTempShape(null);

      if (socket) {
        socket.emit('whiteboard-shape', { roomId, shape: newShape, username });
      }
    }

    setIsDrawing(false);
    setDragStart(null);
  };

  const undo = () => {
    if (historyStep > 0) {
      const prevState = history[historyStep - 1];
      setPaths(prevState.paths);
      setShapes(prevState.shapes);
      setHistoryStep(historyStep - 1);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const nextState = history[historyStep + 1];
      setPaths(nextState.paths);
      setShapes(nextState.shapes);
      setHistoryStep(historyStep + 1);
    }
  };

  const clearCanvas = () => {
    setPaths([]);
    setShapes([]);
    saveToHistory();

    if (socket) {
      socket.emit('whiteboard-clear', { roomId, username });
    }
  };

  const exportCanvas = () => {
    if (!canvasRef.current) return;

    const dataURL = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `whiteboard-${roomId}-${Date.now()}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const predefinedColors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB'
  ];

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleRemotePath = (data: { path: DrawingPath; username: string }) => {
      if (data.username !== username) {
        setPaths(prev => [...prev, data.path]);
      }
    };

    const handleRemoteShape = (data: { shape: Shape; username: string }) => {
      if (data.username !== username) {
        setShapes(prev => [...prev, data.shape]);
      }
    };

    const handleRemoteClear = (data: { username: string }) => {
      if (data.username !== username) {
        setPaths([]);
        setShapes([]);
      }
    };

    socket.on('whiteboard-path', handleRemotePath);
    socket.on('whiteboard-shape', handleRemoteShape);
    socket.on('whiteboard-clear', handleRemoteClear);

    return () => {
      socket.off('whiteboard-path', handleRemotePath);
      socket.off('whiteboard-shape', handleRemoteShape);
      socket.off('whiteboard-clear', handleRemoteClear);
    };
  }, [socket, username]);

  if (!isClient) {
    return (
      <div className="flex flex-col h-full bg-base-100">
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <div className="loading loading-spinner loading-lg"></div>
            <span className="text-lg">Loading whiteboard...</span>
          </div>
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
            <button
              onClick={() => setSelectedTool('select')}
              className={`btn btn-sm join-item ${selectedTool === 'select' ? 'btn-primary' : 'btn-ghost'}`}
              title="Select"
            >
              <Move className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSelectedTool('pen')}
              className={`btn btn-sm join-item ${selectedTool === 'pen' ? 'btn-primary' : 'btn-ghost'}`}
              title="Pen"
            >
              <Pen className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSelectedTool('eraser')}
              className={`btn btn-sm join-item ${selectedTool === 'eraser' ? 'btn-primary' : 'btn-ghost'}`}
              title="Eraser"
            >
              <Eraser className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSelectedTool('rectangle')}
              className={`btn btn-sm join-item ${selectedTool === 'rectangle' ? 'btn-primary' : 'btn-ghost'}`}
              title="Rectangle"
            >
              <Square className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSelectedTool('circle')}
              className={`btn btn-sm join-item ${selectedTool === 'circle' ? 'btn-primary' : 'btn-ghost'}`}
              title="Circle"
            >
              <CircleIcon className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSelectedTool('text')}
              className={`btn btn-sm join-item ${selectedTool === 'text' ? 'btn-primary' : 'btn-ghost'}`}
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
                <div className="absolute top-12 left-0 z-50 bg-base-100 p-2 rounded-lg shadow-lg border border-base-300">
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {predefinedColors.map(color => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded border-2 ${strokeColor === color ? 'border-primary' : 'border-base-300'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          setStrokeColor(color);
                          setShowColorPicker(false);
                        }}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="w-full h-8 rounded border border-base-300"
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

            {/* Zoom Controls */}
            <div className="join">
              <button
                onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
                className="btn btn-sm join-item btn-ghost"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={resetView}
                className="btn btn-sm join-item btn-ghost"
                title="Reset View"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                className="btn btn-sm join-item btn-ghost"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="navbar-end">
          <div className="join">
            <button
              onClick={undo}
              disabled={historyStep <= 0}
              className="btn btn-sm join-item btn-ghost"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>

            <button
              onClick={redo}
              disabled={historyStep >= history.length - 1}
              className="btn btn-sm join-item btn-ghost"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>

            <button
              onClick={exportCanvas}
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
      <div ref={containerRef} className="flex-1 overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
};

export default CustomWhiteboard;