import React, { useState } from 'react';
import { VoteRecord } from '../types/emotion';
import { exportToCSV, generateCanvaTableClipboardText } from '../utils/storage';
import { FileSpreadsheet, Download, Copy, Check, Search, ShieldCheck, RefreshCw } from 'lucide-react';

interface CanvaSheetViewProps {
  votes: VoteRecord[];
  sessionName: string;
  onClearSessionPrompt: () => void;
}

export const CanvaSheetView: React.FC<CanvaSheetViewProps> = ({
  votes,
  sessionName,
  onClearSessionPrompt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  const filteredVotes = votes.filter((v) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      v.emotionLabel.toLowerCase().includes(term) ||
      v.anonymousStudentId.toLowerCase().includes(term) ||
      v.categoryLabel.toLowerCase().includes(term) ||
      v.timestamp.toLowerCase().includes(term)
    );
  });

  const handleCopyForCanva = () => {
    const tableText = generateCanvaTableClipboardText(votes);
    navigator.clipboard.writeText(tableText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadCSV = () => {
    exportToCSV(votes, sessionName);
  };

  return (
    <div className="bg-white rounded-3xl border-4 border-slate-900/10 p-5 sm:p-7 shadow-xl">
      {/* Canva Sheet Title Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b-2 border-slate-100">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-gradient-to-tr from-cyan-600 to-purple-600 text-white rounded-2xl shadow-md">
              <FileSpreadsheet className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Canva Sheet: Data Pilihan Anonim
                </h2>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Auto-Saved
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-500 mt-0.5">
                Pencatatan otomatis per respons siswa Kelas 11 untuk bahan evaluasi & refleksi guru
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons: Download CSV, Copy for Canva, Reset */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadCSV}
            disabled={votes.length === 0}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-sm
              ${votes.length > 0
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
            `}
            title="Download CSV yang kompatibel dengan Canva Sheet & Excel"
          >
            <Download className="w-4 h-4" />
            Unduh CSV
          </button>

          <button
            onClick={handleCopyForCanva}
            disabled={votes.length === 0}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-sm border-2
              ${votes.length > 0
                ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 active:scale-95'
                : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'}
            `}
            title="Salin tabel untuk langsung dipaste ke slide Canva atau spreadsheet"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Salin ke Canva Table
              </>
            )}
          </button>

          <button
            onClick={onClearSessionPrompt}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atur Ulang
          </button>
        </div>
      </div>

      {/* Filter and stats banner */}
      <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari emosi, kode siswa, atau waktu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Privasi Terjaga: 100% Anonim</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-900 font-extrabold">{votes.length} entri terekam</span>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="mt-4 border-2 border-slate-200 rounded-2xl overflow-hidden shadow-inner">
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-100/90 sticky top-0 z-10 border-b-2 border-slate-200">
              <tr className="text-xs font-black uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4 w-12 text-center border-r border-slate-200">#</th>
                <th className="py-3 px-4 w-36 border-r border-slate-200">ID Anonim</th>
                <th className="py-3 px-4 w-48 border-r border-slate-200">Waktu (WIB)</th>
                <th className="py-3 px-4 w-20 text-center border-r border-slate-200">Emotikon</th>
                <th className="py-3 px-4 border-r border-slate-200">Perasaan Siswa</th>
                <th className="py-3 px-4 w-36 border-r border-slate-200">Kategori Emosi</th>
                <th className="py-3 px-4">Sesi Kelas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredVotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">
                      {votes.length === 0
                        ? 'Belum ada data masuk. Sentuh salah satu emotikon di atas untuk merekam perasaan!'
                        : 'Tidak ada data yang sesuai dengan pencarian.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredVotes.map((v, i) => (
                  <tr
                    key={v.id}
                    className={`hover:bg-indigo-50/40 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                  >
                    <td className="py-2.5 px-4 text-center font-bold text-slate-400 border-r border-slate-100 text-xs">
                      {v.index}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-xs font-bold text-indigo-700 border-r border-slate-100">
                      {v.anonymousStudentId}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-600 border-r border-slate-100 whitespace-nowrap">
                      {v.timestamp}
                    </td>
                    <td className="py-2.5 px-4 text-center text-2xl border-r border-slate-100 select-none">
                      {v.emotionEmoji}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 border-r border-slate-100">
                      {v.emotionLabel}
                    </td>
                    <td className="py-2.5 px-4 text-xs font-semibold text-slate-600 border-r border-slate-100">
                      {v.categoryLabel}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-500 truncate max-w-[140px]">
                      {v.sessionName}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer hint */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>Format tabel siap paste ke Canva Whiteboard / Google Sheets</span>
        <span>Penyimpanan lokal otomatis tersimpan di peramban (Local Storage)</span>
      </div>
    </div>
  );
};
