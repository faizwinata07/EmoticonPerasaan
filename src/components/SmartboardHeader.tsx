import React, { useState, useEffect } from 'react';
import { ViewMode } from '../types/emotion';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  LayoutGrid,
  BarChart2,
  FileSpreadsheet,
  Columns,
  Database,
} from 'lucide-react';

interface SmartboardHeaderProps {
  currentView: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  sessionName: string;
  totalVotes: number;
  isMuted: boolean;
  isSheetConnected?: boolean;
  onToggleMute: () => void;
  onResetPrompt: () => void;
  onOpenReflectionGuide: () => void;
}

export const SmartboardHeader: React.FC<SmartboardHeaderProps> = ({
  currentView,
  onViewChange,
  sessionName,
  totalVotes,
  isMuted,
  isSheetConnected = false,
  onToggleMute,
  onResetPrompt,
  onOpenReflectionGuide,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const time = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setTimeStr(`${time} WIB`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  return (
    <header className="bg-slate-900 text-white border-b-4 border-amber-400 px-4 sm:px-6 py-3.5 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Branding & Session Name */}
        <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg border-2 border-white/20 select-none">
              11
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-lg sm:text-xl tracking-tight leading-none text-white flex items-center gap-1.5">
                  Radar Emosi Kelas 11 SMA
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                  Smartboard
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mt-1">
                <span className="text-amber-400 font-bold">{sessionName}</span>
                <span>·</span>
                <span className="font-mono text-slate-400">{timeStr}</span>
              </div>
            </div>
          </div>

          {/* Quick Counter for Mobile */}
          <div className="md:hidden flex items-center gap-1 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            <span className="text-xs font-bold text-slate-400">Suara:</span>
            <span className="text-sm font-black text-amber-400">{totalVotes}</span>
          </div>
        </div>

        {/* Center: View Switcher Tabs */}
        <div className="flex items-center bg-slate-800/90 p-1.5 rounded-2xl border-2 border-slate-700/80 shadow-inner overflow-x-auto max-w-full">
          <button
            onClick={() => onViewChange('interactive_board')}
            className={`
              flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap
              ${currentView === 'interactive_board'
                ? 'bg-amber-400 text-slate-950 shadow-md scale-102'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'}
            `}
          >
            <LayoutGrid className="w-4 h-4" />
            Papan Emotikon
          </button>

          <button
            onClick={() => onViewChange('split_view')}
            className={`
              hidden lg:flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap
              ${currentView === 'split_view'
                ? 'bg-amber-400 text-slate-950 shadow-md scale-102'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'}
            `}
          >
            <Columns className="w-4 h-4" />
            Mode Terbagi
          </button>

          <button
            onClick={() => onViewChange('analytics_chart')}
            className={`
              flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap
              ${currentView === 'analytics_chart'
                ? 'bg-amber-400 text-slate-950 shadow-md scale-102'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'}
            `}
          >
            <BarChart2 className="w-4 h-4" />
            Grafik Batang
          </button>

          <button
            onClick={() => onViewChange('canva_sheet')}
            className={`
              flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap
              ${currentView === 'canva_sheet'
                ? 'bg-amber-400 text-slate-950 shadow-md scale-102'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'}
            `}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Canva Sheet
          </button>

          <button
            onClick={() => onViewChange('google_sheets')}
            className={`
              flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap
              ${currentView === 'google_sheets'
                ? 'bg-emerald-400 text-slate-950 shadow-md scale-102'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'}
            `}
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Google Sheets DB</span>
            {isSheetConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Nyalakan Efek Suara' : 'Matikan Suara'}
            className={`
              p-2.5 rounded-xl border-2 transition-all cursor-pointer
              ${isMuted
                ? 'bg-rose-950/60 border-rose-500/50 text-rose-400'
                : 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'}
            `}
            title={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            aria-label="Mode Layar Penuh Smartboard"
            className="p-2.5 rounded-xl bg-slate-800 border-2 border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700 transition-all cursor-pointer hidden sm:block"
            title="Layar Penuh Papan Tulis (F11)"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {/* Teacher Guide Prompt */}
          <button
            onClick={onOpenReflectionGuide}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs border border-indigo-400/50 shadow-sm cursor-pointer transition-all"
            title="Tips Refleksi Emosi Kelas 11"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Panduan Refleksi</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={onResetPrompt}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs border border-rose-500 shadow-sm cursor-pointer transition-all active:scale-95"
            title="Atur Ulang / Kosongkan Sesi Permainan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Atur Ulang</span>
          </button>
        </div>
      </div>
    </header>
  );
};
