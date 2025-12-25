'use client';

import { useCallback, useRef, useEffect, useState } from 'react';

interface SmoothSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  unit?: string;
}

export default function SmoothSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue,
  unit = '',
}: SmoothSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const clamp = useCallback(
    (val: number) => Math.min(max, Math.max(min, val)),
    [min, max]
  );

  const snapToStep = useCallback(
    (val: number) => {
      const steps = Math.round((val - min) / step);
      return clamp(min + steps * step);
    },
    [min, step, clamp]
  );

  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return value;
      const rect = trackRef.current.getBoundingClientRect();
      const percentage = (clientX - rect.left) / rect.width;
      const rawValue = min + percentage * (max - min);
      return snapToStep(rawValue);
    },
    [min, max, value, snapToStep]
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const direction = e.deltaY > 0 ? -1 : 1;
      const newValue = snapToStep(value + direction * step);
      onChange(newValue);
    },
    [value, step, onChange, snapToStep]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      const newValue = getValueFromPosition(e.clientX);
      onChange(newValue);
    },
    [getValueFromPosition, onChange]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const newValue = getValueFromPosition(e.clientX);
      onChange(newValue);
    },
    [isDragging, getValueFromPosition, onChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle keyboard input
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let newValue = value;
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault();
          newValue = snapToStep(value + step);
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          e.preventDefault();
          newValue = snapToStep(value - step);
          break;
        case 'Home':
          e.preventDefault();
          newValue = min;
          break;
        case 'End':
          e.preventDefault();
          newValue = max;
          break;
        case 'PageUp':
          e.preventDefault();
          newValue = snapToStep(value + step * 10);
          break;
        case 'PageDown':
          e.preventDefault();
          newValue = snapToStep(value - step * 10);
          break;
        default:
          return;
      }
      onChange(newValue);
    },
    [value, step, min, max, onChange, snapToStep]
  );

  useEffect(() => {
    const element = sliderRef.current;
    if (!element) return;

    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      element.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const percentage = ((value - min) / (max - min)) * 100;
  const displayValue = formatValue ? formatValue(value) : value.toString();

  return (
    <div
      ref={sliderRef}
      className="w-full select-none"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <span className="text-lg font-mono font-semibold text-white tabular-nums">
          {displayValue}
          {unit && <span className="text-gray-400 ml-1 text-sm">{unit}</span>}
        </span>
      </div>

      <div
        ref={trackRef}
        className={`relative h-3 rounded-full cursor-pointer transition-all duration-150 ${
          isDragging || isHovering ? 'h-4' : 'h-3'
        }`}
        style={{
          background: `linear-gradient(to right,
            rgb(59, 130, 246) 0%,
            rgb(147, 51, 234) ${percentage}%,
            rgb(55, 65, 81) ${percentage}%,
            rgb(55, 65, 81) 100%)`,
        }}
        onMouseDown={handleMouseDown}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
      >
        {/* Thumb */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white shadow-lg border-2 border-purple-500 transition-all duration-150 ${
            isDragging
              ? 'w-6 h-6 shadow-purple-500/50 shadow-lg'
              : isHovering
              ? 'w-5 h-5'
              : 'w-4 h-4'
          }`}
          style={{ left: `${percentage}%` }}
        />
      </div>

      {/* Scroll hint */}
      <div
        className={`text-xs text-gray-500 mt-1 text-center transition-opacity duration-200 ${
          isHovering ? 'opacity-100' : 'opacity-0'
        }`}
      >
        Scroll to adjust
      </div>
    </div>
  );
}
