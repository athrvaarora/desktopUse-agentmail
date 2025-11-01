import { useState, useEffect, useRef } from 'react';
import { Star, Copy, ClipboardPaste, RotateCcw, ChevronUp, ChevronDown, Check, Save, Loader2, Settings } from 'lucide-react';
import clsx from 'clsx';
import Filmstrip from './Filmstrip';
import { GLOBAL_KEYS, ImageFile, SelectedImage, ThumbnailAspectRatio } from '../ui/AppProperties';
import { useNavigation } from 'desktopuse-sdk';

interface BottomBarProps {
  filmstripHeight?: number;
  imageList?: Array<ImageFile>;
  imageRatings?: Record<string, number> | null;
  isCopied: boolean;
  isCopyDisabled: boolean;
  isExportDisabled?: boolean;
  isFilmstripVisible?: boolean;
  isLibraryView?: boolean;
  isLoading?: boolean;
  isPasted: boolean;
  isPasteDisabled: boolean;
  isRatingDisabled?: boolean;
  isResetDisabled?: boolean;
  isResizing?: boolean;
  multiSelectedPaths?: Array<string>;
  onClearSelection?(): void;
  onContextMenu?(event: any, path: string): void;
  onCopy(): void;
  onExportClick?(): void;
  onImageSelect?(path: string, event: any): void;
  onOpenCopyPasteSettings?(): void;
  onPaste(): void;
  onRate(rate: number): void;
  onReset?(): void;
  onZoomChange?(zoomValue: number, fitToWindow?: boolean): void;
  rating: number;
  selectedImage?: SelectedImage;
  setIsFilmstripVisible?(isVisible: boolean): void;
  thumbnails?: Record<string, string>;
  thumbnailAspectRatio: ThumbnailAspectRatio;
  zoom?: number;
  displaySize?: { width: number; height: number };
  originalSize?: { width: number; height: number };
  baseRenderSize?: { width: number; height: number };
}

interface StarRatingProps {
  disabled: boolean;
  onRate(rate: number): void;
  rating: number;
}

