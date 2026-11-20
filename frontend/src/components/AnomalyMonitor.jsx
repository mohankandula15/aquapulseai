import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Zap, 
  Activity, 
  Filter, 
  Clock, 
  TrendingDown, 
  RefreshCw,
  Search,
  ChevronRight
} from 'lucide-react';
import { getAnomalies, getAnomalySummary } from '../api/client';

export default function AnomalyMonitor({ stations, onSelectStationForDetail }) {
  const [anomalies, setAnomalies] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedStation, setSelectedStation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedStation]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [anomData, sumData] = await Promise.all([
        getAnomalies(selectedStation || null),
        getAnomalySummary(),
      ]);
      setAnomalies(anomData);
      setSummary(sumData);
    } catch (err) {
      console.error('Failed to load anomalies:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Total Anomalies */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-slate-400">Total Anomalies</span>
            <div className="p-2 rounded-xl bg-amber-950/70 border border-amber-800 text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-100 mt-2">
            {summary?.total_anomalies ?? '--'}
          </div>
          <p className="text-xs text-slate-400 mt-1">Identified across all monitoring stations</p>
        </div>

        {/* Card 2: Anomaly Rate */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-slate-400">Anomaly Rate</span>
            <div className="p-2 rounded-xl bg-cyan-950/70 border border-cyan-800 text-cyan-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-cyan-400 mt-2">
            {summary?.anomaly_rate_percentage ?? '--'}%
          </div>
          <p className="text-xs text-slate-400 mt-1">Of total ingested telemetry readings</p>
        </div>

        {/* Card 3: Total Monitored Readings */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-slate-400">Total Telemetry Points</span>
            <div className="p-2 rounded-xl bg-blue-950/70 border border-blue-800 text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-100 mt-2">
            {summary?.total_readings ?? '--'}
          </div>
          <p className="text-xs text-slate-400 mt-1">Logged in time-series database</p>
        </div>

        {/* Card 4: Algorithm Info */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-slate-400">Detection Engine</span>
            <div className="p-2 rounded-xl bg-purple-950/70 border border-purple-800 text-purple-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-purple-300 mt-2">Isolation Forest</div>
          <p className="text-xs text-slate-400 mt-1">Multi-dimensional distance scoring</p>
        </div>
      </div>

      {/* Filter and Anomalies Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Detected Environmental & Sensor Anomalies</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Unusual multi-parameter vectors flagged by the unsupervised Isolation Forest model
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 font-medium focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            >
              <option value="">All Stations</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Refresh anomalies"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Anomalies Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-3.5 py-3">Timestamp</th>
                <th className="px-3.5 py-3">Station</th>
                <th className="px-3.5 py-3">Anomaly Score</th>
                <th className="px-3.5 py-3">pH</th>
                <th className="px-3.5 py-3">Turbidity</th>
                <th className="px-3.5 py-3">DO</th>
                <th className="px-3.5 py-3">TDS</th>
                <th className="px-3.5 py-3">WQI</th>
                <th className="px-3.5 py-3">Classification</th>
                <th className="px-3.5 py-3">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
              {anomalies.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-4 py-8 text-center text-slate-500">
                    No anomalies found for the selected filter.
                  </td>
                </tr>
              ) : (
                anomalies.map((anom) => {
                  const dateStr = new Date(anom.timestamp).toLocaleString();
                  return (
                    <tr key={anom.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-3.5 py-3 font-mono text-slate-400 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="px-3.5 py-3 font-medium text-slate-200">
                        {anom.station_name}
                      </td>
                      <td className="px-3.5 py-3">
                        <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300 font-mono font-bold">
                          {anom.anomaly_score?.toFixed(3)}
                        </span>
                      </td>
                      <td className={`px-3.5 py-3 font-mono font-semibold ${anom.ph < 6.5 || anom.ph > 8.5 ? 'text-rose-400' : 'text-slate-300'}`}>
                        {anom.ph?.toFixed(2)}
                      </td>
                      <td className={`px-3.5 py-3 font-mono font-semibold ${anom.turbidity > 5.0 ? 'text-amber-400' : 'text-slate-300'}`}>
                        {anom.turbidity?.toFixed(1)} NTU
                      </td>
                      <td className={`px-3.5 py-3 font-mono font-semibold ${anom.dissolved_oxygen < 5.0 ? 'text-rose-400' : 'text-slate-300'}`}>
                        {anom.dissolved_oxygen?.toFixed(1)} mg/L
                      </td>
                      <td className="px-3.5 py-3 font-mono text-slate-300">
                        {Math.round(anom.tds)} mg/L
                      </td>
                      <td className="px-3.5 py-3 font-mono font-bold text-cyan-400">
                        {anom.wqi?.toFixed(1)}
                      </td>
                      <td className="px-3.5 py-3">
                        {anom.potability_pred === 1 ? (
                          <span className="text-emerald-400 font-medium">Potable</span>
                        ) : (
                          <span className="text-rose-400 font-semibold px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-800">
                            Non-Potable
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 text-slate-500 font-mono text-[11px]">
                        {anom.source}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
