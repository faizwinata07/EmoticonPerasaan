import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, Download, X } from 'lucide-react';
import { VoteRecord } from '../types/emotion';
import { exportToCSV } from '../utils/storage';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: (newSessionName?: string) => void;
  votes: VoteRecord[];
  currentSessionName: string;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
  votes,
  currentSessionName,
}) => {
  const [newSessionName, setNewSessionName] = useState(currentSessionName);

  if (!isOpen) return null;

  const handleDownloadBeforeReset = () => {
    exportToCSV(votes, currentSessionName);
  };

  const handleConfirm = () => {
    onConfirmReset(newSessionName.trim() || 'Kelas XI - Sesi Baru');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border-4 border-slate-900 max-w-lg w-full p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900">
                Atur Ulang Sesi Permainan?
              </h3>
              <p className="text-sm font-semibold text-slate-500">
                Konfirmasi pembersihan data papan emosi kelas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mt-5 p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-900 text-sm font-medium">
          Saat ini terdapat <strong>{votes.length} data suara emosi</strong> siswa yang telah terekam. Mengosongkan sesi akan mereset hitungan grafik batang dan lembar data untuk kelas berikutnya.
        </div>

        {/* Optional Download before reset */}
        {votes.length > 0 && (
          <div className="mt-4">
            <button
              onClick={handleDownloadBeforeReset}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-emerald-800 font-bold text-sm hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              Cadangkan & Unduh Canva Sheet (CSV) Sebelum Reset
            </button>
          </div>
        )}

        {/* Change Session Name */}
        <div className="mt-4">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
            Nama Sesi / Kelas Berikutnya
          </label>
          <input
            type="text"
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            placeholder="Contoh: Kelas XI MIPA 1 - Jam Ke-3"
            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-800 text-sm focus:outline-none focus:border-indigo-600"
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-1/2 py-3 px-4 rounded-xl border-2 border-slate-300 text-slate-700 font-extrabold text-sm hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Ya, Kosongkan Sesi
          </button>
        </div>
      </div>
    </div>
  );
};
