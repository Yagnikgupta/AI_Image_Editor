import React, { useState } from 'react';
import {
  SlidersHorizontal, Sun, Contrast, Droplets, Aperture, Thermometer,
  Sparkles, Lightbulb, EyeOff, Crop, RotateCcw, RotateCw, FlipHorizontal,
  FlipVertical, Maximize, Type, Shapes, Eraser, Brush, Eye, SmilePlus,
  LayoutTemplate, ImageDown, ArrowRight, Circle, Star, ArrowUp, Hash,
  Heart, Minus, Plus, Check, X,
} from 'lucide-react';
import axios from 'axios';

/* ============== Adjustment Sliders ============== */
function AdjustPanel({ adjustments, onAdjustmentChange }) {
  const sliders = [
    { key: 'brightness', label: 'Brightness', icon: Sun, min: -100, max: 100 },
    { key: 'contrast', label: 'Contrast', icon: Contrast, min: -100, max: 100 },
    { key: 'saturation', label: 'Saturation', icon: Droplets, min: -100, max: 100 },
    { key: 'exposure', label: 'Exposure', icon: Aperture, min: -100, max: 100 },
    { key: 'temperature', label: 'Temperature', icon: Thermometer, min: -100, max: 100 },
    { key: 'sharpness', label: 'Sharpness', icon: Sparkles, min: 0, max: 100 },
    { key: 'highlights', label: 'Highlights', icon: Lightbulb, min: -100, max: 100 },
    { key: 'shadows', label: 'Shadows', icon: EyeOff, min: -100, max: 100 },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-xs font-semibold text-dark-200 uppercase tracking-wider">Adjustments</h3>
      {sliders.map(({ key, label, icon: Icon, min, max }) => (
        <div key={key} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-dark-100">
              <Icon className="w-3.5 h-3.5 text-dark-200" />
              {label}
            </div>
            <span className="text-xs text-dark-300 font-mono w-8 text-right">{adjustments[key]}</span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            value={adjustments[key]}
            onChange={(e) => onAdjustmentChange(key, parseInt(e.target.value))}
            className="slider-input"
          />
        </div>
      ))}
    </div>
  );
}

