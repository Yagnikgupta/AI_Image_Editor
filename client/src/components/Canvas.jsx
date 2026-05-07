import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';

const FILTER_PRESETS = {
  vintage: { brightness: 0.08, contrast: 0.15, saturation: -0.3 },
  bw: { brightness: 0, contrast: 0.1, saturation: -1 },
  cinematic: { brightness: -0.05, contrast: 0.25, saturation: -0.1 },
  hdr: { brightness: 0.1, contrast: 0.35, saturation: 0.25 },
  warm: { brightness: 0.05, contrast: 0.05, saturation: 0.15 },
  cool: { brightness: 0, contrast: 0.1, saturation: -0.15 },
  sepia: { brightness: 0.05, contrast: 0.1, saturation: -0.6 },
  bright: { brightness: 0.25, contrast: 0.1, saturation: 0.1 },
};

const Canvas = forwardRef(function CanvasComponent(
  { imageSrc, adjustments, activeFilter, cropRatio, isCropping, cancelCropTrigger, onStateChange },
  ref
) {
  const containerRef = useRef(null);
  const canvasElRef = useRef(null);
  const fabricRef = useRef(null);
  const imageRef = useRef(null);
  const cropRectRef = useRef(null);
  const [fabricModule, setFabricModule] = useState(null);

  // Dynamically import fabric to avoid SSR/crash issues
  useEffect(() => {
    let cancelled = false;
    import('fabric').then((mod) => {
      if (!cancelled) setFabricModule(mod);
    }).catch((err) => {
      console.error('Failed to load Fabric.js:', err);
    });
    return () => { cancelled = true; };
  }, []);

  // Initialize canvas once fabric is loaded
  useEffect(() => {
    if (!fabricModule || !containerRef.current || !canvasElRef.current) return;

    const fabric = fabricModule;
    let c;
    try {
      c = new fabric.Canvas(canvasElRef.current, {
        backgroundColor: '#141517',
        preserveObjectStacking: true,
      });
    } catch (err) {
      console.error('Canvas init error:', err);
      return;
    }
    
    fabricRef.current = c;
    // Expose the initialized Fabric canvas instance to the parent ref
    if (typeof ref === 'function') {
      ref(c);
    } else if (ref) {
      ref.current = c;
    }

    const resizeCanvas = () => {
      try {
        const w = containerRef.current?.offsetWidth || 800;
        const h = containerRef.current?.offsetHeight || 600;
        c.setDimensions({ width: w, height: h });
        if (imageRef.current) centerImage(c, imageRef.current);
        c.renderAll();
      } catch (err) {
        console.error('Resize error:', err);
      }
    };
    resizeCanvas();

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      try { c.dispose(); } catch (e) { /* ignore */ }
      fabricRef.current = null;
    };
  }, [fabricModule]);

  // Load image when imageSrc changes
  useEffect(() => {
    if (!fabricModule || !fabricRef.current || !imageSrc) return;
    const fabric = fabricModule;
    const c = fabricRef.current;

    const imgEl = new window.Image();
    imgEl.crossOrigin = 'anonymous';
    imgEl.onload = () => {
      try {
        if (imageRef.current) {
          c.remove(imageRef.current);
        }

        // Fabric.js v7 uses FabricImage
        const FabricImage = fabric.FabricImage || fabric.Image;
        const fImg = new FabricImage(imgEl, {
          selectable: false,
          evented: false,
        });
        imageRef.current = fImg;

        // Use add instead of insertAt for broader compatibility
        c.add(fImg);
        
        // Ensure image is above any background rectangle but below other objects
        const bgRect = c.getObjects().find(obj => obj.name === 'imageBackground');
        if (bgRect) {
          c.moveObjectTo(fImg, c.getObjects().indexOf(bgRect) + 1);
        } else {
          c.sendObjectToBack(fImg);
        }

        // Ensure canvas dimensions are up to date with container before centering
        const w = containerRef.current?.offsetWidth || 800;
        const h = containerRef.current?.offsetHeight || 600;
        c.setDimensions({ width: w, height: h });

        centerImage(c, fImg);
        c.renderAll();
      } catch (err) {
        console.error('Image load error:', err);
      }
    };
    imgEl.onerror = (err) => {
      console.error('Image element load error:', err);
    };
    imgEl.src = imageSrc;
  }, [imageSrc, fabricModule]);

  // Apply adjustments + filters
  useEffect(() => {
    if (!fabricModule) return;
    const fabric = fabricModule;
    const img = imageRef.current;
    const c = fabricRef.current;
    if (!img || !c) return;

    try {
      let adj = { ...adjustments };
      if (activeFilter && FILTER_PRESETS[activeFilter]) {
        const preset = FILTER_PRESETS[activeFilter];
        adj = {
          ...adj,
          brightness: (adj.brightness || 0) + (preset.brightness || 0) * 100,
          contrast: (adj.contrast || 0) + (preset.contrast || 0) * 100,
          saturation: (adj.saturation || 0) + (preset.saturation || 0) * 100,
        };
      }

      const filters = [];
      const f = fabric.filters;

      if (adj.brightness && f.Brightness) {
        filters.push(new f.Brightness({ brightness: adj.brightness / 100 }));
      }
      if (adj.contrast && f.Contrast) {
        filters.push(new f.Contrast({ contrast: adj.contrast / 100 }));
      }
      if (adj.saturation && f.Saturation) {
        filters.push(new f.Saturation({ saturation: adj.saturation / 100 }));
      }
      if (adj.exposure && f.Gamma) {
        const g = 1 + adj.exposure / 100;
        filters.push(new f.Gamma({ gamma: [g, g, g] }));
      }
      
      // Temperature (Warm/Cool) using ColorMatrix
      if (adj.temperature && f.ColorMatrix) {
        // Temperature adjusts red (+ is warmer) and blue (- is warmer)
        const t = adj.temperature / 100; // range: -1 to 1
        filters.push(new f.ColorMatrix({
          matrix: [
            1 + (t > 0 ? t : 0), 0, 0, 0, 0,
            0, 1, 0, 0, 0,
            0, 0, 1 + (t < 0 ? -t : 0), 0, 0,
            0, 0, 0, 1, 0
          ]
        }));
      }

      if (adj.sharpness && f.Convolute) {
        const s = adj.sharpness / 100;
        filters.push(new f.Convolute({
          matrix: [
            0, -s, 0,
            -s, 1 + 4 * s, -s,
            0, -s, 0
          ],
        }));
      }

      // Fake Highlights/Shadows using ColorMatrix
      if ((adj.highlights || adj.shadows) && f.ColorMatrix) {
        // Range -1 to 1
        const h = (adj.highlights || 0) / 100;
        const s = (adj.shadows || 0) / 100;
        
        // Multiplier factor for overall brightness shift
        const factor = 1 + (h * 0.2) + (s * 0.2);
        
        // Additive offset for shadows (scaled down to prevent blackout/blowout) 
        // Note: The 5th column in Fabric ColorMatrix is an additive constant (0 to 1 range typically)
        const offset = s * 0.1;
        
        filters.push(new f.ColorMatrix({
          matrix: [
            factor, 0, 0, 0, offset,
            0, factor, 0, 0, offset,
            0, 0, factor, 0, offset,
            0, 0, 0, 1, 0
          ]
        }));
      }

      if (activeFilter === 'sepia' && f.Sepia) {
        filters.push(new f.Sepia());
      }

      img.filters = filters;
      img.applyFilters();
      c.renderAll();
    } catch (err) {
      console.error('Filter apply error:', err);
    }
  }, [adjustments, activeFilter, fabricModule]);

  // Handle Crop Overlay and Execution
  const prevIsCropping = useRef(isCropping);

  // Cancel trigger explicitly clears the rect
  useEffect(() => {
    if (cancelCropTrigger > 0 && cropRectRef.current && fabricRef.current) {
      fabricRef.current.remove(cropRectRef.current);
      cropRectRef.current = null;
    }
  }, [cancelCropTrigger]);

  useEffect(() => {
    if (!fabricModule || !fabricRef.current || !imageRef.current) return;
    const fabric = fabricModule;
    const c = fabricRef.current;
    const img = imageRef.current;

    // 1. Detect if we should APPLY the crop (transition from true -> false)
    if (prevIsCropping.current && !isCropping && cropRectRef.current) {
      const rect = cropRectRef.current;
      try {
        const cropCanvas = document.createElement('canvas');
        const ctx = cropCanvas.getContext('2d');
        
        const bounds = rect.getBoundingRect();
        const imgBounds = img.getBoundingRect();
        
        const scaleX = img.scaleX || 1;
        const scaleY = img.scaleY || 1;
        
        const sx = (bounds.left - imgBounds.left) / scaleX;
        const sy = (bounds.top - imgBounds.top) / scaleY;
        const sWidth = bounds.width / scaleX;
        const sHeight = bounds.height / scaleY;
        
        cropCanvas.width = sWidth;
        cropCanvas.height = sHeight;
        
        const originalImageEl = img.getElement();
        
        ctx.drawImage(
          originalImageEl,
          sx, sy, sWidth, sHeight,
          0, 0, sWidth, sHeight
        );
        
        const croppedDataUrl = cropCanvas.toDataURL('image/png');
        if (onStateChange) {
           onStateChange({ imageSrc: croppedDataUrl });
        }
        
        c.remove(cropRectRef.current);
        cropRectRef.current = null;
      } catch (err) {
        console.error('Crop execution error:', err);
      }
    } 
    // 2. Or, if we transitioned from false -> true, or ratio changed while true, CREATE/UPDATE crop box
    else if (isCropping) {
      if (cropRectRef.current) {
        c.remove(cropRectRef.current);
      }

      const imgBounds = img.getBoundingRect();
      const scaleX = img.scaleX || 1;
      const scaleY = img.scaleY || 1;
      const imgW = (img.width || 800) * scaleX;
      const imgH = (img.height || 600) * scaleY;
      
      let cropWidth = imgW * 0.8;
      let cropHeight = imgH * 0.8;

      if (cropRatio) {
        if (cropRatio > 1) {
          cropHeight = cropWidth / cropRatio;
        } else {
          cropWidth = cropHeight * cropRatio;
        }
      }

      // Constrain initial size to not exceed image
      if (cropWidth > imgBounds.width) {
        cropWidth = imgBounds.width;
        if (cropRatio) cropHeight = cropWidth / cropRatio;
      }
      if (cropHeight > imgBounds.height) {
        cropHeight = imgBounds.height;
        if (cropRatio) cropWidth = cropHeight * cropRatio;
      }

      // Calculate perfect top-left position for centering
      const center = img.getCenterPoint();
      const leftPos = center.x - (cropWidth / 2);
      const topPos = center.y - (cropHeight / 2);

      const rect = new fabric.Rect({
        originX: 'left',
        originY: 'top',
        left: leftPos,
        top: topPos,
        width: cropWidth,
        height: cropHeight,
        fill: 'rgba(0,0,0,0.3)', // Darker overlay to see better
        stroke: '#fff',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        cornerColor: '#5c7cfa',
        cornerStrokeColor: '#fff',
        cornerSize: 12,
        transparentCorners: false,
        hasRotatingPoint: false,
        lockRotation: true,
      });

      rect.setControlsVisibility({ mtr: false }); 
      if (cropRatio) rect.set('lockUniScaling', true);
      else rect.set('lockUniScaling', false);

      // Simple, robust clamping logic 
      const constrainRect = () => {
        const obj = cropRectRef.current;
        if (!obj || !img) return;

        obj.setCoords();
        const bounds = obj.getBoundingRect(true, true);
        const imgBounds = img.getBoundingRect(true, true);

        let newLeft = obj.left;
        let newTop = obj.top;
        let newWidth = obj.width * obj.scaleX;
        let newHeight = obj.height * obj.scaleY;
        let needsUpdate = false;

        // Force maximum size constraints
        if (newWidth > imgBounds.width) {
          newWidth = imgBounds.width;
          needsUpdate = true;
        }
        if (newHeight > imgBounds.height) {
          newHeight = imgBounds.height;
          needsUpdate = true;
        }

        // Left Boundary Clamp
        if (newLeft < imgBounds.left) {
          newLeft = imgBounds.left;
          needsUpdate = true;
        } else if (newLeft + newWidth > imgBounds.left + imgBounds.width) {
          newLeft = imgBounds.left + imgBounds.width - newWidth;
          needsUpdate = true;
        }

        // Top Boundary Clamp
        if (newTop < imgBounds.top) {
          newTop = imgBounds.top;
          needsUpdate = true;
        } else if (newTop + newHeight > imgBounds.top + imgBounds.height) {
          newTop = imgBounds.top + imgBounds.height - newHeight;
          needsUpdate = true;
        }

        // Uniform Scaling enforcement if a ratio is set
        if (cropRatio && needsUpdate) {
            // Find the most restricted axis and apply it evenly
            const scaleW = newWidth / obj.width;
            const scaleH = newHeight / obj.height;
            const minScale = Math.min(scaleW, scaleH);
            newWidth = obj.width * minScale;
            newHeight = obj.height * minScale;
            
            // Re-check left/top positioning drift after uniform scale squash
            if (newLeft + newWidth > imgBounds.left + imgBounds.width) {
                newLeft = imgBounds.left + imgBounds.width - newWidth;
            }
            if (newTop + newHeight > imgBounds.top + imgBounds.height) {
                newTop = imgBounds.top + imgBounds.height - newHeight;
            }
        }

        if (needsUpdate) {
          obj.set({
            left: newLeft,
            top: newTop,
            scaleX: newWidth / obj.width,
            scaleY: newHeight / obj.height,
          });
          obj.setCoords();
        }
      };

      rect.on('moving', constrainRect);
      rect.on('scaling', constrainRect);
      
      cropRectRef.current = rect;
      c.add(rect);
      c.setActiveObject(rect);
    } 
    // 3. Just hiding the crop box without applying (e.g. they clicked another tool without applying)
    else if (!isCropping && cropRectRef.current && !prevIsCropping.current) {
      c.remove(cropRectRef.current);
      cropRectRef.current = null;
      // Re-center when exiting crop without applying
      if (img) centerImage(c, img);
    }
    
    // Also re-center image when entering crop mode to ensure stable coordinates
    if (isCropping && !prevIsCropping.current && img) {
       centerImage(c, img);
    }

    prevIsCropping.current = isCropping;
    c.renderAll();
  }, [isCropping, cropRatio, fabricModule]);

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden bg-dark-900">
      {/* Checkerboard pattern for transparency */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%)`,
        backgroundSize: '20px 20px',
      }} />
      <canvas ref={canvasElRef} />
      {!fabricModule && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-dark-300 text-sm">Loading canvas...</div>
        </div>
      )}
    </div>
  );
});

function centerImage(canvas, img) {
  try {
    const cW = canvas.getWidth();
    const cH = canvas.getHeight();
    // Use the image's original dimensions
    const iW = img.width || 800;
    const iH = img.height || 600;
    
    // Calculate scale to fit exactly within canvas (with 5% padding)
    const scale = Math.min((cW * 0.95) / iW, (cH * 0.95) / iH);
    
    // Calculate exact center coordinates to ensure it's positioned correctly
    const left = (cW - iW * scale) / 2;
    const top = (cH - iH * scale) / 2;
    
    img.set({
      scaleX: scale,
      scaleY: scale,
      left: left,
      top: top,
      originX: 'left',
      originY: 'top'
    });
    
    img.setCoords();
  } catch (err) {
    console.error('Center image error:', err);
  }
}

export default Canvas;
