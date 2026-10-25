import { VoteRecord } from '../types/emotion';

const STORAGE_KEY_VOTES = 'radar_emosi_kelas_11_votes_v2';
const STORAGE_KEY_SESSION = 'radar_emosi_kelas_11_session_v2';

export function loadSavedVotes(): VoteRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VOTES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load saved votes', e);
    return [];
  }
}

export function saveVotesToStorage(votes: VoteRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_VOTES, JSON.stringify(votes));
  } catch (e) {
    console.error('Failed to save votes', e);
  }
}

export function loadSessionName(): string {
  if (typeof window === 'undefined') return 'Kelas XI - Sesi Hari Ini';
  try {
    return localStorage.getItem(STORAGE_KEY_SESSION) || 'Kelas XI - Sesi Hari Ini';
  } catch {
    return 'Kelas XI - Sesi Hari Ini';
  }
}

export function saveSessionNameToStorage(sessionName: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_SESSION, sessionName);
  } catch (e) {
    console.error('Failed to save session name', e);
  }
}

export function generateAnonymousStudentId(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `SISWA-XI-${randomNum}`;
}

export function formatWIBDate(date: Date = new Date()): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds} WIB`;
}

/**
 * Export votes to CSV compatible with Canva Sheets, Google Sheets, and Excel
 */
export function exportToCSV(votes: VoteRecord[], sessionName: string): void {
  if (votes.length === 0) return;

  const headers = ['No', 'ID Anonim', 'Waktu (WIB)', 'Emotikon', 'Label Perasaan', 'Kategori', 'Sesi Kelas'];
  const rows = votes.map((v) => [
    v.index,
    `"${v.anonymousStudentId}"`,
    `"${v.timestamp}"`,
    `"${v.emotionEmoji}"`,
    `"${v.emotionLabel}"`,
    `"${v.categoryLabel}"`,
    `"${v.sessionName.replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const cleanSession = sessionName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  link.setAttribute('href', url);
  link.setAttribute('download', `Canva_Sheet_Radar_Emosi_${cleanSession}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Format data as Tab-Separated text so teachers can paste directly into Canva Table or Google Sheets
 */
export function generateCanvaTableClipboardText(votes: VoteRecord[]): string {
  const headers = ['No', 'ID Anonim', 'Waktu (WIB)', 'Emotikon', 'Perasaan', 'Kategori'];
  const rows = votes.map((v) => [
    v.index,
    v.anonymousStudentId,
    v.timestamp,
    v.emotionEmoji,
    v.emotionLabel,
    v.categoryLabel,
  ]);

  return [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
}
