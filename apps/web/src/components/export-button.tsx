'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui';

interface ExportButtonProps {
  storyId: string;
  storyTitle: string;
}

export function ExportButton({ storyId, storyTitle }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [includeAuthorNotes, setIncludeAuthorNotes] = useState(true);
  const [includeTableOfContents, setIncludeTableOfContents] = useState(true);

  const options = { includeAuthorNotes, includeTableOfContents };

  const handleExport = (format: 'pdf' | 'epub' | 'html') => {
    let url: string;
    switch (format) {
      case 'pdf':
        url = api.getExportPdfUrl(storyId, options);
        break;
      case 'epub':
        url = api.getExportEpubUrl(storyId, options);
        break;
      case 'html':
        url = api.getExportHtmlUrl(storyId, options);
        break;
    }
    window.open(url, '_blank');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-1"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Download
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-3 border-b border-gray-100">
              <h3 className="font-medium text-gray-900 text-sm">Export Options</h3>
            </div>

            <div className="p-3 space-y-3 border-b border-gray-100">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={includeTableOfContents}
                  onChange={(e) => setIncludeTableOfContents(e.target.checked)}
                  className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                />
                Include table of contents
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={includeAuthorNotes}
                  onChange={(e) => setIncludeAuthorNotes(e.target.checked)}
                  className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                />
                Include author notes
              </label>
            </div>

            <div className="p-2">
              <button
                onClick={() => handleExport('epub')}
                className="w-full px-3 py-2 text-left text-sm rounded hover:bg-gray-50 flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <span>EPUB</span>
                <span className="text-xs text-gray-500 ml-auto">For e-readers</span>
              </button>

              <button
                onClick={() => handleExport('pdf')}
                className="w-full px-3 py-2 text-left text-sm rounded hover:bg-gray-50 flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span>PDF</span>
                <span className="text-xs text-gray-500 ml-auto">For printing</span>
              </button>

              <button
                onClick={() => handleExport('html')}
                className="w-full px-3 py-2 text-left text-sm rounded hover:bg-gray-50 flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                <span>HTML</span>
                <span className="text-xs text-gray-500 ml-auto">For web</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
