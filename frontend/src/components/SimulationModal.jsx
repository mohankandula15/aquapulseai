import React, { useState } from 'react';
import { 
  X, 
  Zap, 
  AlertTriangle, 
  Play, 
  Droplet, 
  CheckCircle2, 
  FlaskConical 
} from 'lucide-react';
import { injectAnomalyEvent } from '../api/client';

export default function SimulationModal({ isOpen, onClose, stations, onInjected }) {
  const [selectedStation, setSelectedStation] = useState(stations[0]?.id || 1);
  const [anomalyType, setAnomalyType] = useState('ACID_SPILL');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const scenarios = [
    {
      type: 'ACID_SPILL',
      title: 'Industrial Acid Discharge Spill',
      desc: 'Severe pH collapse to ~4.2, elevated conductivity, and rapid aquatic toxicity alert.',
      impact: 'Triggers CRITICAL low pH threshold alert and non-potability classification.'
    },
    {
      type: 'TURBIDITY_SPIKE',
      title: 'Upstream Storm Mudslide & Runoff',
      desc: 'Sudden sediment surge up to 25.0 NTU, choking filtration membranes.',
      impact: 'Triggers CRITICAL Turbidity violation and ML Isolation Forest anomaly flag.'
    },
    {
      type: 'CHEMICAL_CONTAMINATION',
      title: 'Heavy Chemical / Electrolyte Dumping',
      desc: 'TDS surges to >1600 mg/L, conductivity exceeds 2600 µS/cm, severe DO crash.',
      impact: 'Multi-parameter vector anomaly triggers emergency boil/halt advisory.'
    },
    {
      type: 'OXYGEN_DEPLETION',
      title: 'Severe Hypoxia / Septic Decomposition',
      desc: 'Dissolved oxygen collapses to < 1.5 mg/L, creating immediate fish kill hazard.',
      impact: 'Triggers CRITICAL Hypoxia warning, prompting mechanical aeration diffusers.'
    },
    {
      type: 'ALKALINE_SURGE',
      title: 'Caustic Alkaline Influx',
      desc: 'pH surges to > 10.5, scaling pipes and disabling free chlorine disinfection.',
      impact: 'Triggers CRITICAL alkaline alert and corrective acid-dosing alert.'
    }
  ];

  const handleInject = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await injectAnomalyEvent(selectedStation, anomalyType);
      setResult(res);
      if (onInjected) onInjected();
    } catch (err) {
      console.error('Failed to inject anomaly:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-400">
              <Zap className="w-5 h-5 fill-rose-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Environmental Anomaly Event Injector
              </h3>
              <p className="text-xs text-slate-400">
                Stress-test the ML early warning engine & real-time threshold alert generator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 text-xs">
          {/* Target Station */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Select Target Monitoring Station:
            </label>
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 font-medium focus:ring-1 focus:ring-rose-500 focus:outline-none"
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code} - {s.water_body_type})
                </option>
              ))}
            </select>
          </div>

          {/* Anomaly Scenarios Selection */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Select Anomaly Scenario:
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {scenarios.map((scen) => (
                <div
                  key={scen.type}
                  onClick={() => setAnomalyType(scen.type)}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    anomalyType === scen.type
                      ? 'bg-rose-950/40 border-rose-600 ring-1 ring-rose-500/50'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-200">{scen.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-rose-300">
                      {scen.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{scen.desc}</p>
                  <p className="text-[10px] text-rose-300/80 mt-1 font-medium">⚡ {scen.impact}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Response Notification if Injected */}
          {result && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-800 text-emerald-300 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Anomaly Injected Successfully!</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                ML Classification: <strong>{result.ml_inference.potability_label}</strong> (WQI: {result.ml_inference.wqi})
              </p>
              <p className="text-amber-400 text-[11px]">
                🚨 Generated {result.alerts_triggered?.length || 0} Alert(s) in Early Warning Center.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs font-semibold"
          >
            Close
          </button>
          <button
            onClick={handleInject}
            disabled={loading}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>{loading ? 'Injecting Telemetry...' : 'Fire Anomaly Event'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
