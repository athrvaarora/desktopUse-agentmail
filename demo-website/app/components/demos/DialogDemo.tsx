'use client';

import { useState } from 'react';
import { useNavigation } from 'desktopuse-sdk';

export function DialogDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<string>('');
  
  const { ref: dialogRef } = useNavigation({
    id: 'settings-dialog',
    type: 'dialog',
    label: 'Settings Dialog',
    availableActions: ['open', 'close'],
    metadata: {
      description: `Settings dialog, currently ${isOpen ? 'open' : 'closed'}`,
      isOpen
    },
    onOpen: setIsOpen,
    customActions: {
      open: () => setIsOpen(true),
      close: () => setIsOpen(false)
    }
  });

  const { ref: confirmRef } = useNavigation({
    id: 'confirm-dialog',
    type: 'dialog',
    label: 'Confirmation Dialog',
    availableActions: ['open', 'close'],
    metadata: {
      description: `Confirmation dialog, currently ${confirmOpen ? 'open' : 'closed'}`,
      isOpen: confirmOpen
    },
    onOpen: setConfirmOpen,
    customActions: {
      open: () => setConfirmOpen(true),
      close: () => setConfirmOpen(false),
      confirm: () => {
        setResult('Confirmed');
        setConfirmOpen(false);
      },
      cancel: () => {
        setResult('Cancelled');
        setConfirmOpen(false);
      }
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Dialog Component</h2>
        <p className="text-gray-400">
          Control via AI: "open settings dialog", "close dialog", "open confirmation", "confirm action"
        </p>
      </div>

      <div className="bg-zinc-900 rounded-lg p-8 space-y-6">
        <div className="space-y-4">
          <button
            onClick={() => setIsOpen(true)}
            className="px-6 py-3 bg-[#FF3B8A] text-white font-medium rounded-lg hover:bg-[#ff1f75] transition-colors"
          >
            Open Settings Dialog
          </button>

          <button
            onClick={() => setConfirmOpen(true)}
            className="ml-4 px-6 py-3 bg-zinc-700 text-white font-medium rounded-lg hover:bg-zinc-600 transition-colors"
          >
            Open Confirmation Dialog
          </button>

          {result && (
            <div className="mt-4 p-4 bg-zinc-800 rounded-lg">
              <p className="text-sm text-gray-400">
                Last action: <span className="text-[#FF3B8A] font-medium">{result}</span>
              </p>
            </div>
          )}
        </div>

        {/* Settings Dialog */}
        {isOpen && (
          <div ref={dialogRef} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsOpen(false)}>
            <div className="bg-zinc-800 rounded-lg p-6 w-full max-w-md border border-zinc-700" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Settings</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close dialog"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF3B8A]"
                    placeholder="Enter username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF3B8A]"
                    placeholder="Enter email"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setResult('Settings saved');
                    setIsOpen(false);
                  }}
                  className="px-4 py-2 bg-[#FF3B8A] text-white rounded-lg hover:bg-[#ff1f75] transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {confirmOpen && (
          <div ref={confirmRef} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setConfirmOpen(false)}>
            <div className="bg-zinc-800 rounded-lg p-6 w-full max-w-sm border border-zinc-700" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#FF3B8A]/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#FF3B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Confirm Action</h3>
                  <p className="text-sm text-gray-400">Are you sure you want to proceed?</p>
                </div>
              </div>

              <p className="text-sm text-gray-300 mb-6">
                This action cannot be undone. Please confirm to continue.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setResult('Cancelled');
                    setConfirmOpen(false);
                  }}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setResult('Confirmed');
                    setConfirmOpen(false);
                  }}
                  className="px-4 py-2 bg-[#FF3B8A] text-white rounded-lg hover:bg-[#ff1f75] transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
