import { useState, useEffect, useRef, useMemo } from 'react';
import { save, open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { Save, CheckCircle, XCircle, Loader, Ban } from 'lucide-react';
import debounce from 'lodash.debounce';
import Switch from '../../ui/Switch';
import Dropdown from '../../ui/Dropdown';
import Slider from '../../ui/Slider';
import ImagePicker from '../../ui/ImagePicker';
import { Adjustments } from '../../../utils/adjustments';
import {
  ExportSettings,
  FileFormat,
  FILE_FORMATS,
  FILENAME_VARIABLES,
  Status,
  ExportState,
  FileFormats,
  WatermarkAnchor,
} from './ExportImportProperties';
import { Invokes, SelectedImage } from '../../ui/AppProperties';
import { useNavigation } from 'desktopuse-sdk';

interface ExportPanelProps {
  adjustments: Adjustments;
  exportState: ExportState;
  multiSelectedPaths: Array<string>;
  selectedImage: SelectedImage;
  setExportState(state: any): void;
}

interface SectionProps {
  children: any;
  title: string;
}

function Section({ title, children }: SectionProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary mb-3 border-b border-surface pb-2">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function WatermarkPreview({
  anchor,
  scale,
  spacing,
  opacity,
  watermarkPath,
  imageAspectRatio,
  watermarkImageAspectRatio,
}: {
  anchor: WatermarkAnchor;
  scale: number;
  spacing: number;
  opacity: number;
  watermarkPath: string | null;
  imageAspectRatio: number;
  watermarkImageAspectRatio: number;
}) {
  const getPositionStyles = () => {
    const minDimPercent = imageAspectRatio > 1 ? 100 / imageAspectRatio : 100;
    const watermarkSizePercent = minDimPercent * (scale / 100);
    const spacingPercent = minDimPercent * (spacing / 100);

    const styles: React.CSSProperties = {
      width: `${watermarkSizePercent}%`,
      opacity: opacity / 100,
      position: 'absolute',
    };

    const spacingString = `${spacingPercent}%`;

    switch (anchor) {
      case WatermarkAnchor.TopLeft:
        styles.top = spacingString;
        styles.left = spacingString;
        break;
      case WatermarkAnchor.TopCenter:
        styles.top = spacingString;
        styles.left = '50%';
        styles.transform = 'translateX(-50%)';
        break;
      case WatermarkAnchor.TopRight:
        styles.top = spacingString;
        styles.right = spacingString;
        break;
      case WatermarkAnchor.CenterLeft:
        styles.top = '50%';
        styles.left = spacingString;
        styles.transform = 'translateY(-50%)';
        break;
      case WatermarkAnchor.Center:
        styles.top = '50%';
        styles.left = '50%';
        styles.transform = 'translate(-50%, -50%)';
        break;
      case WatermarkAnchor.CenterRight:
        styles.top = '50%';
        styles.right = spacingString;
        styles.transform = 'translateY(-50%)';
        break;
      case WatermarkAnchor.BottomLeft:
        styles.bottom = spacingString;
        styles.left = spacingString;
        break;
      case WatermarkAnchor.BottomCenter:
        styles.bottom = spacingString;
        styles.left = '50%';
        styles.transform = 'translateX(-50%)';
        break;
      case WatermarkAnchor.BottomRight:
        styles.bottom = spacingString;
        styles.right = spacingString;
        break;
    }
    return styles;
  };

  return (
    <div
      className="w-full bg-bg-primary rounded-md relative overflow-hidden border border-surface"
      style={{ aspectRatio: imageAspectRatio }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-text-tertiary text-sm">Preview</span>
      </div>
      {watermarkPath && (
        <div style={getPositionStyles()}>
          <div
            className="w-full bg-accent/50 border-2 border-dashed border-accent rounded-sm flex items-center justify-center"
            style={{ aspectRatio: watermarkImageAspectRatio }}
          >
            <span className="text-white text-[8px] font-bold">Logo</span>
          </div>
        </div>
      )}
    </div>
  );
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const resizeModeOptions = [
  { label: 'Long Edge', value: 'longEdge' },
  { label: 'Short Edge', value: 'shortEdge' },
  { label: 'Width', value: 'width' },
  { label: 'Height', value: 'height' },
];

export default function ExportPanel({
  adjustments,
  exportState,
  multiSelectedPaths,
  selectedImage,
  setExportState,
}: ExportPanelProps) {
  const [fileFormat, setFileFormat] = useState<string>('jpeg');
  const [jpegQuality, setJpegQuality] = useState<number>(90);
  const [enableResize, setEnableResize] = useState<boolean>(false);
  const [resizeMode, setResizeMode] = useState<string>('longEdge');
  const [resizeValue, setResizeValue] = useState<number>(2048);
  const [dontEnlarge, setDontEnlarge] = useState<boolean>(true);
  const [keepMetadata, setKeepMetadata] = useState<boolean>(true);
  const [stripGps, setStripGps] = useState<boolean>(true);
  const [filenameTemplate, setFilenameTemplate] = useState<string>('{original_filename}_edited');
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [isEstimating, setIsEstimating] = useState<boolean>(false);
  const [enableWatermark, setEnableWatermark] = useState<boolean>(false);
  const [watermarkPath, setWatermarkPath] = useState<string | null>(null);
  const [watermarkAnchor, setWatermarkAnchor] = useState<WatermarkAnchor>(WatermarkAnchor.BottomRight);
  const [watermarkScale, setWatermarkScale] = useState<number>(10);
  const [watermarkSpacing, setWatermarkSpacing] = useState<number>(5);
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(75);
  const [watermarkImageAspectRatio, setWatermarkImageAspectRatio] = useState(1);
  const filenameInputRef = useRef<HTMLInputElement>(null);

  const { status, progress, errorMessage } = exportState;
  const isExporting = status === Status.Exporting;

  const isEditorContext = !!selectedImage;
  const pathsToExport = isEditorContext
    ? multiSelectedPaths.length > 0
      ? multiSelectedPaths
      : selectedImage
      ? [selectedImage.path]
      : []
    : multiSelectedPaths;
  const numImages = pathsToExport.length;
  const isBatchMode = numImages > 1;

  const imageAspectRatio = useMemo(() => {
    if (selectedImage && selectedImage.width && selectedImage.height) {
      return selectedImage.width / selectedImage.height;
    }
    return 16 / 9;
  }, [selectedImage]);

  const anchorOptions = [
    { label: 'Top Left', value: WatermarkAnchor.TopLeft },
    { label: 'Top Center', value: WatermarkAnchor.TopCenter },
    { label: 'Top Right', value: WatermarkAnchor.TopRight },
    { label: 'Center Left', value: WatermarkAnchor.CenterLeft },
    { label: 'Center', value: WatermarkAnchor.Center },
    { label: 'Center Right', value: WatermarkAnchor.CenterRight },
    { label: 'Bottom Left', value: WatermarkAnchor.BottomLeft },
    { label: 'Bottom Center', value: WatermarkAnchor.BottomCenter },
    { label: 'Bottom Right', value: WatermarkAnchor.BottomRight },
  ];

  const canExport = numImages > 0;

  // Tag File Format Selector
  const { ref: fileFormatRef } = useNavigation({
    id: 'export-file-format-selector',
    type: 'button',
    label: 'File Format Selector',
    availableActions: ['click'],
    metadata: {
      description: `File format selector with ${fileFormat} selected. Available formats: jpeg, png, tiff`,
      currentFormat: fileFormat,
      availableFormats: FILE_FORMATS.map((f: FileFormat) => f.id),
      isExporting: isExporting,
    },
    customActions: {
      selectFormat: (format: any) => {
        const formatStr = typeof format === 'string' ? format.toLowerCase() : String(format).toLowerCase();
        if (!isExporting && FILE_FORMATS.find((f: FileFormat) => f.id === formatStr)) {
          setFileFormat(formatStr);
        }
      },
      selectJPEG: () => {
        if (!isExporting) setFileFormat('jpeg');
      },
      selectPNG: () => {
        if (!isExporting) setFileFormat('png');
      },
      selectTIFF: () => {
        if (!isExporting) setFileFormat('tiff');
      },
    },
  });

  // Tag JPEG Quality Slider
  const { ref: jpegQualityRef } = useNavigation({
    id: 'export-jpeg-quality-slider',
    type: 'input',
    label: 'JPEG Quality Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `JPEG quality slider with value ${jpegQuality}. Visible when JPEG format is selected.`,
      value: jpegQuality,
      min: 1,
      max: 100,
      step: 1,
      visible: fileFormat === FileFormats.Jpeg,
      isExporting: isExporting,
    },
    customActions: {
      setValue: (newValue: any) => {
        if (isExporting) return;
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(1, Math.min(100, Math.round(numValue)));
          setJpegQuality(clampedValue);
        }
      },
      increase: (amount: any) => {
        if (isExporting) return;
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? Math.round(numAmount) : 1;
        const newValue = Math.min(100, jpegQuality + validAmount);
        setJpegQuality(newValue);
      },
      decrease: (amount: any) => {
        if (isExporting) return;
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? Math.round(numAmount) : 1;
        const newValue = Math.max(1, jpegQuality - validAmount);
        setJpegQuality(newValue);
      },
    },
  });

  // Tag Filename Template Input
  const { ref: filenameTemplateRef } = useNavigation({
    id: 'export-filename-template-input',
    type: 'input',
    label: 'Filename Template Input',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Filename template input with value "${filenameTemplate}". Visible in batch mode. Available variables: ${FILENAME_VARIABLES.join(', ')}`,
      value: filenameTemplate,
      visible: isBatchMode,
      isExporting: isExporting,
      availableVariables: FILENAME_VARIABLES,
    },
    customActions: {
      setValue: (newValue: any) => {
        if (isExporting) return;
        const strValue = typeof newValue === 'string' ? newValue : String(newValue);
        setFilenameTemplate(strValue);
      },
      addVariable: (variable: any) => {
        if (isExporting) return;
        const varStr = typeof variable === 'string' ? variable : String(variable);
        if (FILENAME_VARIABLES.includes(varStr)) {
          handleVariableClick(varStr);
        }
      },
    },
  });

  // Tag Resize Enable Switch
  const { ref: resizeEnableRef } = useNavigation({
    id: 'export-resize-enable-switch',
    type: 'button',
    label: 'Resize Enable Switch',
    availableActions: ['click'],
    metadata: {
      description: `Resize enable switch. Current state: ${enableResize ? 'enabled' : 'disabled'}`,
      isEnabled: enableResize,
      isExporting: isExporting,
    },
    customActions: {
      toggle: () => {
        if (!isExporting) setEnableResize(!enableResize);
      },
      enable: () => {
        if (!isExporting) setEnableResize(true);
      },
      disable: () => {
        if (!isExporting) setEnableResize(false);
      },
      click: () => {
        if (!isExporting) setEnableResize(!enableResize);
      },
    },
  });

  // Tag Resize Mode Dropdown
  const { ref: resizeModeRef } = useNavigation({
    id: 'export-resize-mode-dropdown',
    type: 'button',
    label: 'Resize Mode Dropdown',
    availableActions: ['click'],
    metadata: {
      description: `Resize mode dropdown with ${resizeMode} selected. Available modes: longEdge, shortEdge, width, height. Visible when resize is enabled.`,
      currentMode: resizeMode,
      availableModes: resizeModeOptions.map((o) => o.value),
      visible: enableResize,
      isExporting: isExporting,
    },
    customActions: {
      selectMode: (mode: any) => {
        if (isExporting) return;
        const modeStr = typeof mode === 'string' ? mode : String(mode);
        if (resizeModeOptions.find((o) => o.value === modeStr)) {
          setResizeMode(modeStr);
        }
      },
      selectLongEdge: () => {
        if (!isExporting) setResizeMode('longEdge');
      },
      selectShortEdge: () => {
        if (!isExporting) setResizeMode('shortEdge');
      },
      selectWidth: () => {
        if (!isExporting) setResizeMode('width');
      },
      selectHeight: () => {
        if (!isExporting) setResizeMode('height');
      },
    },
  });

  // Tag Resize Value Input
  const { ref: resizeValueRef } = useNavigation({
    id: 'export-resize-value-input',
    type: 'input',
    label: 'Resize Value Input',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Resize value input with value ${resizeValue} pixels. Visible when resize is enabled.`,
      value: resizeValue,
      min: 1,
      visible: enableResize,
      isExporting: isExporting,
    },
    customActions: {
      setValue: (newValue: any) => {
        if (isExporting) return;
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(1, Math.round(numValue));
          setResizeValue(clampedValue);
        }
      },
      increase: (amount: any) => {
        if (isExporting) return;
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? Math.round(numAmount) : 100;
        setResizeValue(resizeValue + validAmount);
      },
      decrease: (amount: any) => {
        if (isExporting) return;
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? Math.round(numAmount) : 100;
        const newValue = Math.max(1, resizeValue - validAmount);
        setResizeValue(newValue);
      },
    },
  });

  // Tag Don't Enlarge Switch
  const { ref: dontEnlargeRef } = useNavigation({
    id: 'export-dont-enlarge-switch',
    type: 'button',
    label: 'Don\'t Enlarge Switch',
    availableActions: ['click'],
    metadata: {
      description: `Don't enlarge switch. Current state: ${dontEnlarge ? 'enabled' : 'disabled'}. Visible when resize is enabled.`,
      isEnabled: dontEnlarge,
      visible: enableResize,
      isExporting: isExporting,
    },
    customActions: {
      toggle: () => {
        if (!isExporting) setDontEnlarge(!dontEnlarge);
      },
      enable: () => {
        if (!isExporting) setDontEnlarge(true);
      },
      disable: () => {
        if (!isExporting) setDontEnlarge(false);
      },
      click: () => {
        if (!isExporting) setDontEnlarge(!dontEnlarge);
      },
    },
  });

  // Tag Keep Metadata Switch
  const { ref: keepMetadataRef } = useNavigation({
    id: 'export-keep-metadata-switch',
    type: 'button',
    label: 'Keep Metadata Switch',
    availableActions: ['click'],
    metadata: {
      description: `Keep original metadata switch. Current state: ${keepMetadata ? 'enabled' : 'disabled'}`,
      isEnabled: keepMetadata,
      isExporting: isExporting,
    },
    customActions: {
      toggle: () => {
        if (!isExporting) setKeepMetadata(!keepMetadata);
      },
      enable: () => {
        if (!isExporting) setKeepMetadata(true);
      },
      disable: () => {
        if (!isExporting) setKeepMetadata(false);
      },
      click: () => {
        if (!isExporting) setKeepMetadata(!keepMetadata);
      },
    },
  });

  // Tag Strip GPS Switch
  const { ref: stripGpsRef } = useNavigation({
    id: 'export-strip-gps-switch',
    type: 'button',
    label: 'Strip GPS Switch',
    availableActions: ['click'],
    metadata: {
      description: `Remove GPS data switch. Current state: ${stripGps ? 'enabled' : 'disabled'}. Visible when keep metadata is enabled.`,
      isEnabled: stripGps,
      visible: keepMetadata,
      isExporting: isExporting,
    },
    customActions: {
      toggle: () => {
        if (!isExporting) setStripGps(!stripGps);
      },
      enable: () => {
        if (!isExporting) setStripGps(true);
      },
      disable: () => {
        if (!isExporting) setStripGps(false);
      },
      click: () => {
        if (!isExporting) setStripGps(!stripGps);
      },
    },
  });

  // Tag Watermark Enable Switch
  const { ref: watermarkEnableRef } = useNavigation({
    id: 'export-watermark-enable-switch',
    type: 'button',
    label: 'Watermark Enable Switch',
    availableActions: ['click'],
    metadata: {
      description: `Watermark enable switch. Current state: ${enableWatermark ? 'enabled' : 'disabled'}`,
      isEnabled: enableWatermark,
      isExporting: isExporting,
    },
    customActions: {
      toggle: () => {
        if (!isExporting) setEnableWatermark(!enableWatermark);
      },
      enable: () => {
        if (!isExporting) setEnableWatermark(true);
      },
      disable: () => {
        if (!isExporting) setEnableWatermark(false);
      },
      click: () => {
        if (!isExporting) setEnableWatermark(!enableWatermark);
      },
    },
  });

  // Tag Watermark Anchor Dropdown
  const { ref: watermarkAnchorRef } = useNavigation({
    id: 'export-watermark-anchor-dropdown',
    type: 'button',
    label: 'Watermark Anchor Dropdown',
    availableActions: ['click'],
    metadata: {
      description: `Watermark anchor dropdown with ${watermarkAnchor} selected. Available: topLeft, topCenter, topRight, centerLeft, center, centerRight, bottomLeft, bottomCenter, bottomRight. Visible when watermark is enabled.`,
      currentAnchor: watermarkAnchor,
      availableAnchors: anchorOptions.map((o) => o.value),
      visible: enableWatermark && !!watermarkPath,
      isExporting: isExporting,
    },
    customActions: {
      selectAnchor: (anchor: any) => {
        if (isExporting) return;
        const anchorStr = typeof anchor === 'string' ? anchor : String(anchor);
        if (Object.values(WatermarkAnchor).includes(anchorStr as WatermarkAnchor)) {
          setWatermarkAnchor(anchorStr as WatermarkAnchor);
        }
      },
      selectTopLeft: () => {
        if (!isExporting) setWatermarkAnchor(WatermarkAnchor.TopLeft);
      },
      selectTopCenter: () => {
        if (!isExporting) setWatermarkAnchor(WatermarkAnchor.TopCenter);
      },
      selectTopRight: () => {
        if (!isExporting) setWatermarkAnchor(WatermarkAnchor.TopRight);
      },
      selectCenterLeft: () => {
        if (!isExporting) setWatermarkAnchor(WatermarkAnchor.CenterLeft);
      },
      selectCenter: () => {
        if (!isExporting) setWatermarkAnchor(WatermarkAnchor.Center);
      },
      selectCenterRight: () => {
        if (!isExporting) setWatermarkAnchor(WatermarkAnchor.CenterRight);
      },
      selectBottomLeft: () => {
        if (!isExporting) setWatermarkAnchor(WatermarkAnchor.BottomLeft);
      },
      selectBottomCenter: () => {
        if (!isExporting) setWatermarkAnchor(WatermarkAnchor.BottomCenter);
      },
      selectBottomRight: () => {
        if (!isExporting) setWatermarkAnchor(WatermarkAnchor.BottomRight);
      },
    },
  });

  // Tag Watermark Scale Slider
  const { ref: watermarkScaleRef } = useNavigation({
    id: 'export-watermark-scale-slider',
    type: 'input',
    label: 'Watermark Scale Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Watermark scale slider with value ${watermarkScale}%. Visible when watermark is enabled.`,
      value: watermarkScale,
      min: 1,
      max: 50,
      step: 1,
      visible: enableWatermark && !!watermarkPath,
      isExporting: isExporting,
    },
    customActions: {
      setValue: (newValue: any) => {
        if (isExporting) return;
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(1, Math.min(50, Math.round(numValue)));
          setWatermarkScale(clampedValue);
        }
      },
      increase: (amount: any) => {
        if (isExporting) return;
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? Math.round(numAmount) : 1;
        const newValue = Math.min(50, watermarkScale + validAmount);
        setWatermarkScale(newValue);
      },
      decrease: (amount: any) => {
        if (isExporting) return;
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? Math.round(numAmount) : 1;
        const newValue = Math.max(1, watermarkScale - validAmount);
        setWatermarkScale(newValue);
      },
    },
  });

  // Tag Watermark Spacing Slider
  const { ref: watermarkSpacingRef } = useNavigation({
    id: 'export-watermark-spacing-slider',
    type: 'input',
    label: 'Watermark Spacing Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Watermark spacing slider with value ${watermarkSpacing}%. Visible when watermark is enabled.`,
      value: watermarkSpacing,
      min: 0,
      max: 25,
      step: 1,
      visible: enableWatermark && !!watermarkPath,
      isExporting: isExporting,
    },
    customActions: {
      setValue: (newValue: any) => {
        if (isExporting) return;
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(0, Math.min(25, Math.round(numValue)));
          setWatermarkSpacing(clampedValue);
        }
      },
      increase: (amount: any) => {
        if (isExporting) return;
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? Math.round(numAmount) : 1;
        const newValue = Math.min(25, watermarkSpacing + validAmount);
        setWatermarkSpacing(newValue);
      },
      decrease: (amount: any) => {
        if (isExporting) return;
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? Math.round(numAmount) : 1;
        const newValue = Math.max(0, watermarkSpacing - validAmount);
        setWatermarkSpacing(newValue);
      },
    },
  });

  // Tag Watermark Opacity Slider
  const { ref: watermarkOpacityRef } = useNavigation({
    id: 'export-watermark-opacity-slider',
    type: 'input',
    label: 'Watermark Opacity Slider',
    availableActions: ['type', 'click'],
    metadata: {
      description: `Watermark opacity slider with value ${watermarkOpacity}%. Visible when watermark is enabled.`,
      value: watermarkOpacity,
      min: 0,
      max: 100,
      step: 1,
      visible: enableWatermark && !!watermarkPath,
      isExporting: isExporting,
    },
    customActions: {
      setValue: (newValue: any) => {
        if (isExporting) return;
        const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          const clampedValue = Math.max(0, Math.min(100, Math.round(numValue)));
          setWatermarkOpacity(clampedValue);
        }
      },
      increase: (amount: any) => {
        if (isExporting) return;
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? Math.round(numAmount) : 1;
        const newValue = Math.min(100, watermarkOpacity + validAmount);
        setWatermarkOpacity(newValue);
      },
      decrease: (amount: any) => {
        if (isExporting) return;
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const validAmount = typeof numAmount === 'number' && !isNaN(numAmount) ? Math.round(numAmount) : 1;
        const newValue = Math.max(0, watermarkOpacity - validAmount);
        setWatermarkOpacity(newValue);
      },
    },
  });

  // Tag Export Button
  const { ref: exportButtonRef } = useNavigation({
    id: 'export-button',
    type: 'button',
    label: 'Export Button',
    availableActions: ['click'],
    metadata: {
      description: `Export button. ${canExport ? `Ready to export ${numImages} image${numImages > 1 ? 's' : ''}` : 'No images to export'}. Status: ${status}`,
      canExport: canExport,
      isExporting: isExporting,
      numImages: numImages,
      status: status,
    },
    customActions: {
      click: () => {
        if (canExport && !isExporting) {
          handleExport();
        }
      },
      export: () => {
        if (canExport && !isExporting) {
          handleExport();
        }
      },
    },
  });

  // Tag Cancel Export Button
  const { ref: cancelButtonRef } = useNavigation({
    id: 'export-cancel-button',
    type: 'button',
    label: 'Cancel Export Button',
    availableActions: ['click'],
    metadata: {
      description: `Cancel export button. Visible when export is in progress.`,
      visible: isExporting,
    },
    customActions: {
      click: () => {
        if (isExporting) {
          handleCancel();
        }
      },
      cancel: () => {
        if (isExporting) {
          handleCancel();
        }
      },
    },
  });

  useEffect(() => {
    const fetchWatermarkDimensions = async () => {
      if (watermarkPath) {
        try {
          const dimensions: { width: number; height: number } = await invoke('get_image_dimensions', {
            path: watermarkPath,
          });
          if (dimensions.height > 0) {
            setWatermarkImageAspectRatio(dimensions.width / dimensions.height);
          } else {
            setWatermarkImageAspectRatio(1);
          }
        } catch (error) {
          console.error('Failed to get watermark dimensions:', error);
          setWatermarkImageAspectRatio(1);
        }
      } else {
        setWatermarkImageAspectRatio(1);
      }
    };
    fetchWatermarkDimensions();
  }, [watermarkPath]);

  const debouncedEstimateSize = useMemo(
    () =>
      debounce(async (currentAdjustments, exportSettings, format) => {
        if (!selectedImage?.path) {
          setEstimatedSize(null);
          return;
        }
        setIsEstimating(true);
        try {
          const size: number = await invoke(Invokes.EstimateExportSize, {
            jsAdjustments: currentAdjustments,
            exportSettings,
            outputFormat: format,
          });
          setEstimatedSize(size);
        } catch (err) {
          console.error('Failed to estimate export size:', err);
          setEstimatedSize(null);
        } finally {
          setIsEstimating(false);
        }
      }, 500),
    [selectedImage?.path],
  );

  useEffect(() => {
    const exportSettings: ExportSettings = {
      filenameTemplate,
      jpegQuality,
      keepMetadata,
      resize: enableResize ? { mode: resizeMode, value: resizeValue, dontEnlarge } : null,
      stripGps,
      watermark:
        enableWatermark && watermarkPath
          ? {
              path: watermarkPath,
              anchor: watermarkAnchor,
              scale: watermarkScale,
              spacing: watermarkSpacing,
              opacity: watermarkOpacity,
            }
          : null,
    };
    const format = FILE_FORMATS.find((f: FileFormat) => f.id === fileFormat)?.extensions[0] || 'jpeg';
    debouncedEstimateSize(adjustments, exportSettings, format);

    return () => debouncedEstimateSize.cancel();
  }, [
    adjustments,
    fileFormat,
    jpegQuality,
    enableResize,
    resizeMode,
    resizeValue,
    dontEnlarge,
    keepMetadata,
    stripGps,
    filenameTemplate,
    enableWatermark,
    watermarkPath,
    watermarkAnchor,
    watermarkScale,
    watermarkSpacing,
    watermarkOpacity,
    debouncedEstimateSize,
  ]);

  const handleVariableClick = (variable: string) => {
    if (!filenameInputRef.current) {
      return;
    }

    const input: HTMLInputElement = filenameInputRef.current;
    const start = Number(input.selectionStart);
    const end = Number(input.selectionEnd);
    const currentValue = input.value;

    const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
    setFilenameTemplate(newValue);

    setTimeout(() => {
      input.focus();
      const newCursorPos = start + variable.length;
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleExport = async () => {
    if (numImages === 0 || isExporting) {
      return;
    }

    setExportState({ status: Status.Exporting, progress: { current: 0, total: numImages }, errorMessage: '' });

    let finalFilenameTemplate = filenameTemplate;
    if (isBatchMode && !filenameTemplate.includes('{sequence}') && !filenameTemplate.includes('{original_filename}')) {
      finalFilenameTemplate = `${filenameTemplate}_{sequence}`;
      setFilenameTemplate(finalFilenameTemplate);
    }

    const exportSettings: ExportSettings = {
      filenameTemplate: finalFilenameTemplate,
      jpegQuality: jpegQuality,
      keepMetadata,
      resize: enableResize ? { mode: resizeMode, value: resizeValue, dontEnlarge } : null,
      stripGps,
      watermark:
        enableWatermark && watermarkPath
          ? {
              path: watermarkPath,
              anchor: watermarkAnchor,
              scale: watermarkScale,
              spacing: watermarkSpacing,
              opacity: watermarkOpacity,
            }
          : null,
    };

    try {
      if (isBatchMode || !isEditorContext) {
        const outputFolder = await open({ title: `Select Folder to Export ${numImages} Image(s)`, directory: true });
        if (outputFolder) {
          await invoke(Invokes.BatchExportImages, {
            exportSettings,
            outputFolder,
            outputFormat: FILE_FORMATS.find((f: FileFormat) => f.id === fileFormat)?.extensions[0],
            paths: pathsToExport,
          });
        } else {
          setExportState((prev: ExportState) => ({ ...prev, status: Status.Idle }));
        }
      } else {
        const selectedFormat: any = FILE_FORMATS.find((f) => f.id === fileFormat);
        const originalFilename = selectedImage.path.split(/[\\/]/).pop();
        const name = originalFilename
          ? originalFilename.substring(0, originalFilename.lastIndexOf('.')) || originalFilename
          : '';
        const filePath = await save({
          title: 'Save Edited Image',
          defaultPath: `${name}_edited.${selectedFormat.extensions[0]}`,
          filters: FILE_FORMATS.map((f: FileFormat) => ({ name: f.name, extensions: f.extensions })),
        });
        if (filePath) {
          await invoke(Invokes.ExportImage, {
            exportSettings,
            jsAdjustments: adjustments,
            originalPath: selectedImage.path,
            outputPath: filePath,
          });
        } else {
          setExportState((prev: ExportState) => ({ ...prev, status: Status.Idle }));
        }
      }
    } catch (error) {
      console.error('Failed to start export:', error);
      setExportState({
        errorMessage: typeof error === 'string' ? error : 'Failed to start export.',
        progress,
        status: Status.Error,
      });
    }
  };

  const handleCancel = async () => {
    try {
      await invoke(Invokes.CancelExport);
    } catch (error) {
      console.error('Failed to send cancel request:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex justify-between items-center flex-shrink-0 border-b border-surface">
        <h2 className="text-xl font-bold text-primary text-shadow-shiny">
          Export {numImages > 1 ? `(${numImages})` : ''}
        </h2>
      </div>
      <div className="flex-grow overflow-y-auto p-4 text-text-secondary space-y-6">
        {canExport ? (
          <>
            <Section title="File Settings">
              <div ref={fileFormatRef} className="grid grid-cols-3 gap-2">
                {FILE_FORMATS.map((format: FileFormat) => (
                  <button
                    className={`px-2 py-1.5 text-sm rounded-md transition-colors ${
                      fileFormat === format.id ? 'bg-accent text-button-text' : 'bg-surface hover:bg-card-active'
                    } disabled:opacity-50`}
                    disabled={isExporting}
                    key={format.id}
                    onClick={() => setFileFormat(format.id)}
                  >
                    {format.name}
                  </button>
                ))}
              </div>
              {fileFormat === FileFormats.Jpeg && (
                <div ref={jpegQualityRef} className={isExporting ? 'opacity-50 pointer-events-none' : ''}>
                  <Slider
                    defaultValue={90}
                    label="Quality"
                    max={100}
                    min={1}
                    onChange={(e) => setJpegQuality(parseInt(e.target.value))}
                    step={1}
                    value={jpegQuality}
                  />
                </div>
              )}
            </Section>

            {isBatchMode && (
              <Section title="File Naming">
                <div ref={filenameTemplateRef}>
                  <input
                    className="w-full bg-bg-primary border border-surface rounded-md p-2 text-sm text-text-primary focus:ring-accent focus:border-accent"
                    disabled={isExporting}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilenameTemplate(e.target.value)}
                    ref={filenameInputRef}
                    type="text"
                    value={filenameTemplate}
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {FILENAME_VARIABLES.map((variable: string) => (
                    <button
                      className="px-2 py-1 bg-surface text-text-secondary text-xs rounded-md hover:bg-card-active transition-colors disabled:opacity-50"
                      disabled={isExporting}
                      key={variable}
                      onClick={() => handleVariableClick(variable)}
                    >
                      {variable}
                    </button>
                  ))}
                </div>
              </Section>
            )}

            <Section title="Image Sizing">
              <div ref={resizeEnableRef}>
                <Switch label="Resize to Fit" checked={enableResize} onChange={setEnableResize} disabled={isExporting} />
              </div>
              {enableResize && (
                <div className="space-y-4 pl-2 border-l-2 border-surface">
                  <div className="flex items-center gap-2">
                    <div ref={resizeModeRef} className={`w-full ${isExporting ? 'opacity-50 pointer-events-none' : ''}`}>
                      <Dropdown options={resizeModeOptions} value={resizeMode} onChange={setResizeMode} />
                    </div>
                    <input
                      ref={resizeValueRef}
                      className="w-24 bg-bg-primary text-center rounded-md p-2 border border-surface focus:border-accent focus:ring-accent"
                      disabled={isExporting}
                      min="1"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResizeValue(parseInt(e?.target?.value))}
                      type="number"
                      value={resizeValue}
                    />
                    <span className="text-sm">pixels</span>
                  </div>
                  <div ref={dontEnlargeRef}>
                    <Switch
                      checked={dontEnlarge}
                      disabled={isExporting}
                      label="Don't Enlarge"
                      onChange={setDontEnlarge}
                    />
                  </div>
                </div>
              )}
            </Section>

            <Section title="Metadata">
              <div ref={keepMetadataRef}>
                <Switch
                  checked={keepMetadata}
                  disabled={isExporting}
                  label="Keep Original Metadata"
                  onChange={setKeepMetadata}
                />
              </div>
              {keepMetadata && (
                <div className="pl-2 border-l-2 border-surface">
                  <div ref={stripGpsRef}>
                    <Switch label="Remove GPS Data" checked={stripGps} onChange={setStripGps} disabled={isExporting} />
                  </div>
                </div>
              )}
            </Section>

            <Section title="Watermark">
              <div ref={watermarkEnableRef}>
                <Switch
                  label="Add Watermark"
                  checked={enableWatermark}
                  onChange={setEnableWatermark}
                  disabled={isExporting}
                />
              </div>
              {enableWatermark && (
                <div className="space-y-4 pl-2 border-l-2 border-surface">
                  <ImagePicker
                    label="Watermark Image"
                    imageName={watermarkPath ? watermarkPath.split(/[\\/]/).pop() || null : null}
                    onImageSelect={setWatermarkPath}
                    onClear={() => setWatermarkPath(null)}
                  />
                  {watermarkPath && (
                    <>
                      <div ref={watermarkAnchorRef} className={`w-full ${isExporting ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Dropdown options={anchorOptions} value={watermarkAnchor} onChange={setWatermarkAnchor} />
                      </div>
                      <div ref={watermarkScaleRef} className={isExporting ? 'opacity-50 pointer-events-none' : ''}>
                        <Slider
                          label="Scale"
                          min={1}
                          max={50}
                          step={1}
                          value={watermarkScale}
                          onChange={(e) => setWatermarkScale(parseInt(e.target.value))}
                          defaultValue={10}
                        />
                      </div>
                      <div ref={watermarkSpacingRef} className={isExporting ? 'opacity-50 pointer-events-none' : ''}>
                        <Slider
                          label="Spacing"
                          min={0}
                          max={25}
                          step={1}
                          value={watermarkSpacing}
                          onChange={(e) => setWatermarkSpacing(parseInt(e.target.value))}
                          defaultValue={5}
                        />
                      </div>
                      <div ref={watermarkOpacityRef} className={isExporting ? 'opacity-50 pointer-events-none' : ''}>
                        <Slider
                          label="Opacity"
                          min={0}
                          max={100}
                          step={1}
                          value={watermarkOpacity}
                          onChange={(e) => setWatermarkOpacity(parseInt(e.target.value))}
                          defaultValue={75}
                        />
                      </div>
                      <WatermarkPreview
                        imageAspectRatio={imageAspectRatio}
                        watermarkImageAspectRatio={watermarkImageAspectRatio}
                        watermarkPath={watermarkPath}
                        anchor={watermarkAnchor}
                        scale={watermarkScale}
                        spacing={watermarkSpacing}
                        opacity={watermarkOpacity}
                      />
                    </>
                  )}
                </div>
              )}
            </Section>
          </>
        ) : (
          <p className="text-center text-text-tertiary mt-4">No image selected for export.</p>
        )}
      </div>

      <div className="p-4 border-t border-surface flex-shrink-0 space-y-3">
        <div className="text-center text-xs text-text-tertiary h-4">
          {isEstimating ? (
            <span className="italic">Estimating size...</span>
          ) : estimatedSize !== null ? (
            <span>Estimated file size: ~{formatBytes(estimatedSize)}</span>
          ) : null}
        </div>
        {isExporting ? (
          <button
            ref={cancelButtonRef}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600/80 text-white font-bold rounded-lg hover:bg-red-600 transition-all"
            onClick={handleCancel}
          >
            <Ban size={18} />
            Cancel Export
          </button>
        ) : (
          <button
            ref={exportButtonRef}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-button-text font-bold rounded-lg hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            disabled={!canExport || isExporting}
            onClick={handleExport}
          >
            <Save size={18} />
            Export {numImages > 1 ? `${numImages} Images` : 'Image'}
          </button>
        )}

        {status === Status.Exporting && (
          <div className="flex items-center gap-2 text-accent mt-3 text-sm justify-center">
            <Loader size={16} className="animate-spin" />
            <span>{`Exporting... (${progress.current}/${progress.total})`}</span>
          </div>
        )}
        {status === Status.Success && (
          <div className="flex items-center gap-2 text-green-400 mt-3 text-sm justify-center">
            <CheckCircle size={16} />
            <span>Export successful!</span>
          </div>
        )}
        {status === Status.Error && (
          <div className="flex items-center gap-2 text-red-400 mt-3 text-sm justify-center text-center">
            <XCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}
        {status === Status.Cancelled && (
          <div className="flex items-center gap-2 text-yellow-400 mt-3 text-sm justify-center">
            <Ban size={16} />
            <span>Export cancelled.</span>
          </div>
        )}
      </div>
    </div>
  );
}