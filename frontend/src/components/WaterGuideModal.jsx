import React from 'react';
import { X, BookOpen, CheckCircle2, AlertTriangle, Droplets, Info } from 'lucide-react';

export default function WaterGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const parameters = [
    {
      name: 'Water Quality Index (WQI)',
      range: '0 to 100',
      simpleMeaning: 'The overall health report card of the water. Higher score = cleaner water.',
      levels: [
        { label: '85 - 100: Pristine / Excellent', color: 'text-emerald-400' },
        { label: '70 - 84: Good (Safe to Drink)', color: 'text-sky-400' },
        { label: '50 - 69: Moderate (Filter Before Drinking)', color: 'text-amber-400' },
        { label: 'Under 50: Poor / Hazardous (Do Not Drink)', color: 'text-rose-400' }
      ]
    },
    {
      name: 'pH Level (Acidity Balance)',
      range: 'Safe: 6.5 to 8.5',
      simpleMeaning: 'Tells if water is acidic (sour/corrosive) or alkaline (bitter/scaling). Pure water is 7.0.',
      levels: [
        { label: 'Below 6.5: Acidic (Can corrode pipes and leach metals)', color: 'text-rose-400' },
        { label: '6.5 to 8.5: Ideal Healthy Drinking Water', color: 'text-emerald-400' },
        { label: 'Above 8.5: Alkaline (Can cause pipe scale and soapy taste)', color: 'text-rose-400' }
      ]
    },
    {
      name: 'Turbidity (Water Clarity)',
      range: 'Safe: Under 5.0 NTU',
      simpleMeaning: 'Measures how clear or cloudy water looks due to mud, clay, or algae.',
      levels: [
        { label: '0 to 2 NTU: Crystal Clear & Transparent', color: 'text-emerald-400' },
        { label: '2 to 5 NTU: Acceptable Clarity', color: 'text-sky-400' },
        { label: 'Above 5 NTU: Cloudy / Muddy (Hides bacteria, filtration required)', color: 'text-amber-400' }
      ]
    },
    {
      name: 'Dissolved Oxygen (DO)',
      range: 'Healthy: Above 5.0 mg/L',
      simpleMeaning: 'The oxygen dissolved in water. Water needs oxygen to stay fresh and support aquatic life.',
      levels: [
        { label: 'Above 7.0 mg/L: Well-Aerated & Fresh', color: 'text-emerald-400' },
        { label: '5.0 to 7.0 mg/L: Normal Safe Level', color: 'text-sky-400' },
        { label: 'Below 4.0 mg/L: Stagnant / Septic (Fish cannot breathe, bacterial risk)', color: 'text-rose-400' }
      ]
    },
    {
      name: 'Total Dissolved Solids (TDS)',
      range: 'Standard: Under 500 mg/L',
      simpleMeaning: 'Total dissolved minerals (calcium, magnesium, salts). Low is sweet and light.',
      levels: [
        { label: '50 to 300 mg/L: Sweet & Great Tasting', color: 'text-emerald-400' },
        { label: '300 to 500 mg/L: Normal Mineral Water', color: 'text-sky-400' },
        { label: 'Above 500 mg/L: Salty, hard water (needs reverse osmosis)', color: 'text-amber-400' }
      ]
    },
    {
      name: 'Electrical Conductivity (EC)',
      range: 'Standard: Under 800 µS/cm',
      simpleMeaning: 'Ability to conduct electricity due to dissolved salts and industrial ions.',
      levels: [
        { label: 'Under 500 µS/cm: Fresh Clean Water', color: 'text-emerald-400' },
        { label: 'Above 800 µS/cm: Elevated chemical or saline pollution', color: 'text-rose-400' }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Water Quality 101: Simple Guide
              </h3>
              <p className="text-xs text-slate-400">
                Understanding what water parameters mean for health in everyday words
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

        {/* Content list */}
        <div className="overflow-y-auto py-4 space-y-4 pr-1 text-xs">
          {parameters.map((p, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 text-sm">{p.name}</span>
                <span className="font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-900 text-[11px]">
                  {p.range}
                </span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                💡 <span className="font-semibold text-slate-200">What it means:</span> {p.simpleMeaning}
              </p>
              <div className="pt-1.5 border-t border-slate-800/80 space-y-1">
                {p.levels.map((lvl, lIdx) => (
                  <div key={lIdx} className="flex items-center space-x-2 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    <span className={lvl.color}>{lvl.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md transition"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
