import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  Droplet, 
  AlertTriangle, 
  CheckCircle2, 
  AlertOctagon, 
  Radio, 
  Activity, 
  Layers,
  ExternalLink
} from 'lucide-react';

export default function StationMap({ stations, selectedStationId, onSelectStation }) {
  const [activeStation, setActiveStation] = useState(
    stations.find((s) => s.id === selectedStationId) || stations[0]
  );

  const getStatusColor = (station) => {
    if (station.active_alerts_count > 0 || station.latest_potability === 0) return '#ef4444'; // Red
    if (station.has_anomaly) return '#f59e0b'; // Amber
    if (station.latest_wqi >= 80) return '#10b981'; // Green
    return '#06b6d4'; // Cyan
  };

  // Convert lat/long to normalized % coordinates for visual map container
  // Latitudes range ~ 37.5 to 37.9, Longitudes range ~ -122.5 to -122.25
  const getCoordinatesPct = (lat, lon) => {
    const minLat = 37.50, maxLat = 37.90;
    const minLon = -122.50, maxLon = -122.25;

    // Invert lat for Y axis (higher lat = higher up on map = lower Y %)
    const yPct = 100 - ((lat - minLat) / (maxLat - minLat)) * 80 - 10;
    const xPct = ((lon - minLon) / (maxLon - minLon)) * 80 + 10;

    return {
      top: `${Math.max(10, Math.min(90, yPct))}%`,
      left: `${Math.max(10, Math.min(90, xPct))}%`,
    };
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              Station-Wise Geospatial Surveillance & Network Map
            </h2>
            <p className="text-xs text-slate-400">
              Distributed water intake reservoirs, river check dams, and municipal effluent checkpoints
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>Nominal</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>Anomaly</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
            <span>Critical / Alert</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map on Left (8 cols), Selected Station Detail on Right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Map View Canvas (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Hydrological Basin Network Matrix</span>
            </span>
            <span className="text-xs font-mono text-slate-500">Regional Watershed Surveillance Grid</span>
          </div>

          {/* Interactive Simulated Map Canvas */}
          <div className="h-96 w-full bg-slate-950 rounded-xl border border-slate-800/80 relative overflow-hidden flex items-center justify-center">
            {/* Topographic / Grid Styling */}
            <div 
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            />

            {/* Stylized River Basin Vector */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25">
              <path
                d="M 50 180 Q 220 120 380 200 T 700 160"
                fill="none"
                stroke="#0284c7"
                strokeWidth="14"
                strokeLinecap="round"
              />
              <path
                d="M 220 120 Q 300 280 480 320"
                fill="none"
                stroke="#0369a1"
                strokeWidth="8"
                strokeLinecap="round"
              />
            </svg>

            {/* Station Ping Markers */}
            {stations.map((stn) => {
              const coords = getCoordinatesPct(stn.latitude, stn.longitude);
              const color = getStatusColor(stn);
              const isSelected = activeStation?.id === stn.id;

              return (
                <div
                  key={stn.id}
                  style={{ top: coords.top, left: coords.left }}
                  onClick={() => setActiveStation(stn)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
                >
                  {/* Ping Animation if Critical */}
                  {(stn.active_alerts_count > 0 || stn.has_anomaly) && (
                    <span 
                      className="absolute -inset-2 rounded-full animate-ping opacity-75"
                      style={{ backgroundColor: color }}
                    />
                  )}

                  {/* Marker Circle */}
                  <div 
                    className={`w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-transform ${
                      isSelected ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'group-hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    <Radio className="w-3.5 h-3.5 text-white" />
                  </div>

                  {/* Pin Tooltip Label */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-8 whitespace-nowrap bg-slate-900/90 text-white text-[11px] font-semibold px-2 py-0.5 rounded-md border border-slate-700 shadow-md pointer-events-none transition group-hover:scale-105">
                    {stn.name}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Coordinates referenced to Regional Hydrology Model</span>
            <span>Click any station pin to view live telemetry diagnostics</span>
          </div>
        </div>

        {/* Selected Station Card Details (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          {activeStation ? (
            <>
              <div className="pb-3 border-b border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {activeStation.code}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                    {activeStation.water_body_type}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-100">{activeStation.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{activeStation.location}</p>
              </div>

              {/* Status Score */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Water Quality Index</span>
                  <span className="text-2xl font-black text-cyan-400">
                    {activeStation.latest_wqi ? activeStation.latest_wqi.toFixed(1) : '--'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 font-semibold border border-slate-700 block mb-1">
                    {activeStation.latest_wqi_status || 'Nominal'}
                  </span>
                  {activeStation.latest_potability === 1 ? (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center justify-end">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Potable
                    </span>
                  ) : (
                    <span className="text-xs text-rose-400 font-semibold flex items-center justify-end">
                      <AlertOctagon className="w-3.5 h-3.5 mr-1" /> Non-Potable
                    </span>
                  )}
                </div>
              </div>

              {/* Station Telemetry Readings */}
              {activeStation.latest_reading && (
                <div className="space-y-2 text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block">Live Parameter Sensors</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">pH Level</span>
                      <span className="font-semibold text-slate-200 font-mono text-sm">
                        {activeStation.latest_reading.ph?.toFixed(2)}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Turbidity</span>
                      <span className="font-semibold text-slate-200 font-mono text-sm">
                        {activeStation.latest_reading.turbidity?.toFixed(1)} NTU
                      </span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Dissolved Oxygen</span>
                      <span className="font-semibold text-slate-200 font-mono text-sm">
                        {activeStation.latest_reading.dissolved_oxygen?.toFixed(1)} mg/L
                      </span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">TDS</span>
                      <span className="font-semibold text-slate-200 font-mono text-sm">
                        {Math.round(activeStation.latest_reading.tds)} mg/L
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="font-semibold text-slate-300 block mb-0.5">Facility Overview:</span>
                {activeStation.description || 'Continuous monitoring facility logging multi-spectral telemetry.'}
              </div>

              {/* View Full Telemetry Action Button */}
              <button
                onClick={() => onSelectStation(activeStation.id)}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 transition"
              >
                <span>Inspect Time-Series Telemetry</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Select a station on the map to inspect details.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
