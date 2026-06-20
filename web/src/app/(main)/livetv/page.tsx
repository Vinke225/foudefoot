import React from 'react';

export const metadata = {
  title: 'Live TV | Fou de Foot',
  description: 'Watch Live TV',
};

export default function LiveTVPage() {
  return (
    <div className="flex flex-col w-full h-[calc(100vh-100px)] lg:h-[calc(100vh-40px)] bg-white/50 backdrop-blur-md rounded-2xl border border-gray-100 overflow-hidden shadow-sm mt-6">
      <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Live TV</h1>
          <p className="text-sm text-gray-500">Regardez les matchs en direct</p>
        </div>
      </div>
      <div className="flex-1 w-full h-full relative bg-gray-50/50">
        <iframe
          src="/api/proxy-tv"
          className="absolute inset-0 w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms"
          title="Live TV Proxy"
        />
      </div>
    </div>
  );
}
