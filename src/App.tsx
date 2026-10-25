import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { EMOTIONS_KELAS_11 } from './data/emotions';
import { EmotionItem, VoteRecord, FloatingItem, ViewMode } from './types/emotion';
import {
  loadSavedVotes,
  saveVotesToStorage,
  loadSessionName,
  saveSessionNameToStorage,
  generateAnonymousStudentId,
  formatWIBDate,
} from './utils/storage';
import { playBoingSound, playSuccessChime, playResetSound } from './utils/audio';
import { SmartboardHeader } from './components/SmartboardHeader';
import { EmotionButton } from './components/EmotionButton';
import { FloatingParticles } from './components/FloatingParticles';
import { LiveBarChart } from './components/LiveBarChart';
import { CanvaSheetView } from './components/CanvaSheetView';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { ReflectionGuideModal } from './components/ReflectionGuideModal';
import { Sparkles, Users, Award, HelpCircle } from 'lucide-react';

export default function App() {
  const [votes, setVotes] = useState<VoteRecord[]>(() => loadSavedVotes());
  const [sessionName, setSessionName] = useState<string>(() => loadSessionName());
  const [currentView, setCurrentView] = useState<ViewMode>('interactive_board');
  const [floatingItems, setFloatingItems] = useState<FloatingItem[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [lastVotedEmotion, setLastVotedEmotion] = useState<EmotionItem | null>(null);

  // Compute live counts per emotion
  const counts = React.useMemo(() => {
    const acc: Record<string, number> = {};
    EMOTIONS_KELAS_11.forEach((e) => {
      acc[e.id] = 0;
    });
    votes.forEach((v) => {
      if (acc[v.emotionId] !== undefined) {
        acc[v.emotionId] += 1;
      }
    });
    return acc;
  }, [votes]);

  const totalVotes = votes.length;

  // Persist votes on change
  useEffect(() => {
    saveVotesToStorage(votes);
  }, [votes]);

  // Persist session name
  useEffect(() => {
    saveSessionNameToStorage(sessionName);
  }, [sessionName]);

  // Handle emotion press with bounce, upward floating animation, audio, and record insertion
  const handleEmotionPress = useCallback(
    (emotion: EmotionItem, event: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
      // Audio feedback
      playBoingSound(emotion.audioFrequency, isMuted);

      // Determine coordinate for upward floating particles
      let clientX = window.innerWidth / 2;
      let clientY = window.innerHeight / 2;

      if ('touches' in event && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else if ('clientX' in event && event.clientX !== 0) {
        clientX = event.clientX;
        clientY = event.clientY;
      }

      // Spawn 2-3 floating items drifting upwards
      const newFloaters: FloatingItem[] = [
        {
          id: `float-main-${Date.now()}-${Math.random()}`,
          emoji: emotion.emoji,
          label: emotion.label,
          x: clientX,
          y: clientY - 10,
          size: 64,
          color: emotion.colorHex,
        },
        {
          id: `float-sub-${Date.now()}-${Math.random()}`,
          emoji: emotion.emoji,
          label: emotion.categoryLabel,
          x: clientX + (Math.random() * 60 - 30),
          y: clientY + 15,
          size: 40,
          color: emotion.colorHex,
        },
      ];

      setFloatingItems((prev) => [...prev, ...newFloaters]);
      setLastVotedEmotion(emotion);

      // Clean up floating items after animation finishes
      setTimeout(() => {
        setFloatingItems((prev) =>
          prev.filter((item) => !newFloaters.some((nf) => nf.id === item.id))
        );
      }, 2500);

      // Create new anonymous record for Canva Sheet
      const newRecord: VoteRecord = {
        id: `vote-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        index: votes.length + 1,
        emotionId: emotion.id,
        emotionEmoji: emotion.emoji,
        emotionLabel: emotion.label,
        category: emotion.category,
        categoryLabel: emotion.categoryLabel,
        timestamp: formatWIBDate(new Date()),
        rawTime: Date.now(),
        anonymousStudentId: generateAnonymousStudentId(),
        sessionName: sessionName,
      };

      setVotes((prev) => [...prev, newRecord]);

      // Celebrate milestone touches (e.g., 20, 35, 50 votes)
      const nextTotal = votes.length + 1;
      if (nextTotal % 15 === 0) {
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
          });
          playSuccessChime(isMuted);
        } catch {
          // ignore
        }
      }
    },
    [votes.length, sessionName, isMuted]
  );

  // Handle session reset
  const handleConfirmReset = (newSession?: string) => {
    playResetSound(isMuted);
    setVotes([]);
    if (newSession) {
      setSessionName(newSession);
    }
    setLastVotedEmotion(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900">
      {/* Floating particles rising upward across the screen */}
      <FloatingParticles items={floatingItems} />

      {/* Main Header tailored for Digital Smartboard */}
      <SmartboardHeader
        currentView={currentView}
        onViewChange={setCurrentView}
        sessionName={sessionName}
        totalVotes={totalVotes}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted((prev) => !prev)}
        onResetPrompt={() => setIsResetModalOpen(true)}
        onOpenReflectionGuide={() => setIsGuideOpen(true)}
      />

      {/* Instructions Banner for Smartboard Classroom Use */}
      <div className="bg-amber-400 text-slate-950 font-extrabold px-4 py-2 border-b-2 border-amber-500 text-center text-xs sm:text-sm flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-slate-900" />
        <span>Sentuh emotikon yang paling menggambarkan perasaanmu saat ini! (Pilihan tersimpan anonim secara otomatis)</span>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* VIEW 1: INTERACTIVE BOARD (Big buttons for smartboard tap) */}
        {currentView === 'interactive_board' && (
          <div className="space-y-6">
            {/* Quick status bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border-2 border-slate-300 shadow-sm">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-slate-700 text-sm">
                  Partisipasi Hari Ini: <span className="text-indigo-700 font-black text-base">{totalVotes} Siswa</span>
                </span>
                {lastVotedEmotion && (
                  <span className="hidden md:inline text-xs font-semibold text-slate-400">
                    · Terakhir dipilih: {lastVotedEmotion.emoji} {lastVotedEmotion.label}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView('split_view')}
                  className="text-xs font-black text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                >
                  Lihat Bersama Grafik Batang &rarr;
                </button>
              </div>
            </div>

            {/* Grid of 10 Large Emoticons */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
              {EMOTIONS_KELAS_11.map((emotion) => (
                <EmotionButton
                  key={emotion.id}
                  emotion={emotion}
                  count={counts[emotion.id] || 0}
                  totalVotes={totalVotes}
                  onPress={handleEmotionPress}
                />
              ))}
            </div>

            {/* Quick preview of top emotion */}
            {totalVotes > 0 && (
              <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-bold text-slate-700">
                    Ingin melihat analisis lengkap dan mengunduh data Canva Sheet?
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentView('analytics_chart')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                  >
                    Buka Grafik Batang
                  </button>
                  <button
                    onClick={() => setCurrentView('canva_sheet')}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm cursor-pointer"
                  >
                    Buka Canva Sheet
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: SPLIT VIEW (Emoticon Buttons + Live Bar Chart side-by-side) */}
        {currentView === 'split_view' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: 10 Buttons in 2 columns */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-500">Papan Sentuh Emosi</span>
                <span className="text-xs font-bold text-indigo-600">{totalVotes} suara terekam</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {EMOTIONS_KELAS_11.map((emotion) => (
                  <EmotionButton
                    key={emotion.id}
                    emotion={emotion}
                    count={counts[emotion.id] || 0}
                    totalVotes={totalVotes}
                    onPress={handleEmotionPress}
                  />
                ))}
              </div>
            </div>

            {/* Right Column: Live Bar Chart */}
            <div className="lg:col-span-5 sticky top-4">
              <LiveBarChart
                emotions={EMOTIONS_KELAS_11}
                counts={counts}
                totalVotes={totalVotes}
              />
            </div>
          </div>
        )}

        {/* VIEW 3: LIVE BAR CHART FOCUS */}
        {currentView === 'analytics_chart' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <LiveBarChart
              emotions={EMOTIONS_KELAS_11}
              counts={counts}
              totalVotes={totalVotes}
            />

            {/* Bottom quick action to switch to Canva Sheet */}
            <div className="flex justify-end">
              <button
                onClick={() => setCurrentView('canva_sheet')}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 shadow-md cursor-pointer"
              >
                Lihat Lembar Data Lengkap (Canva Sheet) &rarr;
              </button>
            </div>
          </div>
        )}

        {/* VIEW 4: CANVA SHEET (SPREADSHEET) FOCUS */}
        {currentView === 'canva_sheet' && (
          <div className="space-y-6">
            <CanvaSheetView
              votes={votes}
              sessionName={sessionName}
              onClearSessionPrompt={() => setIsResetModalOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Footer for Interactive Classroom Board */}
      <footer className="bg-white border-t-2 border-slate-200 py-3 px-6 text-center text-xs font-bold text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Papan Interaktif Digital · Bimbingan Konseling & Refleksi Kelas 11 SMA</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Panduan Guru BK
            </button>
            <span>·</span>
            <span>Otomatis Tersimpan ke Canva Sheet</span>
          </div>
        </div>
      </footer>

      {/* Reset Confirmation Modal */}
      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirmReset={handleConfirmReset}
        votes={votes}
        currentSessionName={sessionName}
      />

      {/* Teacher Reflection Guidelines Modal */}
      <ReflectionGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
