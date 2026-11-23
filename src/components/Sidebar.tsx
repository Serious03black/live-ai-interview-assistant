import React from 'react';
import { History, Trash2, ArrowUpRight, MessageSquareText } from 'lucide-react';
import { SessionHistoryItem } from '../types';

interface SidebarProps {
  history: SessionHistoryItem[];
  onSelectHistory: (item: SessionHistoryItem) => void;
  onClearHistory: () => void;
  activeId?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  history,
  onSelectHistory,
  onClearHistory,
  activeId,
}) => {
  return (
    <aside className="w-72 border-r border-white/5 bg-[#0b1120]/60 backdrop-blur-md flex flex-col h-full overflow-hidden select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Session History
          </h2>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-slate-400">
            {history.length}
          </span>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
            title="Clear Session History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* History Items List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {history.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs space-y-2">
            <MessageSquareText className="w-5 h-5 mx-auto text-slate-600" />
            <p>No questions yet</p>
            <p className="text-[11px] text-slate-600">
              Questions asked during the session are archived here for quick review.
            </p>
          </div>
        ) : (
          history.map((item) => {
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectHistory(item)}
                className={`w-full text-left p-2.5 rounded-xl transition-all border group relative ${
                  isActive
                    ? 'bg-sky-500/10 border-sky-500/30 text-white'
                    : 'bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/[0.05] hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                  <span className="font-semibold text-sky-400">
                    {item.question.category}
                  </span>
                  <span className="font-mono">
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs font-medium line-clamp-2 leading-relaxed">
                  {item.question.text}
                </p>
                <ArrowUpRight className="w-3 h-3 absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity" />
              </button>
            );
          })
        )}
      </div>

      {/* Session Footer stats */}
      <div className="p-3 border-t border-white/5 bg-slate-950/40 text-[11px] text-slate-500 font-mono flex items-center justify-between">
        <span>Questions: {history.length}</span>
        <span>Answers: {history.filter((h) => !!h.answer?.content).length}</span>
      </div>
    </aside>
  );
};
