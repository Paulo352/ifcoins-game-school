import React from 'react';
import { useImageLoader } from '@/hooks/useImageLoader';
import { ImageFallback } from '@/components/ui/image-fallback';
import { cn } from '@/lib/utils';

interface EnhancedCardImageProps {
  src: string | null;
  alt: string;
  className?: string;
  fallbackText?: string;
}

export function EnhancedCardImage({ 
  src, 
  alt, 
  className,
  fallbackText = "Sem imagem" 
}: EnhancedCardImageProps) {
  const imageLoader = useImageLoader(src || '');

  const normalizedSrc = (src || '').trim();
  if (!normalizedSrc) {
    return (
      <div className={cn('relative w-full h-48 rounded-md overflow-hidden bg-muted', className)}>
        <img
          src="/placeholder.svg"
          alt={`Sem imagem: ${alt}`}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }

  return (
    <div className={cn('relative w-full h-48 rounded-md overflow-hidden bg-muted', className)}>
      <img
        {...imageLoader.getImageProps()}
        alt={alt}
        className="w-full h-full object-cover transition-opacity duration-200"
        style={{ opacity: imageLoader.isLoading ? 0.7 : 1 }}
      />
      
      {imageLoader.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      
      {imageLoader.hasError && (
        <ImageFallback 
          className="absolute inset-0"
          text="Erro ao carregar"
        />
      )}
    </div>
  );
}

interface EnhancedCardProps {
  id: string;
  name: string;
  description?: string;
  image_url: string | null;
  rarity: 'common' | 'rare' | 'legendary' | 'mythic';
  price?: number;
  quantity?: number;
  available?: boolean;
  showPrice?: boolean;
  showQuantity?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const rarityStyles = {
  common: 'border-gray-300 bg-gray-50',
  rare: 'border-blue-300 bg-blue-50',
  legendary: 'border-purple-300 bg-purple-50',
  mythic: 'border-yellow-300 bg-yellow-50'
};

const rarityLabels = {
  common: 'Comum',
  rare: 'Rara',
  legendary: 'Lendária',
  mythic: 'Mítica'
};

const rarityColors = {
  common: 'bg-gray-500',
  rare: 'bg-blue-500',
  legendary: 'bg-purple-500',
  mythic: 'bg-yellow-500'
};

export function EnhancedCard({
  id,
  name,
  description,
  image_url,
  rarity,
  price,
  quantity,
  available = true,
  showPrice = false,
  showQuantity = false,
  className,
  children
}: EnhancedCardProps) {
  return (
    <div className={cn(
      'bg-card border rounded-lg overflow-hidden shadow-sm transition-all hover:shadow-md',
      rarityStyles[rarity],
      !available && 'opacity-60',
      className
    )}>
      <div className="relative">
        <EnhancedCardImage
          src={image_url}
          alt={name}
          className="h-48"
        />
        
        {/* Rarity badge */}
        <div className="absolute top-2 right-2">
          <span className={cn(
            'px-2 py-1 rounded-full text-xs font-medium text-white',
            rarityColors[rarity]
          )}>
            {rarityLabels[rarity]}
          </span>
        </div>
        
        {/* Quantity badge */}
        {showQuantity && quantity && (
          <div className="absolute top-2 left-2">
            <span className="bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium">
              x{quantity}
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-1">{name}</h3>
        
        {description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {description}
          </p>
        )}
        
        {showPrice && price && (
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold text-primary">
              {price.toLocaleString('pt-BR')} IFCoins
            </span>
          </div>
        )}
        
        {children}
      </div>
    </div>
  );
}