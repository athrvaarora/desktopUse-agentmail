'use client';

import { useState } from 'react';
import { useNavigation } from 'desktopuse-sdk';

export function InputDemo() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  
  const { ref: emailRef } = useNavigation({
    id: 'email-input',
    type: 'input',
    label: 'Email Input',
    availableActions: ['type', 'clear'],
    metadata: {
      description: `Email input field with value: ${email}`,
      value: email,
      placeholder: 'Enter your email'
    },
    onValueChange: setEmail,
    customActions: {
      clear: () => setEmail('')
    }
  });

  const { ref: nameRef } = useNavigation({
    id: 'name-input',
    type: 'input',
    label: 'Name Input',
    availableActions: ['type', 'clear'],
    metadata: {
      description: `Name input field with value: ${name}`,
      value: name,
      placeholder: 'Enter your name'
    },
    onValueChange: setName,
    customActions: {
      clear: () => setName('')
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Input Component</h2>
        <p className="text-gray-400">
          Control via AI: "type john@example.com in email", "clear name field", "enter John Doe in name"
        </p>
      </div>

      <div className="bg-zinc-900 rounded-lg p-8 space-y-6">
        <div ref={emailRef}>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF3B8A] focus:border-transparent"
          />
          {email && (
            <p className="mt-2 text-sm text-gray-400">
              Current value: <span className="text-[#FF3B8A] font-mono">{email}</span>
            </p>
          )}
        </div>

        <div ref={nameRef}>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF3B8A] focus:border-transparent"
          />
          {name && (
            <p className="mt-2 text-sm text-gray-400">
              Current value: <span className="text-[#FF3B8A] font-mono">{name}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
