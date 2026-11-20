import React from 'react';
import { 
  Droplet, 
  Waves, 
  Wind, 
  Layers, 
  Zap, 
  Thermometer, 
  CheckCircle2, 
  AlertTriangle,
  Info
} from 'lucide-react';

export default function FriendlyParameterCards({ reading }) {
  if (!reading) return null;

  const cards = [
    {
      id: 'turbidity',
      name: 'Water Clarity',
      sub: 'Turbidity',
      icon: Waves,
      value: reading.turbidity !== undefined ? reading.turbidity.toFixed(1) : '--',
      unit: 'NTU',
      target: 'Safe: Under 5.0 NTU',
      isSafe: reading.turbidity <= 5.0,
      statusLabel: reading.turbidity <= 2.0 ? 'Crystal Clear' : reading.turbidity <= 5.0 ? 'Acceptable' : 'Cloudy / Muddy',
      meaning: 'High cloudiness hides bacteria and prevents proper chlorination.'
    },
    {
      id: 'ph',
      name: 'Acidity Balance',
      sub: 'pH Level',
      icon: Droplet,
      value: reading.ph !== undefined ? reading.ph.toFixed(2) : '--',
      unit: 'pH',
      target: 'Safe: 6.5 to 8.5',
      isSafe: reading.ph >= 6.5 && reading.ph <= 8.5,
      statusLabel: reading.ph < 6.5 ? 'Too Acidic' : reading.ph > 8.5 ? 'Too Alkaline' : 'Balanced',
      meaning: 'Neutral is 7.0. Acidic water can corrode pipes; alkaline water causes mineral scale.'
    },
    {
      id: 'dissolved_oxygen',
      name: 'Water Freshness',
      sub: 'Dissolved Oxygen',
      icon: Wind,
      value: reading.dissolved_oxygen !== undefined ? reading.dissolved_oxygen.toFixed(1) : '--',
      unit: 'mg/L',
      target: 'Safe: Over 5.0 mg/L',
      isSafe: reading.dissolved_oxygen >= 5.0,
      statusLabel: reading.dissolved_oxygen >= 7.0 ? 'Very Fresh' : reading.dissolved_oxygen >= 5.0 ? 'Healthy' : 'Low Oxygen (Stagnant)',
      meaning: 'Oxygen keeps water fresh and alive. Low oxygen suggests decomposing organic waste.'
    },
    {
      id: 'tds',
      name: 'Dissolved Minerals',
      sub: 'Total Dissolved Solids',
      icon: Layers,
      value: reading.tds !== undefined ? Math.round(reading.tds) : '--',
      unit: 'mg/L',
      target: 'Standard: Under 500 mg/L',
      isSafe: reading.tds <= 500,
      statusLabel: reading.tds <= 300 ? 'Low Minerals' : reading.tds <= 500 ? 'Normal Minerals' : 'High Salt / Hard Water',
      meaning: 'Measures dissolved inorganic salts. Low values give clean, sweet taste.'
    },
    {
      id: 'conductivity',
      name: 'Electric Ions',
      sub: 'Electrical Conductivity',
      icon: Zap,
      value: reading.conductivity !== undefined ? Math.round(reading.conductivity) : '--',
      unit: 'µS/cm',
      target: 'Standard: Under 800 µS/cm',
      isSafe: reading.conductivity <= 800,
      statusLabel: reading.conductivity <= 500 ? 'Normal Charge' : reading.conductivity <= 800 ? 'Moderate' : 'High Industrial Ions',
      meaning: 'Tells how much electric charge is carried by dissolved chemicals and salts.'
    },
    {
      id: 'temperature',
      name: 'Temperature',
      sub: 'Water Warmth',
      icon: Thermometer,
      value: reading.temperature !== undefined ? reading.temperature.toFixed(1) : '--',
      unit: '°C',
      target: 'Nominal: 15° to 25°C',
      isSafe: reading.temperature >= 10 && reading.temperature <= 30,
      statusLabel: reading.temperature <= 22 ? 'Cool & Safe' : reading.temperature <= 28 ? 'Normal' : 'Elevated Heat',
      meaning: 'Warm water holds less dissolved oxygen and can accelerate bacterial growth.'
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
          6 Core Parameters (Current Measurement)
        </h3>
        <span className="text-xs text-slate-400">
          Green badge indicates statutory WHO & EPA safe standard
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.id}
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                c.isSafe
                  ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  : 'bg-rose-950/20 border-rose-800/80 shadow-md shadow-rose-950/10'
              }`}
            >
              {/* Header: Title and Status Badge */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-xl ${
                    c.isSafe ? 'bg-slate-800 text-cyan-400' : 'bg-rose-900/50 text-rose-300'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{c.name}</h4>
                    <span className="text-[11px] text-slate-400 font-mono">({c.sub})</span>
                  </div>
                </div>

                {/* Safe / Warning Badge */}
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border flex items-center space-x-1 ${
                    c.isSafe
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {c.isSafe ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 mr-1" />
                      <span>{c.statusLabel}</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 text-rose-400 mr-1" />
                      <span>{c.statusLabel}</span>
                    </>
                  )}
                </span>
              </div>

              {/* Number reading */}
              <div className="flex items-baseline space-x-2 my-2">
                <span className="text-3xl font-black text-slate-100 font-mono tracking-tight">
                  {c.value}
                </span>
                <span className="text-xs text-slate-400 font-mono font-medium">{c.unit}</span>
              </div>

              {/* Target & Explanation in plain English */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">{c.target}</span>
                <span className="text-[10px] text-slate-500 truncate max-w-[150px]" title={c.meaning}>
                  {c.meaning}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
