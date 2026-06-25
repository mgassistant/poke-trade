"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface DropCountdownProps {
  targetDate: string;
  label?: string;
  onComplete?: () => void;
  compact?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(target: string): TimeLeft | null {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return null;

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function DropCountdown({
  targetDate,
  label = "Drops in",
  onComplete,
  compact = false,
}: DropCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
    calculateTimeLeft(targetDate)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const tl = calculateTimeLeft(targetDate);
      setTimeLeft(tl);
      if (!tl) {
        clearInterval(timer);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  if (!timeLeft) {
    return (
      <div className="flex items-center gap-1.5 text-green-600 font-medium text-sm">
        <Clock className="h-4 w-4" />
        <span>Live Now!</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-red-600 text-sm font-medium">
        <Clock className="h-3.5 w-3.5" />
        <span>
          {timeLeft.days > 0 && `${timeLeft.days}d `}
          {String(timeLeft.hours).padStart(2, "0")}:
          {String(timeLeft.minutes).padStart(2, "0")}:
          {String(timeLeft.seconds).padStart(2, "0")}
        </span>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1.5 text-gray-500 text-xs mb-2">
        <Clock className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <div className="flex items-center justify-center gap-2">
        {timeLeft.days > 0 && (
          <TimeBlock value={timeLeft.days} unit="Days" />
        )}
        <TimeBlock value={timeLeft.hours} unit="Hrs" />
        <TimeBlock value={timeLeft.minutes} unit="Min" />
        <TimeBlock value={timeLeft.seconds} unit="Sec" />
      </div>
    </div>
  );
}

function TimeBlock({ value, unit }: { value: number; unit: string }) {
  return (
    <div className="bg-gray-900 text-white rounded-lg px-3 py-2 min-w-[52px]">
      <div className="text-lg font-bold font-mono tabular-nums">
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-[9px] uppercase tracking-wider text-gray-400">
        {unit}
      </div>
    </div>
  );
}
