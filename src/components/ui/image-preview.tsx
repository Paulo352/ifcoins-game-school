import React from 'react';
import { useImageLoader } from '@/hooks/useImageLoader';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ImagePreviewProps {
  src: string;
  alt: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-16 h-16',
  lg: 'w-32 h-32',
};

export function ImagePreview({ 
  src, 
  alt, 
  className, 
  size = 'md' 
}: ImagePreviewProps) {
  const imageLoader = useImageLoader(src);

  return (
    <div className={cn(
      sizeClasses[size],
      'relative bg-muted rounded-md overflow-hidden',
      className
    )}>
      {src ? (
        <>
          <img
            {...imageLoader.getImageProps()}
            alt={alt}
            className="w-full h-full object-cover"
          />
          {imageLoader.isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <Loader2 className="h-3 w-3 animate-spin" />
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Sem imagem</span>
        </div>
      )}
    </div>
  );
}