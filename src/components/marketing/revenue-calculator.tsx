"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Building2, Home, TrendingUp, Calculator } from "lucide-react";

/* ── Eased count-up for smooth number transitions ── */
function useAnimatedValue(target: number, duration = 400): number {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(target);
  const startTimeRef = useRef(0);

  useEffect(() => {
    const from = startRef.current;
    const to = target;
    if (from === to) return;

    startTimeRef.current = performance.now();

    function animate(now: number) {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        startRef.current = to;
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      startRef.current = display;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return display;
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function formatCurrency(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

/* ── Slider component ── */
function CalcSlider({
  label,
  subtitle,
  min,
  max,
  step,
  value,
  onChange,
  formatValue,
}: {
  label: string;
  subtitle: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  formatValue: (v: number) => string;
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        <span className="font-mono text-xl font-bold text-[#38b6ff] tabular-nums shrink-0">
          {formatValue(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer
          bg-gray-200
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-5
          [&::-webkit-slider-thumb]:h-5
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-[#38b6ff]
          [&::-webkit-slider-thumb]:shadow-md
          [&::-webkit-slider-thumb]:border-2
          [&::-webkit-slider-thumb]:border-white
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-moz-range-thumb]:w-5
          [&::-moz-range-thumb]:h-5
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-[#38b6ff]
          [&::-moz-range-thumb]:border-2
          [&::-moz-range-thumb]:border-white
          [&::-moz-range-thumb]:cursor-pointer
          [&::-moz-range-thumb]:shadow-md"
        style={{
          background: `linear-gradient(to right, #38b6ff ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%)`,
        }}
      />
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-gray-400 font-mono">{formatValue(min)}</span>
        <span className="text-[10px] text-gray-400 font-mono">{formatValue(max)}</span>
      </div>
    </div>
  );
}

/* ── Metric card ── */
function MetricCard({
  label,
  value,
  sublabel,
  isHero,
}: {
  label: string;
  value: number;
  sublabel: string;
  isHero?: boolean;
}) {
  const animated = useAnimatedValue(value);

  return (
    <div className={`dash-card rounded-xl p-5 ${isHero ? "border-l-[3px] border-l-[#38b6ff]" : ""}`}>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p
        className={`font-mono font-bold tabular-nums mt-1 ${
          isHero
            ? "text-3xl sm:text-4xl text-[#38b6ff]"
            : "text-xl sm:text-2xl text-slate-800"
        }`}
      >
        {isHero ? formatCurrency(animated) : formatNumber(animated)}
      </p>
      <p className="text-[11px] text-gray-400 mt-1">{sublabel}</p>
    </div>
  );
}

/* ── Main calculator ── */
export function RevenueCalculator() {
  const [properties, setProperties] = useState(35);
  const [avgDoors, setAvgDoors] = useState(100);
  const [turnoverRate, setTurnoverRate] = useState(10);

  const totalDoors = properties * avgDoors;
  const annualTransactions = Math.round(totalDoors * (turnoverRate / 100));
  const annualOrders = Math.round(annualTransactions * 1.4);

  const resaleOnly = Math.round(annualOrders * 0.40);
  const resalePlusPayoff = Math.round(annualOrders * 0.35);
  const fullPackage = annualOrders - resaleOnly - resalePlusPayoff;

  const resaleOnlyRev = resaleOnly * 250;
  const resalePlusPayoffRev = resalePlusPayoff * 300;
  const fullPackageRev = fullPackage * 645;
  const subtotal = resaleOnlyRev + resalePlusPayoffRev + fullPackageRev;
  const rushUplift = Math.round(subtotal * 0.12);
  const totalPlatformRevenue = subtotal + rushUplift;
  const yourShare = Math.round(totalPlatformRevenue * 0.90);

  return (
    <div>
      {/* Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
        <CalcSlider
          label="Properties Managed"
          subtitle="HOA communities your company represents"
          min={5}
          max={200}
          step={1}
          value={properties}
          onChange={setProperties}
          formatValue={(v) => String(v)}
        />
        <CalcSlider
          label="Avg. Doors per Property"
          subtitle="Average homes/units in each community"
          min={25}
          max={500}
          step={5}
          value={avgDoors}
          onChange={setAvgDoors}
          formatValue={(v) => String(v)}
        />
        <CalcSlider
          label="Annual Turnover Rate"
          subtitle="% of homes that sell or refinance each year"
          min={5}
          max={20}
          step={1}
          value={turnoverRate}
          onChange={setTurnoverRate}
          formatValue={(v) => `${v}%`}
        />
      </div>

      {/* Key metrics row */}
      <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Doors"
          value={totalDoors}
          sublabel={`${formatNumber(properties)} properties × ${formatNumber(avgDoors)} doors`}
        />
        <MetricCard
          label="Annual Transactions"
          value={annualTransactions}
          sublabel={`${formatNumber(totalDoors)} doors × ${turnoverRate}% turnover`}
        />
        <MetricCard
          label="Document Orders"
          value={annualOrders}
          sublabel={`${formatNumber(annualTransactions)} transactions × 1.4 docs`}
        />
        <MetricCard
          label="Your Annual Revenue"
          value={yourShare}
          sublabel="You keep 90%"
          isHero
        />
      </div>

      {/* Revenue breakdown */}
      <div className="mt-6 rounded-xl bg-gray-50 border border-gray-100 px-5 py-4 space-y-1.5">
        <p className="text-xs text-gray-500">
          <span className="font-mono font-medium text-gray-600">{formatNumber(annualOrders)}</span> orders/year:
          ~{formatNumber(resaleOnly)} resale only ($250) + ~{formatNumber(resalePlusPayoff)} resale+payoff ($300) + ~{formatNumber(fullPackage)} full package ($645)
        </p>
        <p className="text-xs text-gray-500">
          Plus ~12% rush order premium
        </p>
        <p className="text-xs text-gray-500">
          Total order revenue: <span className="font-mono font-medium text-gray-600">{formatCurrency(totalPlatformRevenue)}</span>
          {" "}— you keep 90%: <span className="font-mono font-semibold text-[#38b6ff]">{formatCurrency(yourShare)}</span>
        </p>
        <p className="text-[11px] text-gray-400 pt-1 border-t border-gray-200 mt-2">
          Based on PropertyDocz standard pricing with 10% platform fee. No setup cost, no monthly fee.
        </p>
      </div>
    </div>
  );
}
