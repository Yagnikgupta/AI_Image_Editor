import React from 'react';
import {
  Download, Undo2, Redo2, RotateCcw, Sparkles, Bot, Sun, Moon,
} from 'lucide-react';

export default function TopBar({
  onExport,
  onEnhance,
  onReset,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onToggleAI,
  showAIAgent,
}) {
  const [darkMode, setDarkMode] = React.useState(true);
  const [showExportMenu, setShowExportMenu] = React.useState(false);

  return (
    <div className="h-14 bg-dark-700/90 backdrop-blur-lg border-b border-dark-500/30 flex items-center justify-between px-4 z-50">
      {/* Left: Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
          PixelMind AI
        </span>
      </div>

      {/* Center: Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`btn-ghost ${!canUndo ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`btn-ghost ${!canRedo ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-dark-500 mx-2" />
        <button onClick={onReset} className="btn-ghost" title="Reset All">
          <RotateCcw className="w-4 h-4" />
          <span className="text-xs">Reset</span>
        </button>
        <button onClick={onEnhance} className="btn-primary animate-pulse-glow" title="AI Enhance">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs">Enhance</span>
        </button>
        <button
          onClick={onToggleAI}
          className={`btn-ghost ${showAIAgent ? 'bg-primary-700/20 text-primary-400' : ''}`}
          title="AI Prompt Agent"
        >
          <Bot className="w-4 h-4" />
          <span className="text-xs">AI Agent</span>
        </button>
      </div>

      {/* Right: Export + Theme */}
      <div className="flex items-center gap-2 relative">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="btn-ghost"
          title="Toggle Theme"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="btn-primary"
          >
            <Download className="w-4 h-4" />
            <span className="text-xs">Export</span>
          </button>
          {showExportMenu && (
            <div className="absolute right-0 top-12 glass-panel p-2 min-w-[140px] animate-fade-in z-50">
              {[
                { label: 'PNG (Lossless)', format: 'png' },
                { label: 'JPG (Small)', format: 'jpeg' },
              ].map(({ label, format }) => (
                <button
                  key={format}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-dark-600 text-dark-100 hover:text-white transition-colors"
                  onClick={() => { onExport(format); setShowExportMenu(false); }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
