export type EmotionCategory = 'positif' | 'tenang' | 'kelelahan' | 'stres' | 'fokus';

export interface EmotionItem {
  id: string;
  emoji: string;
  label: string;
  sublabel: string;
  description: string;
  category: EmotionCategory;
  categoryLabel: string;
  colorHex: string;
  bgLight: string;
  bgBorder: string;
  textDark: string;
  accentBg: string;
  audioFrequency: number;
}

export interface VoteRecord {
  id: string;
  index: number;
  emotionId: string;
  emotionEmoji: string;
  emotionLabel: string;
  category: EmotionCategory;
  categoryLabel: string;
  timestamp: string; // e.g. "25 Okt 2026, 12:50:23 WIB"
  rawTime: number;
  anonymousStudentId: string; // e.g. "SISWA-XI-3891"
  sessionName: string; // e.g. "Kelas XI - Jam Pelajaran 1"
}

export interface FloatingItem {
  id: string;
  emoji: string;
  label: string;
  x: number;
  y: number;
  size: number;
  color: string;
}

export type ViewMode = 'interactive_board' | 'split_view' | 'analytics_chart' | 'canva_sheet';
