import { useState } from 'react';
import Slider from '../ui/Slider';
import ColorWheel from '../ui/ColorWheel';
import {
  ColorAdjustment,
  ColorCalibration,
  HueSatLum,
  INITIAL_ADJUSTMENTS,
} from '../../utils/adjustments';
import { Adjustments, ColorGrading } from '../../utils/adjustments';
import { AppSettings } from '../ui/AppProperties';
import { useNavigation } from 'desktopuse-sdk';

interface ColorProps {
  color: string;
  name: string;
}

interface ColorPanelProps {
  adjustments: Adjustments;
  setAdjustments(adjustments: Partial<Adjustments>): any;
  appSettings: AppSettings | null;
  isForMask?: boolean;
}

interface ColorSwatchProps {
  color: string;
  isActive: boolean;
  name: string;
  onClick: any;
}

const HSL_COLORS: Array<ColorProps> = [
  { name: 'reds', color: '#f87171' },
  { name: 'oranges', color: '#fb923c' },
  { name: 'yellows', color: '#facc15' },
  { name: 'greens', color: '#4ade80' },
  { name: 'aquas', color: '#2dd4bf' },
  { name: 'blues', color: '#60a5fa' },
  { name: 'purples', color: '#a78bfa' },
  { name: 'magentas', color: '#f472b6' },
];

const ColorSwatch = ({ color, name, isActive, onClick }: ColorSwatchProps) => (
  <button
    aria-label={`Select ${name} color`}
    className={`w-6 h-6 rounded-full focus:outline-none transition-transform duration-150 ${
      isActive ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg-secondary transform scale-110' : 'hover:scale-110'
    }`}
    onClick={() => onClick(name)}
    style={{ backgroundColor: color }}
  />
);

const ColorGradingPanel = ({ adjustments, setAdjustments }: ColorPanelProps) => {
  const colorGrading = adjustments.colorGrading || INITIAL_ADJUSTMENTS.colorGrading;

  const handleChange = (grading: ColorGrading, newValue: HueSatLum) => {
    setAdjustments((prev: Partial<Adjustments>) => ({
      ...prev,
      colorGrading: {
        ...(prev.colorGrading || INITIAL_ADJUSTMENTS.colorGrading),
        [grading]: newValue,
      },
    }));
  };

  const handleGlobalChange = (grading: ColorGrading, value: string) => {
    setAdjustments((prev: Partial<Adjustments>) => ({
      ...prev,
      colorGrading: {
        ...(prev.colorGrading || INITIAL_ADJUSTMENTS.colorGrading),
        [grading]: parseFloat(value),
      },
    }));
  };

  return (
    <div>
      <div className="flex justify-center mb-4">
        <div className="w-[calc(50%-0.5rem)]">
          <ColorWheel
            defaultValue={INITIAL_ADJUSTMENTS.colorGrading.midtones}
            label="Midtones"
            onChange={(val: HueSatLum) => handleChange(ColorGrading.Midtones, val)}
            value={colorGrading.midtones}
          />
        </div>
      </div>
      <div className="flex justify-between mb-2 gap-4">
        <div className="w-full">
          <ColorWheel
            defaultValue={INITIAL_ADJUSTMENTS.colorGrading.shadows}
            label="Shadows"
            onChange={(val: HueSatLum) => handleChange(ColorGrading.Shadows, val)}
            value={colorGrading.shadows}
          />
        </div>
        <div className="w-full">
          <ColorWheel
            defaultValue={INITIAL_ADJUSTMENTS.colorGrading.highlights}
            label="Highlights"
            onChange={(val: HueSatLum) => handleChange(ColorGrading.Highlights, val)}
            value={colorGrading.highlights}
          />
        </div>
      </div>
      <div>
        <Slider
          defaultValue={50}
          label="Blending"
          max={100}
          min={0}
          onChange={(e: any) => handleGlobalChange(ColorGrading.Blending, e.target.value)}
          step={1}
          value={colorGrading.blending}
        />
        <Slider
          defaultValue={0}
          label="Balance"
          max={100}
          min={-100}
          onChange={(e: any) => handleGlobalChange(ColorGrading.Balance, e.target.value)}
          step={1}
          value={colorGrading.balance}
        />
      </div>
    </div>
  );
};

