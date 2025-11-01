'use client';

import { useState } from 'react';
import { useNavigation } from 'desktopuse-sdk';
import { Sidebar } from './components/Sidebar';
import { ComponentDemo } from './components/ComponentDemo';
import { AIChat } from './components/AIChat';
import { Logo } from './components/Logo';

export default function Home() {
  const [activeComponent, setActiveComponent] = useState('slider');

  const { ref: pageRef } = useNavigation({
    id: 'demo-website-page',
    type: 'page',
    label: 'Desktop.use Demo Website',
    availableActions: ['click'],
    metadata: {
      description: 'Main demo page showcasing AI-controllable components',
      activeComponent,
      totalComponents: 8
    }
  });

  const { ref: headerRef } = useNavigation({
    id: 'main-header',
    type: 'card',
    label: 'Website Header',
    parent: 'demo-website-page',
    availableActions: ['click'],
    metadata: {
      description: 'Header containing Desktop.use logo'
    }
  });

  return (
    <div ref={pageRef} className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <header ref={headerRef} className="border-b border-gray-800 px-6 py-4">
        <Logo />
      </header>

      {/* Main Content - 3 Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Component Navigation */}
        <Sidebar 
          activeComponent={activeComponent}
          onSelectComponent={setActiveComponent}
        />

        {/* Center - Component Demo */}
        <ComponentDemo activeComponent={activeComponent} />

        {/* Right Sidebar - AI Chat */}
        <AIChat onNavigateToComponent={setActiveComponent} />
      </div>
    </div>
  );
}
