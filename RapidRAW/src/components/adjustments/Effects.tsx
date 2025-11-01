import Slider from '../ui/Slider';
import Switch from '../ui/Switch';
import { Adjustments, Effect } from '../../utils/adjustments';
import LUTControl from '../ui/LUTControl';
import { AppSettings } from '../ui/AppProperties';
import { useNavigation } from 'desktopuse-sdk';

interface EffectsPanelProps {
  adjustments: Adjustments;
  isForMask: boolean;
  setAdjustments(adjustments: Partial<Adjustments>): any;
  handleLutSelect(path: string): void;
  appSettings: AppSettings | null;
}

export default function EffectsPanel({
  adjustments,
  setAdjustments,
  isForMask = false,
  handleLutSelect,
  appSettings,
}: EffectsPanelProps) {
  const handleAdjustmentChange = (key: Effect, value: any) => {
    const numericValue = parseFloat(value);
    setAdjustments((prev: Partial<Adjustments>) => ({ ...prev, [key]: numericValue }));
  };

  const handleCheckedChange = (key: Effect, checked: boolean) => {
    setAdjustments((prev: Partial<Adjustments>) => ({ ...prev, [key]: checked }));
  };

  const handleColorChange = (key: Effect, value: string) => {
    setAdjustments((prev: Partial<Adjustments>) => ({ ...prev, [key]: value }));
  };

  const handleLutIntensityChange = (intensity: number) => {
    setAdjustments((prev: Partial<Adjustments>) => ({ ...prev, lutIntensity: intensity }));
  };

  const handleLutClear = () => {
    setAdjustments((prev: Partial<Adjustments>) => ({
      ...prev,
      lutPath: null,
      lutName: null,
      lutData: null,
      lutSize: 0,
      lutIntensity: 100,
    }));
  };

  const adjustmentVisibility = appSettings?.adjustmentVisibility || {};

  // Tag Vignette Amount slider
  const { ref: vignetteAmountRef } = useNavigation({
    id: 'vignette-amount-slider',
    type: 'input',
    label: 'Vignette Amount Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Vignette amount slider with value ${adjustments.vignetteAmount}`,
      value: adjustments.vignetteAmount,
      min: -100,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(-100, Math.min(100, numValue));
          handleAdjustmentChange(Effect.VignetteAmount, clampedValue);
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(100, adjustments.vignetteAmount + validAmount);
        handleAdjustmentChange(Effect.VignetteAmount, newValue);
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(-100, adjustments.vignetteAmount - validAmount);
        handleAdjustmentChange(Effect.VignetteAmount, newValue);
      },
    },
  });

  // Tag Vignette Midpoint slider
  const { ref: vignetteMidpointRef } = useNavigation({
    id: 'vignette-midpoint-slider',
    type: 'input',
    label: 'Vignette Midpoint Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Vignette midpoint slider with value ${adjustments.vignetteMidpoint}`,
      value: adjustments.vignetteMidpoint,
      min: 0,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(0, Math.min(100, numValue));
          handleAdjustmentChange(Effect.VignetteMidpoint, clampedValue);
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(100, adjustments.vignetteMidpoint + validAmount);
        handleAdjustmentChange(Effect.VignetteMidpoint, newValue);
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(0, adjustments.vignetteMidpoint - validAmount);
        handleAdjustmentChange(Effect.VignetteMidpoint, newValue);
      },
    },
  });

  // Tag Vignette Roundness slider
  const { ref: vignetteRoundnessRef } = useNavigation({
    id: 'vignette-roundness-slider',
    type: 'input',
    label: 'Vignette Roundness Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Vignette roundness slider with value ${adjustments.vignetteRoundness}`,
      value: adjustments.vignetteRoundness,
      min: -100,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(-100, Math.min(100, numValue));
          handleAdjustmentChange(Effect.VignetteRoundness, clampedValue);
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(100, adjustments.vignetteRoundness + validAmount);
        handleAdjustmentChange(Effect.VignetteRoundness, newValue);
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(-100, adjustments.vignetteRoundness - validAmount);
        handleAdjustmentChange(Effect.VignetteRoundness, newValue);
      },
    },
  });

  // Tag Vignette Feather slider
  const { ref: vignetteFeatherRef } = useNavigation({
    id: 'vignette-feather-slider',
    type: 'input',
    label: 'Vignette Feather Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Vignette feather slider with value ${adjustments.vignetteFeather}`,
      value: adjustments.vignetteFeather,
      min: 0,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(0, Math.min(100, numValue));
          handleAdjustmentChange(Effect.VignetteFeather, clampedValue);
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(100, adjustments.vignetteFeather + validAmount);
        handleAdjustmentChange(Effect.VignetteFeather, newValue);
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(0, adjustments.vignetteFeather - validAmount);
        handleAdjustmentChange(Effect.VignetteFeather, newValue);
      },
    },
  });

  // Tag Grain Amount slider
  const { ref: grainAmountRef } = useNavigation({
    id: 'grain-amount-slider',
    type: 'input',
    label: 'Grain Amount Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Grain amount slider with value ${adjustments.grainAmount}`,
      value: adjustments.grainAmount,
      min: 0,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(0, Math.min(100, numValue));
          handleAdjustmentChange(Effect.GrainAmount, clampedValue);
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(100, adjustments.grainAmount + validAmount);
        handleAdjustmentChange(Effect.GrainAmount, newValue);
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(0, adjustments.grainAmount - validAmount);
        handleAdjustmentChange(Effect.GrainAmount, newValue);
      },
    },
  });

  // Tag Grain Size slider
  const { ref: grainSizeRef } = useNavigation({
    id: 'grain-size-slider',
    type: 'input',
    label: 'Grain Size Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Grain size slider with value ${adjustments.grainSize}`,
      value: adjustments.grainSize,
      min: 0,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(0, Math.min(100, numValue));
          handleAdjustmentChange(Effect.GrainSize, clampedValue);
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(100, adjustments.grainSize + validAmount);
        handleAdjustmentChange(Effect.GrainSize, newValue);
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(0, adjustments.grainSize - validAmount);
        handleAdjustmentChange(Effect.GrainSize, newValue);
      },
    },
  });

  // Tag Grain Roughness slider
  const { ref: grainRoughnessRef } = useNavigation({
    id: 'grain-roughness-slider',
    type: 'input',
    label: 'Grain Roughness Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Grain roughness slider with value ${adjustments.grainRoughness}`,
      value: adjustments.grainRoughness,
      min: 0,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(0, Math.min(100, numValue));
          handleAdjustmentChange(Effect.GrainRoughness, clampedValue);
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(100, adjustments.grainRoughness + validAmount);
        handleAdjustmentChange(Effect.GrainRoughness, newValue);
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(0, adjustments.grainRoughness - validAmount);
        handleAdjustmentChange(Effect.GrainRoughness, newValue);
      },
    },
  });

  return (
    <div>
      {!isForMask && (
        <>
          <div className="my-4 p-2 bg-bg-tertiary rounded-md">
            <p className="text-md font-semibold mb-2 text-primary">LUT</p>
            <LUTControl
              lutName={adjustments.lutName || null}
              lutIntensity={adjustments.lutIntensity || 100}
              onLutSelect={handleLutSelect}
              onIntensityChange={handleLutIntensityChange}
              onClear={handleLutClear}
            />
          </div>

          {adjustmentVisibility.negativeConversion !== false && (
            <div className="mb-4 p-2 bg-bg-tertiary rounded-md">
              <p className="text-md font-semibold mb-2 text-primary">Negative Conversion</p>
              <div className="mb-2">
                <Switch
                  label="Enable"
                  checked={!!adjustments.enableNegativeConversion}
                  onChange={(checked: boolean) => handleCheckedChange(Effect.EnableNegativeConversion, checked)}
                />
              </div>
              {adjustments.enableNegativeConversion && (
                <div className="space-y-2 mt-2 pt-2 border-t border-bg-secondary">
                  <div className="flex items-center justify-between">
                    <label htmlFor="filmBaseColor" className="text-sm font-medium text-text-primary">
                      Film Base Color
                    </label>
                    <input
                      className="p-0 h-8 w-12 border-none rounded-md cursor-pointer bg-bg-secondary"
                      id="filmBaseColor"
                      onChange={(e: any) => handleColorChange(Effect.FilmBaseColor, e.target.value)}
                      type="color"
                      value={adjustments.filmBaseColor || '#ff8800'}
                    />
                  </div>
                  <Slider
                    label="Red Balance"
                    max={100}
                    min={-100}
                    onChange={(e: any) => handleAdjustmentChange(Effect.NegativeRedBalance, e.target.value)}
                    step={1}
                    value={adjustments.negativeRedBalance || 0}
                  />
                  <Slider
                    label="Green Balance"
                    max={100}
                    min={-100}
                    onChange={(e: any) => handleAdjustmentChange(Effect.NegativeGreenBalance, e.target.value)}
                    step={1}
                    value={adjustments.negativeGreenBalance || 0}
                  />
                  <Slider
                    label="Blue Balance"
                    max={100}
                    min={-100}
                    onChange={(e: any) => handleAdjustmentChange(Effect.NegativeBlueBalance, e.target.value)}
                    step={1}
                    value={adjustments.negativeBlueBalance || 0}
                  />
                </div>
              )}
            </div>
          )}

          {adjustmentVisibility.vignette !== false && (
            <div className="mb-4 p-2 bg-bg-tertiary rounded-md">
              <p className="text-md font-semibold mb-2 text-primary">Vignette</p>
              <div ref={vignetteAmountRef}>
                <Slider
                  label="Amount"
                  max={100}
                  min={-100}
                  onChange={(e: any) => handleAdjustmentChange(Effect.VignetteAmount, e.target.value)}
                  step={1}
                  value={adjustments.vignetteAmount}
                />
              </div>
              <div ref={vignetteMidpointRef}>
                <Slider
                  defaultValue={50}
                  label="Midpoint"
                  max={100}
                  min={0}
                  onChange={(e: any) => handleAdjustmentChange(Effect.VignetteMidpoint, e.target.value)}
                  step={1}
                  value={adjustments.vignetteMidpoint}
                />
              </div>
              <div ref={vignetteRoundnessRef}>
                <Slider
                  label="Roundness"
                  max={100}
                  min={-100}
                  onChange={(e: any) => handleAdjustmentChange(Effect.VignetteRoundness, e.target.value)}
                  step={1}
                  value={adjustments.vignetteRoundness}
                />
              </div>
              <div ref={vignetteFeatherRef}>
                <Slider
                  defaultValue={50}
                  label="Feather"
                  max={100}
                  min={0}
                  onChange={(e: any) => handleAdjustmentChange(Effect.VignetteFeather, e.target.value)}
                  step={1}
                  value={adjustments.vignetteFeather}
                />
              </div>
            </div>
          )}

          {adjustmentVisibility.grain !== false && (
            <div className="p-2 bg-bg-tertiary rounded-md">
              <p className="text-md font-semibold mb-2 text-primary">Grain</p>
              <div ref={grainAmountRef}>
                <Slider
                  label="Amount"
                  max={100}
                  min={0}
                  onChange={(e: any) => handleAdjustmentChange(Effect.GrainAmount, e.target.value)}
                  step={1}
                  value={adjustments.grainAmount}
                />
              </div>
              <div ref={grainSizeRef}>
                <Slider
                  defaultValue={25}
                  label="Size"
                  max={100}
                  min={0}
                  onChange={(e: any) => handleAdjustmentChange(Effect.GrainSize, e.target.value)}
                  step={1}
                  value={adjustments.grainSize}
                />
              </div>
              <div ref={grainRoughnessRef}>
                <Slider
                  defaultValue={50}
                  label="Roughness"
                  max={100}
                  min={0}
                  onChange={(e: any) => handleAdjustmentChange(Effect.GrainRoughness, e.target.value)}
                  step={1}
                  value={adjustments.grainRoughness}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}