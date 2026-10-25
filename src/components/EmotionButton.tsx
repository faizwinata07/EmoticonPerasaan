import React, { useState } from 'react';
import { EmotionItem } from '../types/emotion';

interface EmotionButtonProps {
  emotion: EmotionItem;
  count: number;
  totalVotes: number;
  onPress: (emotion: EmotionItem, event: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

export const EmotionButton: React.FC<EmotionButtonProps> = ({
  emotion,
  count,
  totalVotes,
  onPress,
  disabled = false,
}) => {
  const [isBouncing, setIsBouncing] = useState(false);
  const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

  const handleInteraction = (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    if (disabled) return;
    setIsBouncing(true);
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(20);
      } catch {
        // ignore
      }
    }
    onPress(emotion, e);
    setTimeout(() => {
      setIsBouncing(false);
    }, 450);
  };

  return (
    <button
      type="button"
      onClick={handleInteraction}
      onTouchStart={(e) => {
        // Prevent ghost click delay on touch screens
        e.preventDefault();
        handleInteraction(e);
      }}
      disabled={disabled}
      aria-label={`${emotion.label}: ${count} suara (${percentage}%)`}
      className={`
        relative w-full text-left p-4 sm:p-5 rounded-2xl
        border-4 transition-all duration-150 select-none
        touch-manipulation cursor-pointer flex flex-col justify-between
        ${emotion.bgLight} ${emotion.bgBorder}
        ${isBouncing ? 'scale-90 shadow-inner' : 'smartboard-card hover:-translate-y-1 hover:shadow-xl'}
        focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-slate-900
      `}
      style={{
        minHeight: '145px',
      }}
    >
      {/* Top row: Big emoji + Live Count Pill */}
      <div className="flex items-center justify-between w-full">
        <span
          className={`
            text-5xl sm:text-6xl select-none filter drop-shadow-sm
            transition-transform duration-300
            ${isBouncing ? 'scale-130 -rotate-12' : 'group-hover:scale-110'}
          `}
          role="img"
          aria-hidden="true"
        >
          {emotion.emoji}
        </span>

        {/* Live Vote Counter on the Button */}
        <div className="flex flex-col items-end">
          <div
            className={`
              flex items-center gap-1.5 px-3 py-1 rounded-xl text-white font-extrabold text-sm sm:text-base
              shadow-sm transition-transform duration-200
              ${emotion.accentBg} ${isBouncing ? 'scale-125' : ''}
            `}
          >
            <span>{count}</span>
            <span className="text-xs opacity-90 font-medium">suara</span>
          </div>
          {totalVotes > 0 && (
            <span className="text-xs font-bold text-slate-500 mt-1">
              {percentage}%
            </span>
          )}
        </div>
      </div>

      {/* Middle & Bottom: Indonesian Label & Sublabel */}
      <div className="mt-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className={`font-black text-lg sm:text-xl tracking-tight leading-snug ${emotion.textDark}`}>
            {emotion.label}
          </h3>
        </div>
        <p className="text-xs sm:text-sm font-semibold text-slate-600 line-clamp-1 mt-0.5">
          {emotion.sublabel}
        </p>
      </div>

      {/* Mini Progress bar indicator inside the button */}
      <div className="w-full bg-black/10 rounded-full h-1.5 mt-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${emotion.accentBg}`}
          style={{ width: `${Math.max(percentage, count > 0 ? 8 : 0)}%` }}
        />
      </div>

      {/* Touch ripple highlight */}
      {isBouncing && (
        <span
          className="absolute inset-0 rounded-2xl ring-4 ring-offset-2 animate-ping pointer-events-none opacity-40"
          style={{ borderColor: emotion.colorHex }}
        />
      )}
    </button>
  );
};
