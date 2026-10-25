import React from 'react';
import { X, Sparkles, HeartHandshake, Coffee, Target, Smile } from 'lucide-react';

interface ReflectionGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReflectionGuideModal: React.FC<ReflectionGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border-4 border-slate-900 max-w-2xl w-full p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-4 border-b-2 border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                Panduan Refleksi Kelas 11 SMA
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-slate-500">
                Tips Guru BK & Wali Kelas merespons suasana hati murid di awal pelajaran
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

        <div className="mt-5 space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200">
            <div className="flex items-center gap-2 text-amber-900 font-black text-base">
              <Smile className="w-5 h-5 text-amber-600" />
              <span>Jika Banyak yang "Bersemangat" & "On Fire"</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-amber-800 mt-1.5 leading-relaxed">
              Manfaatkan momen ini untuk diskusi aktif, kuis interaktif kelompok, atau pengenalan topik baru yang menantang. Murid sedang berada di frekuensi kognitif prima!
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50 border-2 border-indigo-200">
            <div className="flex items-center gap-2 text-indigo-900 font-black text-base">
              <Coffee className="w-5 h-5 text-indigo-600" />
              <span>Jika Banyak yang "Mengantuk" & "Butuh Healing"</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-indigo-800 mt-1.5 leading-relaxed">
              Lakukan <strong>Ice Breaking 2 Menit</strong>: peregangan fisik ringan (stretching), tepuk konsentrasi, minum air putih, atau berikan apresiasi atas perjuangan tugas mereka sebelum masuk materi inti.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200">
            <div className="flex items-center gap-2 text-rose-900 font-black text-base">
              <HeartHandshake className="w-5 h-5 text-rose-600" />
              <span>Jika Banyak yang "Pusing / Overthinking"</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-rose-800 mt-1.5 leading-relaxed">
              Validasi perasaan mereka: "Kelas 11 memang penuh penyesuaian materi dan tugas. Kita selesaikan langkah demi langkah bersama hari ini ya." Pendekatan empatik menurunkan hormon kortisol siswa.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-200">
            <div className="flex items-center gap-2 text-blue-900 font-black text-base">
              <Target className="w-5 h-5 text-blue-600" />
              <span>Jika Banyak yang "Fokus & Siap Belajar"</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-blue-800 mt-1.5 leading-relaxed">
              Sampaikan tujuan pembelajaran secara jelas dan terstruktur. Murid dengan mode fokus menyukai alur yang jelas, target capaian, dan latihan bertahap.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-extrabold text-sm hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Mengerti & Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
};
