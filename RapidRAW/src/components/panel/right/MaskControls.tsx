import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  Copy,
  ClipboardPaste,
  Circle,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Minus,
  Folder as FolderIcon,
} from 'lucide-react';
import CollapsibleSection from '../../ui/CollapsibleSection';
import Switch from '../../ui/Switch';
import Slider from '../../ui/Slider';
import BasicAdjustments from '../../adjustments/Basic';
import CurveGraph from '../../adjustments/Curves';
import ColorPanel from '../../adjustments/Color';
import DetailsPanel from '../../adjustments/Details';
import EffectsPanel from '../../adjustments/Effects';
import {
  Mask,
  MaskType,
  SUB_MASK_COMPONENT_TYPES,
  SubMask,
  ToolType,
  SubMaskMode,
  MASK_ICON_MAP,
  OTHERS_MASK_TYPES,
} from './Masks';
import { INITIAL_MASK_ADJUSTMENTS, ADJUSTMENT_SECTIONS, MaskContainer, Adjustments } from '../../../utils/adjustments';
import { useContextMenu } from '../../../context/ContextMenuContext';
import { BrushSettings, Option, OPTION_SEPARATOR, SelectedImage } from '../../ui/AppProperties';
import { createSubMask } from '../../../utils/maskUtils';
import { usePresets } from '../../../hooks/usePresets';
import { useNavigation } from 'desktopuse-sdk';

interface BrushToolsProps {
  onSettingsChange(settings: any): void;
  settings: any;
}

interface CopiedSection {
  section: string;
  values: Record<string, any>;
}

interface MaskControlsProps {
  activeMaskId: string | null;
  activeSubMask: SubMask | null;
  aiModelDownloadStatus: string | null;
  brushSettings: BrushSettings | null;
  editingMask: MaskContainer;
  histogram: string;
  isGeneratingAiMask: boolean;
  onGenerateAiForegroundMask(id: string): void;
  onGenerateAiSkyMask(id: string): void;
  onSelectMask(id: string | null): void;
  selectedImage: SelectedImage;
  setAdjustments(updater: (prev: Adjustments) => Adjustments): void;
  setBrushSettings(brushSettings: BrushSettings): void;
  setIsMaskControlHovered(hovered: boolean): void;
  updateMask(id: string, adjustments: any): void;
  updateSubMask(id: string, parameters: any): void;
}

function formatMaskTypeName(type: string) {
  if (type === Mask.AiSubject) {
    return 'AI Subject';
  }
  if (type === Mask.AiForeground) {
    return 'AI Foreground';
  }
  if (type === Mask.AiSky) {
    return 'AI Sky';
  }
  if (type === Mask.All) {
    return 'Whole Image';
  }
  return type.charAt(0).toUpperCase() + type.slice(1);
}

const SUB_MASK_CONFIG: Record<Mask, any> = {
  [Mask.Radial]: {
    parameters: [{ key: 'feather', label: 'Feather', min: 0, max: 100, step: 1, multiplier: 100, defaultValue: 50 }],
  },
  [Mask.Brush]: { showBrushTools: true },
  [Mask.Linear]: { parameters: [] },
  [Mask.Color]: { parameters: [] },
  [Mask.Luminance]: { parameters: [] },
  [Mask.All]: { parameters: [] },
  [Mask.AiSubject]: {
    parameters: [
      { key: 'grow', label: 'Grow', min: -100, max: 100, step: 1, defaultValue: 0 },
      { key: 'feather', label: 'Feather', min: 0, max: 100, step: 1, defaultValue: 0 },
    ],
  },
  [Mask.AiForeground]: {
    parameters: [
      { key: 'grow', label: 'Grow', min: -100, max: 100, step: 1, defaultValue: 0 },
      { key: 'feather', label: 'Feather', min: 0, max: 100, step: 1, defaultValue: 0 },
    ],
  },
  [Mask.AiSky]: {
    parameters: [
      { key: 'grow', label: 'Grow', min: -100, max: 100, step: 1, defaultValue: 0 },
      { key: 'feather', label: 'Feather', min: 0, max: 100, step: 1, defaultValue: 0 },
    ],
  },
};

