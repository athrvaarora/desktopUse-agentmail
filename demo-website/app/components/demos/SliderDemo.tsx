'use client';

import { useState } from 'react';
import { useNavigation } from 'desktopuse-sdk';

export function SliderDemo() {
  const [value, setValue] = useState(50);
  
  const { ref: sliderRef } = useNavigation({
    id: 'slider-demo',
    type: 'input',
    label: 'Slider Component',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Interactive slider with value ${value}`,
      value,
      min: 0,
      max: 100,
      step: 1
    },
    customActions: {
      setValue: (newValue: number) => {
        setValue(Math.max(0, Math.min(100, newValue)));
      },
      increase: (amount: number) => {
        setValue(prev => Math.min(100, prev + amount));
      },
      decrease: (amount: number) => {
        setValue(prev => Math.max(0, prev - amount));
      }
    }
  });

  return (
    <div className="space-y-6" ref={sliderRef}>
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Slider Component</h2>
        <p className="text-gray-400">
          Control via AI: "set slider to 75", "increase slider by 20", "decrease slider by 10"
        </p>
      </div>

      <div className="bg-zinc-900 rounded-lg p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-4">
            Value: {value}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
            aria-label="Slider control"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Min:</span>
            <span className="ml-2 text-white font-mono">0</span>
          </div>
          <div>
            <span className="text-gray-400">Current:</span>
            <span className="ml-2 text-[#FF3B8A] font-mono font-bold">{value}</span>
          </div>
          <div>
            <span className="text-gray-400">Max:</span>
            <span className="ml-2 text-white font-mono">100</span>
          </div>
        </div>
      </div>
    </div>
  );
}
