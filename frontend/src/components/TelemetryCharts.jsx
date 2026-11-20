import React, { useState } from 'react';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts';
import { Calendar, AlertCircle, Info, CheckCircle2, TrendingUp } from 'lucide-react';

export default function TelemetryCharts({ readings, selectedStation, timeRange, onTimeRangeChange }) {
  // Default to WQI or Turbidity for clean, friendly initial view
  const [activeParam, setActiveParam] = useState('wqi');

  const paramConfig = {
    wqi: {
      name: 'Water Quality Score',
      sub: 'WQI (0-100)',
      unit: 'WQI',
      color: '#38bdf8',
      min: 0,
      max: 100,
      refMin: 70,
      safeNote: 'Scores above 70 indicate clean, safe water. Above 85 is pristine.',
      desc: 'Overall water health index combining all chemical and physical parameters.'
    },
    turbidity: {
      name: 'Water Clarity',
      sub: 'Turbidity',
      unit: 'NTU',
      color: '#f59e0b',
      min: 0,
      refMax: 5.0,
      safeNote: 'Must be under 5.0 NTU for safe drinking water. Below 2.0 is crystal clear.',
      desc: 'Measures how clear or cloudy the water is due to mud, sediments, or algae.'
    },
    ph: {
      name: 'Acidity Balance',
      sub: 'pH Level',
      unit: 'pH',
      color: '#06b6d4',
      min: 0,
      max: 14,
      refMin: 6.5,
      refMax: 8.5,
      safeNote: 'Healthy range is 6.5 to 8.5 pH. Below 6.5 is acidic; above 8.5 is alkaline.',
      desc: 'Balance of acidity and alkalinity in water.'
    },
    dissolved_oxygen: {
      name: 'Freshness & Oxygen',
      sub: 'Dissolved Oxygen',
      unit: 'mg/L',
      color: '#10b981',
      min: 0,
      refMin: 5.0,
      safeNote: 'Healthy fresh water has oxygen above 5.0 mg/L. Below 3.0 indicates hypoxia/stagnation.',
      desc: 'Amount of oxygen dissolved in water for fish and freshness.'
    },
    tds: {
      name: 'Dissolved Minerals',
      sub: 'Total Dissolved Solids',
      unit: 'mg/L',
      color: '#a855f7',
      min: 0,
      refMax: 500,
      safeNote: 'Clean drinking water is under 500 mg/L. High levels indicate hard or salty water.',
      desc: 'Total inorganic minerals, salts, and dissolved metals.'
    },
    conductivity: {
      name: 'Electric Ions',
      sub: 'Conductivity',
      unit: 'µS/cm',
      color: '#3b82f6',
      min: 0,
      refMax: 800,
      safeNote: 'Safe freshwater is under 800 µS/cm. Spikes indicate industrial or saline runoff.',
      desc: 'Conductivity of electrical current through dissolved ions.'
    },
    temperature: {
      name: 'Temperature',
      sub: 'Water Warmth',
      unit: '°C',
      color: '#f43f5e',
      refMin: 10,
      refMax: 30,
      safeNote: 'Normal surface water is 15° to 25°C.',
      desc: 'Affects oxygen absorption and microbial biological activity.'
    }
  };

  const formattedData = readings.map((r) => {
    const d = new Date(r.timestamp);
    return {
      ...r,
      timeLabel: d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      shortTime: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-2xl shadow-2xl text-xs space-y-1.5 z-50">
          <p className="font-bold text-slate-200 border-b border-slate-800 pb-1">{data.timeLabel}</p>
          <div className="space-y-1 font-mono">
            <div className="flex justify-between space-x-3">
              <span className="text-slate-400">Water Quality (WQI):</span>
              <strong className="text-sky-400">{data.wqi?.toFixed(1)} ({data.wqi_status})</strong>
            </div>
            <div className="flex justify-between space-x-3">
              <span className="text-slate-400">Clarity (Turbidity):</span>
              <strong className={data.turbidity > 5.0 ? 'text-amber-400' : 'text-slate-200'}>{data.turbidity?.toFixed(1)} NTU</strong>
            </div>
            <div className="flex justify-between space-x-3">
              <span className="text-slate-400">pH Level:</span>
              <strong className={data.ph < 6.5 || data.ph > 8.5 ? 'text-rose-400' : 'text-slate-200'}>{data.ph?.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between space-x-3">
              <span className="text-slate-400">Oxygen (DO):</span>
              <strong className={data.dissolved_oxygen < 5.0 ? 'text-rose-400' : 'text-slate-200'}>{data.dissolved_oxygen?.toFixed(1)} mg/L</strong>
            </div>
            <div className="flex justify-between space-x-3">
              <span className="text-slate-400">Minerals (TDS):</span>
              <strong className="text-slate-200">{Math.round(data.tds)} mg/L</strong>
            </div>
          </div>
          {data.is_anomaly && (
            <div className="pt-1 border-t border-slate-800 text-rose-400 font-bold text-[11px]">
              ⚠️ Unusual spike / Anomaly detected
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const currentParam = paramConfig[activeParam];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
      
      {/* Top row: Title + Time range selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <span>Water Quality History & Trends</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            See how water parameters changed over time at {selectedStation?.name || 'this station'}
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs self-start sm:self-auto">
          {[
            { label: 'Past 24 Hours', hours: 24 },
            { label: 'Past 3 Days', hours: 72 },
            { label: 'Past 7 Days', hours: 168 },
          ].map((t) => (
            <button
              key={t.hours}
              onClick={() => onTimeRangeChange(t.hours)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                timeRange === t.hours
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Parameter Switcher Tabs (Plain English Labels) */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(paramConfig).map(([key, cfg]) => {
          const isActive = activeParam === key;
          return (
            <button
              key={key}
              onClick={() => setActiveParam(key)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition border ${
                isActive
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800/80'
              }`}
              style={{
                borderColor: isActive ? cfg.color : undefined,
              }}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
              <span>{cfg.name}</span>
            </button>
          );
        })}
      </div>

      {/* Simple Information Callout */}
      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span className="text-slate-300">
            <strong>{currentParam.name}:</strong> {currentParam.desc}
          </span>
        </div>
        <div className="flex items-center space-x-1 text-emerald-400 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{currentParam.safeNote}</span>
        </div>
      </div>

      {/* Single Clean Interactive Area Chart */}
      <div className="h-72 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="friendlyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={currentParam.color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={currentParam.color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="shortTime" stroke="#475569" tick={{ fontSize: 10 }} minTickGap={30} />
            <YAxis stroke="#475569" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} />

            {/* Threshold reference lines */}
            {currentParam.refMax && (
              <ReferenceLine
                y={currentParam.refMax}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                label={{ value: `Max Safe: ${currentParam.refMax} ${currentParam.unit}`, fill: '#f43f5e', fontSize: 10, position: 'top' }}
              />
            )}
            {currentParam.refMin && (
              <ReferenceLine
                y={currentParam.refMin}
                stroke="#10b981"
                strokeDasharray="4 4"
                label={{ value: `Target: > ${currentParam.refMin} ${currentParam.unit}`, fill: '#10b981', fontSize: 10, position: 'bottom' }}
              />
            )}

            <Area
              type="monotone"
              dataKey={activeParam}
              stroke={currentParam.color}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#friendlyGrad)"
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (payload.is_anomaly) {
                  return (
                    <circle
                      key={`dot-${payload.id}`}
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill="#ef4444"
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                  );
                }
                return null;
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
