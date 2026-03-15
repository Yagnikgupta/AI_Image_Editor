import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function AIPromptAgent({ onAction, onClose }) {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hi! I'm your AI editing assistant. Tell me what you want to do with your image, like:\n• \"Make it brighter and add a vintage filter\"\n• \"Increase contrast and sharpen\"\n• \"Reset all edits\"\n• \"Enhance the image\"",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendPrompt = async () => {
    if (!prompt.trim() || loading) return;

    const userMsg = prompt.trim();
    setPrompt('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await axios.post('/api/ai-agent', { prompt: userMsg });
      const { actions, reply } = res.data;

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply || 'Done! I applied the changes.' },
      ]);

      if (actions && actions.length > 0) {
        onAction(actions);
      }
    } catch (err) {
      // Fallback: try to parse locally
      const actions = parsePromptLocally(userMsg);
      if (actions.length > 0) {
        onAction(actions);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Applied ${actions.length} edit(s) based on your request.` },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: "Sorry, I couldn't process that. Try something like \"make it brighter\" or \"add vintage filter\".",
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendPrompt();
    }
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[480px] glass-panel flex flex-col animate-fade-in z-40 shadow-2xl shadow-black/40">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-500/30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-dark-50">AI Agent</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-primary-600/20 text-primary-400 rounded-full font-medium">Beta</span>
        </div>
        <button onClick={onClose} className="text-dark-300 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Chat area */}
      <div className="flex-1 max-h-[240px] overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white rounded-br-sm'
                  : 'bg-dark-600 text-dark-100 rounded-bl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-dark-600 text-dark-200 px-3 py-2 rounded-xl rounded-bl-sm flex items-center gap-2 text-sm">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Thinking...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-dark-500/30">
        <div className="flex items-center gap-2 bg-dark-600 rounded-xl px-3 py-1.5">
          <Sparkles className="w-4 h-4 text-primary-400 flex-shrink-0" />
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me what to do..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-dark-300 outline-none py-1.5"
          />
          <button
            onClick={sendPrompt}
            disabled={!prompt.trim() || loading}
            className="p-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* Fallback local parser when backend is unavailable */
function parsePromptLocally(prompt) {
  const lower = prompt.toLowerCase();
  const actions = [];

  // Filters
  const filters = ['vintage', 'bw', 'cinematic', 'hdr', 'warm', 'cool', 'sepia', 'bright'];
  for (const f of filters) {
    if (lower.includes(f) || (f === 'bw' && (lower.includes('black and white') || lower.includes('b&w')))) {
      actions.push({ type: 'filter', value: f });
    }
  }

  // Adjustments
  const adjustmentMap = {
    bright: 'brightness', brighter: 'brightness', brightness: 'brightness',
    contrast: 'contrast',
    saturat: 'saturation', vivid: 'saturation', vibrant: 'saturation',
    sharp: 'sharpness', sharpen: 'sharpness', sharpness: 'sharpness',
    exposure: 'exposure',
    temperature: 'temperature', warm: 'temperature',
    highlight: 'highlights',
    shadow: 'shadows',
  };

  for (const [keyword, key] of Object.entries(adjustmentMap)) {
    if (lower.includes(keyword) && !actions.some(a => a.type === 'filter')) {
      const isDecrease = lower.includes('decrease') || lower.includes('reduce') || lower.includes('less') || lower.includes('lower');
      actions.push({ type: 'adjustment', key, value: isDecrease ? -30 : 30 });
    }
  }

  // Special commands
  if (lower.includes('enhance') || lower.includes('improve') || lower.includes('auto')) {
    actions.push({ type: 'enhance' });
  }
  if (lower.includes('reset') || lower.includes('clear') || lower.includes('undo all')) {
    actions.push({ type: 'reset' });
  }

  return actions;
}
