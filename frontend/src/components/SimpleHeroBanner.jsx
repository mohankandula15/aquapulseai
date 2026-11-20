import React from 'react';
import { 
  CheckCircle2, 
  AlertOctagon, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  MapPin, 
  Info, 
  Sparkles,
  HelpCircle
} from 'lucide-react';

export default function SimpleHeroBanner({ 
  selectedStation, 
  stations, 
  onSelectStation, 
  onOpenGuide 
}) {
  if (!selectedStation) return null;

  const reading = selectedStation.latest_reading || {};
  const wqi = selectedStation.latest_wqi || 0;
  const isPotable = selectedStation.latest_potability === 1;
  const hasAlerts = selectedStation.active_alerts_count > 0;
  const hasAnomaly = selectedStation.has_anomaly;

  // Plain-English AI verdict narrative
  const generatePlainSummary = () => {
    if (isPotable && !hasAlerts && !hasAnomaly) {
      return `Water from ${selectedStation.name} is clean, well-aerated, and meets statutory WHO/EPA drinking safety standards. All parameters are in optimal healthy ranges.`;
    }
    if (hasAnomaly || !isPotable) {
      const issues = [];
      if (reading.turbidity > 5.0) issues.push(`high cloudiness (${reading.turbidity.toFixed(1)} NTU)`);
      if (reading.ph < 6.5) issues.push(`acidic water (pH ${reading.ph.toFixed(2)})`);
      if (reading.ph > 8.5) issues.push(`alkaline water (pH ${reading.ph.toFixed(2)})`);
      if (reading.dissolved_oxygen < 5.0) issues.push(`low oxygen (${reading.dissolved_oxygen.toFixed(1)} mg/L)`);
      if (reading.tds > 500) issues.push(`high dissolved minerals (${Math.round(reading.tds)} mg/L)`);
      
      const issueText = issues.length > 0 ? issues.join(', ') : 'abnormal sensor readings';
      return `Attention: Water is currently classified as Non-Potable due to ${issueText}. Treatment and filtration are recommended before consumption.`;
    }
    return `Water quality is moderately acceptable (WQI: ${wqi.toFixed(1)}). Routine surveillance active.`;
  };

  return (
    <div className="space-y-4">
      {/* Friendly Station Pill Selector */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Monitoring Location:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {stations.map((s) => {
              const isSelected = selectedStation.id === s.id;
              const isSafe = s.latest_potability === 1 && s.active_alerts_count === 0;

              return (
                <button
                  key={s.id}
                  onClick={() => onSelectStation(s.id)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                    isSelected
                      ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-600/30'
                      : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSafe ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'
                    }`}
                  />
                  <span>{s.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={onOpenGuide}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium border border-slate-700 transition"
        >
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span>Water Guide (What do scores mean?)</span>
        </button>
      </div>

      {/* Main Big Hero Card */}
      <div
        className={`p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden ${
          isPotable && !hasAlerts
            ? 'bg-gradient-to-r from-emerald-950/50 via-slate-900/90 to-slate-900/90 border-emerald-800/80 shadow-xl shadow-emerald-950/20'
            : 'bg-gradient-to-r from-rose-950/50 via-slate-900/90 to-slate-900/90 border-rose-800/80 shadow-xl shadow-rose-950/20'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Left: Big Verdict & AI Plain English explanation */}
          <div className="space-y-3 max-w-2xl">
            {/* Verdict Badge */}
            <div className="flex items-center space-x-3">
              {isPotable && !hasAlerts ? (
                <div className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Safe for Drinking & Public Supply</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold uppercase tracking-wider">
                  <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span>Unsafe / Requires Filtration or Boiling</span>
                </div>
              )}

              <span className="text-xs text-slate-400 flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-500" />
                {selectedStation.location} ({selectedStation.water_body_type})
              </span>
            </div>

            {/* Station Title */}
            <div>
              <h1 className="text-2xl font-black text-slate-100 tracking-tight">
                {selectedStation.name}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedStation.description}
              </p>
            </div>

            {/* Plain English AI Narrative */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed flex items-start space-x-2.5">
              <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-cyan-300 block mb-0.5">Simple AI Health Summary:</span>
                <span>{generatePlainSummary()}</span>
              </div>
            </div>
          </div>

          {/* Right: Big WQI Score Gauge */}
          <div className="flex items-center space-x-5 bg-slate-950/90 p-5 rounded-2xl border border-slate-800/90 self-start lg:self-center">
            {/* Circular score badge */}
            <div className="relative flex items-center justify-center">
              <div
                className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center ${
                  wqi >= 70
                    ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                    : wqi >= 50
                    ? 'border-amber-500 bg-amber-950/40 text-amber-300'
                    : 'border-rose-500 bg-rose-950/40 text-rose-300'
                }`}
              >
                <span className="text-3xl font-black">{wqi.toFixed(0)}</span>
                <span className="text-[10px] uppercase font-bold opacity-75">/ 100</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Water Quality Index
              </span>
              <span
                className={`text-base font-extrabold block ${
                  wqi >= 70
                    ? 'text-emerald-400'
                    : wqi >= 50
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {selectedStation.latest_wqi_status || 'Evaluating'}
              </span>
              <p className="text-[11px] text-slate-400 max-w-[150px]">
                {wqi >= 70
                  ? 'High purity, standard mineral balance.'
                  : wqi >= 50
                  ? 'Moderate quality, basic treatment needed.'
                  : 'Pollution detected, treatment critical.'}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