const StarRating = ({ rating, onRate, disabled }: StarRatingProps) => {
  return (
    <div className={clsx('flex items-center gap-1', disabled && 'cursor-not-allowed')}>
      {[...Array(5)].map((_, index: number) => {
        const starValue = index + 1;
        return (
          <button
            className="disabled:cursor-not-allowed"
            disabled={disabled}
            key={starValue}
            onClick={() => !disabled && onRate(starValue === rating ? 0 : starValue)}
            title={disabled ? 'Select an image to rate' : `Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
          >
            <Star
              size={18}
              className={clsx(
                'transition-colors duration-150',
                disabled
                  ? 'text-text-secondary opacity-40'
                  : starValue <= rating
                  ? 'fill-accent text-accent'
                  : 'text-text-secondary hover:text-accent',
              )}
            />
          </button>
        );
      })}
    </div>
  );
};

export default function BottomBar({
  filmstripHeight,
  imageList = [],
  imageRatings,
  isCopied,
  isCopyDisabled,
  isExportDisabled,
  isFilmstripVisible,
  isLibraryView = false,
  isLoading = false,
  isPasted,
  isPasteDisabled,
  isRatingDisabled = false,
  isResetDisabled = false,
  isResizing,
  multiSelectedPaths = [],
  onClearSelection,
  onContextMenu,
  onCopy,
  onExportClick,
  onImageSelect,
  onOpenCopyPasteSettings,
  onPaste,
  onRate,
  onReset,
  onZoomChange = () => {},
  rating,
  selectedImage,
  setIsFilmstripVisible,
  thumbnails,
  thumbnailAspectRatio,
  zoom = 0,
  displaySize,
  originalSize,
  baseRenderSize,
}: BottomBarProps) {
  const [isEditingPercent, setIsEditingPercent] = useState(false);
  const [percentInputValue, setPercentInputValue] = useState('');
  const isDraggingSlider = useRef(false);
  const percentInputRef = useRef<HTMLInputElement>(null);
  const [isZoomLabelHovered, setIsZoomLabelHovered] = useState(false);

  const isZoomReady = !isLoading && originalSize && originalSize.width > 0 && displaySize && displaySize.width > 0;
  const currentOriginalPercent = isZoomReady ? displaySize.width / originalSize.width : 1.0;

  const [latchedSliderValue, setLatchedSliderValue] = useState(1.0);
  const [latchedDisplayPercent, setLatchedDisplayPercent] = useState(100);

  // Tag Star Rating component
  const { ref: starRatingRef } = useNavigation({
    id: 'star-rating',
    type: 'button',
    label: 'Star Rating',
    availableActions: ['click'],
    metadata: {
      description: `Image star rating with current value ${rating} stars (0-5)`,
      rating: rating,
      min: 0,
      max: 5,
      disabled: isRatingDisabled,
    },
    customActions: {
      setRating: (value: any) => {
        if (!isRatingDisabled) {
          const numValue = typeof value === 'string' ? parseFloat(value) : value;
          if (typeof numValue === 'number' && !isNaN(numValue)) {
            const clampedValue = Math.max(0, Math.min(5, Math.round(numValue)));
            onRate(clampedValue);
          }
        }
      },
      rate1Star: () => !isRatingDisabled && onRate(rating === 1 ? 0 : 1),
      rate2Stars: () => !isRatingDisabled && onRate(rating === 2 ? 0 : 2),
      rate3Stars: () => !isRatingDisabled && onRate(rating === 3 ? 0 : 3),
      rate4Stars: () => !isRatingDisabled && onRate(rating === 4 ? 0 : 4),
      rate5Stars: () => !isRatingDisabled && onRate(rating === 5 ? 0 : 5),
      clearRating: () => !isRatingDisabled && onRate(0),
    },
  });

  // Tag Copy Settings button
  const { ref: copySettingsRef } = useNavigation({
    id: 'copy-settings-button',
    type: 'button',
    label: 'Copy Settings Button',
    availableActions: ['click'],
    metadata: {
      description: 'Copy current image adjustment settings to clipboard',
      disabled: isCopyDisabled,
      copied: isCopied,
    },
    customActions: {
      copy: () => {
        if (!isCopyDisabled) {
          onCopy();
        }
      },
    },
  });

  // Tag Paste Settings button
  const { ref: pasteSettingsRef } = useNavigation({
    id: 'paste-settings-button',
    type: 'button',
    label: 'Paste Settings Button',
    availableActions: ['click'],
    metadata: {
      description: 'Paste previously copied adjustment settings to current image',
      disabled: isPasteDisabled,
      pasted: isPasted,
    },
    customActions: {
      paste: () => {
        if (!isPasteDisabled) {
          onPaste();
        }
      },
    },
  });

  // Tag Settings button (Copy/Paste Settings)
  const { ref: copyPasteSettingsRef } = useNavigation({
    id: 'copy-paste-settings-button',
    type: 'button',
    label: 'Copy Paste Settings Button',
    availableActions: ['click'],
    metadata: {
      description: 'Open copy/paste settings configuration dialog',
    },
    customActions: {
      openSettings: () => {
        if (onOpenCopyPasteSettings) {
          onOpenCopyPasteSettings();
        }
      },
    },
  });

  // Tag Zoom Slider
  const { ref: zoomSliderRef } = useNavigation({
    id: 'zoom-slider',
    type: 'input',
    label: 'Zoom Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Image zoom slider with current value ${Math.round(latchedDisplayPercent)}% (10% to 200%)`,
      value: latchedSliderValue,
      displayPercent: latchedDisplayPercent,
      min: 0.1,
      max: 2.0,
      step: 0.05,
      isReady: isZoomReady,
    },
    customActions: {
      setZoom: (value: any) => {
        if (isZoomReady) {
          const numValue = typeof value === 'string' ? parseFloat(value) : value;
          if (typeof numValue === 'number' && !isNaN(numValue)) {
            const clampedValue = Math.max(0.1, Math.min(2.0, numValue));
            onZoomChange(clampedValue);
          }
        }
      },
      setPercent: (percent: any) => {
        if (isZoomReady) {
          const numPercent = typeof percent === 'string' ? parseFloat(percent) : percent;
          if (typeof numPercent === 'number' && !isNaN(numPercent)) {
            const originalPercent = numPercent / 100;
            const clampedPercent = Math.max(0.1, Math.min(2.0, originalPercent));
            onZoomChange(clampedPercent);
          }
        }
      },
      zoomIn: (amount: any = 0.1) => {
        if (isZoomReady) {
          const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
          const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0.1;
          const newZoom = Math.min(2.0, latchedSliderValue + validAmount);
          onZoomChange(newZoom);
        }
      },
      zoomOut: (amount: any = 0.1) => {
        if (isZoomReady) {
          const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
          const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? numAmount : 0.1;
          const newZoom = Math.max(0.1, latchedSliderValue - validAmount);
          onZoomChange(newZoom);
        }
      },
      fitToWindow: () => {
        onZoomChange(0, true);
      },
      resetZoom: () => {
        onZoomChange(0, true);
      },
    },
  });

  useEffect(() => {
    if (isZoomReady && !isDraggingSlider.current) {
      setLatchedSliderValue(currentOriginalPercent);
      setLatchedDisplayPercent(Math.round(currentOriginalPercent * 100));
    }
  }, [currentOriginalPercent, isZoomReady]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseFloat(e.target.value);
    setLatchedSliderValue(newZoom);
    if (originalSize && baseRenderSize) {
      const calculatedPercent = (newZoom / (originalSize.width / baseRenderSize.width)) * 100;
      setLatchedDisplayPercent(Math.round(calculatedPercent));
    }
    onZoomChange(newZoom);
  };

  const handleMouseDown = () => {
    isDraggingSlider.current = true;
  };

  const handleMouseUp = () => {
    isDraggingSlider.current = false;
    if (isZoomReady) {
      setLatchedDisplayPercent(Math.round(currentOriginalPercent * 100));
    }
  };

  const handleZoomKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && ['z', 'y'].includes(e.key.toLowerCase())) {
      (e.target as HTMLElement).blur();
      return;
    }
    if (GLOBAL_KEYS.includes(e.key)) {
      (e.target as HTMLElement).blur();
    }
  };

  const handleResetZoom = () => {
    onZoomChange(0, true);
  };

  const handlePercentClick = () => {
    if (!isZoomReady) return;
    setIsEditingPercent(true);
    setPercentInputValue(latchedDisplayPercent.toString());
    setTimeout(() => {
      percentInputRef.current?.focus();
      percentInputRef.current?.select();
    }, 0);
  };

  const handlePercentSubmit = () => {
    const value = parseFloat(percentInputValue);
    if (!isNaN(value)) {
      const originalPercent = value / 100;
      const clampedPercent = Math.max(0.1, Math.min(2.0, originalPercent));
      onZoomChange(clampedPercent);
    }
    setIsEditingPercent(false);
    setPercentInputValue('');
  };

  const handlePercentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handlePercentSubmit();
    else if (e.key === 'Escape') {
      setIsEditingPercent(false);
      setPercentInputValue('');
    }
    e.stopPropagation();
  };

  return (
    <div className="flex-shrink-0 bg-bg-secondary rounded-lg flex flex-col">
      {!isLibraryView && (
        <div
          className={clsx(
            'overflow-hidden',
            !isResizing && 'transition-all duration-300 ease-in-out',
            isFilmstripVisible ? 'p-2' : 'p-0',
          )}
          style={{ height: isFilmstripVisible ? `${filmstripHeight}px` : '0px' }}
        >
          <Filmstrip
            imageList={imageList}
            imageRatings={imageRatings}
            isLoading={isLoading}
            multiSelectedPaths={multiSelectedPaths}
            onClearSelection={onClearSelection}
            onContextMenu={onContextMenu}
            onImageSelect={onImageSelect}
            selectedImage={selectedImage}
            thumbnails={thumbnails}
            thumbnailAspectRatio={thumbnailAspectRatio}
          />
        </div>
      )}

      <div
        className={clsx(
          'flex-shrink-0 h-10 flex items-center justify-between px-3',
          !isLibraryView && isFilmstripVisible && 'border-t border-surface',
        )}
      >
        <div className="flex items-center gap-4">
          <div ref={starRatingRef}>
            <StarRating rating={rating} onRate={onRate} disabled={isRatingDisabled} />
          </div>
          <div className="h-5 w-px bg-surface"></div>
          <div className="flex items-center gap-2">
            <div ref={copySettingsRef}>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-md text-text-secondary hover:bg-surface hover:text-text-primary transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                disabled={isCopyDisabled}
                onClick={onCopy}
                title="Copy Settings"
              >
                {isCopied ? <Check size={18} className="text-green-500 animate-pop-in" /> : <Copy size={18} />}
              </button>
            </div>
            <div ref={pasteSettingsRef}>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-md text-text-secondary hover:bg-surface hover:text-text-primary transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                disabled={isPasteDisabled}
                onClick={onPaste}
                title="Paste Settings"
              >
                {isPasted ? <Check size={18} className="text-green-500 animate-pop-in" /> : <ClipboardPaste size={18} />}
              </button>
            </div>
            <div ref={copyPasteSettingsRef}>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-md text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
                onClick={onOpenCopyPasteSettings}
                title="Copy / Paste Settings"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>
        </div>

        {isLibraryView ? (
          <div className="flex items-center gap-2">
            <button
              className="w-8 h-8 flex items-center justify-center rounded-md text-text-secondary hover:bg-surface hover:text-text-primary transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              disabled={isResetDisabled}
              onClick={onReset}
              title="Reset All Adjustments"
            >
              <RotateCcw size={18} />
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-md text-text-secondary hover:bg-surface hover:text-text-primary transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              disabled={isExportDisabled}
              onClick={onExportClick}
              title="Export Selected Images"
            >
              <Save size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div ref={zoomSliderRef} className="flex items-center gap-2 w-56">
              <div
                className="relative w-12 h-full flex items-center justify-end cursor-pointer"
                onClick={handleResetZoom}
                onMouseEnter={() => setIsZoomLabelHovered(true)}
                onMouseLeave={() => setIsZoomLabelHovered(false)}
                title="Reset Zoom to Fit Window"
              >
                <span className="absolute right-0 text-xs text-text-secondary select-none text-right w-max transition-colors hover:text-text-primary">
                  {isZoomLabelHovered ? 'Reset Zoom' : 'Zoom'}
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={2.0}
                step="0.05"
                value={latchedSliderValue}
                onChange={handleSliderChange}
                onKeyDown={handleZoomKeyDown}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchEnd={handleMouseUp}
                onDoubleClick={handleResetZoom}
                className="flex-1 h-1 bg-surface rounded-lg appearance-none cursor-pointer accent-accent"
              />
              <div className="relative text-xs text-text-secondary w-6 text-right flex items-center justify-end h-5 gap-1">
                {isEditingPercent ? (
                  <input
                    ref={percentInputRef}
                    type="text"
                    value={percentInputValue}
                    onChange={(e) => setPercentInputValue(e.target.value)}
                    onKeyDown={handlePercentKeyDown}
                    onBlur={handlePercentSubmit}
                    className="w-full text-xs text-text-primary bg-bg-primary border border-border-color rounded px-1 text-right"
                    style={{ fontSize: '12px', height: '18px' }}
                  />
                ) : (
                  <span
                    onClick={handlePercentClick}
                    className="cursor-pointer hover:text-text-primary transition-colors select-none"
                    title="Click to enter custom zoom percentage"
                  >
                    {latchedDisplayPercent}%
                  </span>
                )}
                {isLoading && !isEditingPercent && <Loader2 size={12} className="animate-spin ml-1" />}
              </div>
            </div>
            <button
              className="p-1.5 rounded-md text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
              onClick={() => setIsFilmstripVisible?.(!isFilmstripVisible)}
              title={isFilmstripVisible ? 'Collapse Filmstrip' : 'Expand Filmstrip'}
            >
              {isFilmstripVisible ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}