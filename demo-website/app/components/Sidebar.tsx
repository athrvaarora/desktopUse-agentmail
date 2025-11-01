'use client';

import { useNavigation } from 'desktopuse-sdk';

interface SidebarProps {
  activeComponent: string;
  onSelectComponent: (component: string) => void;
}

const components = [
  { id: 'slider', label: 'Slider', icon: '━' },
  { id: 'input', label: 'Input', icon: '▭' },
  { id: 'button', label: 'Button', icon: '◉' },
  { id: 'toggle', label: 'Toggle', icon: '⚫' },
  { id: 'select', label: 'Select', icon: '▼' },
  { id: 'textarea', label: 'Textarea', icon: '▢' },
  { id: 'card', label: 'Card', icon: '▭' },
  { id: 'dialog', label: 'Dialog', icon: '▣' },
];

export function Sidebar({ activeComponent, onSelectComponent }: SidebarProps) {
  const navProps = useNavigation({
    id: 'component-sidebar',
    type: 'list',
    label: 'Component Navigation',
    availableActions: ['scroll'],
    metadata: {
      description: 'Navigation sidebar for component showcase',
      componentCount: components.length,
    },
  });

  return (
    <div 
      {...navProps}
      className="w-64 border-r border-gray-800 bg-black overflow-y-auto"
    >
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
          Components
        </h2>
        <nav className="space-y-1">
          {components.map((component) => (
            <SidebarItem
              key={component.id}
              id={component.id}
              label={component.label}
              icon={component.icon}
              isActive={activeComponent === component.id}
              onClick={() => onSelectComponent(component.id)}
            />
          ))}
        </nav>
      </div>
    </div>
  );
}

function SidebarItem({ 
  id, 
  label, 
  icon, 
  isActive, 
  onClick 
}: { 
  id: string; 
  label: string; 
  icon: string; 
  isActive: boolean; 
  onClick: () => void;
}) {
  const navProps = useNavigation({
    id: `nav-item-${id}`,
    type: 'button',
    label: `Navigate to ${label}`,
    parent: 'component-sidebar',
    availableActions: ['click'],
    metadata: {
      description: `Show ${label} component demo`,
      componentType: id,
      isActive,
    },
    // Add custom action as fallback if DOM click doesn't work
    customActions: {
      navigate: () => {
        console.log(`[Sidebar] Custom navigate action called for: ${id}`);
        onClick();
      },
    },
  });

  return (
    <button
      {...navProps}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
        isActive 
          ? 'bg-[#FF3B8A] text-white' 
          : 'text-gray-400 hover:bg-gray-900 hover:text-white'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
