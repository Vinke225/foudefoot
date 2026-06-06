"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";

interface SafeImageProps extends Omit<ImageProps, "onError" | "src"> {
  src: string;
  fallbackSrc: string;
}

export default function SafeImage({ src, fallbackSrc, alt, ...props }: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);

  // Pattern React moderne pour réinitialiser un état quand une prop change
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (src !== prevSrc) {
    setPrevSrc(src);
    setHasError(false);
  }

  return (
    <Image
      {...props}
      alt={alt || ""}
      src={hasError || !src ? fallbackSrc : src}
      onError={() => setHasError(true)}
    />
  );
}
