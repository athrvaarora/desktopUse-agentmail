'use client';

import { useState } from 'react';
import { useNavigation } from 'desktopuse-sdk';

export function CardDemo() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [likeCount, setLikeCount] = useState(42);
  const [isLiked, setIsLiked] = useState(false);
  
  const { ref: cardRef } = useNavigation({
    id: 'interactive-card',
    type: 'card',
    label: 'Interactive Card',
    availableActions: ['click'],
    metadata: {
      description: `Interactive card, ${isExpanded ? 'expanded' : 'collapsed'}, ${likeCount} likes`,
      isExpanded,
      likeCount,
      isLiked
    },
    customActions: {
      expand: () => setIsExpanded(true),
      collapse: () => setIsExpanded(false),
      toggle: () => setIsExpanded(prev => !prev),
      like: () => {
        if (!isLiked) {
          setLikeCount(prev => prev + 1);
          setIsLiked(true);
        }
      },
      unlike: () => {
        if (isLiked) {
          setLikeCount(prev => prev - 1);
          setIsLiked(false);
        }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Card Component</h2>
        <p className="text-gray-400">
          Control via AI: "expand card", "collapse card", "like the card", "unlike"
        </p>
      </div>

      <div className="bg-zinc-900 rounded-lg p-8">
        <div ref={cardRef} className="bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700">
          {/* Card Image */}
          <div className="h-48 bg-gradient-to-r from-[#FF3B8A] to-[#FF6B9D] flex items-center justify-center">
            <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>

          {/* Card Content */}
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-2">Desktop.use SDK</h3>
            <p className="text-gray-400 text-sm mb-4">
              AI-powered desktop application control via natural language
            </p>

            {isExpanded && (
              <div className="mb-4 p-4 bg-zinc-900 rounded-lg text-sm text-gray-300 space-y-2">
                <p>
                  The Desktop.use SDK allows you to build AI-controllable applications with natural language commands.
                </p>
                <p>
                  Features include component registration, navigation control, real-time state updates, and MCP integration.
                </p>
              </div>
            )}

            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (!isLiked) {
                    setLikeCount(prev => prev + 1);
                  } else {
                    setLikeCount(prev => prev - 1);
                  }
                  setIsLiked(prev => !prev);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isLiked
                    ? 'bg-[#FF3B8A] text-white'
                    : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
                }`}
              >
                <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="font-medium">{likeCount}</span>
              </button>

              <button
                onClick={() => setIsExpanded(prev => !prev)}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-700 text-gray-300 rounded-lg hover:bg-zinc-600 transition-colors"
              >
                {isExpanded ? 'Show Less' : 'Learn More'}
                <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Card Footer */}
          <div className="px-6 py-3 bg-zinc-900 border-t border-zinc-700 flex items-center justify-between text-sm text-gray-400">
            <span>Published on NPM</span>
            <span className="text-[#FF3B8A] font-mono">v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
