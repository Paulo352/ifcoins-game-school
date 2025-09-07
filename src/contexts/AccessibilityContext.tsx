import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: (key: keyof AccessibilitySettings, value: boolean) => void;
  announceToScreenReader: (message: string) => void;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  screenReader: false,
  keyboardNavigation: true,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('accessibility-settings');
      return saved ? JSON.parse(saved) : defaultSettings;
    }
    return defaultSettings;
  });

  const [announcements, setAnnouncements] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    
    // Apply accessibility classes to document
    const root = document.documentElement;
    const body = document.body;
    
    root.classList.toggle('high-contrast', settings.highContrast);
    root.classList.toggle('large-text', settings.largeText);
    root.classList.toggle('reduced-motion', settings.reducedMotion);
    
    // Apply reduced motion preference
    if (settings.reducedMotion) {
      body.style.setProperty('--transition-duration', '0s');
      body.style.setProperty('--animation-duration', '0s');
    } else {
      body.style.removeProperty('--transition-duration');
      body.style.removeProperty('--animation-duration');
    }
    
    // Apply large text preference
    if (settings.largeText) {
      body.style.setProperty('--font-size-multiplier', '1.25');
    } else {
      body.style.removeProperty('--font-size-multiplier');
    }
    
    // Apply high contrast preference
    if (settings.highContrast) {
      body.classList.add('high-contrast-mode');
    } else {
      body.classList.remove('high-contrast-mode');
    }
    
    // Announce settings changes
    if (typeof window !== 'undefined') {
      const enabledFeatures = Object.entries(settings)
        .filter(([key, value]) => value && key !== 'keyboardNavigation')
        .map(([key]) => {
          switch (key) {
            case 'highContrast': return 'Alto contraste';
            case 'largeText': return 'Texto grande';
            case 'reducedMotion': return 'Movimento reduzido';
            case 'screenReader': return 'Otimização para leitor de tela';
            default: return key;
          }
        });
      
      if (enabledFeatures.length > 0) {
        announceToScreenReader(`Recursos de acessibilidade ativados: ${enabledFeatures.join(', ')}`);
      }
    }
  }, [settings]);

  const updateSetting = (key: keyof AccessibilitySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const announceToScreenReader = (message: string) => {
    setAnnouncements(prev => [...prev, message]);
    // Clear announcement after it's been read
    setTimeout(() => {
      setAnnouncements(prev => prev.slice(1));
    }, 1000);
  };

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting, announceToScreenReader }}>
      {children}
      
      {/* Screen reader announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        role="status"
      >
        {announcements[announcements.length - 1]}
      </div>
      
      {/* Skip to main content link */}
      <a 
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Pular para o conteúdo principal
      </a>
    </AccessibilityContext.Provider>
  );
}

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};