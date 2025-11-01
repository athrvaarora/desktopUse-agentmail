'use client';

import { useState } from 'react';
import { useNavigation } from 'desktopuse-sdk';

export function ToggleDemo() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [autoSave, setAutoSave] = useState(false);
  
  const { ref: notificationsRef } = useNavigation({
    id: 'toggle-notifications',
    type: 'toggle',
    label: 'Notifications Toggle',
    availableActions: ['toggle', 'click'],
    metadata: {
      description: `Notifications toggle, currently ${notifications ? 'enabled' : 'disabled'}`,
      checked: notifications
    },
    customActions: {
      toggle: () => setNotifications(prev => !prev),
      enable: () => setNotifications(true),
      disable: () => setNotifications(false)
    }
  });

  const { ref: darkModeRef } = useNavigation({
    id: 'toggle-dark-mode',
    type: 'toggle',
    label: 'Dark Mode Toggle',
    availableActions: ['toggle', 'click'],
    metadata: {
      description: `Dark mode toggle, currently ${darkMode ? 'enabled' : 'disabled'}`,
      checked: darkMode
    },
    customActions: {
      toggle: () => setDarkMode(prev => !prev),
      enable: () => setDarkMode(true),
      disable: () => setDarkMode(false)
    }
  });

  const { ref: autoSaveRef } = useNavigation({
    id: 'toggle-auto-save',
    type: 'toggle',
    label: 'Auto-save Toggle',
    availableActions: ['toggle', 'click'],
    metadata: {
      description: `Auto-save toggle, currently ${autoSave ? 'enabled' : 'disabled'}`,
      checked: autoSave
    },
    customActions: {
      toggle: () => setAutoSave(prev => !prev),
      enable: () => setAutoSave(true),
      disable: () => setAutoSave(false)
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Toggle Component</h2>
        <p className="text-gray-400">
          Control via AI: "turn on notifications", "toggle dark mode", "disable auto-save"
        </p>
      </div>

      <div className="bg-zinc-900 rounded-lg p-8 space-y-6">
        <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
          <div>
            <h3 className="text-white font-medium">Notifications</h3>
            <p className="text-sm text-gray-400">Receive push notifications</p>
          </div>
          <button
            ref={notificationsRef}
            onClick={() => setNotifications(prev => !prev)}
            aria-label="Toggle notifications"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              notifications ? 'bg-[#FF3B8A]' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
          <div>
            <h3 className="text-white font-medium">Dark Mode</h3>
            <p className="text-sm text-gray-400">Use dark theme</p>
          </div>
          <button
            ref={darkModeRef}
            onClick={() => setDarkMode(prev => !prev)}
            aria-label="Toggle dark mode"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              darkMode ? 'bg-[#FF3B8A]' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
          <div>
            <h3 className="text-white font-medium">Auto-save</h3>
            <p className="text-sm text-gray-400">Automatically save changes</p>
          </div>
          <button
            ref={autoSaveRef}
            onClick={() => setAutoSave(prev => !prev)}
            aria-label="Toggle auto-save"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              autoSave ? 'bg-[#FF3B8A]' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                autoSave ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="mt-6 p-4 bg-zinc-800/50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Current Settings:</h4>
          <div className="space-y-1 text-sm">
            <p className="text-gray-400">
              Notifications: <span className={notifications ? 'text-green-400' : 'text-red-400'}>{notifications ? 'Enabled' : 'Disabled'}</span>
            </p>
            <p className="text-gray-400">
              Dark Mode: <span className={darkMode ? 'text-green-400' : 'text-red-400'}>{darkMode ? 'Enabled' : 'Disabled'}</span>
            </p>
            <p className="text-gray-400">
              Auto-save: <span className={autoSave ? 'text-green-400' : 'text-red-400'}>{autoSave ? 'Enabled' : 'Disabled'}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
