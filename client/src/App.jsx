import React, { useState, useRef, useCallback, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import RightPanel from './components/RightPanel';
import TopBar from './components/TopBar';
import UploadScreen from './components/UploadScreen';
import AIPromptAgent from './components/AIPromptAgent';

const INITIAL_ADJUSTMENTS = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  temperature: 0,
  sharpness: 0,
  highlights: 0,
  shadows: 0,
};

export default function App() {
  // Initialize state from localStorage if available
  const [originalImageSrc, setOriginalImageSrc] = useState(() => localStorage.getItem('pixelmind_original_image') || null);
  const [imageSrc, setImageSrc] = useState(() => localStorage.getItem('pixelmind_image') || null);
  const [activeTool, setActiveTool] = useState(() => localStorage.getItem('pixelmind_tool') || 'adjust');
  const [activeFilter, setActiveFilter] = useState(() => localStorage.getItem('pixelmind_filter') || null);
  const [adjustments, setAdjustments] = useState(() => {
    const saved = localStorage.getItem('pixelmind_adjustments');
    return saved ? JSON.parse(saved) : INITIAL_ADJUSTMENTS;
  });
  
  const [cropRatio, setCropRatio] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showAIAgent, setShowAIAgent] = useState(false);
  const canvasRef = useRef(null);

  // Helper to save current state to history
  const saveToHistory = useCallback((newState) => {
    setHistory(prev => {
      // If we are not at the end of history, drop all future states
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newState);
      // Keep only last 20 states to prevent memory issues
      if (newHistory.length > 20) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 19));
  }, [historyIndex]);

  // Initial save to history when image is loaded
  useEffect(() => {
    if (imageSrc && history.length === 0) {
       saveToHistory({ imageSrc, adjustments, activeFilter });
    }
  }, [imageSrc, adjustments, activeFilter, history.length, saveToHistory]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setImageSrc(prevState.imageSrc);
      setAdjustments(prevState.adjustments || INITIAL_ADJUSTMENTS);
      setActiveFilter(prevState.activeFilter || null);
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setImageSrc(nextState.imageSrc);
      setAdjustments(nextState.adjustments || INITIAL_ADJUSTMENTS);
      setActiveFilter(nextState.activeFilter || null);
      setHistoryIndex(prev => prev + 1);
    }
  }, [history, historyIndex]);

  // Wrapper for state changes that should be recorded in history
  const handleStateChange = useCallback((changes) => {
    const currentState = { imageSrc, adjustments, activeFilter };
    const newState = { ...currentState, ...changes };
    
    // Apply changes
    if ('imageSrc' in changes) setImageSrc(changes.imageSrc);
    if ('adjustments' in changes) setAdjustments(changes.adjustments);
    if ('activeFilter' in changes) setActiveFilter(changes.activeFilter);
    
    saveToHistory(newState);
  }, [imageSrc, adjustments, activeFilter, saveToHistory]);


  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (originalImageSrc) localStorage.setItem('pixelmind_original_image', originalImageSrc);
    else localStorage.removeItem('pixelmind_original_image');

    if (imageSrc) localStorage.setItem('pixelmind_image', imageSrc);
    else localStorage.removeItem('pixelmind_image');
    
    localStorage.setItem('pixelmind_tool', activeTool);
    if (activeFilter) localStorage.setItem('pixelmind_filter', activeFilter);
    else localStorage.removeItem('pixelmind_filter');
    
    localStorage.setItem('pixelmind_adjustments', JSON.stringify(adjustments));
  }, [originalImageSrc, imageSrc, activeTool, activeFilter, adjustments]);

  const handleImageUpload = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target.result;
      setOriginalImageSrc(result);
      setImageSrc(result);
      setActiveFilter(null);
      setAdjustments(INITIAL_ADJUSTMENTS);
      
      // Reset history on new upload
      setHistory([{ imageSrc: result, adjustments: INITIAL_ADJUSTMENTS, activeFilter: null }]);
      setHistoryIndex(0);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAdjustmentChange = useCallback((key, value) => {
    const newAdjustments = { ...adjustments, [key]: value };
    handleStateChange({ adjustments: newAdjustments });
  }, [adjustments, handleStateChange]);

  const handleFilterSelect = useCallback((filterName) => {
    const newFilter = activeFilter === filterName ? null : filterName;
    handleStateChange({ activeFilter: newFilter });
  }, [activeFilter, handleStateChange]);

  const handleEnhance = useCallback(() => {
    const newAdjustments = {
      brightness: 12,
      contrast: 15,
      saturation: 18,
      exposure: 5,
      temperature: 5,
      sharpness: 25,
      highlights: -10,
      shadows: 15,
    };
    handleStateChange({ adjustments: newAdjustments, activeFilter: null });
  }, [handleStateChange]);

  const handleReset = useCallback(() => {
    if (originalImageSrc) {
       setImageSrc(originalImageSrc);
    }
    setAdjustments(INITIAL_ADJUSTMENTS);
    setActiveFilter(null);
    setCropRatio(null);
    setIsCropping(false);
    
    // Reset history tracking
    if (originalImageSrc) {
       setHistory([{ imageSrc: originalImageSrc, adjustments: INITIAL_ADJUSTMENTS, activeFilter: null }]);
       setHistoryIndex(0);
    }
    
    // Explicitly re-center the image on the canvas using the ref
    if (canvasRef.current) {
      const c = canvasRef.current;
      const img = c.getObjects().find(obj => obj.type === 'image' || obj.type === 'FabricImage' || obj._element);
      if (img && c.centerObject) {
         // Reset any rotations or flips before centering
         img.set({ angle: 0, flipX: false, flipY: false });
         
         const cW = c.getWidth();
         const cH = c.getHeight();
         const iW = img.width || 800;
         const iH = img.height || 600;
         const scale = Math.min((cW * 0.95) / iW, (cH * 0.95) / iH);
         
         const left = (cW - iW * scale) / 2;
         const top = (cH - iH * scale) / 2;
         
         img.set({ scaleX: scale, scaleY: scale, left: left, top: top, originX: 'left', originY: 'top' });
         img.setCoords();
         c.renderAll();
      }
    }
  }, [originalImageSrc]);

  const handleExport = useCallback((format = 'png') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL({
      format: format,
      quality: 1,
      multiplier: 2,
    });
    const link = document.createElement('a');
    link.download = `pixelmind-export.${format}`;
    link.href = dataURL;
    link.click();
  }, []);

  const handleAIAction = useCallback((actions) => {
    if (!actions || !Array.isArray(actions)) return;
    actions.forEach((action) => {
      switch (action.type) {
        case 'adjustment':
          if (action.key in INITIAL_ADJUSTMENTS) {
            handleAdjustmentChange(action.key, action.value);
          }
          break;
        case 'filter':
          handleFilterSelect(action.value);
          break;
        case 'enhance':
          handleEnhance();
          break;
        case 'reset':
          handleReset();
          break;
        default:
          break;
      }
    });
  }, [handleAdjustmentChange, handleFilterSelect, handleEnhance, handleReset]);

  if (!imageSrc) {
    return <UploadScreen onUpload={handleImageUpload} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-dark-800 overflow-hidden">
      <TopBar
        onExport={handleExport}
        onEnhance={handleEnhance}
        onReset={handleReset}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onToggleAI={() => setShowAIAgent((v) => !v)}
        showAIAgent={showAIAgent}
      />
      <div className="flex flex-1 overflow-hidden">
        <Toolbar
          activeTool={activeTool}
          onToolSelect={setActiveTool}
          onCropStart={() => { setActiveTool('crop'); setIsCropping(true); }}
        />
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <Canvas
            ref={canvasRef}
            imageSrc={imageSrc}
            adjustments={adjustments}
            activeFilter={activeFilter}
            cropRatio={cropRatio}
            isCropping={isCropping}
            onStateChange={handleStateChange}
          />
          {showAIAgent && (
            <AIPromptAgent
              onAction={handleAIAction}
              onClose={() => setShowAIAgent(false)}
            />
          )}
        </div>
        <RightPanel
          activeTool={activeTool}
          adjustments={adjustments}
          onAdjustmentChange={handleAdjustmentChange}
          activeFilter={activeFilter}
          onFilterSelect={handleFilterSelect}
          cropRatio={cropRatio}
          onCropRatioChange={(r) => { setCropRatio(r); setIsCropping(true); setActiveTool('crop'); }}
          onCropApply={() => setIsCropping(false)}
          imageSrc={imageSrc}
          onImageChange={setImageSrc}
          onStateChange={handleStateChange}
          canvasRef={canvasRef}
        />
      </div>
    </div>
  );
}
