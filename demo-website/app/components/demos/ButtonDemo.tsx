'use client';

import { useState } from 'react';
import { useNavigation } from 'desktopuse-sdk';

export function ButtonDemo() {
  const [clickCount, setClickCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const { ref: primaryRef } = useNavigation({
    id: 'primary-button',
    type: 'button',
    label: 'Primary Button',
    availableActions: ['click'],
    metadata: {
      description: `Primary button clicked ${clickCount} times`,
      clickCount
    },
    customActions: {
      click: () => setClickCount(prev => prev + 1),
      reset: () => setClickCount(0)
    }
  });

  const { ref: loadingRef } = useNavigation({
    id: 'loading-button',
    type: 'button',
    label: 'Loading Button',
    availableActions: ['click'],
    metadata: {
      description: `Loading button, currently ${isLoading ? 'loading' : 'idle'}`,
      isLoading
    },
    customActions: {
      click: () => {
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 2000);
      }
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Button Component</h2>
        <p className="text-gray-400">
          Control via AI: "click primary button", "click loading button", "reset counter"
        </p>
      </div>

      <div className="bg-zinc-900 rounded-lg p-8 space-y-8">
        <div ref={primaryRef} className="space-y-4">
          <h3 className="text-lg font-medium text-white">Primary Button</h3>
          <button
            onClick={() => setClickCount(prev => prev + 1)}
            className="px-6 py-3 bg-[#FF3B8A] text-white font-medium rounded-lg hover:bg-[#ff1f75] transition-colors duration-200"
          >
            Click Me ({clickCount})
          </button>
          {clickCount > 0 && (
            <p className="text-sm text-gray-400">
              Button clicked <span className="text-[#FF3B8A] font-bold">{clickCount}</span> times
            </p>
          )}
        </div>

        <div ref={loadingRef} className="space-y-4">
          <h3 className="text-lg font-medium text-white">Loading Button</h3>
          <button
            onClick={() => {
              setIsLoading(true);
              setTimeout(() => setIsLoading(false), 2000);
            }}
            disabled={isLoading}
            className="px-6 py-3 bg-zinc-700 text-white font-medium rounded-lg hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
          >
            {isLoading && (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isLoading ? 'Loading...' : 'Simulate Loading'}
          </button>
        </div>
      </div>
    </div>
  );
}
