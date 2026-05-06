// src/components/SkeletonCard.jsx
import React from "react";

const SkeletonCard = () => {
  return (
    <div className="animate-pulse rounded-[26px] border border-white/5 bg-[#161b22] p-5 shadow-xl shadow-black/20">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <div className="h-12 w-12 rounded-full bg-white/10" />
          <div className="min-w-0 space-y-2">
            <div className="h-4 w-40 rounded bg-white/10" />
            <div className="h-3 w-28 rounded bg-white/10" />
            <div className="h-6 w-20 rounded-full bg-white/10" />
          </div>
        </div>
        <div className="h-8 w-20 rounded-full bg-white/10" />
      </div>

      <div className="mb-3 h-4 w-full rounded bg-white/10" />
      <div className="mb-3 h-4 w-[92%] rounded bg-white/10" />
      <div className="mb-5 h-4 w-[70%] rounded bg-white/10" />

      <div className="mb-5 grid grid-cols-1 gap-4 rounded-[22px] bg-[#0f1a2d] p-5 md:grid-cols-3">
        <div className="space-y-2">
          <div className="h-3 w-16 rounded bg-white/10" />
          <div className="h-6 w-24 rounded bg-white/10" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-20 rounded bg-white/10" />
          <div className="h-6 w-24 rounded bg-white/10" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-white/10" />
          <div className="h-6 w-24 rounded bg-white/10" />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/5 pt-4">
        <div className="flex gap-6">
          <div className="h-4 w-16 rounded bg-white/10" />
          <div className="h-4 w-16 rounded bg-white/10" />
          <div className="h-4 w-16 rounded bg-white/10" />
        </div>
        <div className="h-5 w-5 rounded bg-white/10" />
      </div>
    </div>
  );
};

export default SkeletonCard;