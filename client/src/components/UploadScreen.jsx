import React, { useCallback, useState } from 'react';
import {
  Upload, Image, Sparkles, ArrowUpFromLine,
} from 'lucide-react';

export default function UploadScreen({ onUpload }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onUpload(file);
    }
  }, [onUpload]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  }, [onUpload]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-dark-800 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-700/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 animate-fade-in">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
              PixelMind AI
            </h1>
            <p className="text-dark-200 text-sm">AI-Powered Image Editor</p>
          </div>
        </div>

        {/* Upload Area */}
        <div
          className={`w-[500px] border-2 border-dashed rounded-2xl p-12 flex flex-col items-center gap-6 transition-all duration-300 cursor-pointer ${
            isDragging
              ? 'border-primary-400 bg-primary-600/10 scale-[1.02]'
              : 'border-dark-400 hover:border-primary-500/50 hover:bg-dark-700/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input').click()}
        >
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            isDragging ? 'bg-primary-500/20' : 'bg-dark-600'
          }`}>
            {isDragging ? (
              <ArrowUpFromLine className="w-8 h-8 text-primary-400 animate-bounce" />
            ) : (
              <Upload className="w-8 h-8 text-dark-200" />
            )}
          </div>

          <div className="text-center">
            <p className="text-lg font-medium text-dark-50">
              {isDragging ? 'Release to upload' : 'Drop your image here'}
            </p>
            <p className="text-dark-300 text-sm mt-1">
              or click to browse • Supports PNG, JPG, JPEG
            </p>
          </div>

          <div className="flex gap-2">
            {['PNG', 'JPG', 'JPEG'].map((fmt) => (
              <span key={fmt} className="text-xs px-2.5 py-1 bg-dark-600 rounded-full text-dark-200">
                {fmt}
              </span>
            ))}
          </div>
          <input
            id="file-input"
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Feature badges */}
        <div className="flex flex-wrap justify-center gap-3 max-w-[500px]">
          {[
            { icon: Image, label: 'Smart Filters' },
            { icon: Sparkles, label: 'AI Enhancement' },
            { icon: Upload, label: 'Background Removal' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 px-3 py-1.5 bg-dark-700/60 rounded-full text-sm text-dark-200">
              <Icon className="w-3.5 h-3.5 text-primary-400" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
