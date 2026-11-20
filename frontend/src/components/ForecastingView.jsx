import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Info, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { getForecast } from '../api/client';

export default function ForecastingView({ stations, selectedStationId }) {
  const [stationId, setStationId] = useState(selectedStationId || (stations[0]?.id || 1));
  const [forecastHorizon, setForecastHorizon] = useState(48);
  const [activeParam, setActiveParam] = useState('turbidity');
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedStationId) {
      setStationId(selectedStationId);
    }
  }, [selectedStationId]);

  useEffect(() => {
    fetchForecast();
  }, [stationId, forecastHorizon]);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const data = await getForecast(stationId, forecastHorizon);
      setForecastData(data);
    } catch (err) {
      console.error('Failed to load forecast:', err);
    } finally {
      setLoading(false);
    }
  };

  const paramConfig = {
    turbidity: { name: 'Turbidity', unit: 'NTU', color: '#f59e0b', maxSafe: 5.0 },
    dissolved_oxygen: { name: 'Dissolved Oxygen', unit: 'mg/L', color: '#10b981', minSafe: 5.0 },
    ph: { name: 'pH Level', unit: 'pH', color: '#38bdf8', minSafe: 6.5, maxSafe: 8.5 },
    tds: { name: 'Total Dissolved Solids', unit: 'mg/L', color: '#a855f7', maxSafe: 500 },
    conductivity: { name: 'Electrical Conductivity', unit: 'µS/cm', color: '#06b6d4', maxSafe: 800 },
    temperature: { name: 'Temperature', unit: '°C', color: '#f43f5e', maxSafe: 30 }
  };

  const currentParamPoints = forecastData?.forecasts?.[activeParam] || [];

  const chartData = currentParamPoints.map((pt) => {
    const d = new Date(pt.timestamp);
    return {
      ...pt,
      label: `+${pt.hours_ahead}h (${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      ci_range: pt.upper_bound - pt.lower_bound,
    };
  });

  const selectedStation = stations.find((s) => s.id === Number(stationId));

  return (
    <div className="space-y-6">
      {/* Top Banner / Selection Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                Time-Series Predictive Forecasting & Early Warning
              </h2>
              <p className="text-xs text-slate-400">
                Multi-step autoregressive projection models with confidence intervals & advance breach warnings
              </p>
            </div>
          </div>
        </div>

        {/* Station and Horizon Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={stationId}
            onChange={(e) => setStationId(Number(e.target.value))}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 font-medium focus:ring-1 focus:ring-cyan-500 focus:outline-none"
          >
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>

          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {[12, 24, 48].map((h) => (
              <button
                key={h}
                onClick={() => setForecastHorizon(h)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  forecastHorizon === h
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                +{h}h Horizon
              </button>
            ))}
          </div>

          <button
            onClick={fetchForecast}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Refresh forecast"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Early Warning Proactive Alerts Banner */}
      {forecastData?.has_warnings ? (
        <div className="bg-rose-950/40 border-2 border-rose-600/70 rounded-2xl p-5 shadow-lg shadow-rose-950/30">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded-xl bg-rose-900/60 text-rose-300 border border-rose-700 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-rose-200 uppercase tracking-wide">
                  ⚠️ Early Warning Threshold Breaches Forecasted ({forecastData.early_warning_breaches.length})
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-900/80 text-rose-300 font-semibold border border-rose-700">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-rose-300/90 mt-1">
                The ML time-series model projects parameters will cross statutory safety limits within the forecast window:
              </p>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {forecastData.early_warning_breaches.map((warn, i) => (
                  <div key={i} className="bg-slate-900/90 border border-rose-800/80 p-3 rounded-xl text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-300 text-sm">{warn.parameter_name}</span>
                      <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-400 font-bold">
                        in ~{warn.hours_ahead} hours
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-300">
                      <span>Projected: <strong className="text-rose-400">{warn.predicted_value} {warn.unit}</strong></span>
                      <span className="text-slate-500">|</span>
                      <span>Safe Limit: <strong className="text-slate-400">{warn.threshold_limit} {warn.unit}</strong></span>
                    </div>
                    <p className="text-slate-400 text-[11px] bg-slate-950/60 p-2 rounded border border-slate-800/80">
                      💡 <strong>Recommended Action:</strong> {warn.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-2xl p-4 flex items-center space-x-3 text-xs text-emerald-300">
          <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>
            <strong>All Nominal:</strong> Predictive models indicate all parameters will remain within statutory safety standards over the next <strong>+{forecastHorizon} hours</strong> for {selectedStation?.name}.
          </span>
        </div>
      )}

      {/* Main Forecast Chart Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        {/* Parameter Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="flex flex-wrap gap-2">
            {Object.entries(paramConfig).map(([key, cfg]) => {
              const isBreached = forecastData?.early_warning_breaches?.some((b) => b.parameter === key);
              return (
                <button
                  key={key}
                  onClick={() => setActiveParam(key)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                    activeParam === key
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border-slate-800'
                  }`}
                  style={{
                    borderColor: activeParam === key ? cfg.color : undefined,
                  }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                  <span>{cfg.name}</span>
                  {isBreached && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-4 text-xs text-slate-400">
            <span className="flex items-center">
              <span className="w-3 h-0.5 bg-cyan-400 mr-1.5" /> Predicted Mean
            </span>
            <span className="flex items-center">
              <span className="w-3 h-2 bg-slate-700/60 mr-1.5 rounded-xs" /> 95% Confidence Band
            </span>
            <span className="flex items-center text-rose-400">
              <span className="w-3 h-0.5 border-t border-rose-400 border-dashed mr-1.5" /> Threshold
            </span>
          </div>
        </div>

        {/* Forecast Chart */}
        <div className="h-80 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={paramConfig[activeParam].color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={paramConfig[activeParam].color} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" stroke="#475569" tick={{ fontSize: 10 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
                        <p className="font-bold text-slate-200">Horizon: +{d.hours_ahead} Hours Ahead</p>
                        <p className="text-slate-400">Date: {new Date(d.timestamp).toLocaleString()}</p>
                        <div className="pt-1.5 border-t border-slate-800 space-y-0.5">
                          <p className="text-cyan-400 font-bold">
                            Predicted: {d.predicted} {paramConfig[activeParam].unit}
                          </p>
                          <p className="text-slate-400 text-[11px]">
                            95% CI: [{d.lower_bound} - {d.upper_bound}] {paramConfig[activeParam].unit}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {paramConfig[activeParam].maxSafe && (
                <ReferenceLine
                  y={paramConfig[activeParam].maxSafe}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: `Max Safe: ${paramConfig[activeParam].maxSafe} ${paramConfig[activeParam].unit}`, fill: '#ef4444', fontSize: 10 }}
                />
              )}

              {paramConfig[activeParam].minSafe && (
                <ReferenceLine
                  y={paramConfig[activeParam].minSafe}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: `Min Safe: ${paramConfig[activeParam].minSafe} ${paramConfig[activeParam].unit}`, fill: '#ef4444', fontSize: 10 }}
                />
              )}

              {/* Confidence Interval Upper bound */}
              <Area
                type="monotone"
                dataKey="upper_bound"
                stroke="none"
                fill="url(#ciGrad)"
              />
              <Area
                type="monotone"
                dataKey="lower_bound"
                stroke="none"
                fill="#0b1329"
              />

              {/* Main Predicted Trajectory Line */}
              <Line
                type="monotone"
                dataKey="predicted"
                stroke={paramConfig[activeParam].color}
                strokeWidth={2.5}
                dot={{ r: 3, fill: paramConfig[activeParam].color }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Multi-Horizon Future Parameter Matrix Table */}
        <div className="mt-6">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
            Multi-Horizon Projections Summary for {selectedStation?.name}
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2.5">Parameter</th>
                  <th className="px-3 py-2.5">Standard Limit</th>
                  <th className="px-3 py-2.5">+6 Hours</th>
                  <th className="px-3 py-2.5">+12 Hours</th>
                  <th className="px-3 py-2.5">+24 Hours</th>
                  <th className="px-3 py-2.5">+48 Hours</th>
                  <th className="px-3 py-2.5">Trajectory Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {Object.entries(paramConfig).map(([key, cfg]) => {
                  const series = forecastData?.forecasts?.[key] || [];
                  const p6 = series.find((p) => p.hours_ahead === 6)?.predicted;
                  const p12 = series.find((p) => p.hours_ahead === 12)?.predicted;
                  const p24 = series.find((p) => p.hours_ahead === 24)?.predicted;
                  const p48 = series.find((p) => p.hours_ahead === 48)?.predicted;
                  const breach = forecastData?.early_warning_breaches?.find((b) => b.parameter === key);

                  return (
                    <tr key={key} className="hover:bg-slate-800/40">
                      <td className="px-3 py-2.5 font-medium text-slate-100 flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                        <span>{cfg.name}</span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-400">
                        {cfg.minSafe && cfg.maxSafe ? `${cfg.minSafe} - ${cfg.maxSafe}` : cfg.maxSafe ? `< ${cfg.maxSafe}` : `> ${cfg.minSafe}`} {cfg.unit}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-medium">{p6 ?? '--'}</td>
                      <td className="px-3 py-2.5 font-mono font-medium">{p12 ?? '--'}</td>
                      <td className="px-3 py-2.5 font-mono font-medium">{p24 ?? '--'}</td>
                      <td className="px-3 py-2.5 font-mono font-medium">{p48 ?? '--'}</td>
                      <td className="px-3 py-2.5">
                        {breach ? (
                          <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 font-semibold">
                            ⚠️ Breach in {breach.hours_ahead}h
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                            ✓ Stable
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
