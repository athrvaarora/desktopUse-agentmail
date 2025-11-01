import { memo, useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, ArrowLeft, Maximize, Loader2, Undo, Redo, Waves } from 'lucide-react';
import clsx from 'clsx';
import { SelectedImage } from '../../ui/AppProperties';

interface EditorToolbarProps {
  canRedo: boolean;
  canUndo: boolean;
  isFullScreenLoading: boolean;
  isWaveformVisible: boolean;
  isLoading: boolean;
  isLoadingFullRes?: boolean;
  onBackToLibrary(): void;
  onRedo(): void;
  onToggleFullScreen(): void;
  onToggleShowOriginal(): void;
  onToggleWaveform(): void;
  onUndo(): void;
  selectedImage: SelectedImage;
  showOriginal: boolean;
}

const EditorToolbar = memo(
  ({
    canRedo,
    canUndo,
    isFullScreenLoading,
    isLoading,
    isLoadingFullRes,
    isWaveformVisible,
    onBackToLibrary,
    onRedo,
    onToggleFullScreen,
    onToggleShowOriginal,
    onToggleWaveform,
    onUndo,
    selectedImage,
    showOriginal,
  }: EditorToolbarProps) => {
    const isAnyLoading = isLoading || !!isLoadingFullRes || isFullScreenLoading;
    const [isLoaderVisible, setIsLoaderVisible] = useState(false);
    const [disableLoaderTransition, setDisableLoaderTransition] = useState(false);
    const hideTimeoutRef = useRef<number | null>(null);
    const prevIsLoadingRef = useRef(isLoading);

    const showResolution = selectedImage.width > 0 && selectedImage.height > 0;
    const [displayedResolution, setDisplayedResolution] = useState('');

    useEffect(() => {
      if (showResolution) {
        setDisplayedResolution(` - ${selectedImage.width} × ${selectedImage.height}`);
      }
    }, [showResolution, selectedImage.width, selectedImage.height]);

    useEffect(() => {
      const wasLoadingResolution = prevIsLoadingRef.current && !isLoading;

      if (isAnyLoading) {
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        setDisableLoaderTransition(false);
        setIsLoaderVisible(true);
      } else if (isLoaderVisible) {
        if (wasLoadingResolution) {
          setDisableLoaderTransition(true);
          setIsLoaderVisible(false);
        } else {
          setDisableLoaderTransition(false);
          hideTimeoutRef.current = window.setTimeout(() => {
            setIsLoaderVisible(false);
          }, 300);
        }
      }

      prevIsLoadingRef.current = isLoading;

      return () => {
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      };
    }, [isAnyLoading, isLoading, isLoaderVisible]);

    return (
      <div className="relative flex-shrink-0 flex justify-between items-center px-4 h-14">
        <button
          className="bg-surface text-text-primary p-2 rounded-full hover:bg-card-active transition-colors"
          onClick={onBackToLibrary}
          title="Back to Library"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface text-text-secondary text-xs px-4 py-2 rounded-full select-none truncate flex items-center max-w-[50%]">
          <span className="font-medium text-text-primary truncate">
            {selectedImage.path.split(/[\/\\]/).pop()}
          </span>

          <div
            className={clsx(
              'transition-all duration-300 ease-out overflow-hidden whitespace-nowrap',
              showResolution ? 'max-w-[10rem] opacity-100 ml-2' : 'max-w-0 opacity-0 ml-0',
            )}
          >
            <span
              className={clsx(
                'block transition-transform duration-200 delay-100',
                showResolution ? 'scale-100' : 'scale-95',
              )}
            >
              {displayedResolution}
            </span>
          </div>

          <div
            className={clsx(
              'overflow-hidden',
              isLoaderVisible ? 'max-w-[1rem] opacity-100 ml-2' : 'max-w-0 opacity-0 ml-0',
              disableLoaderTransition ? 'transition-none' : 'transition-all duration-300',
            )}
          >
            <Loader2 size={12} className="animate-spin" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="bg-surface text-text-primary p-2 rounded-full hover:bg-card-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canUndo}
            onClick={onUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo size={20} />
          </button>
          <button
            className="bg-surface text-text-primary p-2 rounded-full hover:bg-card-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canRedo}
            onClick={onRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo size={20} />
          </button>
          <button
            className={clsx(
              'p-2 rounded-full transition-colors',
              isWaveformVisible
                ? 'bg-accent text-button-text hover:bg-accent/90 hover:text-button-text'
                : 'bg-surface hover:bg-card-active text-text-primary',
            )}
            onClick={onToggleWaveform}
            title="Toggle Waveform (W)"
          >
            <Waves size={20} />
          </button>

          <button
            className={clsx(
              'p-2 rounded-full transition-colors',
              showOriginal
                ? 'bg-accent text-button-text hover:bg-accent/90 hover:text-button-text'
                : 'bg-surface hover:bg-card-active text-text-primary',
            )}
            onClick={onToggleShowOriginal}
            title={showOriginal ? 'Show Edited (.)' : 'Show Original (.)'}
          >
            {showOriginal ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
          <button
            className="bg-surface text-text-primary p-2 rounded-full hover:bg-card-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isFullScreenLoading}
            onClick={onToggleFullScreen}
            title="Toggle Fullscreen (F)"
          >
            <Maximize size={20} />
          </button>
        </div>
      </div>
    );
  },
);

export default EditorToolbar;