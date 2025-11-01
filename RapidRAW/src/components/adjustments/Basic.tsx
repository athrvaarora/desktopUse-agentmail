import { motion } from 'framer-motion';
import clsx from 'clsx';
import Slider from '../ui/Slider';
import { Adjustments, BasicAdjustment } from '../../utils/adjustments';
import { useEffect, useRef, useState } from 'react';
import { useNavigation } from 'desktopuse-sdk';

interface BasicAdjustmentsProps {
  adjustments: Adjustments;
  setAdjustments(adjustments: Partial<Adjustments>): any;
  isForMask?: boolean;
}

const toneMapperOptions = [
  { id: 'basic', label: 'Basic' },
  { id: 'agx', label: 'AgX' },
];

interface ToneMapperSwitchProps {
  selectedMapper: string;
  onMapperChange: (mapper: string) => void;
  exposureValue: number;
  onExposureChange: (value: number) => void;
}

const ToneMapperSwitch = ({
  selectedMapper,
  onMapperChange,
  exposureValue,
  onExposureChange,
}: ToneMapperSwitchProps) => {
  const [buttonRefs, setButtonRefs] = useState<Map<string, HTMLButtonElement>>(new Map());
  const [bubbleStyle, setBubbleStyle] = useState({});
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialAnimation = useRef(true);
  const [isLabelHovered, setIsLabelHovered] = useState(false);

  const handleReset = () => {
    onMapperChange('basic');
    onExposureChange(0);
  };

  useEffect(() => {
    const selectedButton = buttonRefs.get(selectedMapper);

    if (selectedButton && containerRef.current) {
      const targetStyle = {
        x: selectedButton.offsetLeft,
        width: selectedButton.offsetWidth,
      };

      if (isInitialAnimation.current && containerRef.current.offsetWidth > 0) {
        let initialX;
        if (selectedMapper === 'agx') {
          initialX = containerRef.current.offsetWidth;
        } else {
          initialX = -targetStyle.width;
        }

        setBubbleStyle({
          x: [initialX, targetStyle.x],
          width: targetStyle.width,
        });
        isInitialAnimation.current = false;
      } else {
        setBubbleStyle(targetStyle);
      }
    }
  }, [selectedMapper, buttonRefs]);

  return (
    <div className="group">
      <div className="flex justify-between items-center mb-2">
        <div
          className="grid cursor-pointer"
          onClick={handleReset}
          onDoubleClick={handleReset}
          onMouseEnter={() => setIsLabelHovered(true)}
          onMouseLeave={() => setIsLabelHovered(false)}
          title="Click or double-click to reset to Basic"
        >
          <span
            aria-hidden={isLabelHovered ? 'true' : 'false'}
            className={`col-start-1 row-start-1 text-sm font-medium text-text-secondary select-none transition-opacity duration-200 ease-in-out ${
              isLabelHovered ? 'opacity-0' : 'opacity-100'
            }`}
          >
            Tone Mapper
          </span>
          <span
            aria-hidden={!isLabelHovered ? 'true' : 'false'}
            className={`col-start-1 row-start-1 text-sm font-medium text-text-primary select-none transition-opacity duration-200 ease-in-out pointer-events-none ${
              isLabelHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Reset
          </span>
        </div>
      </div>
      <div className="w-full p-2 pb-1 bg-card-active rounded-md">
        <div ref={containerRef} className="relative flex w-full">
          <motion.div
            className="absolute top-0 bottom-0 z-0 bg-accent"
            style={{ borderRadius: 6 }}
            animate={bubbleStyle}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
          {toneMapperOptions.map((mapper) => (
            <button
              key={mapper.id}
              ref={(el) => {
                if (el) {
                  const newRefs = new Map(buttonRefs);
                  if (newRefs.get(mapper.id) !== el) {
                    newRefs.set(mapper.id, el);
                    setButtonRefs(newRefs);
                  }
                }
              }}
              onClick={() => onMapperChange(mapper.id)}
              className={clsx(
                'relative flex-1 flex items-center justify-center gap-2 px-3 p-1.5 text-sm font-medium rounded-md transition-colors',
                {
                  'text-text-primary hover:bg-surface': selectedMapper !== mapper.id,
                  'text-button-text': selectedMapper === mapper.id,
                },
              )}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <span className="relative z-10 flex items-center">{mapper.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-2.5 px-1">
          <Slider
            label="Exposure"
            max={5}
            min={-5}
            onChange={(e: any) => onExposureChange(parseFloat(e.target.value))}
            step={0.01}
            value={exposureValue}
            trackClassName="bg-surface"
          />
        </div>
      </div>
    </div>
  );
};

export default function BasicAdjustments({ adjustments, setAdjustments, isForMask = false }: BasicAdjustmentsProps) {
  const handleAdjustmentChange = (key: BasicAdjustment, value: any) => {
    const numericValue = parseFloat(value);
    setAdjustments((prev: Partial<Adjustments>) => ({ ...prev, [key]: numericValue }));
  };

  const handleToneMapperChange = (mapper: string) => {
    setAdjustments((prev: Partial<Adjustments>) => ({
      ...prev,
      toneMapper: mapper as 'basic' | 'agx',
    }));
  };

  // Tag Brightness slider for LLM control
  const { ref: brightnessRef } = useNavigation({
    id: 'brightness-slider',
    type: 'input',
    label: 'Brightness Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Brightness adjustment slider with value ${adjustments.brightness}`,
      value: adjustments.brightness,
      min: -5,
      max: 5,
      step: 0.01,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(-5, Math.min(5, numValue));
          handleAdjustmentChange(BasicAdjustment.Brightness, clampedValue);
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(5, adjustments.brightness + validAmount);
        handleAdjustmentChange(BasicAdjustment.Brightness, newValue);
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(-5, adjustments.brightness - validAmount);
        handleAdjustmentChange(BasicAdjustment.Brightness, newValue);
      },
    },
  });

  // Tag Contrast slider for LLM control
  const { ref: contrastRef } = useNavigation({
    id: 'contrast-slider',
    type: 'input',
    label: 'Contrast Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Contrast adjustment slider with value ${adjustments.contrast}`,
      value: adjustments.contrast,
      min: -100,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(-100, Math.min(100, numValue));
          handleAdjustmentChange(BasicAdjustment.Contrast, clampedValue);
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(100, adjustments.contrast + validAmount);
        handleAdjustmentChange(BasicAdjustment.Contrast, newValue);
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(-100, adjustments.contrast - validAmount);
        handleAdjustmentChange(BasicAdjustment.Contrast, newValue);
      },
    },
  });

  // Tag Highlights slider for LLM control
  const { ref: highlightsRef } = useNavigation({
    id: 'highlights-slider',
    type: 'input',
    label: 'Highlights Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Highlights adjustment slider with value ${adjustments.highlights}`,
      value: adjustments.highlights,
      min: -100,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(-100, Math.min(100, numValue));
          handleAdjustmentChange(BasicAdjustment.Highlights, clampedValue);
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(100, adjustments.highlights + validAmount);
        handleAdjustmentChange(BasicAdjustment.Highlights, newValue);
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(-100, adjustments.highlights - validAmount);
        handleAdjustmentChange(BasicAdjustment.Highlights, newValue);
      },
    },
  });

  // Tag Shadows slider for LLM control
  const { ref: shadowsRef } = useNavigation({
    id: 'shadows-slider',
    type: 'input',
    label: 'Shadows Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Shadows adjustment slider with value ${adjustments.shadows}`,
      value: adjustments.shadows,
      min: -100,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(-100, Math.min(100, numValue));
          handleAdjustmentChange(BasicAdjustment.Shadows, clampedValue);
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(100, adjustments.shadows + validAmount);
        handleAdjustmentChange(BasicAdjustment.Shadows, newValue);
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(-100, adjustments.shadows - validAmount);
        handleAdjustmentChange(BasicAdjustment.Shadows, newValue);
      },
    },
  });

  // Tag Whites slider for LLM control
  const { ref: whitesRef } = useNavigation({
    id: 'whites-slider',
    type: 'input',
    label: 'Whites Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Whites adjustment slider with value ${adjustments.whites}`,
      value: adjustments.whites,
      min: -100,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(-100, Math.min(100, numValue));
          handleAdjustmentChange(BasicAdjustment.Whites, clampedValue);
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(100, adjustments.whites + validAmount);
        handleAdjustmentChange(BasicAdjustment.Whites, newValue);
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(-100, adjustments.whites - validAmount);
        handleAdjustmentChange(BasicAdjustment.Whites, newValue);
      },
    },
  });

  // Tag Blacks slider for LLM control
  const { ref: blacksRef } = useNavigation({
    id: 'blacks-slider',
    type: 'input',
    label: 'Blacks Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Blacks adjustment slider with value ${adjustments.blacks}`,
      value: adjustments.blacks,
      min: -100,
      max: 100,
      step: 1,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(-100, Math.min(100, numValue));
          handleAdjustmentChange(BasicAdjustment.Blacks, clampedValue);
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(100, adjustments.blacks + validAmount);
        handleAdjustmentChange(BasicAdjustment.Blacks, newValue);
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(-100, adjustments.blacks - validAmount);
        handleAdjustmentChange(BasicAdjustment.Blacks, newValue);
      },
    },
  });

  // Tag Tone Mapper dropdown for LLM control
  const { ref: toneMapperRef } = useNavigation({
    id: 'tone-mapper-switch',
    type: 'button',
    label: 'Tone Mapper Switch',
    availableActions: ['click'],
    metadata: {
      description: `Tone mapper selector currently set to ${adjustments.toneMapper || 'agx'}. Options: basic, agx`,
      currentValue: adjustments.toneMapper || 'agx',
    },
    customActions: {
      selectBasic: () => {
        handleToneMapperChange('basic');
      },
      selectAgX: () => {
        handleToneMapperChange('agx');
      },
      setValue: (value: string) => {
        if (value === 'basic' || value === 'agx') {
          handleToneMapperChange(value);
        }
      },
    },
  });

  // Tag Exposure slider for LLM control
  const { ref: exposureRef } = useNavigation({
    id: 'exposure-slider',
    type: 'input',
    label: 'Exposure Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Exposure adjustment slider with value ${adjustments.exposure}`,
      value: adjustments.exposure,
      min: -5,
      max: 5,
      step: 0.01,
    },
    customActions: {
      setValue: (newValue: any) => {
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(-5, Math.min(5, numValue));
          handleAdjustmentChange(BasicAdjustment.Exposure, clampedValue);
        }
      },
      increase: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.min(5, adjustments.exposure + validAmount);
        handleAdjustmentChange(BasicAdjustment.Exposure, newValue);
      },
      decrease: (amount: any) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0;
        const newValue = Math.max(-5, adjustments.exposure - validAmount);
        handleAdjustmentChange(BasicAdjustment.Exposure, newValue);
      },
    },
  });

  return (
    <div>
      <div ref={brightnessRef}>
        <Slider
          label="Brightness"
          max={5}
          min={-5}
          onChange={(e: any) => handleAdjustmentChange(BasicAdjustment.Brightness, e.target.value)}
          step={0.01}
          value={adjustments.brightness}
        />
      </div>
      <div ref={contrastRef}>
        <Slider
          label="Contrast"
          max={100}
          min={-100}
          onChange={(e: any) => handleAdjustmentChange(BasicAdjustment.Contrast, e.target.value)}
          step={1}
          value={adjustments.contrast}
        />
      </div>
      <div ref={highlightsRef}>
        <Slider
          label="Highlights"
          max={100}
          min={-100}
          onChange={(e: any) => handleAdjustmentChange(BasicAdjustment.Highlights, e.target.value)}
          step={1}
          value={adjustments.highlights}
        />
      </div>
      <div ref={shadowsRef}>
        <Slider
          label="Shadows"
          max={100}
          min={-100}
          onChange={(e: any) => handleAdjustmentChange(BasicAdjustment.Shadows, e.target.value)}
          step={1}
          value={adjustments.shadows}
        />
      </div>
      <div ref={whitesRef}>
        <Slider
          label="Whites"
          max={100}
          min={-100}
          onChange={(e: any) => handleAdjustmentChange(BasicAdjustment.Whites, e.target.value)}
          step={1}
          value={adjustments.whites}
        />
      </div>
      <div ref={blacksRef}>
        <Slider
          label="Blacks"
          max={100}
          min={-100}
          onChange={(e: any) => handleAdjustmentChange(BasicAdjustment.Blacks, e.target.value)}
          step={1}
          value={adjustments.blacks}
        />
      </div>
      {!isForMask && (
        <div ref={toneMapperRef}>
          <ToneMapperSwitch
            selectedMapper={adjustments.toneMapper || 'agx'}
            onMapperChange={handleToneMapperChange}
            exposureValue={adjustments.exposure}
            onExposureChange={(value) => handleAdjustmentChange(BasicAdjustment.Exposure, value)}
          />
        </div>
      )}
    </div>
  );
}