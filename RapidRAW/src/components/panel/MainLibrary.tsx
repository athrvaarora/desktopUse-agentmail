import { useState, useEffect, useRef, forwardRef, useMemo, useCallback } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-shell';
import {
  AlertTriangle,
  Check,
  Folder,
  FolderInput,
  Home,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Settings,
  SlidersHorizontal,
  Star as StarIcon,
  Search,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FixedSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import Button from '../ui/Button';
import SettingsPanel from './SettingsPanel';
import { ThemeProps, THEMES, DEFAULT_THEME_ID } from '../../utils/themes';
import {
  AppSettings,
  FilterCriteria,
  ImageFile,
  Invokes,
  Progress,
  RawStatus,
  SortCriteria,
  SortDirection,
  SupportedTypes,
  ThumbnailSize,
  ThumbnailAspectRatio,
} from '../ui/AppProperties';
import { Color, COLOR_LABELS } from '../../utils/adjustments';
import { ImportState, Status } from './right/ExportImportProperties';

interface CellProps {
  columnIndex: number;
  data: any;
  rowIndex: number;
  style: any;
}

interface DropdownMenuProps {
  buttonContent: any;
  buttonTitle: string;
  children: any;
  contentClassName: string;
}

interface FilterOptionProps {
  filterCriteria: FilterCriteria;
  setFilterCriteria(criteria: any): void;
}

interface KeyValueLabel {
  key?: string;
  label?: string;
  value?: number;
}

interface MainLibraryProps {
  activePath: string | null;
  aiModelDownloadStatus: string | null;
  appSettings: AppSettings | null;
  currentFolderPath: string | null;
  filterCriteria: FilterCriteria;
  imageList: Array<ImageFile>;
  imageRatings: Record<string, number>;
  importState: ImportState;
  indexingProgress: Progress;
  isLoading: boolean;
  isThumbnailsLoading?: boolean;
  isIndexing: boolean;
  isTreeLoading: boolean;
  libraryScrollTop: number;
  multiSelectedPaths: Array<string>;
  onClearSelection(): void;
  onContextMenu(event: any, path: string): void;
  onContinueSession(): void;
  onEmptyAreaContextMenu(event: any): void;
  onGoHome(): void;
  onImageClick(path: string, event: any): void;
  onImageDoubleClick(path: string): void;
  onLibraryRefresh(): void;
  onOpenFolder(): void;
  onSettingsChange(settings: AppSettings): void;
  onThumbnailAspectRatioChange(aspectRatio: ThumbnailAspectRatio): void;
  onThumbnailSizeChange(size: ThumbnailSize): void;
  rootPath: string | null;
  searchQuery: string;
  setFilterCriteria(criteria: FilterCriteria): void;
  setLibraryScrollTop(scrollTop: number): void;
  setSearchQuery(query: string): void;
  setSortCriteria(criteria: SortCriteria): void;
  sortCriteria: SortCriteria;
  theme: string;
  thumbnailAspectRatio: ThumbnailAspectRatio;
  thumbnails: Record<string, string>;
  thumbnailSize: ThumbnailSize;
  onNavigateToCommunity(): void;
}

interface SearchInputProps {
  indexingProgress: Progress;
  isIndexing: boolean;
  searchQuery: string;
  setSearchQuery(query: string): void;
}

interface SortOptionsProps {
  sortCriteria: SortCriteria;
  setSortCriteria(criteria: SortCriteria): void;
  sortOptions: Array<Omit<SortCriteria, 'order'> & { label?: string; disabled?: boolean }>;
}

interface ImageLayer {
  id: string;
  url: string;
  opacity: number;
}

interface ThumbnailProps {
  data: string | undefined;
  isActive: boolean;
  isSelected: boolean;
  onContextMenu(e: any): void;
  onImageClick(path: string, event: any): void;
  onImageDoubleClick(path: string): void;
  onLoad(): void;
  path: string;
  rating: number;
  tags: Array<string>;
  aspectRatio: ThumbnailAspectRatio;
}

interface ThumbnailSizeOption {
  id: ThumbnailSize;
  label: string;
  size: number;
}

interface ThumbnailSizeProps {
  onSelectSize(sizeOptions: ThumbnailSize): void;
  selectedSize: ThumbnailSize;
}

interface ThumbnailAspectRatioOption {
  id: ThumbnailAspectRatio;
  label: string;
}

interface ThumbnailAspectRatioProps {
  onSelectAspectRatio(aspectRatio: ThumbnailAspectRatio): void;
  selectedAspectRatio: ThumbnailAspectRatio;
}

interface ViewOptionsProps {
  filterCriteria: FilterCriteria;
  onSelectSize(size: ThumbnailSize): any;
  onSelectAspectRatio(aspectRatio: ThumbnailAspectRatio): any;
  setFilterCriteria(criteria: Partial<FilterCriteria>): void;
  setSortCriteria(criteria: SortCriteria): void;
  sortCriteria: SortCriteria;
  sortOptions: Array<Omit<SortCriteria, 'order'> & { label?: string; disabled?: boolean }>;
  thumbnailSize: ThumbnailSize;
  thumbnailAspectRatio: ThumbnailAspectRatio;
}

const ratingFilterOptions: Array<KeyValueLabel> = [
  { value: 0, label: 'Show All' },
  { value: 1, label: '1 & up' },
  { value: 2, label: '2 & up' },
  { value: 3, label: '3 & up' },
  { value: 4, label: '4 & up' },
  { value: 5, label: '5 only' },
];

const rawStatusOptions: Array<KeyValueLabel> = [
  { key: RawStatus.All, label: 'All Types' },
  { key: RawStatus.RawOnly, label: 'RAW Only' },
  { key: RawStatus.NonRawOnly, label: 'Non-RAW Only' },
];

const thumbnailSizeOptions: Array<ThumbnailSizeOption> = [
  { id: ThumbnailSize.Small, label: 'Small', size: 160 },
  { id: ThumbnailSize.Medium, label: 'Medium', size: 240 },
  { id: ThumbnailSize.Large, label: 'Large', size: 320 },
];

const thumbnailAspectRatioOptions: Array<ThumbnailAspectRatioOption> = [
  { id: ThumbnailAspectRatio.Cover, label: 'Fill Square' },
  { id: ThumbnailAspectRatio.Contain, label: 'Original Ratio' },
];

const customOuterElement = forwardRef((props: any, ref: any) => (
  <div ref={ref} {...props} className="custom-scrollbar" />
));
customOuterElement.displayName = 'CustomOuterElement';

function SearchInput({ indexingProgress, isIndexing, searchQuery, setSearchQuery }: SearchInputProps) {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSearchActive) {
      inputRef.current?.focus();
    }
  }, [isSearchActive]);

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (containerRef.current && !containerRef.current.contains(event.target) && !searchQuery) {
        setIsSearchActive(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchQuery]);

  const isActive = isSearchActive || !!searchQuery;
  const placeholderText =
    isIndexing && indexingProgress.total > 0
      ? `Indexing... (${indexingProgress.current}/${indexingProgress.total})`
      : isIndexing
      ? 'Indexing Images...'
      : 'Search Images';

  return (
    <motion.div
      animate={{ width: isActive ? '14rem' : '3rem' }}
      className="relative flex items-center bg-surface rounded-md h-12"
      initial={false}
      layout
      ref={containerRef}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <button
        className="absolute left-0 top-0 h-12 w-12 flex items-center justify-center text-text-primary z-10"
        onClick={() => {
          if (!isActive) {
            setIsSearchActive(true);
          } else {
            inputRef.current?.focus();
          }
        }}
        title="Search Tags"
      >
        <Search className="w-4 h-4" />
      </button>
      <input
        className="w-full h-full pl-12 pr-10 bg-transparent text-text-primary placeholder-text-secondary border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-accent transition-opacity"
        disabled={isIndexing}
        onBlur={() => {
          if (!searchQuery) {
            setIsSearchActive(false);
          }
        }}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setIsSearchActive(true)}
        placeholder={placeholderText}
        ref={inputRef}
        style={{ opacity: isActive ? 1 : 0, pointerEvents: isActive ? 'auto' : 'none' }}
        type="text"
        value={searchQuery}
      />
      {isIndexing && isActive && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <Loader2 className="h-5 w-5 text-text-secondary animate-spin" />
        </div>
      )}
    </motion.div>
  );
}

