import Slider from '../ui/Slider';
import { Adjustments, DetailsAdjustment, Effect } from '../../utils/adjustments';
import { AppSettings } from '../ui/AppProperties';
import { useNavigation } from 'desktopuse-sdk';

interface DetailsPanelProps {
  adjustments: Adjustments;
  setAdjustments(adjustments: Partial<Adjustments>): any;
  appSettings: AppSettings | null;
  isForMask?: boolean;
}

export default function DetailsPanel({
  adjustments,
  setAdjustments,
  appSettings,
  isForMask = false,
}: DetailsPanelProps) {
  const handleAdjustmentChange = (key: string, value: any) => {
    const numericValue = parseFloat(value);
    setAdjustments((prev: Partial<Adjustments>) => ({ ...prev, [key]: numericValue }));
  };

  const adjustmentVisibility = appSettings?.adjustmentVisibility || {};

  // Tag Sharpness slider
  const { ref: sharpnessRef } = useNavigation({
    id: 'sharpness-slider',
    type: 'input',
    label: 'Sharpness Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Sharpness slider with value ${adjustments.sharpness}`,
      value: adjustments.sharpness,
      min: 0,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(0, Math.min(100, numValue));
          handleAdjustmentChange(DetailsAdjustment.Sharpness, clampedValue);
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(100, adjustments.sharpness + validAmount);
        handleAdjustmentChange(DetailsAdjustment.Sharpness, newValue);
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(0, adjustments.sharpness - validAmount);
        handleAdjustmentChange(DetailsAdjustment.Sharpness, newValue);
      },
    },
  });

  // Tag Clarity slider
  const { ref: clarityRef } = useNavigation({
    id: 'clarity-slider',
    type: 'input',
    label: 'Clarity Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Clarity slider with value ${adjustments.clarity}`,
      value: adjustments.clarity,
      min: -100,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(-100, Math.min(100, numValue));
          handleAdjustmentChange(DetailsAdjustment.Clarity, clampedValue);
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(100, adjustments.clarity + validAmount);
        handleAdjustmentChange(DetailsAdjustment.Clarity, newValue);
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(-100, adjustments.clarity - validAmount);
        handleAdjustmentChange(DetailsAdjustment.Clarity, newValue);
      },
    },
  });

  // Tag Dehaze slider
  const { ref: dehazeRef } = useNavigation({
    id: 'dehaze-slider',
    type: 'input',
    label: 'Dehaze Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Dehaze slider with value ${adjustments.dehaze}`,
      value: adjustments.dehaze,
      min: -100,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(-100, Math.min(100, numValue));
          handleAdjustmentChange(DetailsAdjustment.Dehaze, clampedValue);
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(100, adjustments.dehaze + validAmount);
        handleAdjustmentChange(DetailsAdjustment.Dehaze, newValue);
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(-100, adjustments.dehaze - validAmount);
        handleAdjustmentChange(DetailsAdjustment.Dehaze, newValue);
      },
    },
  });

  // Tag Structure slider
  const { ref: structureRef } = useNavigation({
    id: 'structure-slider',
    type: 'input',
    label: 'Structure Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Structure slider with value ${adjustments.structure}`,
      value: adjustments.structure,
      min: -100,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(-100, Math.min(100, numValue));
          handleAdjustmentChange(DetailsAdjustment.Structure, clampedValue);
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(100, adjustments.structure + validAmount);
        handleAdjustmentChange(DetailsAdjustment.Structure, newValue);
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(-100, adjustments.structure - validAmount);
        handleAdjustmentChange(DetailsAdjustment.Structure, newValue);
      },
    },
  });

  // Tag Centré slider
  const { ref: centréRef } = useNavigation({
    id: 'centre-slider',
    type: 'input',
    label: 'Centré Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Centré slider with value ${adjustments.centré}`,
      value: adjustments.centré,
      min: -100,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(-100, Math.min(100, numValue));
          handleAdjustmentChange(DetailsAdjustment.Centré, clampedValue);
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(100, adjustments.centré + validAmount);
        handleAdjustmentChange(DetailsAdjustment.Centré, newValue);
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(-100, adjustments.centré - validAmount);
        handleAdjustmentChange(DetailsAdjustment.Centré, newValue);
      },
    },
  });

  // Tag Luma Noise Reduction slider
  const { ref: lumaNoiseRef } = useNavigation({
    id: 'luma-noise-slider',
    type: 'input',
    label: 'Luminance Noise Reduction Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Luminance noise reduction slider with value ${adjustments.lumaNoiseReduction}`,
      value: adjustments.lumaNoiseReduction,
      min: 0,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(0, Math.min(100, numValue));
          handleAdjustmentChange(DetailsAdjustment.LumaNoiseReduction, clampedValue);
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(100, adjustments.lumaNoiseReduction + validAmount);
        handleAdjustmentChange(DetailsAdjustment.LumaNoiseReduction, newValue);
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(0, adjustments.lumaNoiseReduction - validAmount);
        handleAdjustmentChange(DetailsAdjustment.LumaNoiseReduction, newValue);
      },
    },
  });

  // Tag Color Noise Reduction slider
  const { ref: colorNoiseRef } = useNavigation({
    id: 'color-noise-slider',
    type: 'input',
    label: 'Color Noise Reduction Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Color noise reduction slider with value ${adjustments.colorNoiseReduction}`,
      value: adjustments.colorNoiseReduction,
      min: 0,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(0, Math.min(100, numValue));
          handleAdjustmentChange(DetailsAdjustment.ColorNoiseReduction, clampedValue);
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(100, adjustments.colorNoiseReduction + validAmount);
        handleAdjustmentChange(DetailsAdjustment.ColorNoiseReduction, newValue);
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(0, adjustments.colorNoiseReduction - validAmount);
        handleAdjustmentChange(DetailsAdjustment.ColorNoiseReduction, newValue);
      },
    },
  });

  // Tag Chromatic Aberration Red/Cyan slider
  const { ref: caRedCyanRef } = useNavigation({
    id: 'ca-red-cyan-slider',
    type: 'input',
    label: 'Chromatic Aberration Red/Cyan Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Chromatic aberration red/cyan correction slider with value ${adjustments.chromaticAberrationRedCyan}`,
      value: adjustments.chromaticAberrationRedCyan,
      min: -100,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(-100, Math.min(100, numValue));
          handleAdjustmentChange(DetailsAdjustment.ChromaticAberrationRedCyan, clampedValue);
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(100, adjustments.chromaticAberrationRedCyan + validAmount);
        handleAdjustmentChange(DetailsAdjustment.ChromaticAberrationRedCyan, newValue);
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(-100, adjustments.chromaticAberrationRedCyan - validAmount);
        handleAdjustmentChange(DetailsAdjustment.ChromaticAberrationRedCyan, newValue);
      },
    },
  });

  // Tag Chromatic Aberration Blue/Yellow slider
  const { ref: caBlueYellowRef } = useNavigation({
    id: 'ca-blue-yellow-slider',
    type: 'input',
    label: 'Chromatic Aberration Blue/Yellow Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Chromatic aberration blue/yellow correction slider with value ${adjustments.chromaticAberrationBlueYellow}`,
      value: adjustments.chromaticAberrationBlueYellow,
      min: -100,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(-100, Math.min(100, numValue));
          handleAdjustmentChange(DetailsAdjustment.ChromaticAberrationBlueYellow, clampedValue);
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(100, adjustments.chromaticAberrationBlueYellow + validAmount);
        handleAdjustmentChange(DetailsAdjustment.ChromaticAberrationBlueYellow, newValue);
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(-100, adjustments.chromaticAberrationBlueYellow - validAmount);
        handleAdjustmentChange(DetailsAdjustment.ChromaticAberrationBlueYellow, newValue);
      },
    },
  });

  return (
    <div>
      {adjustmentVisibility.sharpening !== false && (
        <div className="mb-4 p-2 bg-bg-tertiary rounded-md">
          <p className="text-md font-semibold mb-2 text-primary">Sharpening</p>
          <div ref={sharpnessRef}>
            <Slider
              label="Sharpness"
              max={100}
              min={0}
              onChange={(e: any) => handleAdjustmentChange(DetailsAdjustment.Sharpness, e.target.value)}
              step={1}
              value={adjustments.sharpness}
            />
          </div>
        </div>
      )}

      {adjustmentVisibility.presence !== false && (
        <div className="mb-4 p-2 bg-bg-tertiary rounded-md">
          <p className="text-md font-semibold mb-2 text-primary">Presence</p>
          <div ref={clarityRef}>
            <Slider
              label="Clarity"
              max={100}
              min={-100}
              onChange={(e: any) => handleAdjustmentChange(DetailsAdjustment.Clarity, e.target.value)}
              step={1}
              value={adjustments.clarity}
            />
          </div>
          <div ref={dehazeRef}>
            <Slider
              label="Dehaze"
              max={100}
              min={-100}
              onChange={(e: any) => handleAdjustmentChange(DetailsAdjustment.Dehaze, e.target.value)}
              step={1}
              value={adjustments.dehaze}
            />
          </div>
          <div ref={structureRef}>
            <Slider
              label="Structure"
              max={100}
              min={-100}
              onChange={(e: any) => handleAdjustmentChange(DetailsAdjustment.Structure, e.target.value)}
              step={1}
              value={adjustments.structure}
            />
          </div>
          {!isForMask && (
            <div ref={centréRef}>
              <Slider
                label="Centré"
                max={100}
                min={-100}
                onChange={(e: any) => handleAdjustmentChange(DetailsAdjustment.Centré, e.target.value)}
                step={1}
                value={adjustments.centré}
              />
            </div>
          )}
        </div>
      )}

      {adjustmentVisibility.noiseReduction !== false && (
        <div className="p-2 bg-bg-tertiary rounded-md">
          <p className="text-md font-semibold mb-2 text-primary">Noise Reduction</p>
          <div ref={lumaNoiseRef}>
            <Slider
              label="Luminance"
              max={100}
              min={0}
              onChange={(e: any) => handleAdjustmentChange(DetailsAdjustment.LumaNoiseReduction, e.target.value)}
              step={1}
              value={adjustments.lumaNoiseReduction}
            />
          </div>
          <div ref={colorNoiseRef}>
            <Slider
              label="Color"
              max={100}
              min={0}
              onChange={(e: any) => handleAdjustmentChange(DetailsAdjustment.ColorNoiseReduction, e.target.value)}
              step={1}
              value={adjustments.colorNoiseReduction}
            />
          </div>
        </div>
      )}

      {adjustmentVisibility.chromaticAberration !== false && (
        <div className="p-2 bg-bg-tertiary rounded-md">
          <p className="text-md font-semibold mb-2 text-primary">Chromatic Aberration</p>
          <div ref={caRedCyanRef}>
            <Slider
              label="Red/Cyan"
              max={100}
              min={-100}
              onChange={(e: any) =>
                handleAdjustmentChange(DetailsAdjustment.ChromaticAberrationRedCyan, e.target.value)
              }
              step={1}
              value={adjustments.chromaticAberrationRedCyan}
            />
          </div>
          <div ref={caBlueYellowRef}>
            <Slider
              label="Blue/Yellow"
              max={100}
              min={-100}
              onChange={(e: any) =>
                handleAdjustmentChange(DetailsAdjustment.ChromaticAberrationBlueYellow, e.target.value)
              }
              step={1}
              value={adjustments.chromaticAberrationBlueYellow}
            />
          </div>
        </div>
      )}
    </div>
  );
}