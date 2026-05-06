// src/components/ErrorState.jsx
import React from "react";
import { AlertTriangle } from "lucide-react";

const ErrorState = ({ message = "Veriler yüklenirken bir sorun oluştu.", onRetry }) => {
  return (
    <div className="rounded-[26px] border border-red-500/20 bg-red-500/10 p-6 text-white shadow-xl shadow-black/20">
      <div className="mb-3 flex items-center gap-3 text-red-400">
        <AlertTriangle size={20} />
        <h3 className="text-lg font-black tracking-tight">Yükleme Hatası</h3>
      </div>

      <p className="mb-5 text-sm leading-7 text-slate-300">{message}</p>

      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-400"
        >
          Tekrar Dene
        </button>
      ) : null}
    </div>
  );
};

export default ErrorState;