function ColorFilterOptions({ filterCriteria, setFilterCriteria }: FilterOptionProps) {
  const [lastClickedColor, setLastClickedColor] = useState<string | null>(null);
  const allColors = useMemo(() => [...COLOR_LABELS, { name: 'none', color: '#9ca3af' }], []);

  const handleColorClick = (colorName: string, event: any) => {
    const { ctrlKey, metaKey, shiftKey } = event;
    const isCtrlPressed = ctrlKey || metaKey;
    const currentColors = filterCriteria.colors || [];

    if (shiftKey && lastClickedColor) {
      const lastIndex = allColors.findIndex((c) => c.name === lastClickedColor);
      const currentIndex = allColors.findIndex((c) => c.name === colorName);
      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const range = allColors.slice(start, end + 1).map((c: Color) => c.name);
        const baseSelection = isCtrlPressed ? currentColors : [lastClickedColor];
        const newColors = Array.from(new Set([...baseSelection, ...range]));
        setFilterCriteria((prev: FilterCriteria) => ({ ...prev, colors: newColors }));
      }
    } else if (isCtrlPressed) {
      const newColors = currentColors.includes(colorName)
        ? currentColors.filter((c: string) => c !== colorName)
        : [...currentColors, colorName];
      setFilterCriteria((prev: FilterCriteria) => ({ ...prev, colors: newColors }));
    } else {
      const newColors = currentColors.length === 1 && currentColors[0] === colorName ? [] : [colorName];
      setFilterCriteria((prev: FilterCriteria) => ({ ...prev, colors: newColors }));
    }
    setLastClickedColor(colorName);
  };

  return (
    <div>
      <div className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase">Filter by Color Label</div>
      <div className="flex flex-wrap gap-3 px-3 py-2">
        {allColors.map((color: Color) => {
          const isSelected = (filterCriteria.colors || []).includes(color.name);
          const title = color.name === 'none' ? 'No Label' : color.name.charAt(0).toUpperCase() + color.name.slice(1);
          return (
            <button
              key={color.name}
              title={title}
              onClick={(e: any) => handleColorClick(color.name, e)}
              className="w-6 h-6 rounded-full focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface transition-transform hover:scale-110"
              role="menuitem"
            >
              <div className="relative w-full h-full">
                <div className="w-full h-full rounded-full" style={{ backgroundColor: color.color }}></div>
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                    <Check size={14} className="text-white" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DropdownMenu({ buttonContent, buttonTitle, children, contentClassName = 'w-56' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<any>(null);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="h-12 w-12 bg-surface text-text-primary shadow-none p-0 flex items-center justify-center"
        onClick={() => setIsOpen(!isOpen)}
        title={buttonTitle}
      >
        {buttonContent}
      </Button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`absolute right-0 mt-2 ${contentClassName} origin-top-right z-20`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
          >
            <div
              className="bg-surface/90 backdrop-blur-md rounded-lg shadow-xl"
              role="menu"
              aria-orientation="vertical"
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ThumbnailSizeOptions({ selectedSize, onSelectSize }: ThumbnailSizeProps) {
  return (
    <>
      <div className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase">Thumbnail Size</div>
      {thumbnailSizeOptions.map((option: ThumbnailSizeOption) => {
        const isSelected = selectedSize === option.id;
        return (
          <button
            className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between transition-colors duration-150 ${
              isSelected ? 'bg-card-active text-text-primary font-semibold' : 'text-text-primary hover:bg-bg-primary'
            }`}
            key={option.id}
            onClick={() => onSelectSize(option.id)}
            role="menuitem"
          >
            <span>{option.label}</span>
            {isSelected && <Check size={16} />}
          </button>
        );
      })}
    </>
  );
}

function ThumbnailAspectRatioOptions({ selectedAspectRatio, onSelectAspectRatio }: ThumbnailAspectRatioProps) {
  return (
    <>
      <div className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase">Thumbnail Fit</div>
      {thumbnailAspectRatioOptions.map((option: ThumbnailAspectRatioOption) => {
        const isSelected = selectedAspectRatio === option.id;
        return (
          <button
            className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between transition-colors duration-150 ${
              isSelected ? 'bg-card-active text-text-primary font-semibold' : 'text-text-primary hover:bg-bg-primary'
            }`}
            key={option.id}
            onClick={() => onSelectAspectRatio(option.id)}
            role="menuitem"
          >
            <span>{option.label}</span>
            {isSelected && <Check size={16} />}
          </button>
        );
      })}
    </>
  );
}

function FilterOptions({ filterCriteria, setFilterCriteria }: FilterOptionProps) {
  const handleRatingFilterChange = (rating: number | undefined) => {
    setFilterCriteria((prev: Partial<FilterCriteria>) => ({ ...prev, rating }));
  };

  const handleRawStatusChange = (rawStatus: RawStatus | undefined) => {
    setFilterCriteria((prev: Partial<FilterCriteria>) => ({ ...prev, rawStatus }));
  };

  return (
    <>
      <div className="space-y-4">
        <div>
          <div className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase">Filter by Rating</div>
          {ratingFilterOptions.map((option: KeyValueLabel) => {
            const isSelected = filterCriteria.rating === option.value;
            return (
              <button
                className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between transition-colors duration-150 ${
                  isSelected
                    ? 'bg-card-active text-text-primary font-semibold'
                    : 'text-text-primary hover:bg-bg-primary'
                }`}
                key={option.value}
                onClick={() => handleRatingFilterChange(option.value)}
                role="menuitem"
              >
                <span className="flex items-center gap-2">
                  {option.value && option.value > 0 && <StarIcon size={16} className="text-accent fill-accent" />}
                  <span>{option.label}</span>
                </span>
                {isSelected && <Check size={16} />}
              </button>
            );
          })}
        </div>

        <div>
          <div className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase">Filter by File Type</div>
          {rawStatusOptions.map((option: KeyValueLabel) => {
            const isSelected = (filterCriteria.rawStatus || RawStatus.All) === option.key;
            return (
              <button
                className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between transition-colors duration-150 ${
                  isSelected
                    ? 'bg-card-active text-text-primary font-semibold'
                    : 'text-text-primary hover:bg-bg-primary'
                }`}
                key={option.key}
                onClick={() => handleRawStatusChange(option.key as RawStatus)}
                role="menuitem"
              >
                <span>{option.label}</span>
                {isSelected && <Check size={16} />}
              </button>
            );
          })}
        </div>
      </div>
      <div className="py-2"></div>
      <ColorFilterOptions filterCriteria={filterCriteria} setFilterCriteria={setFilterCriteria} />
    </>
  );
}

function SortOptions({ sortCriteria, setSortCriteria, sortOptions }: SortOptionsProps) {
  const handleKeyChange = (key: string) => {
    setSortCriteria((prev: SortCriteria) => ({ ...prev, key }));
  };

  const handleOrderToggle = () => {
    setSortCriteria((prev: SortCriteria) => ({
      ...prev,
      order: prev.order === SortDirection.Ascending ? SortDirection.Descening : SortDirection.Ascending,
    }));
  };

  return (
    <>
      <div className="px-3 py-2 relative flex items-center">
        <div className="text-xs font-semibold text-text-secondary uppercase">Sort by</div>
        <button
          onClick={handleOrderToggle}
          title={`Sort ${
            sortCriteria.order === SortDirection.Ascending ? 'Descending' : 'Ascending'
          }`}
          className="absolute top-1/2 right-3 -translate-y-1/2 p-1 bg-transparent border-none text-text-secondary hover:text-text-primary focus:outline-none focus:ring-1 focus:ring-accent rounded"
        >
          {sortCriteria.order === SortDirection.Ascending ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          )}
        </button>
      </div>
      {sortOptions.map((option) => {
        const isSelected = sortCriteria.key === option.key;
        return (
          <button
            className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between transition-colors duration-150 ${
              isSelected ? 'bg-card-active text-text-primary font-semibold' : 'text-text-primary hover:bg-bg-primary'
            } ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            key={option.key}
            onClick={() => !option.disabled && handleKeyChange(option.key)}
            role="menuitem"
            disabled={option.disabled}
            title={option.disabled ? 'Enable EXIF Reading in Settings to use this option.' : undefined}
          >
            <span>{option.label}</span>
            {isSelected && <Check size={16} />}
          </button>
        );
      })}
    </>
  );
}

function ViewOptionsDropdown({
  filterCriteria,
  onSelectSize,
  onSelectAspectRatio,
  setFilterCriteria,
  setSortCriteria,
  sortCriteria,
  sortOptions,
  thumbnailSize,
  thumbnailAspectRatio,
}: ViewOptionsProps) {
  const isFilterActive =
    filterCriteria.rating > 0 ||
    (filterCriteria.rawStatus && filterCriteria.rawStatus !== RawStatus.All) ||
    (filterCriteria.colors && filterCriteria.colors.length > 0);

  return (
    <DropdownMenu
      buttonContent={
        <>
          <SlidersHorizontal className="w-8 h-8" />
          {isFilterActive && <div className="absolute -top-1 -right-1 bg-accent rounded-full w-3 h-3" />}
        </>
      }
      buttonTitle="View Options"
      contentClassName="w-[720px]"
    >
      <div className="flex">
        <div className="w-1/4 p-2 border-r border-border-color">
          <ThumbnailSizeOptions selectedSize={thumbnailSize} onSelectSize={onSelectSize} />
          <div className="pt-2">
            <ThumbnailAspectRatioOptions
              selectedAspectRatio={thumbnailAspectRatio}
              onSelectAspectRatio={onSelectAspectRatio}
            />
          </div>
        </div>
        <div className="w-2/4 p-2 border-r border-border-color">
          <FilterOptions filterCriteria={filterCriteria} setFilterCriteria={setFilterCriteria} />
        </div>
        <div className="w-1/4 p-2">
          <SortOptions sortCriteria={sortCriteria} setSortCriteria={setSortCriteria} sortOptions={sortOptions} />
        </div>
      </div>
    </DropdownMenu>
  );
}

function Thumbnail({
  data,
  isActive,
  isSelected,
  onContextMenu,
  onImageClick,
  onImageDoubleClick,
  onLoad,
  path,
  rating,
  tags,
  aspectRatio: thumbnailAspectRatio,
}: ThumbnailProps) {
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const [layers, setLayers] = useState<ImageLayer[]>([]);
  const latestThumbDataRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (data) {
      setShowPlaceholder(false);
      return;
    }
    const timer = setTimeout(() => {
      setShowPlaceholder(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [data]);

  useEffect(() => {
    if (!data) {
      setLayers([]);
      latestThumbDataRef.current = undefined;
      return;
    }

    if (data !== latestThumbDataRef.current) {
      latestThumbDataRef.current = data;

      setLayers((prev) => {
        if (prev.some((l) => l.id === data)) {
          return prev;
        }
        return [...prev, { id: data, url: data, opacity: 0 }];
      });
    }
  }, [data]);

  useEffect(() => {
    const layerToFadeIn = layers.find((l) => l.opacity === 0);
    if (layerToFadeIn) {
      const timer = setTimeout(() => {
        setLayers((prev) => prev.map((l) => (l.id === layerToFadeIn.id ? { ...l, opacity: 1 } : l)));
        onLoad();
      }, 10);

      return () => clearTimeout(timer);
    }
  }, [layers, onLoad]);

  const handleTransitionEnd = useCallback((finishedId: string) => {
    setLayers((prev) => {
      const finishedIndex = prev.findIndex((l) => l.id === finishedId);
      if (finishedIndex < 0 || prev.length <= 1) {
        return prev;
      }
      return prev.slice(finishedIndex);
    });
  }, []);

  const ringClass = isActive
    ? 'ring-2 ring-accent'
    : isSelected
    ? 'ring-2 ring-gray-400'
    : 'hover:ring-2 hover:ring-hover-color';
  const colorTag = tags?.find((t: string) => t.startsWith('color:'))?.substring(6);
  const colorLabel = COLOR_LABELS.find((c: Color) => c.name === colorTag);

  return (
    <div
      className={`aspect-square bg-surface rounded-md overflow-hidden cursor-pointer group relative transition-all duration-150 ${ringClass}`}
      onClick={(e: any) => {
        e.stopPropagation();
        onImageClick(path, e);
      }}
      onContextMenu={onContextMenu}
      onDoubleClick={() => onImageDoubleClick(path)}
      title={path.split(/[\\/]/).pop()}
    >
      {layers.length > 0 && (
        <div className="absolute inset-0 w-full h-full">
          {layers.map((layer) => (
            <div
              key={layer.id}
              className="absolute inset-0 w-full h-full"
              style={{
                opacity: layer.opacity,
                transition: 'opacity 300ms ease-in-out',
              }}
              onTransitionEnd={() => handleTransitionEnd(layer.id)}
            >
              {thumbnailAspectRatio === ThumbnailAspectRatio.Contain && (
                <img alt="" className="absolute inset-0 w-full h-full object-cover blur-md scale-110" src={layer.url} />
              )}
              <img
                alt={path.split(/[\\/]/).pop()}
                className={`w-full h-full group-hover:scale-[1.02] transition-transform duration-300 ${
                  thumbnailAspectRatio === ThumbnailAspectRatio.Contain ? 'object-contain' : 'object-cover'
                } relative`}
                decoding="async"
                loading="lazy"
                src={layer.url}
              />
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {layers.length === 0 && showPlaceholder && (
          <motion.div
            className="absolute inset-0 w-full h-full flex items-center justify-center bg-surface"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <ImageIcon className="text-text-secondary animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {(colorLabel || rating > 0) && (
        <div className="absolute top-1.5 right-1.5 bg-bg-primary/50 rounded-full px-1.5 py-0.5 text-xs text-text-primary flex items-center gap-1 backdrop-blur-sm">
          {colorLabel && (
            <div
              className="w-3 h-3 rounded-full ring-1 ring-black/20"
              style={{ backgroundColor: colorLabel.color }}
              title={`Color: ${colorLabel.name}`}
            ></div>
          )}
          {rating > 0 && (
            <>
              <span>{rating}</span>
              <StarIcon size={12} className="text-accent fill-accent" />
            </>
          )}
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        <p className="text-white text-xs truncate">{path.split(/[\\/]/).pop()}</p>
      </div>
    </div>
  );
}

const Cell = ({ columnIndex, rowIndex, style, data }: CellProps) => {
  const {
    activePath,
    columnCount,
    imageList,
    imageRatings,
    multiSelectedPaths,
    onContextMenu,
    onImageClick,
    onImageDoubleClick,
    thumbnails,
    thumbnailAspectRatio,
    loadedThumbnails,
  } = data;
  const index = rowIndex * columnCount + columnIndex;
  if (index >= imageList.length) {
    return null;
  }

  const imageFile = imageList[index];
  const handleLoad = useCallback(() => {
    loadedThumbnails.add(imageFile.path);
  }, [loadedThumbnails, imageFile.path]);

  return (
    <div style={style}>
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="p-2 h-full"
        initial={{ opacity: 0.9, scale: 0.95 }}
        key={imageFile.path}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <Thumbnail
          data={thumbnails[imageFile.path]}
          isActive={activePath === imageFile.path}
          isSelected={multiSelectedPaths.includes(imageFile.path)}
          onContextMenu={(e: any) => onContextMenu(e, imageFile.path)}
          onImageClick={onImageClick}
          onImageDoubleClick={onImageDoubleClick}
          onLoad={handleLoad}
          path={imageFile.path}
          rating={imageRatings?.[imageFile.path] || 0}
          tags={imageFile.tags}
          aspectRatio={thumbnailAspectRatio}
        />
      </motion.div>
    </div>
  );
};

export default function MainLibrary({
  activePath,
  aiModelDownloadStatus,
  appSettings,
  currentFolderPath,
  filterCriteria,
  imageList,
  imageRatings,
  importState,
  indexingProgress,
  isIndexing,
  isLoading,
  isThumbnailsLoading,
  isTreeLoading,
  libraryScrollTop,
  multiSelectedPaths,
  onClearSelection,
  onContextMenu,
  onContinueSession,
  onEmptyAreaContextMenu,
  onGoHome,
  onImageClick,
  onImageDoubleClick,
  onLibraryRefresh,
  onOpenFolder,
  onSettingsChange,
  onThumbnailAspectRatioChange,
  onThumbnailSizeChange,
  rootPath,
  searchQuery,
  setFilterCriteria,
  setLibraryScrollTop,
  setSearchQuery,
  setSortCriteria,
  sortCriteria,
  theme,
  thumbnailAspectRatio,
  thumbnails,
  thumbnailSize,
  onNavigateToCommunity,
}: MainLibraryProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [appVersion, setAppVersion] = useState('');
  const [supportedTypes, setSupportedTypes] = useState<SupportedTypes | null>(null);
  const libraryContainerRef = useRef<HTMLDivElement>(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState('');
  const [isLoaderVisible, setIsLoaderVisible] = useState(false);
  const loadedThumbnailsRef = useRef(new Set<string>());

  const sortOptions = useMemo(() => {
    const exifEnabled = appSettings?.enableExifReading ?? false;
    return [
      { key: 'name', label: 'File Name' },
      { key: 'date', label: 'Date Modified' },
      { key: 'rating', label: 'Rating' },
      { key: 'date_taken', label: 'Date Taken', disabled: !exifEnabled },
      { key: 'focal_length', label: 'Focal Length', disabled: !exifEnabled },
      { key: 'iso', label: 'ISO', disabled: !exifEnabled },
      { key: 'shutter_speed', label: 'Shutter Speed', disabled: !exifEnabled },
      { key: 'aperture', label: 'Aperture', disabled: !exifEnabled },
    ];
  }, [appSettings?.enableExifReading]);

  useEffect(() => {
    const exifEnabled = appSettings?.enableExifReading ?? true;
    const exifSortKeys = ['date_taken', 'iso', 'shutter_speed', 'aperture', 'focal_length'];
    const isCurrentSortExif = exifSortKeys.includes(sortCriteria.key);

    if (!exifEnabled && isCurrentSortExif) {
      setSortCriteria({ key: 'name', order: SortDirection.Ascending });
    }
  }, [appSettings?.enableExifReading, sortCriteria.key, setSortCriteria]);

  useEffect(() => {
    let showTimer: number | undefined;
    let hideTimer: number | undefined;
  
    if (isThumbnailsLoading || isLoading) {
      showTimer = window.setTimeout(() => {
        setIsLoaderVisible(true);
      }, 1000);
    } else {
      hideTimer = window.setTimeout(() => {
        setIsLoaderVisible(false);
      }, 500);
    }
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [isThumbnailsLoading, isLoading]);

  useEffect(() => {
    const compareVersions = (v1: string, v2: string) => {
      const parts1 = v1.split('.').map(Number);
      const parts2 = v2.split('.').map(Number);
      const len = Math.max(parts1.length, parts2.length);
      for (let i = 0; i < len; i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p1 < p2) return -1;
        if (p1 > p2) return 1;
      }
      return 0;
    };

    const checkVersion = async () => {
      try {
        const currentVersion = await getVersion();
        setAppVersion(currentVersion);

        const response = await fetch('https://api.github.com/repos/CyberTimon/RapidRAW/releases/latest');
        if (!response.ok) {
          console.error('Failed to fetch latest release info from GitHub.');
          return;
        }
        const data = await response.json();
        const latestTag = data.tag_name;
        if (!latestTag) return;

        const latestVersionStr = latestTag.startsWith('v') ? latestTag.substring(1) : latestTag;
        setLatestVersion(latestVersionStr);

        if (compareVersions(currentVersion, latestVersionStr) < 0) {
          setIsUpdateAvailable(true);
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    };

    checkVersion();
  }, []);

  useEffect(() => {
    invoke(Invokes.GetSupportedFileTypes)
      .then((types: any) => setSupportedTypes(types))
      .catch((err) => console.error('Failed to load supported file types:', err));
  }, []);

  useEffect(() => {
    const handleWheel = (event: any) => {
      const container = libraryContainerRef.current;
      if (!container || !container.contains(event.target)) {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        const currentIndex = thumbnailSizeOptions.findIndex((o: ThumbnailSizeOption) => o.id === thumbnailSize);
        if (currentIndex === -1) {
          return;
        }

        const nextIndex =
          event.deltaY < 0
            ? Math.min(currentIndex + 1, thumbnailSizeOptions.length - 1)
            : Math.max(currentIndex - 1, 0);
        if (nextIndex !== currentIndex) {
          onThumbnailSizeChange(thumbnailSizeOptions[nextIndex].id);
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [thumbnailSize, onThumbnailSizeChange]);

  if (!rootPath) {
    if (!appSettings) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center h-full rounded-lg bg-bg-primary p-8 text-center">
          <ImageIcon size={80} className="text-accent opacity-20 mb-6 animate-pulse" />
          <h1 className="text-3xl font-bold text-primary mb-2">RapidRAW</h1>
          <p className="text-text-secondary mb-8">Loading settings...</p>
        </div>
      );
    }
    const hasLastPath = !!appSettings.lastRootPath;
    const currentThemeId = theme || DEFAULT_THEME_ID;
    const selectedTheme: ThemeProps | undefined =
      THEMES.find((t: ThemeProps) => t.id === currentThemeId) ||
      THEMES.find((t: ThemeProps) => t.id === DEFAULT_THEME_ID);
    const splashImage = selectedTheme?.splashImage;
    return (
      <div className="flex-1 flex h-full bg-bg-secondary overflow-hidden shadow-lg">
        <div className="w-1/2 hidden md:block relative">
          <AnimatePresence>
            <motion.img
              alt="Splash screen background"
              animate={{ opacity: 1 }}
              className="absolute inset-0 w-full h-full object-cover"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              key={splashImage}
              src={splashImage}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </AnimatePresence>
        </div>
        <div className="w-full md:w-1/2 flex flex-col p-8 lg:p-16 relative">
          {showSettings ? (
            <SettingsPanel
              appSettings={appSettings}
              onBack={() => setShowSettings(false)}
              onLibraryRefresh={onLibraryRefresh}
              onSettingsChange={onSettingsChange}
              rootPath={rootPath}
            />
          ) : (
            <>
              <div className="my-auto text-left">
                <h1 className="text-5xl font-bold text-text-primary text-shadow-shiny mb-4">RapidRAW</h1>
                <p className="text-text-secondary mb-10 max-w-md">
                  {hasLastPath ? (
                    <>
                      Welcome back!
                      <br />
                      Continue where you left off or start a new session.
                    </>
                  ) : (
                    'A blazingly fast, GPU-accelerated RAW image editor. Open a folder to begin.'
                  )}
                </p>
                <div className="flex flex-col w-full max-w-xs gap-4">
                  {hasLastPath && (
                    <Button
                      className="rounded-md h-11 w-full flex justify-start items-center"
                      onClick={onContinueSession}
                      size="lg"
                    >
                      <RefreshCw size={20} className="mr-2" /> Continue Session
                    </Button>
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      className={`rounded-md flex-grow flex justify-start items-center h-11 ${
                        hasLastPath ? 'bg-surface text-text-primary shadow-none' : ''
                      }`}
                      onClick={onOpenFolder}
                      size="lg"
                    >
                      <Folder size={20} className="mr-2" />
                      {hasLastPath ? 'Change Folder' : 'Open Folder'}
                    </Button>
                    <Button
                      className="px-3 bg-surface text-text-primary shadow-none h-11"
                      onClick={() => setShowSettings(true)}
                      size="lg"
                      title="Settings"
                      variant="ghost"
                    >
                      <Settings size={20} />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-8 left-8 lg:left-16 text-xs text-text-secondary space-y-1">
                <p>
                Images by{' '}
                  <a
                    href="https://instagram.com/timonkaech.photography"
                    className="hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Timon Käch
                  </a>  
                </p>
                {appVersion && (
                  <div className="flex items-center space-x-2">
                    <p>
                      <span
                        className={`group transition-all duration-300 ease-in-out rounded-md py-1 ${
                          isUpdateAvailable
                            ? 'cursor-pointer border border-yellow-500 px-2 hover:bg-yellow-500/20'
                            : ''
                        }`}
                        onClick={() => {
                          if (isUpdateAvailable) {
                            open('https://github.com/CyberTimon/RapidRAW/releases/latest');
                          }
                        }}
                        title={
                          isUpdateAvailable
                            ? `Click to download version ${latestVersion}`
                            : `You are on the latest version`
                        }
                      >
                        <span className={isUpdateAvailable ? 'group-hover:hidden' : ''}>Version {appVersion}</span>
                        {isUpdateAvailable && (
                          <span className="hidden group-hover:inline text-yellow-400">New version available!</span>
                        )}
                      </span>
                    </p>
                    <span>-</span>
                    <p>
                      <a
                        href="https://ko-fi.com/cybertimon"
                        className="hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Donate on Ko-Fi
                      </a>
                      <span className="mx-1">or</span>
                      <a
                        href="https://github.com/CyberTimon/RapidRAW"
                        className="hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Contribute on GitHub
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col h-full min-w-0 bg-bg-secondary rounded-lg overflow-hidden"
      ref={libraryContainerRef}
    >
      <header className="p-4 flex-shrink-0 flex justify-between items-center border-b border-border-color">
        <div>
          <h2 className="text-2xl font-bold text-primary">Library</h2>
          <div className="flex items-center gap-2">
            <p className="text-sm text-text-secondary truncate">{currentFolderPath}</p>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                isLoaderVisible ? 'max-w-[1rem] opacity-100' : 'max-w-0 opacity-0'
              }`}
            >
              <Loader2 size={14} className="animate-spin text-text-secondary" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {importState.status === Status.Importing && (
            <div className="flex items-center gap-2 text-sm text-accent animate-pulse">
              <FolderInput size={16} />
              <span>
                Importing... ({importState.progress?.current}/{importState.progress?.total})
              </span>
            </div>
          )}
          {importState.status === Status.Success && (
            <div className="flex items-center gap-2 text-sm text-green-400">
              <Check size={16} />
              <span>Import Complete!</span>
            </div>
          )}
          {importState.status === Status.Error && (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <AlertTriangle size={16} />
              <span>Import Failed!</span>
            </div>
          )}
          <SearchInput
            indexingProgress={indexingProgress}
            isIndexing={isIndexing}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
          <ViewOptionsDropdown
            filterCriteria={filterCriteria}
            onSelectSize={onThumbnailSizeChange}
            onSelectAspectRatio={onThumbnailAspectRatioChange}
            setFilterCriteria={setFilterCriteria}
            setSortCriteria={setSortCriteria}
            sortCriteria={sortCriteria}
            sortOptions={sortOptions}
            thumbnailSize={thumbnailSize}
            thumbnailAspectRatio={thumbnailAspectRatio}
          />
          <Button
            className="h-12 w-12 bg-surface text-text-primary shadow-none p-0 flex items-center justify-center"
            onClick={onNavigateToCommunity}
            title="Community Presets"
          >
            <Users className="w-8 h-8" />
          </Button>
          <Button
            className="h-12 w-12 bg-surface text-text-primary shadow-none p-0 flex items-center justify-center"
            onClick={onOpenFolder}
            title="Open another folder"
          >
            <Folder className="w-8 h-8" />
          </Button>
          <Button
            className="h-12 w-12 bg-surface text-text-primary shadow-none p-0 flex items-center justify-center"
            onClick={onGoHome}
            title="Go to Home Screen"
          >
            <Home className="w-8 h-8" />
          </Button>
        </div>
      </header>
      {imageList.length > 0 ? (
        <div className="flex-1 w-full h-full" onClick={onClearSelection} onContextMenu={onEmptyAreaContextMenu}>
          <AutoSizer>
            {({ height, width }) => {
              const SCROLLBAR_SIZE = 10;
              const PADDING = 8;
              const minThumbWidth = thumbnailSizeOptions.find((o) => o.id === thumbnailSize)?.size || 240;
              const columnCount = Math.max(1, Math.floor(width / (minThumbWidth + PADDING * 2)));
              const rowCount = Math.ceil(imageList.length / columnCount);
              const preliminaryCellWidth = width / columnCount;
              const isScrollbarVisible = rowCount * preliminaryCellWidth > height;
              const gridWidth = isScrollbarVisible ? width - SCROLLBAR_SIZE : width;
              const cellWidth = gridWidth / columnCount;
              const cellHeight = cellWidth;

              return (
                <Grid
                  columnCount={columnCount}
                  columnWidth={cellWidth}
                  height={height}
                  initialScrollTop={libraryScrollTop}
                  itemData={{
                    activePath,
                    columnCount,
                    imageList,
                    imageRatings,
                    multiSelectedPaths,
                    onContextMenu,
                    onImageClick,
                    onImageDoubleClick,
                    thumbnails,
                    thumbnailAspectRatio,
                    loadedThumbnails: loadedThumbnailsRef.current,
                  }}
                  key={`${sortCriteria.key}-${sortCriteria.order}-${filterCriteria.rating}-${
                    filterCriteria.rawStatus || RawStatus.All
                  }-${searchQuery}`}
                  onScroll={({ scrollTop }) => setLibraryScrollTop(scrollTop)}
                  outerElementType={customOuterElement}
                  rowCount={rowCount}
                  rowHeight={cellHeight}
                  width={width}
                >
                  {Cell}
                </Grid>
              );
            }}
          </AutoSizer>
        </div>
      ) : isIndexing || aiModelDownloadStatus || importState.status === Status.Importing ? (
        <div
          className="flex-1 flex flex-col items-center justify-center text-text-secondary"
          onContextMenu={onEmptyAreaContextMenu}
        >
          <Loader2 className="h-12 w-12 text-secondary animate-spin mb-4" />
          <p className="text-lg font-semibold">
            {aiModelDownloadStatus
              ? `Downloading ${aiModelDownloadStatus}...`
              : isIndexing && indexingProgress.total > 0
              ? `Indexing images... (${indexingProgress.current}/${indexingProgress.total})`
              : importState.status === Status.Importing &&
                importState?.progress?.total &&
                importState.progress.total > 0
              ? `Importing images... (${importState.progress?.current}/${importState.progress?.total})`
              : 'Processing images...'}
          </p>
          <p className="text-sm mt-2">This may take a moment.</p>
        </div>
      ) : searchQuery ? (
        <div
          className="flex-1 flex flex-col items-center justify-center text-text-secondary text-center"
          onContextMenu={onEmptyAreaContextMenu}
        >
          <Search className="h-12 w-12 text-secondary mb-4" />
          {appSettings?.enableAiTagging ? (
            <>
              <p className="text-lg font-semibold">No Results Found</p>
              <p className="text-sm mt-2">Could not find an image based on filename or AI tags.</p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold">No Results Found</p>
              <p className="text-sm mt-2 max-w-sm">
                Filename not found. For more accurate general search, please enable automatic tagging in Settings.
              </p>
            </>
          )}
        </div>
      ) : (
        <div
          className="flex-1 flex flex-col items-center justify-center text-text-secondary"
          onContextMenu={onEmptyAreaContextMenu}
        >
          <SlidersHorizontal className="h-12 w-12 text-secondary mb-4 text-text-secondary" />
          <p className="text-text-secondary">No images found that match your filter.</p>
        </div>
      )}
    </div>
  );
}