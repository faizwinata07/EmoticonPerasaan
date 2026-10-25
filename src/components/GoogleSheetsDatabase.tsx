import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  ConnectedSheetInfo,
  createMoodDatabaseSpreadsheet,
  batchAppendVotesToSheet,
  readVotesFromSheet,
  clearSheetDataRows,
} from '../services/googleSheets';
import { VoteRecord } from '../types/emotion';
import {
  Database,
  ExternalLink,
  PlusCircle,
  RefreshCw,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Search,
  FileSpreadsheet,
  Link as LinkIcon,
} from 'lucide-react';

interface GoogleSheetsDatabaseProps {
  user: User | null;
  accessToken: string | null;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  connectedSheet: ConnectedSheetInfo | null;
  onConnectedSheetChange: (info: ConnectedSheetInfo | null) => void;
  localVotes: VoteRecord[];
  onSyncLocalVotesToSheet: (sheetVotes: VoteRecord[]) => void;
}

export const GoogleSheetsDatabase: React.FC<GoogleSheetsDatabaseProps> = ({
  user,
  accessToken,
  isLoggingIn,
  onLogin,
  onLogout,
  connectedSheet,
  onConnectedSheetChange,
  localVotes,
  onSyncLocalVotesToSheet,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [customSheetId, setCustomSheetId] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [sheetRecords, setSheetRecords] = useState<VoteRecord[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleCreateNewDatabase = async () => {
    if (!accessToken) {
      showToast('error', 'Silakan masuk dengan akun Google terlebih dahulu');
      return;
    }
    setIsCreating(true);
    try {
      const newSheet = await createMoodDatabaseSpreadsheet(
        accessToken,
        `Radar Emosi Kelas 11 SMA - Database (${new Date().toLocaleDateString('id-ID')})`
      );
      onConnectedSheetChange(newSheet);
      showToast('success', `Database Google Sheets "${newSheet.spreadsheetTitle}" berhasil dibuat dan siap digunakan!`);

      // If there are existing local votes, ask or automatically sync them
      if (localVotes.length > 0) {
        await batchAppendVotesToSheet(accessToken, newSheet.spreadsheetId, newSheet.sheetTitle, localVotes);
        showToast('success', `Database dibuat & ${localVotes.length} data tersimpan langsung disinkronkan!`);
      }
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Gagal membuat Google Spreadsheet baru');
    } finally {
      setIsCreating(false);
    }
  };

  const handleConnectExisting = () => {
    if (!customSheetId.trim()) {
      showToast('error', 'Masukkan ID atau URL Google Spreadsheet');
      return;
    }
    let id = customSheetId.trim();
    if (id.includes('/d/')) {
      const match = id.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        id = match[1];
      }
    }
    const sheetInfo: ConnectedSheetInfo = {
      spreadsheetId: id,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${id}`,
      spreadsheetTitle: 'Google Sheets Terhubung',
      sheetTitle: 'Data_Respon_Murid',
      lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
    };
    onConnectedSheetChange(sheetInfo);
    showToast('success', 'Spreadsheet berhasil dihubungkan sebagai database!');
    setCustomSheetId('');
  };

  const handleSyncAllLocal = async () => {
    if (!accessToken || !connectedSheet) return;
    setIsSyncing(true);
    try {
      await batchAppendVotesToSheet(
        accessToken,
        connectedSheet.spreadsheetId,
        connectedSheet.sheetTitle,
        localVotes
      );
      const updatedInfo: ConnectedSheetInfo = {
        ...connectedSheet,
        lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
      };
      onConnectedSheetChange(updatedInfo);
      showToast('success', `Berhasil menyinkronkan ${localVotes.length} data suara ke Google Sheets!`);
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Gagal sinkronisasi data');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFetchFromSheet = async () => {
    if (!accessToken || !connectedSheet) return;
    setIsReading(true);
    try {
      const records = await readVotesFromSheet(
        accessToken,
        connectedSheet.spreadsheetId,
        connectedSheet.sheetTitle
      );
      setSheetRecords(records);
      onSyncLocalVotesToSheet(records);
      showToast('success', `Berhasil memuat ${records.length} data langsung dari Google Sheets!`);
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Gagal memuat data dari spreadsheet');
    } finally {
      setIsReading(false);
    }
  };

  const handleClearSheetConfirmed = async () => {
    if (!accessToken || !connectedSheet) return;
    try {
      await clearSheetDataRows(accessToken, connectedSheet.spreadsheetId, connectedSheet.sheetTitle);
      setSheetRecords([]);
      setShowClearConfirm(false);
      showToast('success', 'Baris data di Google Sheets berhasil dikosongkan.');
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Gagal mengosongkan Google Sheets');
    }
  };

  const displayedRecords = (sheetRecords.length > 0 ? sheetRecords : localVotes).filter((r) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      r.emotionLabel.toLowerCase().includes(q) ||
      r.anonymousStudentId.toLowerCase().includes(q) ||
      r.categoryLabel.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-3xl border-4 border-slate-900/10 p-5 sm:p-7 shadow-xl space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b-2 border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-2xl shadow-md">
            <Database className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Database Google Sheets
              </h2>
              {connectedSheet && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Cloud Database Aktif
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-500 mt-0.5">
              Simpan dan sinkronkan data perasaan murid secara permanen ke akun Google Spreadsheet Anda
            </p>
          </div>
        </div>

        {/* Auth / Account Profile */}
        <div>
          {!user ? (
            <button
              onClick={onLogin}
              disabled={isLoggingIn}
              className="flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl border-2 border-slate-300 shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isLoggingIn ? 'Menghubungkan...' : 'Sign in with Google'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-slate-50 p-1.5 pl-3 pr-2 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full border border-slate-300" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                    {user.email ? user.email[0].toUpperCase() : 'G'}
                  </div>
                )}
                <div className="leading-tight">
                  <span className="block text-xs font-black text-slate-800">{user.displayName || 'Akun Google'}</span>
                  <span className="block text-[11px] text-slate-500 font-mono truncate max-w-[150px]">{user.email}</span>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
              >
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border-2 flex items-center gap-3 text-sm font-bold ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Content based on auth and sheet status */}
      {!user ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
          <Database className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-black text-slate-800">
            Hubungkan Akun Google untuk Mengaktifkan Google Sheets Database
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
            Dengan menghubungkan Google Sheets, seluruh data pilihan emosi siswa dari papan interaktif akan otomatis tersimpan sebagai basis data cloud di Google Drive Anda.
          </p>
          <button
            onClick={onLogin}
            disabled={isLoggingIn}
            className="inline-flex items-center gap-3 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Database className="w-4 h-4" />
            <span>{isLoggingIn ? 'Membuka Google Login...' : 'Masuk dengan Google & Aktifkan Sheets'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Connected Sheet Card or Setup Card */}
          {connectedSheet ? (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                    <h3 className="font-black text-lg text-emerald-950">
                      {connectedSheet.spreadsheetTitle}
                    </h3>
                  </div>
                  <p className="text-xs text-emerald-800 font-mono">
                    ID: {connectedSheet.spreadsheetId} · Tab: {connectedSheet.sheetTitle}
                  </p>
                  {connectedSheet.lastSyncedAt && (
                    <p className="text-xs font-semibold text-emerald-700">
                      Terakhir disinkronkan: {connectedSheet.lastSyncedAt} WIB
                    </p>
                  )}
                </div>

                {/* Database Quick Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={connectedSheet.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-bold text-xs shadow-xs hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Buka di Google Sheets
                  </a>

                  <button
                    onClick={handleSyncAllLocal}
                    disabled={isSyncing || localVotes.length === 0}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    {isSyncing ? 'Menyinkronkan...' : `Sinkronkan ${localVotes.length} Data Lokal`}
                  </button>

                  <button
                    onClick={handleFetchFromSheet}
                    disabled={isReading}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isReading ? 'animate-spin' : ''}`} />
                    {isReading ? 'Memuat...' : 'Muat dari Sheets'}
                  </button>

                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                    title="Kosongkan data di Google Sheets"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Auto create new database */}
              <div className="p-6 rounded-2xl bg-emerald-50/70 border-2 border-emerald-300 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-3">
                    <PlusCircle className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-lg text-slate-900">Buat Database Otomatis</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Buat Google Spreadsheet baru di Google Drive Anda dengan struktur kolom dan format siap pakai dalam 1 klik.
                  </p>
                </div>
                <button
                  onClick={handleCreateNewDatabase}
                  disabled={isCreating}
                  className="mt-4 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isCreating ? 'Sedang Membuat Spreadsheet...' : 'Buat Database Google Sheets Baru'}
                </button>
              </div>

              {/* Option 2: Connect existing spreadsheet */}
              <div className="p-6 rounded-2xl bg-slate-50 border-2 border-slate-300 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center mb-3">
                    <LinkIcon className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-lg text-slate-900">Hubungkan Spreadsheet yang Ada</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Gunakan file Google Sheets yang sudah Anda miliki dengan menempelkan URL atau Spreadsheet ID.
                  </p>
                  <input
                    type="text"
                    placeholder="URL atau ID Spreadsheet..."
                    value={customSheetId}
                    onChange={(e) => setCustomSheetId(e.target.value)}
                    className="mt-3 w-full px-3 py-2 rounded-xl border-2 border-slate-200 text-xs focus:outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
                <button
                  onClick={handleConnectExisting}
                  className="mt-4 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  Hubungkan Spreadsheet
                </button>
              </div>
            </div>
          )}

          {/* Database Live Table View */}
          <div className="border-2 border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-100 p-3.5 border-b-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span className="font-black text-sm text-slate-800">
                  Data Baris Database: {displayedRecords.length} Catatan
                </span>
                {connectedSheet && (
                  <span className="text-xs text-slate-500">
                    (Sinkron otomatis setiap murid memencet emotikon)
                  </span>
                )}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari dalam database..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-800 text-white sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3 w-32">ID Siswa</th>
                    <th className="py-2.5 px-3 w-44">Waktu (WIB)</th>
                    <th className="py-2.5 px-3 w-16 text-center">Emoji</th>
                    <th className="py-2.5 px-3">Perasaan Siswa</th>
                    <th className="py-2.5 px-3 w-32">Kategori</th>
                    <th className="py-2.5 px-3">Sesi Kelas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {displayedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        Belum ada rekaman data di Google Sheets database.
                      </td>
                    </tr>
                  ) : (
                    displayedRecords.map((r, i) => (
                      <tr key={r.id || i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="py-2 px-3 text-center text-slate-400 font-bold">{r.index}</td>
                        <td className="py-2 px-3 font-mono text-emerald-800 font-bold">{r.anonymousStudentId}</td>
                        <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{r.timestamp}</td>
                        <td className="py-2 px-3 text-center text-xl select-none">{r.emotionEmoji}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{r.emotionLabel}</td>
                        <td className="py-2 px-3 text-slate-600">{r.categoryLabel}</td>
                        <td className="py-2 px-3 text-slate-500 truncate max-w-[140px]">{r.sessionName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory User Confirmation Dialog for Destructive Operations on Google Sheets */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border-4 border-slate-900 max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertCircle className="w-8 h-8" />
              <h4 className="text-xl font-black text-slate-900">Kosongkan Data Google Sheets?</h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Tindakan ini akan menghapus semua baris respon siswa di tab <strong>"{connectedSheet?.sheetTitle}"</strong> pada Google Spreadsheet: <strong>"{connectedSheet?.spreadsheetTitle}"</strong>. Baris judul header akan tetap dipertahankan.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl border-2 border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleClearSheetConfirmed}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md cursor-pointer"
              >
                Ya, Kosongkan Baris Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