const ColorCalibrationPanel = ({ adjustments, setAdjustments }: ColorPanelProps) => {
  const [activePrimary, setActivePrimary] = useState('red');
  const colorCalibration = adjustments.colorCalibration || INITIAL_ADJUSTMENTS.colorCalibration;

  const PRIMARY_COLORS = [
    { name: 'red', color: '#f87171' },
    { name: 'green', color: '#4ade80' },
    { name: 'blue', color: '#60a5fa' },
  ];

  const handleShadowsChange = (value: string) => {
    setAdjustments((prev: Partial<Adjustments>) => ({
      ...prev,
      colorCalibration: {
        ...(prev.colorCalibration || INITIAL_ADJUSTMENTS.colorCalibration),
        shadowsTint: parseFloat(value),
      },
    }));
  };

  const handlePrimaryChange = (key: 'Hue' | 'Saturation', value: string) => {
    const fullKey = `${activePrimary}${key}` as keyof ColorCalibration;
    setAdjustments((prev: Partial<Adjustments>) => ({
      ...prev,
      colorCalibration: {
        ...(prev.colorCalibration || INITIAL_ADJUSTMENTS.colorCalibration),
        [fullKey]: parseFloat(value),
      },
    }));
  };

  const currentValues = {
    hue: colorCalibration[`${activePrimary}Hue` as keyof ColorCalibration] || 0,
    saturation: colorCalibration[`${activePrimary}Saturation` as keyof ColorCalibration] || 0,
  };

  return (
    <div className="p-2 bg-bg-tertiary rounded-md mt-4">
      <p className="text-md font-semibold mb-3 text-primary">Color Calibration</p>
      <div>
        <p className="text-sm font-medium mb-1 text-secondary">Shadows</p>
        <Slider
          label="Tint"
          min={-100}
          max={100}
          step={1}
          defaultValue={0}
          value={colorCalibration.shadowsTint}
          onChange={(e: any) => handleShadowsChange(e.target.value)}
        />
      </div>
      <div className="mt-3">
        <p className="text-sm font-medium mb-3 text-secondary">Primaries</p>
        <div className="flex justify-center gap-6 mb-4 px-1">
          {PRIMARY_COLORS.map(({ name, color }) => (
            <ColorSwatch
              color={color}
              isActive={activePrimary === name}
              key={name}
              name={name}
              onClick={setActivePrimary}
            />
          ))}
        </div>
        <Slider
          label="Hue"
          min={-100}
          max={100}
          step={1}
          defaultValue={0}
          value={currentValues.hue}
          onChange={(e: any) => handlePrimaryChange('Hue', e.target.value)}
        />
        <Slider
          label="Saturation"
          min={-100}
          max={100}
          step={1}
          defaultValue={0}
          value={currentValues.saturation}
          onChange={(e: any) => handlePrimaryChange('Saturation', e.target.value)}
        />
      </div>
    </div>
  );
};