// Component for SubMask component control buttons with navigation tags
const SubMaskComponentControls = ({
  subMask,
  onToggleMode,
  onToggleVisibility,
  onDelete,
}: {
  subMask: SubMask;
  onToggleMode: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
}) => {
  const { ref: modeButtonRef } = useNavigation({
    id: `submask-mode-toggle-${subMask.id}`,
    type: 'button',
    label: `Toggle SubMask Mode`,
    availableActions: ['click'],
    metadata: {
      description: `Toggle SubMask mode between additive and subtractive, currently ${subMask.mode === SubMaskMode.Additive ? 'additive (+)' : 'subtractive (-)'}`,
      subMaskId: subMask.id,
      subMaskType: subMask.type,
      mode: subMask.mode,
    },
    customActions: {
      click: () => onToggleMode(),
      toggle: () => onToggleMode(),
      setAdditive: () => {
        if (subMask.mode !== SubMaskMode.Additive) onToggleMode();
      },
      setSubtractive: () => {
        if (subMask.mode !== SubMaskMode.Subtractive) onToggleMode();
      },
    },
  });

  const { ref: visibilityButtonRef } = useNavigation({
    id: `submask-visibility-toggle-${subMask.id}`,
    type: 'button',
    label: `${subMask.visible ? 'Hide' : 'Show'} SubMask Component`,
    availableActions: ['click'],
    metadata: {
      description: `Toggle visibility for SubMask component, currently ${subMask.visible ? 'visible' : 'hidden'}`,
      subMaskId: subMask.id,
      subMaskType: subMask.type,
      visible: subMask.visible,
    },
    customActions: {
      click: () => onToggleVisibility(),
      toggle: () => onToggleVisibility(),
    },
  });

  const { ref: deleteButtonRef } = useNavigation({
    id: `submask-delete-${subMask.id}`,
    type: 'button',
    label: `Delete SubMask Component`,
    availableActions: ['click'],
    metadata: {
      description: `Delete SubMask component of type ${subMask.type}`,
      subMaskId: subMask.id,
      subMaskType: subMask.type,
    },
    customActions: {
      click: () => onDelete(),
    },
  });

  return (
    <div className="flex items-center gap-1">
      <button
        ref={modeButtonRef as any}
        className="p-1.5 rounded-full text-text-secondary hover:bg-bg-primary"
        onClick={(e: any) => {
          e.stopPropagation();
          onToggleMode();
        }}
        title={subMask.mode === SubMaskMode.Additive ? 'Set to Subtract' : 'Set to Add'}
      >
        {subMask.mode === SubMaskMode.Additive ? <Plus size={14} /> : <Minus size={14} />}
      </button>
      <button
        ref={visibilityButtonRef as any}
        className="p-1.5 rounded-full text-text-secondary hover:bg-bg-primary"
        onClick={(e: any) => {
          e.stopPropagation();
          onToggleVisibility();
        }}
        title={subMask.visible ? 'Hide' : 'Show'}
      >
        {subMask.visible ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
      <button
        ref={deleteButtonRef as any}
        className="p-1.5 rounded-full text-text-secondary hover:text-red-500 hover:bg-red-500/10"
        onClick={(e: any) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

// Component for rendering SubMask parameter sliders with navigation tags
const SubMaskParameterSlider = ({ param, value, onChange }: { param: any; value: number; onChange: (key: string, value: number) => void }) => {
  const { ref: paramSliderRef } = useNavigation({
    id: `submask-${param.key}-slider`,
    type: 'input',
    label: `SubMask ${param.label}`,
    availableActions: ['type', 'click'],
    metadata: {
      description: `SubMask ${param.label} slider with value ${value}`,
      value: value,
      min: param.min,
      max: param.max,
      step: param.step,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(param.min, Math.min(param.max, numValue));
          onChange(param.key, clampedValue / (param.multiplier || 1));
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : param.step;
        const newValue = Math.min(param.max, value + validAmount);
        onChange(param.key, newValue / (param.multiplier || 1));
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : param.step;
        const newValue = Math.max(param.min, value - validAmount);
        onChange(param.key, newValue / (param.multiplier || 1));
      },
    },
  });

  return (
    <div ref={paramSliderRef}>
      <Slider
        defaultValue={param.defaultValue}
        label={param.label}
        max={param.max}
        min={param.min}
        onChange={(e: any) => onChange(param.key, parseFloat(e.target.value) / (param.multiplier || 1))}
        step={param.step}
        value={value}
      />
    </div>
  );
};

const BrushTools = ({ settings, onSettingsChange }: BrushToolsProps) => {
  // Navigation tags for brush size slider
  const { ref: brushSizeSliderRef } = useNavigation({
    id: 'brush-size-slider',
    type: 'input',
    label: 'Brush Size',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Brush size slider with value ${settings.size}`,
      value: settings.size,
      min: 1,
      max: 200,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(1, Math.min(200, numValue));
          onSettingsChange((s: any) => ({ ...s, size: clampedValue }));
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 1;
        const newValue = Math.min(200, settings.size + validAmount);
        onSettingsChange((s: any) => ({ ...s, size: newValue }));
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 1;
        const newValue = Math.max(1, settings.size - validAmount);
        onSettingsChange((s: any) => ({ ...s, size: newValue }));
      },
    },
  });

  // Navigation tags for brush feather slider
  const { ref: brushFeatherSliderRef } = useNavigation({
    id: 'brush-feather-slider',
    type: 'input',
    label: 'Brush Feather',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Brush feather slider with value ${settings.feather}`,
      value: settings.feather,
      min: 0,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(0, Math.min(100, numValue));
          onSettingsChange((s: any) => ({ ...s, feather: clampedValue }));
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 1;
        const newValue = Math.min(100, settings.feather + validAmount);
        onSettingsChange((s: any) => ({ ...s, feather: newValue }));
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 1;
        const newValue = Math.max(0, settings.feather - validAmount);
        onSettingsChange((s: any) => ({ ...s, feather: newValue }));
      },
    },
  });

  // Navigation tag for brush tool button
  const { ref: brushToolButtonRef } = useNavigation({
    id: 'brush-tool-button',
    type: 'button',
    label: 'Brush Tool',
    availableActions: ['click'],
    metadata: {
      description: `Select brush tool for painting on mask, currently ${settings.tool === ToolType.Brush ? 'selected' : 'not selected'}`,
      selected: settings.tool === ToolType.Brush,
    },
    customActions: {
      click: () => onSettingsChange((s: any) => ({ ...s, tool: ToolType.Brush })),
    },
  });

  // Navigation tag for eraser tool button
  const { ref: eraserToolButtonRef } = useNavigation({
    id: 'eraser-tool-button',
    type: 'button',
    label: 'Eraser Tool',
    availableActions: ['click'],
    metadata: {
      description: `Select eraser tool for erasing from mask, currently ${settings.tool === ToolType.Eraser ? 'selected' : 'not selected'}`,
      selected: settings.tool === ToolType.Eraser,
    },
    customActions: {
      click: () => onSettingsChange((s: any) => ({ ...s, tool: ToolType.Eraser })),
    },
  });

  return (
    <div className="space-y-4 pt-4 border-t border-surface mt-4">
      <div ref={brushSizeSliderRef}>
        <Slider
          defaultValue={100}
          label="Brush Size"
          max={200}
          min={1}
          onChange={(e: any) => onSettingsChange((s: any) => ({ ...s, size: Number(e.target.value) }))}
          step={1}
          value={settings.size}
        />
      </div>
      <div ref={brushFeatherSliderRef}>
        <Slider
          defaultValue={50}
          label="Brush Feather"
          max={100}
          min={0}
          onChange={(e: any) => onSettingsChange((s: any) => ({ ...s, feather: Number(e.target.value) }))}
          step={1}
          value={settings.feather}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 pt-2">
        <button
          ref={brushToolButtonRef as any}
          className={`p-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            settings.tool === ToolType.Brush
              ? 'text-primary bg-surface'
              : 'bg-surface text-text-secondary hover:bg-card-active'
          }`}
          onClick={() => onSettingsChange((s: any) => ({ ...s, tool: ToolType.Brush }))}
        >
          Brush
        </button>
        <button
          ref={eraserToolButtonRef as any}
          className={`p-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            settings.tool === ToolType.Eraser
              ? 'text-primary bg-surface'
              : 'bg-surface text-text-secondary hover:bg-card-active'
          }`}
          onClick={() => onSettingsChange((s: any) => ({ ...s, tool: ToolType.Eraser }))}
        >
          Eraser
        </button>
      </div>
    </div>
  );
};

export default function MaskControls({
  activeMaskId,
  activeSubMask,
  aiModelDownloadStatus,
  brushSettings,
  editingMask,
  histogram,
  isGeneratingAiMask,
  onGenerateAiForegroundMask,
  onGenerateAiSkyMask,
  onSelectMask,
  selectedImage,
  setAdjustments,
  setBrushSettings,
  setIsMaskControlHovered,
  updateMask,
  updateSubMask,
}: MaskControlsProps) {
  const { showContextMenu } = useContextMenu();
  const { presets } = usePresets(editingMask.adjustments);
  const [isSettingsSectionOpen, setSettingsSectionOpen] = useState(true);
  const [copiedSectionAdjustments, setCopiedSectionAdjustments] = useState<CopiedSection | null>(null);
  const [collapsibleState, setCollapsibleState] = useState<any>({
    basic: true,
    curves: false,
    color: false,
    details: false,
    effects: false,
  });
  const [showAnalyzingMessage, setShowAnalyzingMessage] = useState(false);
  const analyzingTimeoutRef = useRef<number | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const presetButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setCollapsibleState({ basic: true, curves: false, color: false, details: false, effects: false });
  }, [editingMask?.id]);

  useEffect(() => {
    if (isGeneratingAiMask) {
      analyzingTimeoutRef.current = setTimeout(() => setShowAnalyzingMessage(true), 1000);
    } else {
      if (analyzingTimeoutRef.current) clearTimeout(analyzingTimeoutRef.current);
      setShowAnalyzingMessage(false);
    }

    return () => {
      if (analyzingTimeoutRef.current) clearTimeout(analyzingTimeoutRef.current);
    };
  }, [isGeneratingAiMask]);

  const handleAddSubMask = (containerId: string, type: Mask) => {
    const subMask = createSubMask(type, selectedImage);

    setAdjustments((prev: Adjustments) => ({
      ...prev,
      masks: prev.masks?.map((c: MaskContainer) =>
        c.id === containerId ? { ...c, subMasks: [...c.subMasks, subMask] } : c,
      ),
    }));

    onSelectMask(subMask.id);

    if (type === Mask.AiForeground) {
      onGenerateAiForegroundMask(subMask.id);
    } else if (type === Mask.AiSky) {
      onGenerateAiSkyMask(subMask.id);
    }
  };

  const handleAddOthersSubMask = (event: React.MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const options = OTHERS_MASK_TYPES.map((maskType) => ({
      label: maskType.name,
      icon: maskType.icon,
      onClick: () => handleAddSubMask(editingMask.id, maskType.type),
    }));
    showContextMenu(rect.left, rect.bottom + 5, options);
  };

  const handleDeleteSubMask = (containerId: string, subMaskId: string) => {
    setDeletingItemId(subMaskId);
    setTimeout(() => {
      if (activeMaskId === subMaskId) {
        onSelectMask(null);
      }

      setAdjustments((prev: Adjustments) => ({
        ...prev,
        masks: prev.masks?.map((c: MaskContainer) =>
          c.id === containerId ? { ...c, subMasks: c.subMasks.filter((sm: SubMask) => sm.id !== subMaskId) } : c,
        ),
      }));

      setDeletingItemId(null);
    }, 200);
  };

  const handleDeselectSubMask = () => onSelectMask(null);

  const handleApplyPresetToMask = (presetAdjustments: Partial<Adjustments>) => {
    setAdjustments((prev: Adjustments) => ({
      ...prev,
      masks: prev.masks.map((c: MaskContainer) => {
        if (c.id === editingMask.id) {
          const newMaskAdjustments = {
            ...c.adjustments,
            ...presetAdjustments,
          };
          newMaskAdjustments.sectionVisibility = {
            ...c.adjustments.sectionVisibility,
            ...presetAdjustments.sectionVisibility,
          };
          return { ...c, adjustments: newMaskAdjustments };
        }
        return c;
      }),
    }));
  };

  const generatePresetSubmenu = (presetList: any[]): any[] => {
    return presetList
      .map((item: any) => {
        if (item.folder) {
          return {
            label: item.folder.name,
            icon: FolderIcon,
            submenu: generatePresetSubmenu(item.folder.children),
          };
        }
        if (item.preset) {
          return {
            label: item.preset.name,
            onClick: () => handleApplyPresetToMask(item.preset.adjustments),
          };
        }
        if (item.adjustments) {
          return {
            label: item.name,
            onClick: () => handleApplyPresetToMask(item.adjustments),
          };
        }
        return null;
      })
      .filter(Boolean);
  };

  const handlePresetSelectClick = () => {
    if (presetButtonRef.current) {
      const rect = presetButtonRef.current.getBoundingClientRect();
      const presetSubmenu = generatePresetSubmenu(presets);
      const options = presetSubmenu.length > 0 ? presetSubmenu : [{ label: 'No presets found', disabled: true }];
      showContextMenu(rect.left, rect.bottom + 5, options);
    }
  };

  const handleSubMaskContextMenu = (event: any, subMask: SubMask) => {
    event.preventDefault();
    event.stopPropagation();

    const options = [
      {
        label: 'Delete Component',
        icon: Trash2,
        isDestructive: true,
        onClick: () => handleDeleteSubMask(editingMask.id, subMask.id),
      },
    ];

    showContextMenu(event.clientX, event.clientY, options);
  };

  if (!editingMask) {
    return null;
  }

  const subMaskConfig = activeSubMask ? SUB_MASK_CONFIG[activeSubMask.type] || {} : {};

  const setMaskContainerAdjustments = (updater: any) => {
    const currentAdjustments = editingMask.adjustments;
    const newAdjustments = typeof updater === 'function' ? updater(currentAdjustments) : updater;
    updateMask(editingMask.id, { adjustments: newAdjustments });
  };

  const handleToggleSection = (section: string) =>
    setCollapsibleState((prev: any) => ({ ...prev, [section]: !prev[section] }));

  const handleToggleVisibility = (sectionName: string) => {
    const currentAdjustments = editingMask.adjustments;
    const currentVisibility = currentAdjustments.sectionVisibility || INITIAL_MASK_ADJUSTMENTS.sectionVisibility;
    const newAdjustments = {
      ...currentAdjustments,
      sectionVisibility: { ...currentVisibility, [sectionName]: !currentVisibility[sectionName] },
    };
    updateMask(editingMask.id, { adjustments: newAdjustments });
  };

  const handleSubMaskParameterChange = (key: string, value: number) => {
    if (!activeSubMask) {
      return;
    }
    updateSubMask(activeSubMask.id, { parameters: { ...activeSubMask.parameters, [key]: value } });
  };

  const handleMaskPropertyChange = (key: string, value: any) => updateMask(editingMask.id, { [key]: value });

  const handleSectionContextMenu = (event: any, sectionName: string) => {
    event.preventDefault();
    event.stopPropagation();

    const sectionKeys = ADJUSTMENT_SECTIONS[sectionName];
    if (!sectionKeys) {
      return;
    }

    const handleCopy = () => {
      const adjustmentsToCopy: Record<string, any> = {};
      for (const key of sectionKeys) {
        if (editingMask.adjustments.hasOwnProperty(key)) {
          adjustmentsToCopy[key] = JSON.parse(JSON.stringify(editingMask.adjustments[key]));
        }
      }
      setCopiedSectionAdjustments({ section: sectionName, values: adjustmentsToCopy });
    };

    const handlePaste = () => {
      if (!copiedSectionAdjustments || copiedSectionAdjustments.section !== sectionName) {
        return;
      }

      setMaskContainerAdjustments((prev: any) => ({
        ...prev,
        ...copiedSectionAdjustments.values,
        sectionVisibility: {
          ...(prev.sectionVisibility || INITIAL_MASK_ADJUSTMENTS.sectionVisibility),
          [sectionName]: true,
        },
      }));
    };

    const handleReset = () => {
      const resetValues: any = {};
      for (const key of sectionKeys) {
        resetValues[key] = JSON.parse(JSON.stringify(INITIAL_MASK_ADJUSTMENTS[key]));
      }
      setMaskContainerAdjustments((prev: any) => ({
        ...prev,
        ...resetValues,
        sectionVisibility: {
          ...(prev.sectionVisibility || INITIAL_MASK_ADJUSTMENTS.sectionVisibility),
          [sectionName]: true,
        },
      }));
    };

    const isPasteAllowed = copiedSectionAdjustments && copiedSectionAdjustments.section === sectionName;

    const pasteLabel = copiedSectionAdjustments
      ? `Paste ${
          copiedSectionAdjustments.section.charAt(0).toUpperCase() + copiedSectionAdjustments.section.slice(1)
        } Settings`
      : 'Paste Settings';

    const options: Array<Option> = [
      {
        icon: Copy,
        label: `Copy ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} Settings`,
        onClick: handleCopy,
      },
      { label: pasteLabel, icon: ClipboardPaste, onClick: handlePaste, disabled: !isPasteAllowed },
      { type: OPTION_SEPARATOR },
      {
        icon: RotateCcw,
        label: `Reset ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} Settings`,
        onClick: handleReset,
      },
    ];

    showContextMenu(event.clientX, event.clientY, options);
  };

  const isAiMask =
    activeSubMask &&
    (activeSubMask.type === Mask.AiSubject ||
      activeSubMask.type === Mask.AiForeground ||
      activeSubMask.type === Mask.AiSky);
  const sectionVisibility = editingMask.adjustments.sectionVisibility || INITIAL_MASK_ADJUSTMENTS.sectionVisibility;

  // Navigation tags for Add to Mask buttons
  const addSubjectMaskNav = useNavigation({
    id: 'add-subject-mask-button',
    type: 'button',
    label: 'Add Subject Mask Component',
    availableActions: ['click'],
    metadata: {
      description: 'Add AI-detected subject mask component to the current mask',
    },
    customActions: {
      click: () => handleAddSubMask(editingMask.id, Mask.AiSubject),
    },
  });

  const addSkyMaskNav = useNavigation({
    id: 'add-sky-mask-button',
    type: 'button',
    label: 'Add Sky Mask Component',
    availableActions: ['click'],
    metadata: {
      description: 'Add AI-detected sky mask component to the current mask',
    },
    customActions: {
      click: () => handleAddSubMask(editingMask.id, Mask.AiSky),
    },
  });

  const addForegroundMaskNav = useNavigation({
    id: 'add-foreground-mask-button',
    type: 'button',
    label: 'Add Foreground Mask Component',
    availableActions: ['click'],
    metadata: {
      description: 'Add AI-detected foreground mask component to the current mask',
    },
    customActions: {
      click: () => handleAddSubMask(editingMask.id, Mask.AiForeground),
    },
  });

  const addLinearMaskNav = useNavigation({
    id: 'add-linear-mask-button',
    type: 'button',
    label: 'Add Linear Mask Component',
    availableActions: ['click'],
    metadata: {
      description: 'Add linear gradient mask component to the current mask',
    },
    customActions: {
      click: () => handleAddSubMask(editingMask.id, Mask.Linear),
    },
  });

  const addRadialMaskNav = useNavigation({
    id: 'add-radial-mask-button',
    type: 'button',
    label: 'Add Radial Mask Component',
    availableActions: ['click'],
    metadata: {
      description: 'Add radial gradient mask component to the current mask',
    },
    customActions: {
      click: () => handleAddSubMask(editingMask.id, Mask.Radial),
    },
  });

  const addBrushMaskNav = useNavigation({
    id: 'add-brush-mask-button',
    type: 'button',
    label: 'Add Brush Mask Component',
    availableActions: ['click'],
    metadata: {
      description: 'Add brush-painted mask component to the current mask',
    },
    customActions: {
      click: () => handleAddSubMask(editingMask.id, Mask.Brush),
    },
  });

  const getAddMaskButtonRef = (maskType: MaskType) => {
    switch (maskType.type) {
      case Mask.AiSubject:
        return addSubjectMaskNav.ref;
      case Mask.AiSky:
        return addSkyMaskNav.ref;
      case Mask.AiForeground:
        return addForegroundMaskNav.ref;
      case Mask.Linear:
        return addLinearMaskNav.ref;
      case Mask.Radial:
        return addRadialMaskNav.ref;
      case Mask.Brush:
        return addBrushMaskNav.ref;
      default:
        return undefined;
    }
  };

  // Navigation tag for Invert Mask switch
  const { ref: invertMaskSwitchRef } = useNavigation({
    id: 'mask-invert-switch',
    type: 'button',
    label: 'Invert Mask',
    availableActions: ['toggle', 'click'],
    metadata: {
      description: `Invert mask toggle, currently ${editingMask.invert ? 'enabled' : 'disabled'}`,
      checked: !!editingMask.invert,
    },
    customActions: {
      toggle: () => handleMaskPropertyChange('invert', !editingMask.invert),
      click: () => handleMaskPropertyChange('invert', !editingMask.invert),
    },
  });

  // Navigation tag for Mask Transparency slider
  const { ref: maskTransparencySliderRef } = useNavigation({
    id: 'mask-transparency-slider',
    type: 'input',
    label: 'Mask Transparency',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Mask transparency slider with value ${editingMask.opacity ?? 100}`,
      value: editingMask.opacity ?? 100,
      min: 0,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(0, Math.min(100, numValue));
          handleMaskPropertyChange('opacity', clampedValue);
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 1;
        const currentValue = editingMask.opacity ?? 100;
        const newValue = Math.min(100, currentValue + validAmount);
        handleMaskPropertyChange('opacity', newValue);
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 1;
        const currentValue = editingMask.opacity ?? 100;
        const newValue = Math.max(0, currentValue - validAmount);
        handleMaskPropertyChange('opacity', newValue);
      },
    },
  });

  return (
    <>
      <div className="p-4 border-b border-surface">
        <p className="text-sm mb-3 font-semibold text-text-primary">Add to Mask</p>
        <div className="grid grid-cols-3 gap-2">
          {SUB_MASK_COMPONENT_TYPES.map((maskType: MaskType) => (
            <button
              ref={getAddMaskButtonRef(maskType) as any}
              className={`bg-surface text-text-primary rounded-lg p-2 flex flex-col items-center justify-center gap-1.5 aspect-square transition-colors ${
                maskType.disabled || isGeneratingAiMask ? 'opacity-50 cursor-not-allowed' : 'hover:bg-card-active'
              }`}
              disabled={maskType.disabled || isGeneratingAiMask}
              key={maskType.type || maskType.id}
              onClick={(e) => {
                if (maskType.id === 'others') {
                  handleAddOthersSubMask(e);
                } else {
                  handleAddSubMask(editingMask.id, maskType.type);
                }
              }}
              title={`Add ${maskType.name} component`}
            >
              <maskType.icon size={24} />
              <span className="text-xs">{maskType.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-2" onClick={handleDeselectSubMask}>
        <p className="text-sm mb-3 font-semibold text-text-primary">Mask Components</p>
        {editingMask.subMasks.length === 0 ? (
          <div className="text-center text-sm text-text-secondary py-6 px-4 bg-surface rounded-lg">
            <p className="font-medium">This mask is empty.</p>
            <p className="mt-1">Select a component type above to begin building your mask.</p>
          </div>
        ) : (
          <AnimatePresence>
            {editingMask.subMasks
              .filter((sm: SubMask) => sm.id !== deletingItemId)
              .map((subMask: SubMask) => {
                const MaskIcon = MASK_ICON_MAP[subMask.type] || Circle;
                return (
                  <motion.div
                    className={`group p-2 rounded-lg flex items-center justify-between cursor-pointer transition-all duration-200 ${
                      activeMaskId === subMask.id ? 'bg-accent/20' : 'bg-surface hover:bg-card-active'
                    } ${!subMask.visible ? 'opacity-60' : 'opacity-100'}`}
                    exit={{ opacity: 0, x: -15, transition: { duration: 0.2 } }}
                    key={subMask.id}
                    layout
                    onClick={(e: any) => {
                      e.stopPropagation();
                      onSelectMask(subMask.id);
                    }}
                    onContextMenu={(e: any) => handleSubMaskContextMenu(e, subMask)}
                  >
                    <div className="flex items-center gap-3">
                      <MaskIcon size={16} className="text-text-secondary" />
                      <span className="font-medium text-sm text-text-primary capitalize">
                        {formatMaskTypeName(subMask.type)}
                      </span>
                    </div>
                    <SubMaskComponentControls
                      subMask={subMask}
                      onToggleMode={() =>
                        updateSubMask(subMask.id, {
                          mode: subMask.mode === SubMaskMode.Additive ? SubMaskMode.Subtractive : SubMaskMode.Additive,
                        })
                      }
                      onToggleVisibility={() => updateSubMask(subMask.id, { visible: !subMask.visible })}
                      onDelete={() => handleDeleteSubMask(editingMask.id, subMask.id)}
                    />
                  </motion.div>
                );
              })}
          </AnimatePresence>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 border-t border-surface">
        <CollapsibleSection
          canToggleVisibility={false}
          isContentVisible={true}
          isOpen={isSettingsSectionOpen}
          onToggle={() => setSettingsSectionOpen((prev: any) => !prev)}
          title="Mask Properties"
        >
          <div className="space-y-4">
            <div ref={invertMaskSwitchRef}>
              <Switch
                checked={!!editingMask.invert}
                label="Invert Mask"
                onChange={(checked: boolean) => handleMaskPropertyChange('invert', checked)}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-text-secondary select-none">Apply Preset</span>
              <button
                ref={presetButtonRef}
                onClick={handlePresetSelectClick}
                className="text-sm text-text-primary text-right select-none cursor-pointer hover:text-accent transition-colors"
                title="Select a preset to apply"
              >
                Select
              </button>
            </div>
            <div ref={maskTransparencySliderRef}>
              <Slider
                defaultValue={100}
                label="Mask Transparency"
                max={100}
                min={0}
                onChange={(e: any) => handleMaskPropertyChange('opacity', Number(e.target.value))}
                step={1}
                value={editingMask.opacity ?? 100}
              />
            </div>
            {activeSubMask && (
              <>
                {isAiMask && (
                  <>
                    {aiModelDownloadStatus && (
                      <div className="text-sm text-text-secondary p-2 bg-surface rounded-md text-center">
                        Downloading AI Model ({aiModelDownloadStatus})...
                      </div>
                    )}
                    {showAnalyzingMessage && !aiModelDownloadStatus && (
                      <div className="text-sm text-text-secondary p-2 bg-surface rounded-md text-center animate-pulse">
                        Analyzing Image...
                      </div>
                    )}
                  </>
                )}
                {subMaskConfig.parameters?.map((param: any) => (
                  <SubMaskParameterSlider
                    key={param.key}
                    param={param}
                    value={(activeSubMask.parameters[param.key] || 0) * (param.multiplier || 1)}
                    onChange={handleSubMaskParameterChange}
                  />
                ))}
                {subMaskConfig.showBrushTools && brushSettings && setBrushSettings && (
                  <BrushTools settings={brushSettings} onSettingsChange={setBrushSettings} />
                )}
              </>
            )}
          </div>
        </CollapsibleSection>

        <div
          className="flex flex-col gap-2"
          onMouseEnter={() => setIsMaskControlHovered(true)}
          onMouseLeave={() => setIsMaskControlHovered(false)}
        >
          {Object.keys(ADJUSTMENT_SECTIONS).map((sectionName) => {
            const SectionComponent: any = {
              basic: BasicAdjustments,
              curves: CurveGraph,
              color: ColorPanel,
              details: DetailsPanel,
              effects: EffectsPanel,
            }[sectionName];
            const title = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
            return (
              <CollapsibleSection
                isContentVisible={sectionVisibility[sectionName]}
                isOpen={collapsibleState[sectionName]}
                key={sectionName}
                onContextMenu={(e: any) => handleSectionContextMenu(e, sectionName)}
                onToggle={() => handleToggleSection(sectionName)}
                onToggleVisibility={() => handleToggleVisibility(sectionName)}
                title={title}
              >
                <SectionComponent
                  adjustments={editingMask.adjustments}
                  setAdjustments={setMaskContainerAdjustments}
                  histogram={histogram}
                  isForMask={true}
                />
              </CollapsibleSection>
            );
          })}
        </div>
      </div>
    </>
  );
}