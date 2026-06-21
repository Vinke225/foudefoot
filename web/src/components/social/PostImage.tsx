"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageViewer } from "../ui/ImageViewer";

interface PostImageProps {
  mediaUrl: string;
  alt?: string;
}

export function PostImage({ mediaUrl, alt = "Image du post" }: PostImageProps) {
  const [showViewer, setShowViewer] = useState(false);

  if (!mediaUrl) return null;

  return (
    <>
      <div 
        className="relative w-full max-h-150 flex items-center justify-center rounded-[20px] overflow-hidden mb-4 bg-gray-50 border border-gray-100 cursor-pointer group"
        onClick={() => setShowViewer(true)}
      >
        <div className="relative w-full h-100">
          <Image 
            src={mediaUrl}
            alt={alt}
            fill
            className="object-contain"
            unoptimized
          />
          {/* Overlay subtil au survol pour indiquer que c'est cliquable */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />
        </div>
      </div>

      {showViewer && (
        <ImageViewer 
          mediaUrl={mediaUrl} 
          onClose={() => setShowViewer(false)} 
        />
      )}
    </>
  );
}
