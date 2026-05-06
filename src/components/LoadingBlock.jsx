// src/components/LoadingBlock.jsx
import React from "react";
import SkeletonCard from "./SkeletonCard";

const LoadingBlock = ({ count = 3 }) => {
  return (
    <div className="space-y-5">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
};

export default LoadingBlock;