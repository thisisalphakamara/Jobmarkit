import React from "react";

const SkeletonLoader = () => {
  return (
    <div className="w-full h-full p-8 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-3">
        <div className="h-8 bg-gray-100 rounded-lg w-1/3"></div>
        <div className="h-4 bg-gray-100 rounded-lg w-1/2"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="h-24 bg-gray-100 rounded-xl"></div>
        <div className="h-24 bg-gray-100 rounded-xl"></div>
        <div className="h-24 bg-gray-100 rounded-xl"></div>
        <div className="h-24 bg-gray-100 rounded-xl"></div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-28 bg-gray-100 rounded-xl"></div>
        <div className="h-28 bg-gray-100 rounded-xl"></div>
      </div>

      {/* Pipeline Skeleton */}
      <div>
        <div className="h-6 bg-gray-100 rounded-lg w-1/4 mb-4"></div>
        <div className="h-56 bg-gray-100 rounded-xl"></div>
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-72 bg-gray-100 rounded-xl"></div>
        <div className="h-72 bg-gray-100 rounded-xl"></div>
      </div>
    </div>
  );
};

export default SkeletonLoader;
