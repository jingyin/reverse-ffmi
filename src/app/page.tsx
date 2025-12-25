'use client';

import { useState, useMemo, useCallback } from 'react';
import SmoothSlider from '@/components/SmoothSlider';

// FFMI Formula (normalized):
// FFMI = (Lean Mass in kg) / (Height in m)^2
// Normalized FFMI = FFMI + 6.1 × (1.8 - Height in m)
//
// Reverse calculation:
// Given: Height (H), Body Fat % (BF), Target Normalized FFMI
// 1. FFMI = Normalized FFMI - 6.1 × (1.8 - H)
// 2. Lean Mass = FFMI × H^2
// 3. Total Weight = Lean Mass / (1 - BF/100)

function calculateTargetWeight(
  heightCm: number,
  bodyFatPercent: number,
  normalizedFFMI: number
): { weightKg: number; leanMassKg: number; fatMassKg: number } {
  const heightMeters = heightCm / 100;

  // De-normalize FFMI
  const ffmi = normalizedFFMI - 6.1 * (1.8 - heightMeters);

  // Calculate lean mass in kg
  const leanMassKg = ffmi * Math.pow(heightMeters, 2);

  // Calculate total weight
  const weightKg = leanMassKg / (1 - bodyFatPercent / 100);
  const fatMassKg = weightKg - leanMassKg;

  return { weightKg, leanMassKg, fatMassKg };
}

function formatHeightImperial(inches: number): string {
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  const wholeInches = Math.floor(remainingInches);
  const fraction = remainingInches - wholeInches;

  if (Math.abs(fraction - 0.5) < 0.01) {
    return `${feet}'${wholeInches}½"`;
  }
  return `${feet}'${wholeInches}"`;
}

function formatHeightMetric(cm: number): string {
  return `${cm}`;
}

function getFFMICategory(normalizedFFMI: number): { label: string; color: string; description: string } {
  if (normalizedFFMI < 18) {
    return { label: 'Below Average', color: 'text-gray-400', description: 'Below average muscle mass' };
  } else if (normalizedFFMI < 20) {
    return { label: 'Average', color: 'text-blue-400', description: 'Average muscle development' };
  } else if (normalizedFFMI < 22) {
    return { label: 'Above Average', color: 'text-green-400', description: 'Noticeable muscle development' };
  } else if (normalizedFFMI < 23) {
    return { label: 'Excellent', color: 'text-yellow-400', description: 'Excellent natural development' };
  } else if (normalizedFFMI < 25) {
    return { label: 'Superior', color: 'text-orange-400', description: 'Near natural limit' };
  } else if (normalizedFFMI < 26) {
    return { label: 'Natural Limit', color: 'text-red-400', description: 'At or near genetic ceiling' };
  } else {
    return { label: 'Elite', color: 'text-purple-400', description: 'Likely enhanced or genetic outlier' };
  }
}

// Conversion helpers
const inchesToCm = (inches: number) => inches * 2.54;
const cmToInches = (cm: number) => cm / 2.54;
const kgToLbs = (kg: number) => kg * 2.20462;

// Snap to nearest valid step
const snapToStep = (value: number, min: number, step: number) => {
  const steps = Math.round((value - min) / step);
  return min + steps * step;
};

