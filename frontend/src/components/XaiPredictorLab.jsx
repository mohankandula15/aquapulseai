import React, { useState } from 'react';
import {
  BrainCircuit,
  Sliders,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Zap,
  TrendingDown,
  TrendingUp,
  Info,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine
} from 'recharts';
import { predictWaterSample } from '../api/client';

export default function XaiPredictorLab({ modelInfo }) {
  const presets = [
    {
      name: 'Pristine Mountain Spring',
      desc: 'Optimal aeration, low solids, natural mineral balance',
      values: { ph: 7.4, turbidity: 0.8, tds: 140, temperature: 16.0, dissolved_oxygen: 10.2, conductivity: 210 }
    },
    {
      name: 'Municipal Tap Water Standard',
      desc: 'Filtered and treated municipal drinking water',
      values: { ph: 7.2, turbidity: 1.4, tds: 230, temperature: 19.5, dissolved_oxygen: 8.9, conductivity: 360 }
    },
    {
      name: 'Storm Runoff & Soil Erosion',
      desc: 'High sediment, elevated turbidity and mild acidification',
      values: { ph: 6.2, turbidity: 15.2, tds: 610, temperature: 21.0, dissolved_oxygen: 5.1, conductivity: 980 }
    },
    {
      name: 'Acid Mine / Chemical Spill',
      desc: 'Severe pH collapse, high conductivity, severe hypoxia',
      values: { ph: 3.9, turbidity: 22.0, tds: 1480, temperature: 27.0, dissolved_oxygen: 1.8, conductivity: 2600 }
    },
    {
      name: 'Alkaline Industrial Effluent',
      desc: 'Strong basic pH surge, dissolved chemical salts',
      values: { ph: 10.4, turbidity: 8.6, tds: 1150, temperature: 25.0, dissolved_oxygen: 3.4, conductivity: 1950 }
    }
  ];

  const [inputs, setInputs] = useState(presets[1].values);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, val) => {
    setInputs((prev) => ({
      ...prev,
      [field]: parseFloat(val) || 0
    }));
  };

  const handleRunPredict = async () => {
    setLoading(true);
    try {
      const res = await predictWaterSample(inputs);
      setPrediction(res);
    } catch (err) {
      console.error('Failed to run prediction:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run initial prediction on mount
  React.useEffect(() => {
    handleRunPredict();
  }, []);

  const explainabilityData = prediction?.explainability?.attributions?.map((attr) => ({
    ...attr,
    impact: attr.attribution_score * 100, // percentage points
  })) || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/20">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <span>ML Predictive Classifier & Explainable AI (XAI) Lab</span>
              {modelInfo?.model_accuracy && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 font-semibold">
                  RF Acc: {(modelInfo.model_accuracy * 100).toFixed(1)}% | F1: {modelInfo.model_f1.toFixed(3)}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              Interactive sample sandbox evaluating potability, WQI, Isolation Forest anomaly detection, and SHAP-based feature attributions
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 font-medium whitespace-nowrap mr-1">Presets:</span>
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputs(preset.values);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 whitespace-nowrap transition"
              title={preset.desc}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Controls on Left, Inferences and XAI on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Input Parameters Controls (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Water Sample Parameters</span>
            </h3>
            <button
              onClick={handleRunPredict}
              disabled={loading}
              className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 transition disabled:opacity-50"
            >
              {loading ? 'Evaluating...' : 'Run Prediction'}
            </button>
          </div>

          {/* Parameter Sliders */}
          <div className="space-y-3.5 text-xs">
            {/* pH */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-300">pH Level (Acidity / Alkalinity)</span>
                <span className={`font-mono ${inputs.ph < 6.5 || inputs.ph > 8.5 ? 'text-rose-400' : 'text-cyan-400'}`}>
                  {inputs.ph.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="2.0"
                max="12.0"
                step="0.1"
                value={inputs.ph}
                onChange={(e) => handleInputChange('ph', e.target.value)}
                className="w-full accent-cyan-500 bg-slate-800"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>2.0 (Acidic)</span>
                <span className="text-emerald-400">Safe: 6.5 - 8.5</span>
                <span>12.0 (Basic)</span>
              </div>
            </div>

            {/* Turbidity */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-300">Turbidity (Water Clarity)</span>
                <span className={`font-mono ${inputs.turbidity > 5.0 ? 'text-amber-400' : 'text-cyan-400'}`}>
                  {inputs.turbidity.toFixed(1)} NTU
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="30.0"
                step="0.1"
                value={inputs.turbidity}
                onChange={(e) => handleInputChange('turbidity', e.target.value)}
                className="w-full accent-amber-500 bg-slate-800"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0.1 (Pristine)</span>
                <span className="text-emerald-400">Safe Standard: &lt; 5.0 NTU</span>
                <span>30.0 (Opaque/Muddy)</span>
              </div>
            </div>

            {/* Dissolved Oxygen */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-300">Dissolved Oxygen (DO)</span>
                <span className={`font-mono ${inputs.dissolved_oxygen < 5.0 ? 'text-rose-400' : 'text-cyan-400'}`}>
                  {inputs.dissolved_oxygen.toFixed(1)} mg/L
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="14.0"
                step="0.1"
                value={inputs.dissolved_oxygen}
                onChange={(e) => handleInputChange('dissolved_oxygen', e.target.value)}
                className="w-full accent-emerald-500 bg-slate-800"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0.5 (Hypoxic/Septic)</span>
                <span className="text-emerald-400">Safe Standard: &gt; 5.0 mg/L</span>
                <span>14.0 (Super-aerated)</span>
              </div>
            </div>

            {/* Total Dissolved Solids */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-300">Total Dissolved Solids (TDS)</span>
                <span className={`font-mono ${inputs.tds > 500 ? 'text-purple-400' : 'text-cyan-400'}`}>
                  {Math.round(inputs.tds)} mg/L
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="2000"
                step="10"
                value={inputs.tds}
                onChange={(e) => handleInputChange('tds', e.target.value)}
                className="w-full accent-purple-500 bg-slate-800"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>50 mg/L (Pure)</span>
                <span className="text-emerald-400">Safe: &lt; 500 mg/L</span>
                <span>2000 mg/L (Brackish)</span>
              </div>
            </div>

            {/* Temperature */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-300">Water Temperature</span>
                <span className="font-mono text-cyan-400">{inputs.temperature.toFixed(1)} °C</span>
              </div>
              <input
                type="range"
                min="5.0"
                max="40.0"
                step="0.5"
                value={inputs.temperature}
                onChange={(e) => handleInputChange('temperature', e.target.value)}
                className="w-full accent-rose-500 bg-slate-800"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>5.0 °C (Cold)</span>
                <span className="text-slate-400">Nominal: 15 - 25 °C</span>
                <span>40.0 °C (Thermal Outflow)</span>
              </div>
            </div>

            {/* Electrical Conductivity */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-300">Electrical Conductivity (EC)</span>
                <span className="font-mono text-cyan-400">{Math.round(inputs.conductivity)} µS/cm</span>
              </div>
              <input
                type="range"
                min="50"
                max="3500"
                step="25"
                value={inputs.conductivity}
                onChange={(e) => handleInputChange('conductivity', e.target.value)}
                className="w-full accent-cyan-500 bg-slate-800"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>50 µS/cm</span>
                <span className="text-emerald-400">Freshwater Standard: &lt; 800 µS/cm</span>
                <span>3500 µS/cm (Saline)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Prediction Outputs & Explainable AI (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Top Prediction Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Potability Card */}
            <div className={`p-4 rounded-2xl border text-center ${
              prediction?.potability_pred === 1
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-rose-950/60 border-rose-800 text-rose-300'
            }`}>
              <div className="flex items-center justify-center space-x-1.5 mb-1">
                {prediction?.potability_pred === 1 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertOctagon className="w-5 h-5 text-rose-400" />
                )}
                <span className="text-xs uppercase font-bold tracking-wider">Potability</span>
              </div>
              <div className="text-lg font-black">{prediction?.potability_label || 'Evaluating'}</div>
              <div className="text-xs opacity-80 mt-1">
                Confidence: <strong>{((prediction?.potability_prob || 0) * 100).toFixed(1)}%</strong>
              </div>
            </div>

            {/* 2. Water Quality Index Card */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
              <div className="text-xs uppercase font-bold text-slate-400 mb-1">Water Quality Index</div>
              <div className="text-2xl font-black text-cyan-400">
                {prediction?.wqi?.toFixed(1) || '--'} <span className="text-xs text-slate-500 font-normal">/ 100</span>
              </div>
              <div className="text-xs font-semibold text-slate-300 mt-1">
                Grade: <span className="text-cyan-300">{prediction?.wqi_status || '--'}</span>
              </div>
            </div>

            {/* 3. ML Anomaly Card */}
            <div className={`p-4 rounded-2xl border text-center ${
              prediction?.is_anomaly
                ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                : 'bg-slate-900/90 border-slate-800 text-slate-300'
            }`}>
              <div className="flex items-center justify-center space-x-1.5 mb-1">
                <Zap className={`w-4 h-4 ${prediction?.is_anomaly ? 'text-amber-400' : 'text-slate-500'}`} />
                <span className="text-xs uppercase font-bold tracking-wider">Anomaly State</span>
              </div>
              <div className="text-lg font-black">
                {prediction?.is_anomaly ? 'Outlier Detected' : 'Nominal'}
              </div>
              <div className="text-xs opacity-80 mt-1">
                Anomaly Score: <strong>{prediction?.anomaly_intensity || 0}%</strong>
              </div>
            </div>
          </div>

          {/* Explainable AI (XAI) Attribution Waterfall Section */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <BrainCircuit className="w-4 h-4 text-cyan-400" />
                  <span>Explainable AI (XAI) Feature Attribution</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Explains which physical parameters shifted the potability probability away from the healthy baseline (+65%)
                </p>
              </div>
            </div>

            {/* Waterfall Impact Bar Chart */}
            <div className="h-56 bg-slate-950/70 p-3 rounded-xl border border-slate-800 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={explainabilityData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    type="number"
                    stroke="#475569"
                    tick={{ fontSize: 10 }}
                    unit="%"
                    domain={['dataMin - 5', 'dataMax + 5']}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    stroke="#475569"
                    tick={{ fontSize: 10 }}
                    width={110}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                            <p className="font-bold text-slate-200">{d.label}: {d.value} {d.unit}</p>
                            <p className={d.impact >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              Net Potability Impact: {d.impact >= 0 ? `+${d.impact.toFixed(1)}%` : `${d.impact.toFixed(1)}%`}
                            </p>
                            <p className="text-slate-400 text-[11px] max-w-xs">{d.narrative}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine x={0} stroke="#64748b" />
                  <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                    {explainabilityData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.impact >= 0 ? '#10b981' : '#f43f5e'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Parameter Detailed Explainability Breakdown Cards */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Parameter-by-Parameter Risk Attribution
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {explainabilityData.map((attr, idx) => (
                  <div key={idx} className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{attr.label}</span>
                      <span className={`font-mono font-bold ${attr.impact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {attr.impact >= 0 ? `+${attr.impact.toFixed(1)}%` : `${attr.impact.toFixed(1)}%`}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Observed: <strong className="text-slate-300">{attr.value} {attr.unit}</strong></span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                        Rank #{idx + 1}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/60 leading-relaxed">
                      {attr.narrative}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
