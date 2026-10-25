import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { User } from 'firebase/auth';
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
import { initAuth, googleSignIn, logout } from './services/firebaseAuth';
import {
  ConnectedSheetInfo,
  getSavedSheetInfo,
  saveSheetInfo,
  appendVoteToSheet,
} from './services/googleSheets';
import { SmartboardHeader } from './components/SmartboardHeader';
import { EmotionButton } from './components/EmotionButton';
import { FloatingParticles } from './components/FloatingParticles';
import { LiveBarChart } from './components/LiveBarChart';
import { CanvaSheetView } from './components/CanvaSheetView';
import { GoogleSheetsDatabase } from './components/GoogleSheetsDatabase';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { ReflectionGuideModal } from './components/ReflectionGuideModal';
import { Sparkles, Users, Award, HelpCircle, Database, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [votes, setVotes] = useState<VoteRecord[]>(() => loadSavedVotes());
  const [sessionName, setSessionName] = useState<string>(() => loadSessionName());
  const [currentView, setCurrentView] = useState<ViewMode>('interactive_board');
  const [floatingItems, setFloatingItems] = useState<FloatingItem[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [lastVotedEmotion, setLastVotedEmotion] = useState<EmotionItem | null>(null);

  // Google Workspace & Sheets state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [connectedSheet, setConnectedSheet] = useState<ConnectedSheetInfo | null>(() => getSavedSheetInfo());
  const [cloudSyncStatus, setCloudSyncStatus] = useState<string>('');

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser, token) => {
        setUser(authedUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
      }
    } catch (err) {
      console.error('Google Sign In error:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
  };

  const handleConnectedSheetChange = (info: ConnectedSheetInfo | null) => {
    setConnectedSheet(info);
    saveSheetInfo(info);
  };

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

      // Create new anonymous record
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

      // If Google Sheets database is connected, automatically sync this vote directly to cloud!
      if (accessToken && connectedSheet) {
        setCloudSyncStatus('Menyimpan ke Google Sheets...');
        appendVoteToSheet(
          accessToken,
          connectedSheet.spreadsheetId,
          connectedSheet.sheetTitle,
          newRecord
        )
          .then(() => {
            setCloudSyncStatus('Tersimpan di Google Sheets ✓');
            setTimeout(() => setCloudSyncStatus(''), 3000);
          })
          .catch((err) => {
            console.error('Failed to auto-append to Google Sheets', err);
            setCloudSyncStatus('Gagal sync ke Sheets');
          });
      }

      // Celebrate milestone touches (e.g., 15, 30, 45 votes)
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
    [votes.length, sessionName, isMuted, accessToken, connectedSheet]
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
        isSheetConnected={Boolean(connectedSheet && accessToken)}
        onToggleMute={() => setIsMuted((prev) => !prev)}
        onResetPrompt={() => setIsResetModalOpen(true)}
        onOpenReflectionGuide={() => setIsGuideOpen(true)}
      />

      {/* Instructions Banner for Smartboard Classroom Use */}
      <div className="bg-amber-400 text-slate-950 font-extrabold px-4 py-2 border-b-2 border-amber-500 text-center text-xs sm:text-sm flex flex-wrap items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-slate-900" />
        <span>Sentuh emotikon yang paling menggambarkan perasaanmu saat ini! (Pilihan tersimpan anonim secara otomatis)</span>

        {connectedSheet && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950 text-white text-[11px] font-bold ml-2">
            <Database className="w-3 h-3 text-emerald-400" />
            <span>DB: {connectedSheet.spreadsheetTitle.slice(0, 25)}...</span>
            {cloudSyncStatus && <span className="text-emerald-300 font-mono">({cloudSyncStatus})</span>}
          </span>
        )}
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

              <div className="flex items-center gap-3">
                {connectedSheet ? (
                  <button
                    onClick={() => setCurrentView('google_sheets')}
                    className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Database Sheets Aktif</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentView('google_sheets')}
                    className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 cursor-pointer"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>Hubungkan Google Sheets</span>
                  </button>
                )}

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
                    Ingin melihat analisis lengkap atau mengelola database Google Sheets?
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
                    onClick={() => setCurrentView('google_sheets')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <Database className="w-3.5 h-3.5" />
                    Google Sheets Database
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

            {/* Bottom quick actions */}
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                onClick={() => setCurrentView('google_sheets')}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 shadow-md cursor-pointer flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                Buka Database Google Sheets
              </button>
              <button
                onClick={() => setCurrentView('canva_sheet')}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 shadow-md cursor-pointer"
              >
                Lihat Canva Sheet &rarr;
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

        {/* VIEW 5: GOOGLE SHEETS AS DATABASE */}
        {currentView === 'google_sheets' && (
          <div className="space-y-6">
            <GoogleSheetsDatabase
              user={user}
              accessToken={accessToken}
              isLoggingIn={isLoggingIn}
              onLogin={handleLogin}
              onLogout={handleLogout}
              connectedSheet={connectedSheet}
              onConnectedSheetChange={handleConnectedSheetChange}
              localVotes={votes}
              onSyncLocalVotesToSheet={(sheetVotes) => {
                if (sheetVotes && sheetVotes.length > 0) {
                  setVotes(sheetVotes);
                }
              }}
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
            <span>Database Cloud: Google Sheets</span>
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
