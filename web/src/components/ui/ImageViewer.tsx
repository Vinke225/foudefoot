"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ImageViewerProps {
  mediaUrl: string;
  onClose: () => void;
}

export function ImageViewer({ mediaUrl, onClose }: ImageViewerProps) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-8"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <img 
        src={mediaUrl} 
        alt="Image plein écran" 
        className="max-w-full max-h-full object-contain cursor-default select-none"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image itself
      />
    </div>
  );
}
