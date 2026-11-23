import React, { useState } from 'react';
import { X, Key, Cpu, Mic, Sliders, Shield, Save } from 'lucide-react';
import { AppSettings, AIProvider } from '../types';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,
  settings,
  onSave,
}) => {
  const [form, setForm] = useState<AppSettings>(settings);
  const [showDeepseekKey, setShowDeepseekKey] = useState(false);

  if (!open) return null;

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0e172a] border border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-bold text-white">Application Settings & AI Providers</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* DeepSeek API Settings */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white text-xs">DeepSeek API Configuration (Primary)</h3>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                Recommended
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                DeepSeek API Key
              </label>
              <div className="relative">
                <input
                  type={showDeepseekKey ? 'text' : 'password'}
                  value={form.deepseekApiKey}
                  onChange={(e) => setForm({ ...form, deepseekApiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowDeepseekKey(!showDeepseekKey)}
                  className="absolute right-3 top-2.5 text-[10px] text-slate-400 hover:text-white"
                >
                  {showDeepseekKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Stored securely in your local environment. Used directly for streaming responses.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  DeepSeek Model
                </label>
                <select
                  value={form.deepseekModel}
                  onChange={(e) => setForm({ ...form, deepseekModel: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white outline-none"
                >
                  <option value="deepseek-chat">deepseek-chat (V3 - Fast & Smart)</option>
                  <option value="deepseek-reasoner">deepseek-reasoner (R1 - Deep Thinking)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Base URL
                </label>
                <input
                  type="text"
                  value={form.deepseekBaseUrl}
                  onChange={(e) => setForm({ ...form, deepseekBaseUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white font-mono text-[11px] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Response Style & Length */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-white/5 space-y-3">
            <h3 className="font-bold text-white text-xs">AI Response Formatting</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Answer Length
                </label>
                <select
                  value={form.responseLength}
                  onChange={(e) =>
                    setForm({ ...form, responseLength: e.target.value as any })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white outline-none"
                >
                  <option value="short">Short (3-4 sentences / Rapid)</option>
                  <option value="medium">Medium (Standard interview depth)</option>
                  <option value="comprehensive">Comprehensive (Detailed explanation)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Response Style
                </label>
                <select
                  value={form.responseStyle}
                  onChange={(e) =>
                    setForm({ ...form, responseStyle: e.target.value as any })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white outline-none"
                >
                  <option value="concise">Concise & Spoken English</option>
                  <option value="bullet_points">Structured Bullet Points</option>
                  <option value="detailed">In-depth Technical Breakdown</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="autoGen"
                checked={form.autoGenerateAnswer}
                onChange={(e) => setForm({ ...form, autoGenerateAnswer: e.target.checked })}
                className="rounded border-white/10 bg-slate-900 text-sky-500 focus:ring-0"
              />
              <label htmlFor="autoGen" className="text-slate-300 cursor-pointer">
                Automatically generate answer when a question is detected
              </label>
            </div>
          </div>

          {/* Privacy & Security */}
          <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              Privacy First: Audio streams are processed strictly in memory. Neither voice recordings nor API keys are persisted externally.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/60 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition-colors text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-sky-500/20"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
