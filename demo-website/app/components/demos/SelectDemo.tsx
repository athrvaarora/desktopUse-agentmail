'use client';

import { useState } from 'react';
import { useNavigation } from 'desktopuse-sdk';

export function SelectDemo() {
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('en');
  
  const { ref: countryRef } = useNavigation({
    id: 'country-select',
    type: 'select',
    label: 'Country Selector',
    availableActions: ['select'],
    metadata: {
      description: `Country selector, selected: ${country || 'none'}`,
      value: country,
      options: [
        { label: 'USA', value: 'USA' },
        { label: 'UK', value: 'UK' },
        { label: 'Canada', value: 'Canada' },
        { label: 'Australia', value: 'Australia' },
        { label: 'Germany', value: 'Germany' },
        { label: 'France', value: 'France' }
      ]
    },
    onValueChange: setCountry,
    customActions: {
      selectUSA: () => setCountry('USA'),
      selectUK: () => setCountry('UK'),
      selectCanada: () => setCountry('Canada')
    }
  });

  const { ref: languageRef } = useNavigation({
    id: 'language-select',
    type: 'select',
    label: 'Language Selector',
    availableActions: ['select'],
    metadata: {
      description: `Language selector, selected: ${language}`,
      value: language,
      options: [
        { label: 'en', value: 'en' },
        { label: 'es', value: 'es' },
        { label: 'fr', value: 'fr' },
        { label: 'de', value: 'de' },
        { label: 'ja', value: 'ja' },
        { label: 'zh', value: 'zh' }
      ]
    },
    onValueChange: setLanguage
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Select Component</h2>
        <p className="text-gray-400">
          Control via AI: "select USA", "choose French language", "set country to Canada"
        </p>
      </div>

      <div className="bg-zinc-900 rounded-lg p-8 space-y-6">
        <div ref={countryRef}>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Country
          </label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            aria-label="Select country"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF3B8A] focus:border-transparent"
          >
            <option value="">Select a country</option>
            <option value="USA">United States</option>
            <option value="UK">United Kingdom</option>
            <option value="Canada">Canada</option>
            <option value="Australia">Australia</option>
            <option value="Germany">Germany</option>
            <option value="France">France</option>
          </select>
          {country && (
            <p className="mt-2 text-sm text-gray-400">
              Selected: <span className="text-[#FF3B8A] font-medium">{country}</span>
            </p>
          )}
        </div>

        <div ref={languageRef}>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="Select language"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF3B8A] focus:border-transparent"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="ja">日本語</option>
            <option value="zh">中文</option>
          </select>
          <p className="mt-2 text-sm text-gray-400">
            Selected: <span className="text-[#FF3B8A] font-medium">{language}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
