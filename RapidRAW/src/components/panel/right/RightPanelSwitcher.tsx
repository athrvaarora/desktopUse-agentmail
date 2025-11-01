import { SlidersHorizontal, Info, Scaling, BrainCircuit, Bookmark, Save, Layers } from 'lucide-react';
import { Panel } from '../../ui/AppProperties';
import { useNavigation } from 'desktopuse-sdk';

interface PanelOptions {
  icon: any;
  id: Panel;
  title: string;
}

interface RightPanelSwitcherProps {
  activePanel: Panel | null;
  onPanelSelect(id: Panel): void;
}

const panelOptions: Array<PanelOptions> = [
  { id: Panel.Metadata, icon: Info, title: 'Metadata' },
  { id: Panel.Adjustments, icon: SlidersHorizontal, title: 'Adjustments' },
  { id: Panel.Crop, icon: Scaling, title: 'Crop' },
  { id: Panel.Masks, icon: Layers, title: 'Masks' },
  { id: Panel.Presets, icon: Bookmark, title: 'Presets' },
  { id: Panel.Ai, icon: BrainCircuit, title: 'AI Tools' },
  { id: Panel.Export, icon: Save, title: 'Export' },
];

export default function RightPanelSwitcher({ activePanel, onPanelSelect }: RightPanelSwitcherProps) {
  // Tag Metadata button
  const { ref: metadataRef } = useNavigation({
    id: 'metadata-panel-button',
    type: 'button',
    label: 'Metadata Panel Button',
    availableActions: ['click'],
    metadata: {
      description: 'Open Metadata panel to view image information (EXIF, camera settings, file details)',
      isActive: activePanel === Panel.Metadata,
      panelId: Panel.Metadata,
    },
    customActions: {
      open: () => onPanelSelect(Panel.Metadata),
      select: () => onPanelSelect(Panel.Metadata),
    },
  });

  // Tag Adjustments button
  const { ref: adjustmentsRef } = useNavigation({
    id: 'adjustments-panel-button',
    type: 'button',
    label: 'Adjustments Panel Button',
    availableActions: ['click'],
    metadata: {
      description: 'Open Adjustments panel for photo editing controls (exposure, color, curves, effects)',
      isActive: activePanel === Panel.Adjustments,
      panelId: Panel.Adjustments,
    },
    customActions: {
      open: () => onPanelSelect(Panel.Adjustments),
      select: () => onPanelSelect(Panel.Adjustments),
    },
  });

  // Tag Crop button
  const { ref: cropRef } = useNavigation({
    id: 'crop-panel-button',
    type: 'button',
    label: 'Crop Panel Button',
    availableActions: ['click'],
    metadata: {
      description: 'Open Crop panel to adjust image framing and aspect ratio',
      isActive: activePanel === Panel.Crop,
      panelId: Panel.Crop,
    },
    customActions: {
      open: () => onPanelSelect(Panel.Crop),
      select: () => onPanelSelect(Panel.Crop),
    },
  });

  // Tag Masks button
  const { ref: masksRef } = useNavigation({
    id: 'masks-panel-button',
    type: 'button',
    label: 'Masks Panel Button',
    availableActions: ['click'],
    metadata: {
      description: 'Open Masks panel for selective editing with layer masks',
      isActive: activePanel === Panel.Masks,
      panelId: Panel.Masks,
    },
    customActions: {
      open: () => onPanelSelect(Panel.Masks),
      select: () => onPanelSelect(Panel.Masks),
    },
  });

  // Tag Presets button
  const { ref: presetsRef } = useNavigation({
    id: 'presets-panel-button',
    type: 'button',
    label: 'Presets Panel Button',
    availableActions: ['click'],
    metadata: {
      description: 'Open Presets panel to save, load, and manage adjustment presets',
      isActive: activePanel === Panel.Presets,
      panelId: Panel.Presets,
    },
    customActions: {
      open: () => onPanelSelect(Panel.Presets),
      select: () => onPanelSelect(Panel.Presets),
    },
  });

  // Tag AI Tools button
  const { ref: aiRef } = useNavigation({
    id: 'ai-tools-panel-button',
    type: 'button',
    label: 'AI Tools Panel Button',
    availableActions: ['click'],
    metadata: {
      description: 'Open AI Tools panel for AI-powered image enhancement features',
      isActive: activePanel === Panel.Ai,
      panelId: Panel.Ai,
    },
    customActions: {
      open: () => onPanelSelect(Panel.Ai),
      select: () => onPanelSelect(Panel.Ai),
    },
  });

  // Tag Export button
  const { ref: exportRef } = useNavigation({
    id: 'export-panel-button',
    type: 'button',
    label: 'Export Panel Button',
    availableActions: ['click'],
    metadata: {
      description: 'Open Export panel to save edited images with format and quality settings',
      isActive: activePanel === Panel.Export,
      panelId: Panel.Export,
    },
    customActions: {
      open: () => onPanelSelect(Panel.Export),
      select: () => onPanelSelect(Panel.Export),
    },
  });

  const panelRefs = {
    [Panel.Metadata]: metadataRef,
    [Panel.Adjustments]: adjustmentsRef,
    [Panel.Crop]: cropRef,
    [Panel.Masks]: masksRef,
    [Panel.Presets]: presetsRef,
    [Panel.Ai]: aiRef,
    [Panel.Export]: exportRef,
  };

  return (
    <div className="flex flex-col p-1 gap-1 h-full">
      {panelOptions.map(({ id, icon: Icon, title }) => (
        <div key={id} ref={panelRefs[id]}>
          <button
            className={`p-2 rounded-md transition-colors duration-200 ${
              activePanel === id
                ? 'bg-surface text-text-primary'
                : 'text-text-secondary hover:bg-surface hover:text-text-primary'
            }`}
            onClick={() => onPanelSelect(id)}
            title={title}
          >
            <Icon size={20} />
          </button>
        </div>
      ))}
    </div>
  );
}
