import { PostImage } from "./PostImage";
import Link from "next/link";

interface PostContentProps {
  caption?: string | null;
  mediaUrl?: string | null;
}

export function PostContent({ caption, mediaUrl }: PostContentProps) {
  const isTextBackground = mediaUrl?.startsWith('bg:');
  const textBackgroundColor = isTextBackground && mediaUrl ? mediaUrl.substring(3) : null;

  const renderCaptionWithMentions = (text: string | null | undefined, isBackground: boolean) => {
    if (!text) return null;
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@') && part.length > 1) {
        return (
          <span 
            key={index} 
            className={isBackground ? 'text-blue-200 cursor-pointer hover:underline' : 'text-blue-600 cursor-pointer hover:underline'}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  if (isTextBackground) {
    return (
      <div 
        className="rounded-2xl mb-3 flex items-center justify-center p-8 min-h-62.5 whitespace-pre-wrap"
        style={{ backgroundColor: textBackgroundColor || '#000' }}
      >
        <p className="text-white text-2xl font-bold text-center leading-relaxed">
          {renderCaptionWithMentions(caption, true)}
        </p>
      </div>
    );
  }

  return (
    <>
      {!!caption && (
        <p className="text-[15px] mb-3 leading-relaxed text-gray-800 whitespace-pre-wrap">
          {renderCaptionWithMentions(caption, false)}
        </p>
      )}
      
      {mediaUrl && (
        <PostImage mediaUrl={mediaUrl} />
      )}
    </>
  );
}
