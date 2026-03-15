import React from 'react';
import {
  SlidersHorizontal, Palette, Crop, Eraser, Type, Shapes,
  RotateCw, FlipHorizontal, FlipVertical, ImagePlus, Move,
  Maximize, Wand2, Brush, Eye, SmilePlus, LayoutTemplate,
} from 'lucide-react';

const TOOLS = [
  { id: 'adjust', icon: SlidersHorizontal, label: 'Adjust' },
  { id: 'filters', icon: Palette, label: 'Filters' },
  { id: 'crop', icon: Crop, label: 'Crop' },
  { id: 'transform', icon: Move, label: 'Transform' },
  { id: 'background', icon: Eraser, label: 'BG Remove' },
  { id: 'retouch', icon: Brush, label: 'Retouch' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'shapes', icon: Shapes, label: 'Shapes' },
  { id: 'stickers', icon: SmilePlus, label: 'Stickers' },
  { id: 'templates', icon: LayoutTemplate, label: 'Templates' },
];

export default function Toolbar({ activeTool, onToolSelect }) {
  return (
    <div className="w-[72px] bg-dark-700/60 backdrop-blur-lg border-r border-dark-500/20 flex flex-col items-center py-3 gap-1 overflow-y-auto">
      {TOOLS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onToolSelect(id)}
          className={`tool-btn ${activeTool === id ? 'active' : ''}`}
          title={label}
        >
          <Icon className="w-5 h-5" />
          <span className="leading-none">{label}</span>
        </button>
      ))}
    </div>
  );
}
