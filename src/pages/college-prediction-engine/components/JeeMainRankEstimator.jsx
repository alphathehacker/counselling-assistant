import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';

const JeeMainRankEstimator = ({ initialMarks = 200, maxMarks = 300, totalCandidates = 1000000 }) => {
  const [marks, setMarks] = useState(initialMarks);

  const { percentile, rank } = useMemo(() => {
    const m = Math.max(0, Math.min(maxMarks, Number(marks) || 0));
    const x = m / maxMarks;

    // Smooth non‑linear curve: low marks grow slowly, high marks push towards 99.9+
    const percentileValue = 40 + 60 * Math.pow(x, 2.5);
    const clampedPercentile = Math.min(99.99, Math.max(0, percentileValue));

    const estimatedRank =
      clampedPercentile >= 99.99
        ? 50
        : Math.max(1, Math.round(((100 - clampedPercentile) / 100) * totalCandidates));

    return {
      percentile: clampedPercentile,
      rank: estimatedRank,
    };
  }, [marks, maxMarks, totalCandidates]);

  const handleSliderChange = (e) => {
    setMarks(e.target.value);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value === '') {
      setMarks('');
      return;
    }
    const num = Number(value);
    if (!Number.isNaN(num)) {
      setMarks(Math.max(0, Math.min(maxMarks, num)));
    }
  };

  const displayPercentile = percentile >= 99.995 ? '99.99+' : percentile.toFixed(2);

  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-sky-100/60 dark:from-primary/20 dark:via-primary/10 dark:to-sky-900/40 p-6 md:p-8 shadow-lg shadow-primary/10">
      {/* Badge */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
        <div className="inline-flex items-center gap-2 rounded-full bg-background px-4 py-1 shadow-md border border-border">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-semibold tracking-wide text-emerald-600 uppercase">
            Live Rank Check
          </span>
        </div>
      </div>

      {/* Heading */}
      <div className="text-center mb-6 mt-2">
        <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">
          Estimate Your JEE Main Rank
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          Based on approximate JEE Main 2026 trends (for quick guidance only)
        </p>
      </div>

      {/* Percentile & Rank cards */}
      <div className="grid grid-cols-2 gap-4 md:gap-6 mb-8">
        <div className="rounded-2xl bg-background/80 backdrop-blur-md border border-border shadow-sm px-4 py-5 flex flex-col items-center">
          <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Percentile
          </span>
          <span className="mt-2 text-3xl md:text-4xl font-extrabold text-violet-500">
            {displayPercentile}
          </span>
        </div>

        <div className="rounded-2xl bg-background/80 backdrop-blur-md border border-border shadow-sm px-4 py-5 flex flex-col items-center">
          <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Rank (Approx.)
          </span>
          <span className="mt-2 text-3xl md:text-4xl font-extrabold text-sky-500">
            {rank.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Marks slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Marks (out of {maxMarks})</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={maxMarks}
              value={marks}
              onChange={handleInputChange}
              className="w-20 h-9 rounded-md border border-input bg-background px-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="mt-3">
          <div className="relative h-8 flex items-center">
            <div className="pointer-events-none absolute inset-x-0 mx-1 h-1.5 rounded-full bg-gradient-to-r from-violet-200 via-sky-200 to-emerald-200 dark:from-violet-500/40 dark:via-sky-500/40 dark:to-emerald-500/40" />
            <input
              type="range"
              min={0}
              max={maxMarks}
              value={marks || 0}
              onChange={handleSliderChange}
              className="relative w-full appearance-none bg-transparent mx-1 cursor-pointer"
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            <span>0</span>
            <span>{Math.round(maxMarks / 3)}</span>
            <span>{Math.round((2 * maxMarks) / 3)}</span>
            <span>{maxMarks}</span>
          </div>
        </div>
      </div>

      {/* Info note */}
      <div className="mt-4 flex items-start gap-2 text-[11px] text-muted-foreground">
        <Icon name="Info" size={14} className="mt-[2px]" />
        <p>
          This is an approximate conversion for practice and quick planning. Actual JEE Main
          ranks depend on official NTA normalization and yearly exam statistics.
        </p>
      </div>
    </div>
  );
};

export default JeeMainRankEstimator;