export default function Home() {
  const [isImperial, setIsImperial] = useState(true);

  // Store height in cm internally (snapped to valid metric value)
  const [heightCm, setHeightCm] = useState(178); // ~5'10"

  // When toggling units, snap to nearest valid value in new unit system
  const handleUnitToggle = useCallback((toImperial: boolean) => {
    if (toImperial === isImperial) return;

    if (toImperial) {
      // Converting from metric to imperial: snap cm to nearest valid inch value
      const inches = cmToInches(heightCm);
      const snappedInches = snapToStep(inches, 60, 0.5);
      const clampedInches = Math.max(60, Math.min(84, snappedInches));
      setHeightCm(inchesToCm(clampedInches));
    } else {
      // Converting from imperial to metric: snap to nearest cm
      const snappedCm = snapToStep(heightCm, 152, 1);
      const clampedCm = Math.max(152, Math.min(213, snappedCm));
      setHeightCm(clampedCm);
    }
    setIsImperial(toImperial);
  }, [isImperial, heightCm]);

  // Body fat: 5% to 35% in 0.5% increments
  const [bodyFatPercent, setBodyFatPercent] = useState(12);

  // Normalized FFMI: 15 to 30 in 0.5 increments
  const [normalizedFFMI, setNormalizedFFMI] = useState(20);

  const result = useMemo(
    () => calculateTargetWeight(heightCm, bodyFatPercent, normalizedFFMI),
    [heightCm, bodyFatPercent, normalizedFFMI]
  );

  const category = getFFMICategory(normalizedFFMI);

  // Height slider config based on unit
  const heightConfig = isImperial
    ? {
        value: cmToInches(heightCm),
        min: 60, // 5'0"
        max: 84, // 7'0"
        step: 0.5,
        onChange: (inches: number) => setHeightCm(inchesToCm(inches)),
        formatValue: formatHeightImperial,
        unit: '',
      }
    : {
        value: heightCm,
        min: 152, // ~5'0"
        max: 213, // ~7'0"
        step: 1,
        onChange: setHeightCm,
        formatValue: formatHeightMetric,
        unit: 'cm',
      };

  // Format weight based on unit
  const formatWeight = (kg: number) => {
    if (isImperial) {
      return kgToLbs(kg).toFixed(1);
    }
    return kg.toFixed(1);
  };

  const weightUnit = isImperial ? 'lbs' : 'kg';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Reverse FFMI Calculator
          </h1>
          <p className="text-gray-400 text-lg">
            Calculate your target weight based on desired physique
          </p>
        </div>

        {/* Unit Toggle - Slider Style */}
        <div className="flex justify-center mb-8">
          <div
            className="relative bg-gray-800/70 rounded-full p-1 flex cursor-pointer select-none"
            onClick={() => handleUnitToggle(!isImperial)}
          >
            {/* Sliding background */}
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-2px)] bg-purple-600 rounded-full transition-all duration-300 ease-out ${
                isImperial ? 'left-1' : 'left-[calc(50%+1px)]'
              }`}
            />
            {/* Labels */}
            <div
              className={`relative z-10 px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                isImperial ? 'text-white' : 'text-gray-400'
              }`}
              onClick={(e) => { e.stopPropagation(); handleUnitToggle(true); }}
            >
              Imperial
            </div>
            <div
              className={`relative z-10 px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                !isImperial ? 'text-white' : 'text-gray-400'
              }`}
              onClick={(e) => { e.stopPropagation(); handleUnitToggle(false); }}
            >
              Metric
            </div>
          </div>
        </div>

        {/* Input Sliders */}
        <div className="space-y-8 mb-12">
          <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur border border-gray-700/50">
            <SmoothSlider
              label="Height"
              value={heightConfig.value}
              min={heightConfig.min}
              max={heightConfig.max}
              step={heightConfig.step}
              onChange={heightConfig.onChange}
              formatValue={heightConfig.formatValue}
              unit={heightConfig.unit}
            />
          </div>

          <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur border border-gray-700/50">
            <SmoothSlider
              label="Target Body Fat"
              value={bodyFatPercent}
              min={5}
              max={35}
              step={0.5}
              onChange={setBodyFatPercent}
              formatValue={(v) => v.toFixed(1)}
              unit="%"
            />
          </div>

          <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur border border-gray-700/50">
            <SmoothSlider
              label="Target Normalized FFMI"
              value={normalizedFFMI}
              min={15}
              max={30}
              step={0.5}
              onChange={setNormalizedFFMI}
              formatValue={(v) => v.toFixed(1)}
            />
            <div className={`mt-3 text-sm ${category.color}`}>
              <span className="font-semibold">{category.label}</span>
              <span className="text-gray-500 ml-2">— {category.description}</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-2xl p-8 border border-purple-500/30">
          <h2 className="text-xl font-semibold text-gray-300 mb-6 text-center">
            Your Target Physique
          </h2>

          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">
                {formatWeight(result.weightKg)}
              </div>
              <div className="text-sm text-gray-400 uppercase tracking-wide">
                Total Weight ({weightUnit})
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">
                {formatWeight(result.leanMassKg)}
              </div>
              <div className="text-sm text-gray-400 uppercase tracking-wide">
                Lean Mass ({weightUnit})
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-1">
                {formatWeight(result.fatMassKg)}
              </div>
              <div className="text-sm text-gray-400 uppercase tracking-wide">
                Fat Mass ({weightUnit})
              </div>
            </div>
          </div>
        </div>

        {/* FFMI Reference Guide */}
        <div className="mt-8 bg-gray-800/30 rounded-xl p-6 border border-gray-700/30">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Normalized FFMI Reference
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span className="text-gray-400">&lt;18: Below Average</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <span className="text-gray-400">18-20: Average</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-gray-400">20-22: Above Average</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="text-gray-400">22-23: Excellent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-400" />
              <span className="text-gray-400">23-25: Superior</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <span className="text-gray-400">25-26: Natural Limit</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>
            FFMI (Fat-Free Mass Index) is normalized to a height of 1.8m (5&apos;11&quot;)
          </p>
        </div>
      </div>
    </div>
  );
}
