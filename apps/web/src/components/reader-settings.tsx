'use client';

import { useReaderStore, type ReaderSettings } from '@/stores/reader';
import { Button } from '@/components/ui';

export function ReaderSettingsPanel() {
  const { settings, isSettingsOpen, toggleSettings, setTheme, setFontSize, setLineHeight, setFontFamily, setMaxWidth, setTextAlign, resetSettings } = useReaderStore();

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" onClick={toggleSettings} />

      {/* Panel */}
      <div
        className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl overflow-y-auto"
        style={{ backgroundColor: 'var(--reader-header-bg, white)' }}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Reader Settings</h2>
          <button onClick={toggleSettings} className="text-gray-400 hover:text-gray-600 text-xl">
            &times;
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
            <div className="grid grid-cols-3 gap-2">
              {(['light', 'sepia', 'dark'] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => setTheme(theme)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    settings.theme === theme
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{
                    backgroundColor: theme === 'light' ? '#f8f9fa' : theme === 'sepia' ? '#f4ecd8' : '#1a1a1a',
                    color: theme === 'dark' ? '#e0e0e0' : '#1a1a1a',
                  }}
                >
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font Size: {settings.fontSize}px
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFontSize(settings.fontSize - 1)}
                disabled={settings.fontSize <= 14}
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-lg hover:bg-gray-50 disabled:opacity-50"
              >
                A<span className="text-xs">-</span>
              </button>
              <input
                type="range"
                min="14"
                max="28"
                value={settings.fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="flex-1"
              />
              <button
                onClick={() => setFontSize(settings.fontSize + 1)}
                disabled={settings.fontSize >= 28}
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-xl hover:bg-gray-50 disabled:opacity-50"
              >
                A<span className="text-xs">+</span>
              </button>
            </div>
          </div>

          {/* Line Height */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Line Spacing: {settings.lineHeight.toFixed(1)}
            </label>
            <input
              type="range"
              min="1.4"
              max="2.2"
              step="0.1"
              value={settings.lineHeight}
              onChange={(e) => setLineHeight(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Tight</span>
              <span>Relaxed</span>
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Font</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'serif', label: 'Serif', sample: 'Aa' },
                { value: 'sans-serif', label: 'Sans', sample: 'Aa' },
                { value: 'mono', label: 'Mono', sample: 'Aa' },
              ] as const).map((font) => (
                <button
                  key={font.value}
                  onClick={() => setFontFamily(font.value)}
                  className={`px-3 py-3 text-sm rounded-lg border transition-colors ${
                    settings.fontFamily === font.value
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{
                    fontFamily: font.value === 'serif'
                      ? 'Georgia, serif'
                      : font.value === 'sans-serif'
                        ? 'system-ui, sans-serif'
                        : 'Consolas, monospace',
                  }}
                >
                  <div className="text-xl mb-1">{font.sample}</div>
                  <div className="text-xs">{font.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Content Width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content Width</label>
            <div className="grid grid-cols-3 gap-2">
              {(['narrow', 'medium', 'wide'] as const).map((width) => (
                <button
                  key={width}
                  onClick={() => setMaxWidth(width)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    settings.maxWidth === width
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {width.charAt(0).toUpperCase() + width.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Text Align */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Text Alignment</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'left', label: 'Left', icon: '|||' },
                { value: 'justify', label: 'Justify', icon: '||||' },
              ] as const).map((align) => (
                <button
                  key={align.value}
                  onClick={() => setTextAlign(align.value)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    settings.textAlign === align.value
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {align.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <div className="pt-4 border-t border-gray-200">
            <Button variant="outline" className="w-full" onClick={resetSettings}>
              Reset to Defaults
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReaderSettingsButton() {
  const { toggleSettings } = useReaderStore();

  return (
    <button
      onClick={toggleSettings}
      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      title="Reader Settings"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
  );
}
