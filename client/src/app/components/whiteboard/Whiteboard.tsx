import React, { useState, useRef, useEffect } from 'react';
import { 
  Pen, 
  Eraser, 
  Square, 
  Circle as CircleIcon, 
  Type, 
  Palette, 
  Download, 
  Trash2
} from 'lucide-react';

interface WhiteboardProps {
  roomId: string;
  username: string;
  socket?: any;
  isActive?: boolean;
}

type DrawingTool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'text';

const Whiteboard: React.FC<WhiteboardProps> = ({ 
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
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;
    
    // Fill with white background
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Configure drawing context
    context.lineCap = 'round';
    context.lineJoin = 'round';
  }, [isClient]);

  const startDrawing = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    lastPointRef.current = { x, y };
    setIsDrawing(true);

    if (selectedTool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        const context = canvasRef.current.getContext('2d');
        if (context) {
          context.font = '16px Arial';
          context.fillStyle = strokeColor;
          context.fillText(text, x, y);
        }
      }
      setIsDrawing(false);
    }
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    
    const context = canvasRef.current.getContext('2d');
    if (!context) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (selectedTool === 'pen' || selectedTool === 'eraser') {
      context.strokeStyle = selectedTool === 'eraser' ? 'white' : strokeColor;
      context.lineWidth = selectedTool === 'eraser' ? strokeWidth * 2 : strokeWidth;
      
      context.beginPath();
      context.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      context.lineTo(x, y);
      context.stroke();
      
      lastPointRef.current = { x, y };
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    
    const context = canvasRef.current.getContext('2d');
    if (context) {
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
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

  const predefinedColors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB'
  ];

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
          </div>
        </div>
        
        <div className="navbar-end">
          <div className="join">
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
      <div className="flex-1 overflow-hidden bg-white p-4">
        <canvas
          ref={canvasRef}
          className="border border-base-300 rounded cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>
    </div>
  );
};

export default Whiteboard;