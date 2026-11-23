import React from 'react';
import {
  Sparkles,
  Settings as SettingsIcon,
  User,
  Pin,
  PinOff,
  Minus,
  Square,
  X,
  Radio,
  Cpu,
  PanelLeft,
  PanelLeftClose,
} from 'lucide-react';
import { AIProvider, AppSettings, CandidateProfile } from '../types';

interface NavbarProps {
  settings: AppSettings;
  profile?: CandidateProfile;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  serverOnline: boolean;
  alwaysOnTop: boolean;
  onToggleAlwaysOnTop: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  profile,
  sidebarOpen = false,
  onToggleSidebar,
  onUpdateSettings,
  onOpenSettings,
  onOpenProfile,
  serverOnline,
  alwaysOnTop,
  onToggleAlwaysOnTop,
}) => {
  const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

  const handleMinimize = () => {
    (window as any).electronAPI?.minimizeWindow();
  };

  const handleMaximize = () => {
    (window as any).electronAPI?.maximizeWindow();
  };

  const handleClose = () => {
    (window as any).electronAPI?.closeWindow();
  };

  return (
    <header className="h-14 border-b border-white/5 bg-[#0b1120]/80 backdrop-blur-md px-4 flex items-center justify-between select-none drag-region">
      {/* Brand & Status */}
      <div className="flex items-center gap-3 no-drag-region">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title={sidebarOpen ? 'Close Session History Sidebar' : 'Open Session History Sidebar'}
            className={`p-1.5 rounded-lg border transition-all ${
              sidebarOpen
                ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>
        )}

        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-sky-500 to-cyan-400 p-[1px] shadow-lg shadow-sky-500/20">
          <div className="w-full h-full bg-[#090D16] rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              Live AI Interview Assistant
            </h1>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              DeepSeek Core
            </span>
          </div>
        </div>
      </div>

      {/* Center Controls: Provider Selector & Server status */}
      <div className="flex items-center gap-2.5 no-drag-region">
        <div className="flex items-center bg-slate-900/90 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-slate-300">
          <Cpu className="w-3.5 h-3.5 mr-1.5 text-sky-400" />
          <span className="text-[11px] font-medium mr-1.5 text-slate-400">AI:</span>
          <select
            value={settings.aiProvider}
            onChange={(e) =>
              onUpdateSettings({ ...settings, aiProvider: e.target.value as AIProvider })
            }
            className="bg-transparent text-white font-semibold outline-none cursor-pointer text-xs"
          >
            <option value="deepseek" className="bg-slate-900 text-white">DeepSeek V3 / R1</option>
            <option value="gemini" className="bg-slate-900 text-white">Google Gemini</option>
            <option value="openai" className="bg-slate-900 text-white">OpenAI GPT-4o</option>
            <option value="custom" className="bg-slate-900 text-white">Custom / Ollama</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-white/5 text-[11px]">
          <span
            className={`w-2 h-2 rounded-full ${
              serverOnline ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'
            }`}
          />
          <span className="text-slate-400 font-mono">
            {serverOnline ? 'Proxy Live' : 'Direct Mode'}
          </span>
        </div>
      </div>

      {/* Right Actions & Window Controls */}
      <div className="flex items-center gap-1.5 no-drag-region">
        {/* Always on top toggle */}
        <button
          onClick={onToggleAlwaysOnTop}
          title={alwaysOnTop ? 'Disable Always on Top' : 'Enable Always on Top'}
          className={`p-2 rounded-lg transition-all text-xs flex items-center gap-1 border ${
            alwaysOnTop
              ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
              : 'bg-white/[0.03] text-slate-400 border-white/5 hover:text-white'
          }`}
        >
          {alwaysOnTop ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
        </button>

        {/* Profile */}
        <button
          onClick={onOpenProfile}
          title="Candidate Profile & Resume Personalization"
          className="px-2.5 py-1.5 rounded-lg bg-white/[0.03] text-slate-300 border border-white/5 hover:text-white hover:bg-white/[0.08] transition-all flex items-center gap-1.5 text-xs"
        >
          <User className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline font-medium">
            {profile?.name ? profile.name : 'Resume Profile'}
          </span>
          {profile?.resumeText ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" title="Resume active" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-400" title="Click to add resume" />
          )}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          title="Settings & API Keys"
          className="p-2 rounded-lg bg-white/[0.03] text-slate-400 border border-white/5 hover:text-white hover:bg-white/[0.08] transition-all"
        >
          <SettingsIcon className="w-3.5 h-3.5" />
        </button>

        {/* Electron Window Controls */}
        {isElectron && (
          <div className="flex items-center gap-1 ml-2 pl-2 border-l border-white/10">
            <button
              onClick={handleMinimize}
              className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleMaximize}
              className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Square className="w-3 h-3" />
            </button>
            <button
              onClick={handleClose}
              className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-rose-500/80 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
