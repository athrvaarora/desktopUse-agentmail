'use client';

import { useState } from 'react';
import { useNavigation } from 'desktopuse-sdk';

export function TextareaDemo() {
  const [message, setMessage] = useState('');
  const [bio, setBio] = useState('');
  
  const { ref: messageRef } = useNavigation({
    id: 'message-textarea',
    type: 'textarea',
    label: 'Message Textarea',
    availableActions: ['type', 'clear'],
    metadata: {
      description: `Message textarea with ${message.length} characters`,
      value: message,
      charCount: message.length,
      placeholder: 'Enter your message'
    },
    onValueChange: setMessage,
    customActions: {
      clear: () => setMessage(''),
      append: (text: string) => setMessage(prev => prev + text)
    }
  });

  const { ref: bioRef } = useNavigation({
    id: 'bio-textarea',
    type: 'textarea',
    label: 'Bio Textarea',
    availableActions: ['type', 'clear'],
    metadata: {
      description: `Bio textarea with ${bio.length} characters`,
      value: bio,
      charCount: bio.length,
      maxLength: 500,
      placeholder: 'Tell us about yourself'
    },
    onValueChange: (value: string) => setBio(value.slice(0, 500)),
    customActions: {
      clear: () => setBio('')
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Textarea Component</h2>
        <p className="text-gray-400">
          Control via AI: "type Hello World in message", "clear bio field", "append text to message"
        </p>
      </div>

      <div className="bg-zinc-900 rounded-lg p-8 space-y-6">
        <div ref={messageRef}>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message"
            rows={4}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF3B8A] focus:border-transparent resize-none"
          />
          <p className="mt-2 text-sm text-gray-400">
            Characters: <span className="text-[#FF3B8A] font-mono">{message.length}</span>
          </p>
        </div>

        <div ref={bioRef}>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Bio (max 500 characters)
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 500))}
            placeholder="Tell us about yourself"
            rows={6}
            maxLength={500}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF3B8A] focus:border-transparent resize-none"
          />
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-gray-400">
              Characters: <span className="text-[#FF3B8A] font-mono">{bio.length}</span> / 500
            </span>
            <span className={`font-mono ${bio.length >= 500 ? 'text-red-400' : 'text-gray-400'}`}>
              {500 - bio.length} remaining
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
