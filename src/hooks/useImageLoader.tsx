import { useState, useCallback } from 'react';

export interface ImageLoadState {
  src: string;
  isLoading: boolean;
  hasError: boolean;
  attemptedCors: boolean;
}

export function useImageLoader(initialSrc: string = '') {
  const [state, setState] = useState<ImageLoadState>({
    src: initialSrc,
    isLoading: !!initialSrc,
    hasError: false,
    attemptedCors: false,
  });

  console.log('🖼️ ImageLoader - Initial src:', initialSrc, 'State:', state);

  const isExternalUrl = (url: string) => 
    url && !url.includes('supabase.co') && !url.startsWith('/') && !url.startsWith('data:');

  const handleLoad = useCallback(() => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      hasError: false,
    }));
  }, []);

  const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const currentSrc = img.src;

    setState(prev => {
      // Se ainda não tentamos CORS e é uma URL externa
      if (!prev.attemptedCors && isExternalUrl(currentSrc)) {
        // Tentar com CORS
        img.crossOrigin = 'anonymous';
        img.src = currentSrc;
        return {
          ...prev,
          attemptedCors: true,
        };
      }

      // Se já tentamos tudo, usar placeholder
      img.src = '/placeholder.svg';
      return {
        ...prev,
        isLoading: false,
        hasError: true,
      };
    });
  }, []);

  const updateSrc = useCallback((newSrc: string) => {
    console.log('🖼️ ImageLoader - Updating src to:', newSrc);
    setState({
      src: newSrc,
      isLoading: !!newSrc,
      hasError: false,
      attemptedCors: false,
    });
  }, []);

  const getImageProps = useCallback(() => {
    const external = isExternalUrl(state.src);
    return {
      src: state.src,
      loading: 'lazy' as const,
      decoding: 'async' as const,
      referrerPolicy: external ? 'no-referrer' as const : undefined,
      crossOrigin: external ? 'anonymous' as const : undefined,
      onLoad: handleLoad,
      onError: handleError,
    };
  }, [state.src, handleLoad, handleError]);

  return {
    ...state,
    updateSrc,
    getImageProps,
    isExternalUrl: isExternalUrl(state.src),
  };
}