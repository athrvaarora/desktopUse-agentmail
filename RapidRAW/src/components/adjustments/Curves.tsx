import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertOctagon } from 'lucide-react';
import clsx from 'clsx';
import { ActiveChannel, Adjustments, Coord } from '../../utils/adjustments';
import { Theme } from '../ui/AppProperties';
import { useNavigation } from 'desktopuse-sdk';

export interface ChannelConfig {
  [index: string]: ColorData;
  [ActiveChannel.Luma]: ColorData;
  [ActiveChannel.Red]: ColorData;
  [ActiveChannel.Green]: ColorData;
  [ActiveChannel.Blue]: ColorData;
}

interface ColorData {
  color: string;
  data: any;
}

interface CurveGraphProps {
  adjustments: Adjustments;
  histogram: ChannelConfig | null;
  isMasksView?: boolean;
  setAdjustments(updater: (prev: any) => any): void;
  theme: string;
}

function getCurvePath(points: Array<Coord>) {
  if (points.length < 2) return '';

  const n = points.length;
  const deltas = [];
  const ms = [];

  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    if (dx === 0) {
      deltas.push(dy > 0 ? 1e6 : dy < 0 ? -1e6 : 0);
    } else {
      deltas.push(dy / dx);
    }
  }

  ms.push(deltas[0]);

  for (let i = 1; i < n - 1; i++) {
    if (deltas[i - 1] * deltas[i] <= 0) {
      ms.push(0);
    } else {
      ms.push((deltas[i - 1] + deltas[i]) / 2);
    }
  }

  ms.push(deltas[n - 2]);

  for (let i = 0; i < n - 1; i++) {
    if (deltas[i] === 0) {
      ms[i] = 0;
      ms[i + 1] = 0;
    } else {
      const alpha: number = ms[i] / deltas[i];
      const beta: number = ms[i + 1] / deltas[i];

      const tau = alpha * alpha + beta * beta;
      if (tau > 9) {
        const scale = 3.0 / Math.sqrt(tau);
        ms[i] = scale * alpha * deltas[i];
        ms[i + 1] = scale * beta * deltas[i];
      }
    }
  }

  let path = `M ${points[0].x} ${255 - points[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const m0 = ms[i];
    const m1 = ms[i + 1];
    const dx = p1.x - p0.x;

    const cp1x = p0.x + dx / 3.0;
    const cp1y = p0.y + (m0 * dx) / 3.0;
    const cp2x = p1.x - dx / 3.0;
    const cp2y = p1.y - (m1 * dx) / 3.0;

    path += ` C ${cp1x.toFixed(2)} ${255 - Number(cp1y.toFixed(2))}, ${cp2x.toFixed(2)} ${
      255 - Number(cp2y.toFixed(2))
    }, ${p1.x} ${255 - p1.y}`;
  }

  return path;
}

function getHistogramPath(data: Array<any>) {
  if (!data || data.length === 0) {
    return '';
  }
  const maxVal = Math.max(...data);
  if (maxVal === 0) {
    return '';
  }

  const pathData = data
    .map((value: number, index: number) => {
      const x = (index / 255) * 255;
      const y = (value / maxVal) * 255;
      return `${x},${255 - y}`;
    })
    .join(' ');

  return `M0,255 L${pathData} L255,255 Z`;
}

function getZeroHistogramPath(data: Array<any>) {
  if (!data || data.length === 0) {
    return '';
  }
  const pathData = data
    .map((_, index: number) => {
      const x = (index / 255) * 255;
      return `${x},255`;
    })
    .join(' ');

  return `M0,255 L${pathData} L255,255 Z`;
}

export default function CurveGraph({ adjustments, setAdjustments, histogram, theme, isMasksView }: CurveGraphProps) {
  const [activeChannel, setActiveChannel] = useState<ActiveChannel>(ActiveChannel.Luma);
  const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);
  const [localPoints, setLocalPoints] = useState<Array<Coord> | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (draggingPointIndex === null) {
      setLocalPoints(null);
    }
  }, [adjustments?.curves?.[activeChannel]]);

  // Tag Channel Selector for LLM control
  const { ref: channelSelectorRef } = useNavigation({
    id: 'curve-channel-selector',
    type: 'button',
    label: 'Curve Channel Selector',
    availableActions: ['click'],
    metadata: {
      description: `Curve channel selector with ${activeChannel} active. Available channels: luma (brightness), red, green, blue`,
      activeChannel: activeChannel,
      availableChannels: ['luma', 'red', 'green', 'blue'],
    },
    customActions: {
      selectLuma: () => {
        setActiveChannel(ActiveChannel.Luma);
      },
      selectRed: () => {
        setActiveChannel(ActiveChannel.Red);
      },
      selectGreen: () => {
        setActiveChannel(ActiveChannel.Green);
      },
      selectBlue: () => {
        setActiveChannel(ActiveChannel.Blue);
      },
      selectChannel: (channel: string) => {
        const channelMap: { [key: string]: ActiveChannel } = {
          luma: ActiveChannel.Luma,
          red: ActiveChannel.Red,
          green: ActiveChannel.Green,
          blue: ActiveChannel.Blue,
        };
        if (channelMap[channel]) {
          setActiveChannel(channelMap[channel]);
        }
      },
    },
  });

  // Tag Curve Graph for point-based LLM control
  const { ref: curveGraphRef } = useNavigation({
    id: 'curve-graph-interactive',
    type: 'card',
    label: 'Curve Graph',
    availableActions: ['click'],
    metadata: {
      description: `Interactive curve graph for ${activeChannel} channel with ${adjustments?.curves?.[activeChannel]?.length || 0} control points. Coordinate range: 0-255 for both X and Y axes. Available presets: linear, s-curve, inverse-s, brighten, darken, contrast-boost`,
      activeChannel: activeChannel,
      points: adjustments?.curves?.[activeChannel] || [],
      pointCount: adjustments?.curves?.[activeChannel]?.length || 0,
      availablePresets: ['linear', 's-curve', 'inverse-s', 'brighten', 'darken', 'contrast-boost'],
    },
    customActions: {
      addPoint: (coords: any) => {
        if (!coords || typeof coords !== 'object') return;
        const { x, y } = coords;
        if (typeof x !== 'number' || typeof y !== 'number') return;
        
        const currentPoints = adjustments?.curves?.[activeChannel] || [];
        const clampedX = Math.max(0, Math.min(255, x));
        const clampedY = Math.max(0, Math.min(255, y));
        
        // Don't add if too close to existing point
        const tooClose = currentPoints.some((p: Coord) => Math.abs(p.x - clampedX) < 5);
        if (tooClose) return;

        const newPoints = [...currentPoints, { x: clampedX, y: clampedY }].sort((a: Coord, b: Coord) => a.x - b.x);
        
        setAdjustments((prev: Adjustments) => ({
          ...prev,
          curves: { ...prev.curves, [activeChannel]: newPoints },
        }));
      },
      removePoint: (index: any) => {
        if (typeof index !== 'number') return;
        const currentPoints = adjustments?.curves?.[activeChannel] || [];
        // Don't allow removing first or last point (anchor points)
        if (index === 0 || index === currentPoints.length - 1) return;
        if (index < 0 || index >= currentPoints.length) return;

        const newPoints = currentPoints.filter((_: Coord, i: number) => i !== index);
        
        setAdjustments((prev: Adjustments) => ({
          ...prev,
          curves: { ...prev.curves, [activeChannel]: newPoints },
        }));
      },
      adjustPoint: (params: any) => {
        if (!params || typeof params !== 'object') return;
        const { index, newY } = params;
        if (typeof index !== 'number' || typeof newY !== 'number') return;
        
        const currentPoints = adjustments?.curves?.[activeChannel] || [];
        if (index < 0 || index >= currentPoints.length) return;

        const clampedY = Math.max(0, Math.min(255, newY));
        const newPoints = [...currentPoints];
        newPoints[index] = { ...newPoints[index], y: clampedY };
        
        setAdjustments((prev: Adjustments) => ({
          ...prev,
          curves: { ...prev.curves, [activeChannel]: newPoints },
        }));
      },
      movePoint: (params: any) => {
        if (!params || typeof params !== 'object') return;
        const { index, x, y } = params;
        if (typeof index !== 'number' || typeof x !== 'number' || typeof y !== 'number') return;
        
        const currentPoints = adjustments?.curves?.[activeChannel] || [];
        if (index < 0 || index >= currentPoints.length) return;

        const clampedY = Math.max(0, Math.min(255, y));
        let clampedX = Math.max(0, Math.min(255, x));

        // Anchor points (first and last) can only move vertically
        const isAnchor = index === 0 || index === currentPoints.length - 1;
        if (isAnchor) {
          clampedX = currentPoints[index].x;
        } else {
          // Constrain X between neighboring points
          const prevX = currentPoints[index - 1].x;
          const nextX = currentPoints[index + 1].x;
          clampedX = Math.max(prevX + 1, Math.min(nextX - 1, clampedX));
        }

        const newPoints = [...currentPoints];
        newPoints[index] = { x: clampedX, y: clampedY };
        
        setAdjustments((prev: Adjustments) => ({
          ...prev,
          curves: { ...prev.curves, [activeChannel]: newPoints },
        }));
      },
      resetCurve: () => {
        const defaultPoints = [
          { x: 0, y: 0 },
          { x: 255, y: 255 },
        ];
        
        setAdjustments((prev: Adjustments) => ({
          ...prev,
          curves: { ...prev.curves, [activeChannel]: defaultPoints },
        }));
      },
      adjustShadows: (deltaY: any) => {
        if (typeof deltaY !== 'number') return;
        // Adjust the lower third of the curve
        const currentPoints = adjustments?.curves?.[activeChannel] || [];
        const newPoints = currentPoints.map((p: Coord) => {
          if (p.x < 85) {
            const newY = Math.max(0, Math.min(255, p.y + deltaY));
            return { ...p, y: newY };
          }
          return p;
        });
        
        setAdjustments((prev: Adjustments) => ({
          ...prev,
          curves: { ...prev.curves, [activeChannel]: newPoints },
        }));
      },
      adjustMidtones: (deltaY: any) => {
        if (typeof deltaY !== 'number') return;
        // Adjust the middle third of the curve
        const currentPoints = adjustments?.curves?.[activeChannel] || [];
        const newPoints = currentPoints.map((p: Coord) => {
          if (p.x >= 85 && p.x <= 170) {
            const newY = Math.max(0, Math.min(255, p.y + deltaY));
            return { ...p, y: newY };
          }
          return p;
        });
        
        setAdjustments((prev: Adjustments) => ({
          ...prev,
          curves: { ...prev.curves, [activeChannel]: newPoints },
        }));
      },
      adjustHighlights: (deltaY: any) => {
        if (typeof deltaY !== 'number') return;
        // Adjust the upper third of the curve
        const currentPoints = adjustments?.curves?.[activeChannel] || [];
        const newPoints = currentPoints.map((p: Coord) => {
          if (p.x > 170) {
            const newY = Math.max(0, Math.min(255, p.y + deltaY));
            return { ...p, y: newY };
          }
          return p;
        });
        
        setAdjustments((prev: Adjustments) => ({
          ...prev,
          curves: { ...prev.curves, [activeChannel]: newPoints },
        }));
      },
      applyPreset: (presetName: any) => {
        if (typeof presetName !== 'string') return;
        let newPoints: Array<Coord>;
        
        switch (presetName.toLowerCase()) {
          case 'linear':
            newPoints = [{ x: 0, y: 0 }, { x: 255, y: 255 }];
            break;
          case 's-curve':
            // Classic S-curve for contrast boost
            newPoints = [
              { x: 0, y: 0 },
              { x: 64, y: 48 },
              { x: 128, y: 128 },
              { x: 192, y: 208 },
              { x: 255, y: 255 },
            ];
            break;
          case 'inverse-s':
            // Inverse S-curve for softer look
            newPoints = [
              { x: 0, y: 0 },
              { x: 64, y: 80 },
              { x: 128, y: 128 },
              { x: 192, y: 176 },
              { x: 255, y: 255 },
            ];
            break;
          case 'brighten':
            newPoints = [
              { x: 0, y: 20 },
              { x: 128, y: 148 },
              { x: 255, y: 255 },
            ];
            break;
          case 'darken':
            newPoints = [
              { x: 0, y: 0 },
              { x: 128, y: 108 },
              { x: 255, y: 235 },
            ];
            break;
          case 'contrast-boost':
            newPoints = [
              { x: 0, y: 0 },
              { x: 85, y: 64 },
              { x: 170, y: 192 },
              { x: 255, y: 255 },
            ];
            break;
          default:
            newPoints = [{ x: 0, y: 0 }, { x: 255, y: 255 }];
        }
        
        setAdjustments((prev: Adjustments) => ({
          ...prev,
          curves: { ...prev.curves, [activeChannel]: newPoints },
        }));
      },
    },
  });

  useEffect(() => {
    setLocalPoints(null);
    setDraggingPointIndex(null);
  }, [activeChannel]);

  useEffect(() => {
    const moveHandler = (e: any) => handleMouseMove(e);
    const upHandler = () => handleMouseUp();

    if (draggingPointIndex !== null) {
      window.addEventListener('mousemove', moveHandler);
      window.addEventListener('mouseup', upHandler);
    }

    return () => {
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('mouseup', upHandler);
    };
  }, [draggingPointIndex, localPoints, adjustments?.curves, activeChannel, setAdjustments]);

  const isLightTheme = theme === Theme.Light || theme === Theme.Arctic;
  const histogramOpacity = isLightTheme ? 0.6 : 0.15;

  const channelConfig: ChannelConfig = {
    luma: { color: 'rgb(var(--color-accent))', data: histogram?.luma },
    red: { color: '#FF6B6B', data: histogram?.red },
    green: { color: '#6BCB77', data: histogram?.green },
    blue: { color: '#4D96FF', data: histogram?.blue },
  };

  const propPoints = adjustments?.curves?.[activeChannel];
  const points = localPoints ?? propPoints;
  const { color, data: histogramData } = channelConfig[activeChannel];

  if (!propPoints || !points) {
    return (
      <div className="w-full aspect-square bg-surface-secondary p-1 rounded-md flex items-center justify-center text-text-secondary text-xs">
        Curve data not available.
      </div>
    );
  }

  const handleToggleClipping = () => {
    setAdjustments((prev: Adjustments) => ({
      ...prev,
      showClipping: !prev.showClipping,
    }));
  };

  const getMousePos = (e: any) => {
    const svg = svgRef.current;
    if (!svg) {
      return { x: 0, y: 0 };
    }
    const rect = svg.getBoundingClientRect();
    const x = Math.max(0, Math.min(255, ((e.clientX - rect.left) / rect.width) * 255));
    const y = Math.max(0, Math.min(255, 255 - ((e.clientY - rect.top) / rect.height) * 255));
    return { x, y };
  };

  const handlePointMouseDown = (e: any, index: number) => {
    e.preventDefault();
    setLocalPoints(points);
    setDraggingPointIndex(index);
  };

  const handleMouseMove = (e: any) => {
    if (draggingPointIndex === null) {
      return;
    }

    let { x, y } = getMousePos(e);

    const newPoints = [...points];
    const isEndPoint = draggingPointIndex === 0 || draggingPointIndex === points.length - 1;

    if (isEndPoint) {
      x = newPoints[draggingPointIndex].x;
    } else {
      const prevX = points[draggingPointIndex - 1].x;
      const nextX = points[draggingPointIndex + 1].x;
      x = Math.max(prevX + 0.01, Math.min(nextX - 0.01, x));
    }

    newPoints[draggingPointIndex] = { x, y };

    setLocalPoints(newPoints);

    setAdjustments((prev: Adjustments) => ({
      ...prev,
      curves: { ...prev.curves, [activeChannel]: newPoints },
    }));
  };

  const handleMouseUp = () => {
    setDraggingPointIndex(null);
  };

  const handleContainerMouseDown = (e: any) => {
    if (e.button !== 0 || e.target.tagName === 'circle') {
      return;
    }

    const { x, y } = getMousePos(e);
    const newPoints = [...points, { x, y }].sort((a: Coord, b: Coord) => a.x - b.x);
    const newPointIndex = newPoints.findIndex((p: Coord) => p.x === x && p.y === y);

    setLocalPoints(newPoints);
    setAdjustments((prev: Adjustments) => ({
      ...prev,
      curves: { ...prev.curves, [activeChannel]: newPoints },
    }));

    setDraggingPointIndex(newPointIndex);
  };

  const handleDoubleClick = () => {
    const defaultPoints = [
      { x: 0, y: 0 },
      { x: 255, y: 255 },
    ];

    setLocalPoints(defaultPoints);
    setAdjustments((prev: Adjustments) => ({
      ...prev,
      curves: { ...prev.curves, [activeChannel]: defaultPoints },
    }));
  };

  return (
    <div className="select-none">
      <div className="flex items-center justify-between gap-1 mb-2 mt-2">
        <div ref={channelSelectorRef} className="flex items-center gap-1">
          {Object.keys(channelConfig).map((channel: any) => (
            <button
              className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all
              ${
                activeChannel === channel
                  ? 'ring-2 ring-offset-2 ring-offset-surface ring-accent'
                  : 'bg-surface-secondary'
              }
              ${channel === ActiveChannel.Luma ? 'text-text-primary' : ''}`}
              key={channel}
              onClick={() => setActiveChannel(channel as ActiveChannel)}
              style={{
                backgroundColor:
                  channel !== ActiveChannel.Luma && activeChannel !== channel
                    ? channelConfig[channel].color + '40'
                    : undefined,
              }}
            >
              {channel.charAt(0).toUpperCase()}
            </button>
          ))}
        </div>
        {!isMasksView && (
          <button
            className={clsx(
              'w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all opacity-0 group-hover:opacity-100',
              {
                'ring-2 ring-offset-2 ring-offset-surface ring-accent bg-accent text-button-text !opacity-100':
                  adjustments.showClipping,
                'bg-surface-secondary text-text-primary': !adjustments.showClipping,
              },
            )}
            key="clipping"
            onClick={handleToggleClipping}
            title="Toggle Clipping Warnings"
          >
            <AlertOctagon size={14} />
          </button>
        )}
      </div>

      <div
        ref={curveGraphRef}
        className="w-full aspect-square bg-surface-secondary p-1 rounded-md relative"
        onMouseDown={handleContainerMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        <svg ref={svgRef} viewBox="0 0 255 255" className="w-full h-full overflow-visible">
          <path
            d="M 63.75,0 V 255 M 127.5,0 V 255 M 191.25,0 V 255 M 0,63.75 H 255 M 0,127.5 H 255 M 0,191.25 H 255"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="0.5"
          />

          <AnimatePresence>
            {histogramData && (
              <motion.path
                key={activeChannel}
                fill={color}
                initial={{ d: getZeroHistogramPath(histogramData), opacity: 0 }}
                animate={{
                  d: getHistogramPath(histogramData),
                  opacity: histogramOpacity,
                  transition: { d: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 1 } },
                }}
                exit={{
                  d: getZeroHistogramPath(histogramData),
                  opacity: 0,
                  transition: { d: { duration: 0.3, ease: [0.55, 0, 0.78, 0.34] }, opacity: { duration: 1 } },
                }}
              />
            )}
          </AnimatePresence>

          <line x1="0" y1="255" x2="255" y2="0" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="2 2" />

          <path d={getCurvePath(points)} fill="none" stroke={color} strokeWidth="2.5" />

          {points.map((p: Coord, i: number) => (
            <circle
              className="cursor-pointer"
              cx={p.x}
              cy={255 - p.y}
              fill={color}
              key={i}
              onMouseDown={(e: any) => handlePointMouseDown(e, i)}
              r="6"
              stroke="#1e1e1e"
              strokeWidth="2"
            />
          ))}
        </svg>
      </div>
    </div>
  );
}