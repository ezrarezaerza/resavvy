import React, { useMemo } from 'react';
import { 
  Sliders, 
  Activity,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export interface EqualizerPreset {
  id: string;
  name: string;
  levels: number[]; // 5 band values (0 to 100, 50 = Flat)
}

export const EQUALIZER_PRESETS: EqualizerPreset[] = [
  {
    id: 'general',
    name: 'General',
    levels: [50, 50, 50, 50, 50]
  },
  {
    id: 'bass',
    name: 'Bass Boost',
    levels: [85, 75, 55, 45, 40]
  },
  {
    id: 'pop',
    name: 'Pop',
    levels: [40, 60, 75, 60, 45]
  },
  {
    id: 'rock',
    name: 'Rock',
    levels: [75, 60, 40, 65, 80]
  },
  {
    id: 'vocal',
    name: 'Vocal Boost',
    levels: [35, 50, 80, 70, 45]
  },
  {
    id: 'acoustic',
    name: 'Acoustic',
    levels: [55, 50, 60, 65, 55]
  },
  {
    id: 'electronic',
    name: 'Electronic',
    levels: [80, 70, 50, 65, 75]
  }
];

export const FREQUENCIES = [
  '60Hz', '230Hz', '910Hz', '4kHz', '14kHz'
];

interface AudioEqualizerSuiteProps {
  isPlaying?: boolean;
}

export function AudioEqualizerSuite({ isPlaying = false }: AudioEqualizerSuiteProps) {
  const { equalizerState, setEqualizerState } = usePlayer();

  const selectedPresetId = equalizerState.presetId || 'general';
  const levels = equalizerState.levels || [50, 50, 50, 50, 50];

  // Handle Preset selection
  const handleSelectPreset = (preset: EqualizerPreset) => {
    setEqualizerState({
      presetId: preset.id,
      levels: [...preset.levels]
    });
  };

  // Reset to General (Flat / Original sound)
  const handleResetGeneral = () => {
    const generalPreset = EQUALIZER_PRESETS[0];
    setEqualizerState({
      presetId: 'general',
      levels: [...generalPreset.levels]
    });
  };

  // Handle individual EQ frequency slider change (0 to 100)
  const handleLevelChange = (index: number, val: number) => {
    const updated = [...levels];
    updated[index] = val;
    setEqualizerState({
      presetId: 'custom',
      levels: updated
    });
  };

  // Generate SVG Spline path string connecting all 5 EQ frequency nodes
  const svgCurvePath = useMemo(() => {
    const width = 360;
    const height = 110;
    const paddingX = 24;
    const paddingY = 16;
    const usableWidth = width - paddingX * 2;
    const usableHeight = height - paddingY * 2;

    const points = levels.map((val, idx) => {
      const x = paddingX + (idx / (levels.length - 1)) * usableWidth;
      // val ranges from 0 to 100, 50 is center
      const y = paddingY + usableHeight - (val / 100) * usableHeight;
      return { x, y };
    });

    if (points.length === 0) return { path: '', fillPath: '', points: [] };

    // Bezier curve generation
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }

    const fillD = `${d} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

    return { path: d, fillPath: fillD, points };
  }, [levels]);

  return (
    <div className="w-full flex flex-col gap-4 text-gray-900 dark:text-gray-100 selection:bg-indigo-500/30">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Audio Equalizer
              {isPlaying && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Sound Engine
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              5-band dynamic audio frequency equalizer
            </p>
          </div>
        </div>

        <button
          onClick={handleResetGeneral}
          title="Reset to Original Sound (Flat)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:text-indigo-600 dark:hover:text-indigo-400 border border-transparent hover:border-indigo-500/30 transition-all duration-200"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Flat</span>
        </button>
      </div>

      {/* Main Grid: Left Presets Selector + Right 5-Band Sliders & Spline Curve */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        
        {/* Left: Preset Selector */}
        <div className="md:col-span-4 flex flex-col gap-2.5 p-3.5 rounded-2xl bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/10">
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Audio Presets
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              {selectedPresetId === 'custom' ? 'Custom Tuning' : 'Preset active'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-1.5 max-h-[250px] overflow-y-auto pr-1 no-scrollbar">
            {EQUALIZER_PRESETS.map((preset) => {
              const isActive = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-all duration-200 border ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20 border-indigo-500'
                      : 'bg-white/60 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border-black/5 dark:border-white/5'
                  }`}
                >
                  <span>{preset.name}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  )}
                </button>
              );
            })}

            {selectedPresetId === 'custom' && (
              <div className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <span>Custom Tuning</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              </div>
            )}
          </div>
        </div>

        {/* Right: 5-Band Equalizer & Spline Visualizer */}
        <div className="md:col-span-8 flex flex-col gap-3 p-3.5 rounded-2xl bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/10 relative">
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              5-Band Frequency Spectrum
            </span>
            <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">Scale: 0 - 100</span>
          </div>

          {/* SVG Real-time Spline Graph */}
          <div className="relative w-full h-[85px] rounded-xl bg-gray-900/90 dark:bg-black/60 border border-white/10 overflow-hidden shadow-inner flex items-center justify-center">
            {/* Grid overlay lines */}
            <div className="absolute inset-0 grid grid-rows-3 grid-cols-4 pointer-events-none opacity-15">
              <div className="border-b border-indigo-400 w-full" />
              <div className="border-b border-indigo-400 w-full" />
              <div className="border-b border-indigo-400 w-full" />
            </div>

            <svg 
              viewBox="0 0 360 110" 
              className="w-full h-full preserve-3d overflow-visible"
            >
              <defs>
                <linearGradient id="eqFillGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="eqLineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>

              {/* Area fill */}
              {svgCurvePath.fillPath && (
                <path 
                  d={svgCurvePath.fillPath} 
                  fill="url(#eqFillGradient)" 
                />
              )}

              {/* Curve line */}
              {svgCurvePath.path && (
                <path 
                  d={svgCurvePath.path} 
                  fill="none" 
                  stroke="url(#eqLineGradient)" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              )}

              {/* Point nodes */}
              {svgCurvePath.points.map((pt, idx) => (
                <g key={idx}>
                  <circle 
                    cx={pt.x} 
                    cy={pt.y} 
                    r="4.5" 
                    className="fill-indigo-400 stroke-white dark:stroke-gray-900 stroke-2 transition-all duration-150" 
                  />
                </g>
              ))}
            </svg>
          </div>

          {/* 5 Vertical Sliders */}
          <div className="grid grid-cols-5 gap-2 items-center justify-items-center pt-1">
            {levels.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5 w-full">
                <span className="text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                  {val}
                </span>

                <div className="relative h-28 flex items-center justify-center py-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={val}
                    onChange={(e) => handleLevelChange(idx, Number(e.target.value))}
                    className="h-24 w-2 accent-indigo-600 dark:accent-indigo-400 cursor-pointer bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none [writing-mode:vertical-lr] [direction:rtl]"
                  />
                </div>

                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 tracking-tight">
                  {FREQUENCIES[idx]}
                </span>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
