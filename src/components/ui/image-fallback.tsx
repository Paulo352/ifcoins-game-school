import React from 'react';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageFallbackProps {
  className?: string;
  text?: string;
  showIcon?: boolean;
}

export function ImageFallback({ 
  className, 
  text = "Sem imagem", 
  showIcon = true 
}: ImageFallbackProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center bg-muted text-muted-foreground p-4',
      className
    )}>
      {showIcon && <ImageIcon className="h-8 w-8 mb-2 opacity-50" />}
      <span className="text-sm text-center">{text}</span>
    </div>
  );
}