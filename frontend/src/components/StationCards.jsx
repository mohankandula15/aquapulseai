import React from 'react';
import { 
  CheckCircle2, 
  AlertOctagon, 
  AlertTriangle, 
  Thermometer, 
  Droplet, 
  Waves, 
  Gauge, 
  Zap, 
  Compass 
} from 'lucide-react';

export default function StationCards({ stations, selectedStationId, onSelectStation }) {
  const getWqiColor = (status, score) => {
    if (score >= 85) return 'text-emerald-400 bg-emerald-950/70 border-emerald-800';
    if (score >= 70) return 'text-sky-400 bg-sky-950/70 border-sky-800';
    if (score >= 50) return 'text-amber-400 bg-amber-950/70 border-amber-800';
    if (score >= 35) return 'text-orange-400 bg-orange-950/70 border-orange-800';
    return 'text-rose-400 bg-rose-950/70 border-rose-800';
  };

  const getWqiBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'excellent':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'good':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'moderate':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'poor':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      default:
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {stations.map((stn) => {
        const isSelected = selectedStationId === stn.id;
        const reading = stn.latest_reading || {};
        const wqi = stn.latest_wqi || 0;
        const wqiStatus = stn.latest_wqi_status || 'Unknown';
        const isPotable = stn.latest_potability === 1;

        return (
          <div
            key={stn.id}
            onClick={() => onSelectStation(stn.id)}
            className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border text-left relative overflow-hidden ${
              isSelected
                ? 'bg-slate-800/95 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/50 scale-[1.02]'
                : 'bg-slate-900/80 hover:bg-slate-800/70 border-slate-800 hover:border-slate-700'
            }`}
          >
            {/* Top row: Station Code & Water Body */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {stn.code}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800/80 text-cyan-300 border border-cyan-900/50">
                {stn.water_body_type}
              </span>
            </div>

            {/* Station Name */}
            <h3 className="font-semibold text-slate-100 text-sm mb-1 truncate" title={stn.name}>
              {stn.name}
            </h3>
            <p className="text-xs text-slate-400 mb-3 truncate" title={stn.location}>
              {stn.location}
            </p>

            {/* WQI Score & Status Bar */}
            <div className={`p-2.5 rounded-xl border mb-3 flex items-center justify-between ${getWqiColor(wqiStatus, wqi)}`}>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">Water Quality Index</div>
                <div className="text-2xl font-black tracking-tight">{wqi.toFixed(1)} <span className="text-xs font-normal opacity-70">/ 100</span></div>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-0.5 rounded-md font-semibold border ${getWqiBadge(wqiStatus)}`}>
                  {wqiStatus}
                </span>
                <div className="mt-1 flex items-center space-x-1 text-[11px]">
                  {isPotable ? (
                    <span className="flex items-center text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3 h-3 mr-0.5" /> Potable
                    </span>
                  ) : (
                    <span className="flex items-center text-rose-400 font-medium">
                      <AlertOctagon className="w-3 h-3 mr-0.5" /> Non-Potable
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Key Telemetry Quick Snapshot */}
            <div className="grid grid-cols-3 gap-1.5 text-xs bg-slate-950/50 p-2 rounded-lg border border-slate-800/80 mb-2">
              <div>
                <span className="text-[10px] text-slate-400 block">pH</span>
                <span className={`font-semibold ${reading.ph < 6.5 || reading.ph > 8.5 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {reading.ph !== undefined ? reading.ph.toFixed(2) : '--'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Turbidity</span>
                <span className={`font-semibold ${reading.turbidity > 5.0 ? 'text-amber-400' : 'text-slate-200'}`}>
                  {reading.turbidity !== undefined ? `${reading.turbidity.toFixed(1)} NTU` : '--'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">DO</span>
                <span className={`font-semibold ${reading.dissolved_oxygen < 5.0 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {reading.dissolved_oxygen !== undefined ? `${reading.dissolved_oxygen.toFixed(1)} mg/L` : '--'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">TDS</span>
                <span className="font-semibold text-slate-200">
                  {reading.tds !== undefined ? `${Math.round(reading.tds)}` : '--'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Temp</span>
                <span className="font-semibold text-slate-200">
                  {reading.temperature !== undefined ? `${reading.temperature.toFixed(1)}°C` : '--'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">EC</span>
                <span className="font-semibold text-slate-200">
                  {reading.conductivity !== undefined ? `${Math.round(reading.conductivity)}` : '--'}
                </span>
              </div>
            </div>

            {/* Bottom Status Flags: Alerts and Anomaly */}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <div className="flex items-center space-x-1">
                {stn.active_alerts_count > 0 ? (
                  <span className="flex items-center text-rose-400 font-medium bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-900/60">
                    <AlertTriangle className="w-3 h-3 mr-1" /> {stn.active_alerts_count} Active Alert{stn.active_alerts_count > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="text-slate-500">No active alerts</span>
                )}
              </div>

              {stn.has_anomaly && (
                <span className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800 text-amber-300 font-semibold text-[10px] flex items-center animate-pulse">
                  <Zap className="w-2.5 h-2.5 mr-0.5 text-amber-400" /> Anomaly
                </span>
              )}
            </div>

            {/* Selection highlight border indicator */}
            {isSelected && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500" />
            )}
          </div>
        );
      })}
    </div>
  );
}