export default function ColorPanel({ adjustments, setAdjustments, appSettings, isForMask = false }: ColorPanelProps) {
  const [activeColor, setActiveColor] = useState('reds');
  const adjustmentVisibility = appSettings?.adjustmentVisibility || {};

  const handleGlobalChange = (key: ColorAdjustment, value: string) => {
    setAdjustments((prev: Partial<Adjustments>) => ({ ...prev, [key]: parseFloat(value) }));
  };

  const handleHslChange = (key: ColorAdjustment, value: string) => {
    setAdjustments((prev: Partial<Adjustments>) => ({
      ...prev,
      hsl: {
        ...(prev.hsl || {}),
        [activeColor]: {
          ...(prev.hsl?.[activeColor] || {}),
          [key]: parseFloat(value),
        },
      },
    }));
  };

  const currentHsl = adjustments?.hsl?.[activeColor] || { hue: 0, saturation: 0, luminance: 0 };

  // Tag Temperature slider
  const { ref: temperatureRef } = useNavigation({
    id: 'temperature-slider',
    type: 'input',
    label: 'Temperature Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `White balance temperature slider with value ${adjustments.temperature || 0}`,
      value: adjustments.temperature || 0,
      min: -100,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(-100, Math.min(100, numValue));
          setAdjustments((prev: Partial<Adjustments>) => ({ ...prev, temperature: clampedValue }));
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(100, (adjustments.temperature || 0) + validAmount);
        setAdjustments((prev: Partial<Adjustments>) => ({ ...prev, temperature: newValue }));
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(-100, (adjustments.temperature || 0) - validAmount);
        setAdjustments((prev: Partial<Adjustments>) => ({ ...prev, temperature: newValue }));
      },
    },
  });

  // Tag Tint slider
  const { ref: tintRef } = useNavigation({
    id: 'tint-slider',
    type: 'input',
    label: 'Tint Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `White balance tint slider with value ${adjustments.tint || 0}`,
      value: adjustments.tint || 0,
      min: -100,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(-100, Math.min(100, numValue));
          setAdjustments((prev: Partial<Adjustments>) => ({ ...prev, tint: clampedValue }));
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(100, (adjustments.tint || 0) + validAmount);
        setAdjustments((prev: Partial<Adjustments>) => ({ ...prev, tint: newValue }));
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(-100, (adjustments.tint || 0) - validAmount);
        setAdjustments((prev: Partial<Adjustments>) => ({ ...prev, tint: newValue }));
      },
    },
  });

  // Tag Vibrance slider
  const { ref: vibranceRef } = useNavigation({
    id: 'vibrance-slider',
    type: 'input',
    label: 'Vibrance Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Vibrance slider with value ${adjustments.vibrance || 0}`,
      value: adjustments.vibrance || 0,
      min: -100,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(-100, Math.min(100, numValue));
          setAdjustments((prev: Partial<Adjustments>) => ({ ...prev, vibrance: clampedValue }));
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(100, (adjustments.vibrance || 0) + validAmount);
        setAdjustments((prev: Partial<Adjustments>) => ({ ...prev, vibrance: newValue }));
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(-100, (adjustments.vibrance || 0) - validAmount);
        setAdjustments((prev: Partial<Adjustments>) => ({ ...prev, vibrance: newValue }));
      },
    },
  });

  // Tag Saturation slider
  const { ref: saturationRef } = useNavigation({
    id: 'saturation-slider',
    type: 'input',
    label: 'Saturation Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Saturation slider with value ${adjustments.saturation || 0}`,
      value: adjustments.saturation || 0,
      min: -100,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(-100, Math.min(100, numValue));
          setAdjustments((prev: Partial<Adjustments>) => ({ ...prev, saturation: clampedValue }));
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(100, (adjustments.saturation || 0) + validAmount);
        setAdjustments((prev: Partial<Adjustments>) => ({ ...prev, saturation: newValue }));
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(-100, (adjustments.saturation || 0) - validAmount);
        setAdjustments((prev: Partial<Adjustments>) => ({ ...prev, saturation: newValue }));
      },
    },
  });

  // Tag Color Mixer selector
  const { ref: colorMixerRef } = useNavigation({
    id: 'color-mixer-selector',
    type: 'button',
    label: 'Color Mixer Selector',
    availableActions: ['click'],
    metadata: {
      description: `Color mixer with ${activeColor} selected. Available colors: reds, oranges, yellows, greens, aquas, blues, purples, magentas`,
      activeColor: activeColor,
      availableColors: ['reds', 'oranges', 'yellows', 'greens', 'aquas', 'blues', 'purples', 'magentas'],
    },
    customActions: {
      selectColor: (color: string) => {
        if (['reds', 'oranges', 'yellows', 'greens', 'aquas', 'blues', 'purples', 'magentas'].includes(color)) {
          setActiveColor(color);
        }
      },
    },
  });

  // Tag HSL Hue slider
  const { ref: hslHueRef } = useNavigation({
    id: 'hsl-hue-slider',
    type: 'input',
    label: 'HSL Hue Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `HSL Hue slider for ${activeColor} with value ${currentHsl.hue}`,
      value: currentHsl.hue,
      activeColor: activeColor,
      min: -100,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(-100, Math.min(100, numValue));
          setAdjustments((prev: Partial<Adjustments>) => ({
            ...prev,
            hsl: {
              ...(prev.hsl || {}),
              [activeColor]: {
                ...(prev.hsl?.[activeColor] || {}),
                hue: clampedValue,
              },
            },
          }));
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(100, currentHsl.hue + validAmount);
        setAdjustments((prev: Partial<Adjustments>) => ({
          ...prev,
          hsl: {
            ...(prev.hsl || {}),
            [activeColor]: {
              ...(prev.hsl?.[activeColor] || {}),
              hue: newValue,
            },
          },
        }));
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(-100, currentHsl.hue - validAmount);
        setAdjustments((prev: Partial<Adjustments>) => ({
          ...prev,
          hsl: {
            ...(prev.hsl || {}),
            [activeColor]: {
              ...(prev.hsl?.[activeColor] || {}),
              hue: newValue,
            },
          },
        }));
      },
    },
  });

  // Tag HSL Saturation slider
  const { ref: hslSaturationRef } = useNavigation({
    id: 'hsl-saturation-slider',
    type: 'input',
    label: 'HSL Saturation Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `HSL Saturation slider for ${activeColor} with value ${currentHsl.saturation}`,
      value: currentHsl.saturation,
      activeColor: activeColor,
      min: -100,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(-100, Math.min(100, numValue));
          setAdjustments((prev: Partial<Adjustments>) => ({
            ...prev,
            hsl: {
              ...(prev.hsl || {}),
              [activeColor]: {
                ...(prev.hsl?.[activeColor] || {}),
                saturation: clampedValue,
              },
            },
          }));
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(100, currentHsl.saturation + validAmount);
        setAdjustments((prev: Partial<Adjustments>) => ({
          ...prev,
          hsl: {
            ...(prev.hsl || {}),
            [activeColor]: {
              ...(prev.hsl?.[activeColor] || {}),
              saturation: newValue,
            },
          },
        }));
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(-100, currentHsl.saturation - validAmount);
        setAdjustments((prev: Partial<Adjustments>) => ({
          ...prev,
          hsl: {
            ...(prev.hsl || {}),
            [activeColor]: {
              ...(prev.hsl?.[activeColor] || {}),
              saturation: newValue,
            },
          },
        }));
      },
    },
  });

  // Tag HSL Luminance slider
  const { ref: hslLuminanceRef } = useNavigation({
    id: 'hsl-luminance-slider',
    type: 'input',
    label: 'HSL Luminance Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `HSL Luminance slider for ${activeColor} with value ${currentHsl.luminance}`,
      value: currentHsl.luminance,
      activeColor: activeColor,
      min: -100,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(-100, Math.min(100, numValue));
          setAdjustments((prev: Partial<Adjustments>) => ({
            ...prev,
            hsl: {
              ...(prev.hsl || {}),
              [activeColor]: {
                ...(prev.hsl?.[activeColor] || {}),
                luminance: clampedValue,
              },
            },
          }));
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(100, currentHsl.luminance + validAmount);
        setAdjustments((prev: Partial<Adjustments>) => ({
          ...prev,
          hsl: {
            ...(prev.hsl || {}),
            [activeColor]: {
              ...(prev.hsl?.[activeColor] || {}),
              luminance: newValue,
            },
          },
        }));
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(-100, currentHsl.luminance - validAmount);
        setAdjustments((prev: Partial<Adjustments>) => ({
          ...prev,
          hsl: {
            ...(prev.hsl || {}),
            [activeColor]: {
              ...(prev.hsl?.[activeColor] || {}),
              luminance: newValue,
            },
          },
        }));
      },
    },
  });

  return (
    <div>
      <div className="mb-4 p-2 bg-bg-tertiary rounded-md">
        <p className="text-md font-semibold mb-2 text-primary">White Balance</p>
        <div ref={temperatureRef}>
          <Slider
            label="Temperature"
            max={100}
            min={-100}
            onChange={(e: any) => handleGlobalChange(ColorAdjustment.Temperature, e.target.value)}
            step={1}
            value={adjustments.temperature || 0}
          />
        </div>
        <div ref={tintRef}>
          <Slider
            label="Tint"
            max={100}
            min={-100}
            onChange={(e: any) => handleGlobalChange(ColorAdjustment.Tint, e.target.value)}
            step={1}
            value={adjustments.tint || 0}
          />
        </div>
      </div>

      <div className="mb-4 p-2 bg-bg-tertiary rounded-md">
        <p className="text-md font-semibold mb-2 text-primary">Presence</p>
        <div ref={vibranceRef}>
          <Slider
            label="Vibrance"
            max={100}
            min={-100}
            onChange={(e: any) => handleGlobalChange(ColorAdjustment.Vibrance, e.target.value)}
            step={1}
            value={adjustments.vibrance || 0}
          />
        </div>
        <div ref={saturationRef}>
          <Slider
            label="Saturation"
            max={100}
            min={-100}
            onChange={(e: any) => handleGlobalChange(ColorAdjustment.Saturation, e.target.value)}
            step={1}
            value={adjustments.saturation || 0}
          />
        </div>
      </div>

      <div className="p-2 bg-bg-tertiary rounded-md mt-4">
        <p className="text-md font-semibold mb-3 text-primary">Color Grading</p>
        <ColorGradingPanel adjustments={adjustments} setAdjustments={setAdjustments} appSettings={appSettings} />
      </div>

      <div className="p-2 bg-bg-tertiary rounded-md mt-4">
        <p className="text-md font-semibold mb-3 text-primary">Color Mixer</p>
        <div ref={colorMixerRef} className="flex justify-between mb-4 px-1">
          {HSL_COLORS.map(({ name, color }) => (
            <ColorSwatch
              color={color}
              isActive={activeColor === name}
              key={name}
              name={name}
              onClick={setActiveColor}
            />
          ))}
        </div>
        <div ref={hslHueRef}>
          <Slider
            label="Hue"
            max={100}
            min={-100}
            onChange={(e: any) => handleHslChange(ColorAdjustment.Hue, e.target.value)}
            step={1}
            value={currentHsl.hue}
          />
        </div>
        <div ref={hslSaturationRef}>
          <Slider
            label="Saturation"
            max={100}
            min={-100}
            onChange={(e: any) => handleHslChange(ColorAdjustment.Saturation, e.target.value)}
            step={1}
            value={currentHsl.saturation}
          />
        </div>
        <div ref={hslLuminanceRef}>
          <Slider
            label="Luminance"
            max={100}
            min={-100}
            onChange={(e: any) => handleHslChange(ColorAdjustment.Luminance, e.target.value)}
            step={1}
            value={currentHsl.luminance}
          />
        </div>
      </div>

      {!isForMask && adjustmentVisibility.colorCalibration !== false && (
        <ColorCalibrationPanel adjustments={adjustments} setAdjustments={setAdjustments} appSettings={appSettings} />
      )}
    </div>
  );
}