import React, { useState } from 'react';
import { EmotionItem } from '../types/emotion';
import { TrendingUp, BarChart2, Award, Zap } from 'lucide-react';

interface LiveBarChartProps {
  emotions: EmotionItem[];
  counts: Record<string, number>;
  totalVotes: number;
}

export const LiveBarChart: React.FC<LiveBarChartProps> = ({
  emotions,
  counts,
  totalVotes,
}) => {
  const [sortByCount, setSortByCount] = useState(true);

  // Calculate highest vote
  let maxCount = 0;
  let topEmotion: EmotionItem | null = null;
  emotions.forEach((e) => {
    const c = counts[e.id] || 0;
    if (c > maxCount) {
      maxCount = c;
      topEmotion = e;
    }
  });

  const sortedEmotions = [...emotions].sort((a, b) => {
    if (sortByCount) {
      return (counts[b.id] || 0) - (counts[a.id] || 0);
    }
    return 0; // Default order
  });

  // Calculate category aggregates for high school mood insight
  const categoryStats = {
    positif: 0,
    tenang: 0,
    kelelahan: 0,
    stres: 0,
    fokus: 0,
  };

  emotions.forEach((e) => {
    const c = counts[e.id] || 0;
    categoryStats[e.category] += c;
  });

  return (
    <div className="bg-white rounded-3xl border-4 border-slate-900/10 p-5 sm:p-7 shadow-xl">
      {/* Header with summary and sort toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b-2 border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Grafik Batang Perasaan Kelas
            </h2>
          </div>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Data otomatis terakumulasi langsung dari respon siswa secara real-time
          </p>
        </div>

        {/* Sort and total toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortByCount(!sortByCount)}
            className={`
              px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all cursor-pointer
              ${sortByCount 
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' 
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'}
            `}
          >
            {sortByCount ? 'Urut: Suara Terbanyak' : 'Urut: Default Emosi'}
          </button>
        </div>
      </div>

      {/* Top Banner: Highest Mood of the day */}
      {totalVotes > 0 && topEmotion && (
        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md">
              <Award className="w-6 h-6" />
            </span>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-800">
                Suasana Dominan Kelas Hari Ini
              </span>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>{(topEmotion as EmotionItem).emoji}</span>
                <span>{(topEmotion as EmotionItem).label}</span>
                <span className="text-amber-700 text-sm font-bold">
                  ({maxCount} siswa · {Math.round((maxCount / totalVotes) * 100)}%)
                </span>
              </h3>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-bold text-slate-500">Total Partisipasi</span>
            <span className="text-2xl font-black text-slate-900">{totalVotes} Siswa</span>
          </div>
        </div>
      )}

      {/* Bar Chart list */}
      <div className="mt-6 space-y-3.5">
        {sortedEmotions.map((emotion) => {
          const count = counts[emotion.id] || 0;
          const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
          const isHighest = totalVotes > 0 && count === maxCount && count > 0;

          return (
            <div
              key={emotion.id}
              className={`
                group p-3 rounded-2xl border-2 transition-all
                ${isHighest ? 'border-amber-400 bg-amber-50/40 shadow-sm' : 'border-slate-200 bg-slate-50/60'}
              `}
            >
              {/* Row title & score */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-2xl select-none" role="img" aria-hidden="true">
                    {emotion.emoji}
                  </span>
                  <div className="truncate">
                    <span className="font-black text-sm sm:text-base text-slate-900">
                      {emotion.label}
                    </span>
                    <span className="hidden md:inline text-xs font-medium text-slate-500 ml-2">
                      · {emotion.categoryLabel}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs sm:text-sm font-extrabold text-slate-500">
                    {Math.round(percentage)}%
                  </span>
                  <div
                    className={`
                      px-2.5 py-0.5 rounded-lg text-xs font-black text-white shadow-xs min-w-[50px] text-center
                      ${emotion.accentBg}
                    `}
                  >
                    {count} suara
                  </div>
                </div>
              </div>

              {/* Graphical Bar */}
              <div className="w-full bg-slate-200/80 rounded-full h-4 sm:h-5 overflow-hidden p-0.5">
                <div
                  className={`
                    h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2
                    ${emotion.accentBg}
                  `}
                  style={{
                    width: `${Math.max(percentage, count > 0 ? 5 : 0)}%`,
                  }}
                >
                  {percentage > 15 && (
                    <span className="text-[10px] text-white font-extrabold drop-shadow">
                      {count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Classroom Energy Insights for Teachers */}
      <div className="mt-6 pt-5 border-t-2 border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
          <span className="text-xs font-bold text-amber-800 flex items-center justify-center gap-1">
            <Zap className="w-3.5 h-3.5" /> Positif & Semangat
          </span>
          <span className="text-xl font-black text-amber-950 mt-1 block">
            {categoryStats.positif}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
          <span className="text-xs font-bold text-blue-800 flex items-center justify-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Fokus & Belajar
          </span>
          <span className="text-xl font-black text-blue-950 mt-1 block">
            {categoryStats.fokus}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <span className="text-xs font-bold text-emerald-800">
            Tenang / Rileks
          </span>
          <span className="text-xl font-black text-emerald-950 mt-1 block">
            {categoryStats.tenang}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
          <span className="text-xs font-bold text-rose-800">
            Perlu Rehat / Pusing
          </span>
          <span className="text-xl font-black text-rose-950 mt-1 block">
            {categoryStats.kelelahan + categoryStats.stres}
          </span>
        </div>
      </div>
    </div>
  );
};