/* ============== Filters Panel ============== */
function FiltersPanel({ activeFilter, onFilterSelect }) {
  const filters = [
    { id: 'vintage', label: 'Vintage', color: 'from-amber-700 to-yellow-900' },
    { id: 'bw', label: 'B&W', color: 'from-gray-500 to-gray-800' },
    { id: 'cinematic', label: 'Cinematic', color: 'from-blue-900 to-slate-800' },
    { id: 'hdr', label: 'HDR', color: 'from-emerald-600 to-teal-800' },
    { id: 'warm', label: 'Warm', color: 'from-orange-500 to-red-700' },
    { id: 'cool', label: 'Cool', color: 'from-cyan-500 to-blue-700' },
    { id: 'sepia', label: 'Sepia', color: 'from-yellow-700 to-orange-900' },
    { id: 'bright', label: 'Bright', color: 'from-yellow-300 to-amber-500' },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-xs font-semibold text-dark-200 uppercase tracking-wider">Filters</h3>
      <div className="grid grid-cols-2 gap-2">
        {filters.map(({ id, label, color }) => (
          <button
            key={id}
            onClick={() => onFilterSelect(id)}
            className={`relative h-20 rounded-xl bg-gradient-to-br ${color} flex items-end p-2 transition-all duration-200 group overflow-hidden ${
              activeFilter === id
                ? 'ring-2 ring-primary-400 scale-[1.03]'
                : 'hover:scale-[1.03] opacity-80 hover:opacity-100'
            }`}
          >
            <span className="text-xs font-medium text-white/90 drop-shadow">{label}</span>
            {activeFilter === id && (
              <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
      {activeFilter && (
        <button
          onClick={() => onFilterSelect(null)}
          className="w-full btn-ghost text-xs justify-center border border-dark-500/30"
        >
          <X className="w-3 h-3" /> Clear Filter
        </button>
      )}
    </div>
  );
}

/* ============== Crop Panel ============== */
function CropPanel({ cropRatio, onCropRatioChange, onCropApply }) {
  const ratios = [
    { id: 'free', label: 'Free', value: null },
    { id: '1:1', label: '1:1', value: 1 },
    { id: '16:9', label: '16:9', value: 16 / 9 },
    { id: '4:3', label: '4:3', value: 4 / 3 },
    { id: '9:16', label: '9:16', value: 9 / 16 },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-xs font-semibold text-dark-200 uppercase tracking-wider">Crop</h3>
      <div className="grid grid-cols-3 gap-2">
        {ratios.map(({ id, label, value }) => (
          <button
            key={id}
            onClick={() => onCropRatioChange(value)}
            className={`py-2.5 rounded-lg text-xs font-medium transition-all ${
              cropRatio === value
                ? 'bg-primary-600 text-white'
                : 'bg-dark-600 text-dark-200 hover:bg-dark-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <button onClick={onCropApply} className="w-full btn-primary text-xs">
        <Check className="w-3.5 h-3.5" />
        Apply Crop
      </button>
    </div>
  );
}

/* ============== Transform Panel ============== */
function TransformPanel({ canvasRef }) {
  const handleRotate = (angle) => {
    const c = canvasRef?.current;
    if (!c) return;
    const objects = c.getObjects();
    objects.forEach(obj => {
      obj.rotate((obj.angle || 0) + angle);
      obj.setCoords();
    });
    c.renderAll();
  };

  const handleFlip = (axis) => {
    const c = canvasRef?.current;
    if (!c) return;
    const objects = c.getObjects();
    objects.forEach(obj => {
      if (axis === 'x') obj.set('flipX', !obj.flipX);
      else obj.set('flipY', !obj.flipY);
      obj.setCoords();
    });
    c.renderAll();
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-xs font-semibold text-dark-200 uppercase tracking-wider">Transform</h3>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => handleRotate(90)} className="btn-ghost border border-dark-500/30 text-xs">
          <RotateCw className="w-4 h-4" /> Rotate 90°
        </button>
        <button onClick={() => handleRotate(-90)} className="btn-ghost border border-dark-500/30 text-xs">
          <RotateCcw className="w-4 h-4" /> Rotate -90°
        </button>
        <button onClick={() => handleFlip('x')} className="btn-ghost border border-dark-500/30 text-xs">
          <FlipHorizontal className="w-4 h-4" /> Flip H
        </button>
        <button onClick={() => handleFlip('y')} className="btn-ghost border border-dark-500/30 text-xs">
          <FlipVertical className="w-4 h-4" /> Flip V
        </button>
      </div>
    </div>
  );
}

/* ============== Background Removal Panel ============== */
function BackgroundPanel({ imageSrc, onStateChange, onImageChange, canvasRef }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRemoveBg = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      
      // Extract original MIME type if possible, default to png
      let mimeType = 'image/png';
      let ext = 'png';
      if (imageSrc.startsWith('data:image/')) {
        mimeType = imageSrc.split(';')[0].split(':')[1];
        ext = mimeType.split('/')[1] || 'png';
      }
      
      const formData = new FormData();
      formData.append('image', blob, `image.${ext}`);
      const response = await axios.post('/api/remove-bg', formData, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      if (onStateChange) {
         onStateChange({ imageSrc: url });
      } else {
         onImageChange(url);
      }
    } catch (err) {
      setError('Failed to remove background. Check your API key.');
    } finally {
      setLoading(false);
    }
  };

  const bgColors = [
    '#ffffff', '#000000', '#ef4444', '#3b82f6', '#22c55e', '#eab308',
    '#a855f7', '#ec4899', '#14b8a6', '#f97316',
  ];

  const applyBgColor = async (color) => {
    const c = canvasRef?.current;
    if (!c) return;
    
    const objects = c.getObjects();
    const mainImg = objects.find(obj => obj.type === 'image' || obj.type === 'FabricImage' || obj._element);
    
    if (!mainImg) {
      c.backgroundColor = color;
      c.renderAll();
      return;
    }

    let bgRect = objects.find(obj => obj.name === 'imageBackground');
    
    if (!bgRect) {
      const fabric = await import('fabric');
      const Rect = fabric.Rect || fabric.FabricRect;
      bgRect = new Rect({
        fill: color,
        selectable: false,
        evented: false,
        name: 'imageBackground',
      });
      c.add(bgRect);
    } else {
      bgRect.set('fill', color);
    }

    // Match image properties
    bgRect.set({
      left: mainImg.left,
      top: mainImg.top,
      width: mainImg.width,
      height: mainImg.height,
      scaleX: mainImg.scaleX,
      scaleY: mainImg.scaleY,
      angle: mainImg.angle,
      flipX: mainImg.flipX,
      flipY: mainImg.flipY,
      originX: mainImg.originX,
      originY: mainImg.originY,
    });

    // Send it to the absolute bottom
    c.sendObjectToBack(bgRect);
    
    c.renderAll();
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-xs font-semibold text-dark-200 uppercase tracking-wider">Background</h3>
      <button
        onClick={handleRemoveBg}
        disabled={loading}
        className="w-full btn-primary text-xs"
      >
        {loading ? (
          <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
        ) : (
          <Eraser className="w-4 h-4" />
        )}
        {loading ? 'Removing...' : 'Remove Background'}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div>
        <p className="text-xs text-dark-300 mb-2">Replace with color:</p>
        <div className="flex flex-wrap gap-2">
          {bgColors.map((color) => (
            <button
              key={color}
              onClick={() => applyBgColor(color)}
              className="w-7 h-7 rounded-lg border-2 border-dark-500/30 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============== Text Panel ============== */
function TextPanel({ canvasRef }) {
  const [text, setText] = useState('Your Text');
  const [fontSize, setFontSize] = useState(36);
  const [fontColor, setFontColor] = useState('#ffffff');

  const addText = async () => {
    const c = canvasRef?.current;
    if (!c) return;
    try {
      const fabric = await import('fabric');
      const FText = fabric.FabricText || fabric.Text || fabric.Textbox;
      const textObj = new FText(text, {
        left: 100,
        top: 100,
        fontSize,
        fill: fontColor,
        fontFamily: 'Inter',
      });
      c.add(textObj);
      c.setActiveObject(textObj);
      c.renderAll();
    } catch (err) {
      console.error('Add text error:', err);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-xs font-semibold text-dark-200 uppercase tracking-wider">Add Text</h3>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full bg-dark-600 border border-dark-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-dark-300 focus:ring-1 focus:ring-primary-500 outline-none"
        placeholder="Enter text..."
      />
      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <label className="text-xs text-dark-300">Size</label>
          <input
            type="number"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            className="w-full bg-dark-600 border border-dark-500/30 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-dark-300">Color</label>
          <input
            type="color"
            value={fontColor}
            onChange={(e) => setFontColor(e.target.value)}
            className="w-10 h-9 rounded-lg cursor-pointer border border-dark-500/30"
          />
        </div>
      </div>
      <button onClick={addText} className="w-full btn-primary text-xs">
        <Type className="w-4 h-4" /> Add Text
      </button>
    </div>
  );
}

/* ============== Shapes Panel ============== */
function ShapesPanel({ canvasRef }) {
  const addShape = async (type) => {
    const c = canvasRef?.current;
    if (!c) return;
    try {
      const fabric = await import('fabric');
      let obj;
      switch (type) {
        case 'rect':
          obj = new fabric.Rect({ left: 100, top: 100, width: 120, height: 80, fill: 'rgba(92,124,250,0.5)', rx: 8, ry: 8 });
          break;
        case 'circle':
          obj = new fabric.Circle({ left: 100, top: 100, radius: 50, fill: 'rgba(168,85,247,0.5)' });
          break;
        case 'triangle':
          obj = new fabric.Triangle({ left: 100, top: 100, width: 100, height: 100, fill: 'rgba(34,197,94,0.5)' });
          break;
        case 'line':
          obj = new fabric.Line([50, 50, 200, 50], { stroke: '#fff', strokeWidth: 3 });
          break;
        default:
          return;
      }
      c.add(obj);
      c.setActiveObject(obj);
      c.renderAll();
    } catch (err) {
      console.error('Add shape error:', err);
    }
  };

  const removeSelected = () => {
    const c = canvasRef?.current;
    if (!c) return;
    const activeObjects = c.getActiveObjects();
    if (activeObjects.length) {
      c.discardActiveObject();
      activeObjects.forEach((object) => {
        if (object.name !== 'imageBackground' && object.type !== 'image' && object.type !== 'FabricImage') {
          c.remove(object);
        }
      });
      c.renderAll();
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-xs font-semibold text-dark-200 uppercase tracking-wider">Shapes</h3>
      <div className="grid grid-cols-2 gap-2">
        {[
          { type: 'rect', label: 'Rectangle', icon: Maximize },
          { type: 'circle', label: 'Circle', icon: Circle },
          { type: 'triangle', label: 'Triangle', icon: ArrowUp },
          { type: 'line', label: 'Line', icon: Minus },
        ].map(({ type, label, icon: Icon }) => (
          <button key={type} onClick={() => addShape(type)} className="btn-ghost border border-dark-500/30 text-xs">
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>
      <button onClick={removeSelected} className="w-full mt-2 btn-ghost border border-red-500/30 text-xs text-red-400 hover:bg-red-500/10">
        <X className="w-4 h-4" /> Delete Selected
      </button>
    </div>
  );
}

/* ============== Stickers Panel ============== */
function StickersPanel({ canvasRef }) {
  const stickers = ['⭐', '❤️', '🔥', '✨', '🎯', '🎨', '👍', '👏', '🚀', '💡', '🌈', '🎵', '➡️', '⬆️', '⬇️', '⬅️'];

  const addSticker = async (emoji) => {
    const c = canvasRef?.current;
    if (!c) return;
    try {
      const fabric = await import('fabric');
      const FText = fabric.FabricText || fabric.Text;
      const text = new FText(emoji, { left: 100, top: 100, fontSize: 60 });
      c.add(text);
      c.setActiveObject(text);
      c.renderAll();
    } catch (err) {
      console.error('Add sticker error:', err);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-xs font-semibold text-dark-200 uppercase tracking-wider">Stickers & Emojis</h3>
      <div className="grid grid-cols-4 gap-2">
        {stickers.map((s, i) => (
          <button key={i} onClick={() => addSticker(s)} className="h-12 bg-dark-600 hover:bg-dark-500 rounded-lg flex items-center justify-center text-2xl transition-all hover:scale-110">
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============== Templates Panel ============== */
function TemplatesPanel({ onCropRatioChange }) {
  const templates = [
    { label: 'Instagram Post', w: 1080, h: 1080, icon: Hash },
    { label: 'Instagram Story', w: 1080, h: 1920, icon: Hash },
    { label: 'YouTube Thumbnail', w: 1280, h: 720, icon: ImageDown },
    { label: 'Poster', w: 1080, h: 1440, icon: Maximize },
    { label: 'Profile Pic', w: 400, h: 400, icon: Circle },
    { label: 'Twitter Post', w: 1200, h: 675, icon: ArrowRight },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-xs font-semibold text-dark-200 uppercase tracking-wider">Templates</h3>
      <div className="space-y-2">
        {templates.map(({ label, w, h, icon: Icon }) => (
          <button key={label} onClick={() => onCropRatioChange(w / h)} className="w-full flex items-center gap-3 p-3 bg-dark-600 hover:bg-dark-500 rounded-xl transition-all text-left group">
            <div className="w-10 h-10 bg-dark-500 group-hover:bg-primary-700/20 rounded-lg flex items-center justify-center transition-colors">
              <Icon className="w-4 h-4 text-dark-200 group-hover:text-primary-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-dark-50">{label}</p>
              <p className="text-xs text-dark-300">{w} × {h}px</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============== Main Right Panel ============== */
export default function RightPanel({
  activeTool,
  adjustments,
  onAdjustmentChange,
  activeFilter,
  onFilterSelect,
  cropRatio,
  onCropRatioChange,
  onCropApply,
  imageSrc,
  onImageChange,
  onStateChange,
  canvasRef,
}) {
  const panels = {
    adjust: <AdjustPanel adjustments={adjustments} onAdjustmentChange={onAdjustmentChange} />,
    filters: <FiltersPanel activeFilter={activeFilter} onFilterSelect={onFilterSelect} />,
    crop: <CropPanel cropRatio={cropRatio} onCropRatioChange={onCropRatioChange} onCropApply={onCropApply} />,
    transform: <TransformPanel canvasRef={canvasRef} />,
    background: <BackgroundPanel imageSrc={imageSrc} onImageChange={onImageChange} onStateChange={onStateChange} canvasRef={canvasRef} />,
    text: <TextPanel canvasRef={canvasRef} />,
    shapes: <ShapesPanel canvasRef={canvasRef} />,
    stickers: <StickersPanel canvasRef={canvasRef} />,
    templates: <TemplatesPanel onCropRatioChange={onCropRatioChange} />,
  };

  return (
    <div className="w-[280px] bg-dark-700/60 backdrop-blur-lg border-l border-dark-500/20 overflow-y-auto">
      <div className="p-4">
        {panels[activeTool] || (
          <p className="text-xs text-dark-300 text-center mt-8">Select a tool from the sidebar</p>
        )}
      </div>
    </div>
  );
}
