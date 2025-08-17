import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getStroke } from 'perfect-freehand';
import axios from 'axios';
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

interface UserCursor {
  username: string;
  x: number;
  y: number;
  isDrawing: boolean;
  color: string;
  lastUpdate: number;
}

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
  const [userCursors, setUserCursors] = useState<Map<string, UserCursor>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
    loadWhiteboard();
  }, []);

  // Backend integration functions
  const loadWhiteboard = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/whiteboard/${roomId}`);
      if (response.data.success && response.data.data.canvasData) {
        const { paths, shapes } = response.data.data.canvasData;
        if (paths) setPaths(paths);
        if (shapes) setShapes(shapes);
      }
    } catch (error) {
      console.error('Failed to load whiteboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveWhiteboard = async () => {
    try {
      const canvasData = {
        paths,
        shapes,
        background: '#ffffff'
      };
      
      await axios.post(`/api/whiteboard/${roomId}`, {
        canvasData,
        username,
        metadata: {
          width: canvasRef.current?.width || 800,
          height: canvasRef.current?.height || 600
        }
      });
      
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save whiteboard:', error);
    }
  };

  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveWhiteboard();
    }, 2000); // Save after 2 seconds of inactivity
  }, [paths, shapes, roomId, username]);

  // Auto-save functionality
  useEffect(() => {
    if (paths.length > 0 || shapes.length > 0) {
      debouncedSave();
    }
  }, [paths, shapes, debouncedSave]);

  // Cursor tracking
  const sendCursorUpdate = useCallback((x: number, y: number, isDrawing: boolean) => {
    if (socket) {
      socket.emit('cursor-update', {
        roomId,
        username,
        x,
        y,
        isDrawing,
        color: strokeColor,
        timestamp: Date.now()
      });
    }
  }, [socket, roomId, username, strokeColor]);

  const drawUserCursor = useCallback((ctx: CanvasRenderingContext2D, cursor: UserCursor) => {
    ctx.save();
    
    // Draw cursor circle
    ctx.beginPath();
    ctx.arc(cursor.x, cursor.y, cursor.isDrawing ? 8 : 5, 0, 2 * Math.PI);
    ctx.fillStyle = cursor.color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw username label
    ctx.font = '12px Arial';
    ctx.fillStyle = '#333333';
    ctx.fillRect(cursor.x + 10, cursor.y - 20, ctx.measureText(cursor.username).width + 8, 16);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(cursor.username, cursor.x + 14, cursor.y - 8);
    
    ctx.restore();
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

    // Draw user cursors (after restore so they're not affected by zoom/pan)
    userCursors.forEach((cursor) => {
      if (cursor.username !== username && Date.now() - cursor.lastUpdate < 10000) { // Show cursors for 10 seconds
        const screenX = cursor.x * zoom + pan.x;
        const screenY = cursor.y * zoom + pan.y;
        drawUserCursor(ctx, { ...cursor, x: screenX, y: screenY });
      }
    });
  }, [zoom, pan, paths, shapes, currentPath, strokeColor, strokeWidth, selectedTool, tempShape, drawPath, drawShape, userCursors, username, drawUserCursor]);

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
    sendCursorUpdate(point.x, point.y, true);

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
    if (!canvasRef.current) return;

    const point = getPointFromEvent(e);
    sendCursorUpdate(point.x, point.y, isDrawing);

    if (!isDrawing) return;

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
    
    sendCursorUpdate(0, 0, false);

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

  const exportCanvas = (format: 'png' | 'jpg' | 'svg' | 'json' = 'png') => {
    if (!canvasRef.current) return;

    switch (format) {
      case 'png':
      case 'jpg':
        const dataURL = canvasRef.current.toDataURL(`image/${format}`);
        const link = document.createElement('a');
        link.download = `whiteboard-${roomId}-${Date.now()}.${format}`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;

      case 'svg':
        exportAsSVG();
        break;

      case 'json':
        exportAsJSON();
        break;

      default:
        exportCanvas('png');
    }
  };

  const exportAsSVG = () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const canvas = canvasRef.current;
    if (!canvas) return;

    svg.setAttribute('width', canvas.width.toString());
    svg.setAttribute('height', canvas.height.toString());
    svg.setAttribute('viewBox', `0 0 ${canvas.width} ${canvas.height}`);

    // Add white background
    const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    background.setAttribute('width', '100%');
    background.setAttribute('height', '100%');
    background.setAttribute('fill', 'white');
    svg.appendChild(background);

    // Convert paths to SVG paths
    paths.forEach(path => {
      if (path.points.length < 2) return;
      
      const stroke = getStroke(path.points, {
        size: path.size,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
      });

      if (stroke.length > 0) {
        const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let d = `M ${stroke[0][0]} ${stroke[0][1]}`;
        for (let i = 1; i < stroke.length; i++) {
          d += ` L ${stroke[i][0]} ${stroke[i][1]}`;
        }
        d += ' Z';
        
        pathElement.setAttribute('d', d);
        pathElement.setAttribute('fill', path.tool === 'eraser' ? 'white' : path.color);
        pathElement.setAttribute('stroke', 'none');
        svg.appendChild(pathElement);
      }
    });

    // Convert shapes to SVG elements
    shapes.forEach(shape => {
      let element;
      
      switch (shape.type) {
        case 'rectangle':
          element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          element.setAttribute('x', shape.x.toString());
          element.setAttribute('y', shape.y.toString());
          element.setAttribute('width', (shape.width || 0).toString());
          element.setAttribute('height', (shape.height || 0).toString());
          break;

        case 'circle':
          element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          element.setAttribute('cx', shape.x.toString());
          element.setAttribute('cy', shape.y.toString());
          element.setAttribute('r', (shape.radius || 0).toString());
          break;

        case 'text':
          element = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          element.setAttribute('x', shape.x.toString());
          element.setAttribute('y', shape.y.toString());
          element.setAttribute('font-family', 'Arial');
          element.setAttribute('font-size', (shape.strokeWidth * 8).toString());
          element.textContent = shape.text || '';
          break;
      }

      if (element) {
        if (shape.type !== 'text') {
          element.setAttribute('fill', 'none');
          element.setAttribute('stroke', shape.color);
          element.setAttribute('stroke-width', shape.strokeWidth.toString());
        } else {
          element.setAttribute('fill', shape.color);
        }
        svg.appendChild(element);
      }
    });

    // Download SVG
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const link = document.createElement('a');
    link.download = `whiteboard-${roomId}-${Date.now()}.svg`;
    link.href = svgUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(svgUrl);
  };

  const exportAsJSON = () => {
    const data = {
      roomId,
      exported: new Date().toISOString(),
      exportedBy: username,
      canvasData: {
        paths,
        shapes,
        background: '#ffffff'
      },
      metadata: {
        width: canvasRef.current?.width || 800,
        height: canvasRef.current?.height || 600,
        zoom,
        pan
      }
    };

    const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    
    const link = document.createElement('a');
    link.download = `whiteboard-${roomId}-${Date.now()}.json`;
    link.href = jsonUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(jsonUrl);
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

    const handleCursorUpdate = (data: { username: string; x: number; y: number; isDrawing: boolean; color: string; timestamp: number }) => {
      if (data.username !== username) {
        setUserCursors(prev => {
          const newCursors = new Map(prev);
          newCursors.set(data.username, {
            username: data.username,
            x: data.x,
            y: data.y,
            isDrawing: data.isDrawing,
            color: data.color,
            lastUpdate: data.timestamp
          });
          return newCursors;
        });
      }
    };

    const handleWhiteboardLoad = (data: { canvasData: { paths: DrawingPath[]; shapes: Shape[] } }) => {
      if (data.canvasData) {
        if (data.canvasData.paths) setPaths(data.canvasData.paths);
        if (data.canvasData.shapes) setShapes(data.canvasData.shapes);
      }
    };

    socket.on('whiteboard-path', handleRemotePath);
    socket.on('whiteboard-shape', handleRemoteShape);
    socket.on('whiteboard-clear', handleRemoteClear);
    socket.on('cursor-update', handleCursorUpdate);
    socket.on('whiteboard-load', handleWhiteboardLoad);

    return () => {
      socket.off('whiteboard-path', handleRemotePath);
      socket.off('whiteboard-shape', handleRemoteShape);
      socket.off('whiteboard-clear', handleRemoteClear);
      socket.off('cursor-update', handleCursorUpdate);
      socket.off('whiteboard-load', handleWhiteboardLoad);
    };
  }, [socket, username]);

  // Clean up old cursors
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setUserCursors(prev => {
        const newCursors = new Map();
        prev.forEach((cursor, username) => {
          if (now - cursor.lastUpdate < 10000) { // Keep cursors for 10 seconds
            newCursors.set(username, cursor);
          }
        });
        return newCursors;
      });
    }, 5000); // Clean up every 5 seconds

    return () => clearInterval(cleanupInterval);
  }, []);

  if (!isClient || isLoading) {
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
          {/* Save Status */}
          <div className="flex items-center mr-4">
            {lastSaved && (
              <span className="text-xs text-gray-500">
                Saved {new Date(lastSaved).toLocaleTimeString()}
              </span>
            )}
            {userCursors.size > 0 && (
              <span className="text-xs text-blue-500 ml-2">
                {userCursors.size} user{userCursors.size > 1 ? 's' : ''} online
              </span>
            )}
          </div>
          
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

            {/* Export Dropdown */}
            <div className="dropdown dropdown-top dropdown-end">
              <button
                tabIndex={0}
                className="btn btn-sm join-item btn-ghost"
                title="Export"
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                <Download className="w-4 h-4" />
              </button>
              {showExportMenu && (
                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-32">
                  <li>
                    <button onClick={() => { exportCanvas('png'); setShowExportMenu(false); }}>
                      PNG Image
                    </button>
                  </li>
                  <li>
                    <button onClick={() => { exportCanvas('jpg'); setShowExportMenu(false); }}>
                      JPG Image
                    </button>
                  </li>
                  <li>
                    <button onClick={() => { exportCanvas('svg'); setShowExportMenu(false); }}>
                      SVG Vector
                    </button>
                  </li>
                  <li>
                    <button onClick={() => { exportCanvas('json'); setShowExportMenu(false); }}>
                      JSON Data
                    </button>
                  </li>
                </ul>
              )}
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