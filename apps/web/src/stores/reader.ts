import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ReaderSettings {
  theme: 'light' | 'sepia' | 'dark';
  fontSize: number; // in px, 14-28
  lineHeight: number; // 1.4-2.2
  fontFamily: 'serif' | 'sans-serif' | 'mono';
  maxWidth: 'narrow' | 'medium' | 'wide';
  textAlign: 'left' | 'justify';
}

interface ReaderState {
  settings: ReaderSettings;
  isSettingsOpen: boolean;
  setTheme: (theme: ReaderSettings['theme']) => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
  setFontFamily: (family: ReaderSettings['fontFamily']) => void;
  setMaxWidth: (width: ReaderSettings['maxWidth']) => void;
  setTextAlign: (align: ReaderSettings['textAlign']) => void;
  toggleSettings: () => void;
  resetSettings: () => void;
}

const defaultSettings: ReaderSettings = {
  theme: 'light',
  fontSize: 18,
  lineHeight: 1.8,
  fontFamily: 'serif',
  maxWidth: 'medium',
  textAlign: 'left',
};

export const useReaderStore = create<ReaderState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      isSettingsOpen: false,
      setTheme: (theme) =>
        set((state) => ({
          settings: { ...state.settings, theme },
        })),
      setFontSize: (fontSize) =>
        set((state) => ({
          settings: { ...state.settings, fontSize: Math.min(28, Math.max(14, fontSize)) },
        })),
      setLineHeight: (lineHeight) =>
        set((state) => ({
          settings: { ...state.settings, lineHeight: Math.min(2.2, Math.max(1.4, lineHeight)) },
        })),
      setFontFamily: (fontFamily) =>
        set((state) => ({
          settings: { ...state.settings, fontFamily },
        })),
      setMaxWidth: (maxWidth) =>
        set((state) => ({
          settings: { ...state.settings, maxWidth },
        })),
      setTextAlign: (textAlign) =>
        set((state) => ({
          settings: { ...state.settings, textAlign },
        })),
      toggleSettings: () =>
        set((state) => ({
          isSettingsOpen: !state.isSettingsOpen,
        })),
      resetSettings: () =>
        set({
          settings: defaultSettings,
        }),
    }),
    {
      name: 'reader-settings',
    }
  )
);

// Helper to get CSS variables from settings
export function getReaderCSSVars(settings: ReaderSettings): Record<string, string> {
  const themes = {
    light: { bg: '#f8f9fa', text: '#1a1a1a', headerBg: '#ffffff' },
    sepia: { bg: '#f4ecd8', text: '#433422', headerBg: '#f9f3e3' },
    dark: { bg: '#1a1a1a', text: '#e0e0e0', headerBg: '#2a2a2a' },
  };

  const fonts = {
    serif: 'Georgia, Cambria, "Times New Roman", serif',
    'sans-serif': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"SF Mono", "Fira Code", "Consolas", monospace',
  };

  const widths = {
    narrow: '600px',
    medium: '720px',
    wide: '900px',
  };

  const theme = themes[settings.theme];

  return {
    '--reader-bg': theme.bg,
    '--reader-text': theme.text,
    '--reader-header-bg': theme.headerBg,
    '--reader-font-size': `${settings.fontSize}px`,
    '--reader-line-height': `${settings.lineHeight}`,
    '--reader-font-family': fonts[settings.fontFamily],
    '--reader-max-width': widths[settings.maxWidth],
    '--reader-text-align': settings.textAlign,
  };
}
