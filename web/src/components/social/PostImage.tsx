"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";

interface PostImageProps {
  mediaUrl: string;
  alt?: string;
}

export function PostImage({ mediaUrl, alt = "Image du post" }: PostImageProps) {
  if (!mediaUrl) return null;

  return (
    <Dialog>
      <DialogTrigger render={<div className="relative w-full max-h-150 flex items-center justify-center rounded-[20px] overflow-hidden mb-4 bg-gray-50 border border-gray-100 cursor-pointer group" />}>
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
      </DialogTrigger>
      
      <DialogContent 
        className="max-w-[100vw] w-screen h-screen p-0 border-none bg-black/95 text-white shadow-none rounded-none flex items-center justify-center" 
        showCloseButton={true}
      >
        <DialogTitle className="sr-only">Visionneuse d&apos;image</DialogTitle>
        <div className="relative w-full h-full max-w-7xl max-h-screen p-4 md:p-12 flex items-center justify-center">
          <Image 
            src={mediaUrl}
            alt={alt}
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
