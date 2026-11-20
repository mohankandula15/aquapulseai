import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  HelpCircle, 
  Flame, 
  Filter, 
  Droplet, 
  FileWarning, 
  Activity, 
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function WaterSafetyView({ currentAnalysis }) {
  const [activeCategory, setActiveCategory] = useState('all'); // 'all', 'safe', 'attention', 'unsafe'
  const [expandedParam, setExpandedParam] = useState('nitrate');

  const categories = [
    {
      id: 'safe',
      badge: 'Category A',
      title: 'Safe or Within Reference Limits',
      subtitle: 'When all tested parameters comply with acceptable standards.',
      color: 'border-emerald-200 bg-emerald-50/50 text-emerald-900',
      badgeColor: 'bg-emerald-600 text-white',
      icon: CheckCircle2,
      points: [
        'Parameters tested comply with established guidelines (e.g. BIS IS 10500:2012 or WHO).',
        'Maintain routine testing: recommended twice a year for borewells and municipal tap lines (pre-monsoon and post-monsoon).',
        'Clean overhead and ground water storage tanks every 6 months to prevent biofilm buildup.',
        'Replace sediment filters and carbon cartridges according to manufacturer life cycles.'
      ],
      caveat: 'CRITICAL LIMITATION: Compliance of chemical parameters does NOT guarantee potability if microbiological tests (E. coli, fecal coliform) or toxic heavy metal assays were omitted from your report.'
    },
    {
      id: 'attention',
      badge: 'Category B',
      title: 'Needs Attention',
      subtitle: 'When one or more parameters exceed desirable or aesthetic thresholds.',
      color: 'border-amber-200 bg-amber-50/50 text-amber-900',
      badgeColor: 'bg-amber-600 text-white',
      icon: AlertTriangle,
      points: [
        'Clearly identify the affected parameters (e.g., elevated TDS, mild hardness, or slight pH drift).',
        'Schedule targeted follow-up testing at an accredited (NABL/EPA) water testing laboratory.',
        'Consult a certified water treatment specialist or environmental engineer before installing expensive filtration.',
        'Inspect plumbing pipes, storage cisterns, and water filtration cartridges for saturation or clogging.'
      ],
      caveat: 'While not an acute chemical emergency, continued consumption of water with elevated dissolved minerals or acidic pH can cause gastrointestinal irritation or pipe corrosion over time.'
    },
    {
      id: 'unsafe',
      badge: 'Category C',
      title: 'Potentially Unsafe',
      subtitle: 'When critical health-significant parameters or pathogens exceed safety limits.',
      color: 'border-rose-300 bg-rose-50/70 text-rose-950',
      badgeColor: 'bg-rose-600 text-white',
      icon: AlertOctagon,
      points: [
        'DO NOT CONSUME THIS WATER for drinking, formula preparation, cooking, or tooth brushing.',
        'Switch immediately to a certified, verified alternative water source (such as certified packaged drinking water or verified municipal tanker).',
        'Notify all household members, building residents, or facility staff of the water hazard.',
        'Contact your local municipal water board, public health officer, or certified water testing agency.',
        'Isolate the supply line to prevent accidental ingestion by vulnerable individuals.'
      ],
      caveat: 'URGENT CAUTION: NEVER rely on visual clarity alone. Clear water can contain lethal bacteria, dissolved nitrates, or heavy metals. Immediate professional remediation is essential.'
    }
  ];

  const parameterGuidance = [
    {
      id: 'turbidity',
      name: 'High Turbidity (Cloudiness)',
      hazard: 'Suspended particles shield pathogens from chlorine/UV disinfection.',
      actions: [
        'Install mechanical sediment filtration (e.g., 5-micron spun polypropylene filter).',
        'Conduct immediate microbiological testing; sediment often carries biological contamination.',
        'Inspect borewell casings or municipal main pipes for silt infiltration or structural collapse.',
        'Reminder: Clear appearance does not mean water is pathogen-free.'
      ]
    },
    {
      id: 'ph',
      name: 'Abnormal pH (<6.5 Acidic or >8.5 Alkaline)',
      hazard: 'Acidic water corrodes copper/lead pipes; alkaline water causes scaling and decreases chlorine disinfection.',
      actions: [
        'Investigate the source of pH imbalance (acid rain, mineral depletion, or alkaline groundwater).',
        'Consult a licensed water treatment technician for proper neutralizing media (calcite/corosex).',
        'Avoid self-administered chemical injection without professional engineering calculation.'
      ]
    },
    {
      id: 'tds',
      name: 'High Total Dissolved Solids (TDS > 500 - 2000 mg/L)',
      hazard: 'Elevated dissolved inorganic minerals, salts, and heavy metal ions.',
      actions: [
        'Perform a comprehensive mineral breakdown to distinguish harmless calcium/magnesium from toxic salts.',
        'Choose treatment based on exact mineral composition (e.g., Reverse Osmosis for high salts, Water Softener for scale).',
        'CRITICAL BOILING WARNING: Boiling does NOT remove TDS or salts. Boiling evaporates pure water, increasing the concentration of dissolved minerals.'
      ]
    },
    {
      id: 'nitrate',
      name: 'High Nitrate (NO3 > 45 mg/L)',
      hazard: 'Severe toxicity to infants under 6 months (Methemoglobinemia / "Blue Baby Syndrome") and pregnant women.',
      actions: [
        'CRITICAL: Immediately discontinue use for infant feeding and pregnant individuals.',
        'Switch to a verified alternative bottled or certified safe drinking supply.',
        'NEVER BOIL NITRATE WATER: Boiling does not destroy nitrates; it concentrates them by evaporating water.',
        'Effective removal methods require certified Reverse Osmosis (RO) or specific anion-exchange resin filters.'
      ]
    },
    {
      id: 'microbial',
      name: 'Microbiological Contamination (E. coli / Total Coliform)',
      hazard: 'Indicates recent sewage or animal fecal intrusion with risk of waterborne pathogens (cholera, typhoid, hepatitis).',
      actions: [
        'STOP DRINKING IMMEDIATELY. Use certified bottled water for all consumption and oral hygiene.',
        'Boiling water at a rolling boil for 1 to 3 minutes is effective ONLY for biological pathogens (bacteria/viruses/cysts), provided chemical levels are safe.',
        'Arrange shock chlorination of wells and tanks followed by sterile retesting before restoring use.',
        'Contact local public health authorities if municipal pipelines are suspected of sewage cross-connection.'
      ]
    },
    {
      id: 'dissolved_oxygen',
      name: 'Low Dissolved Oxygen (DO < 5.0 mg/L)',
      hazard: 'Indicates stagnation, anaerobic decomposition, or organic pollution in water bodies or storage tanks.',
      actions: [
        'Inspect storage cisterns for stagnant water, sludge accumulation, or dead biological matter.',
        'Implement aeration and clean storage reservoirs thoroughly.',
        'Ensure continuous circulation in cooling systems or aquaculture reservoirs.'
      ]
    }
  ];

  const filteredCategories = activeCategory === 'all' 
    ? categories 
    : categories.filter(c => c.id === activeCategory);

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-4 animate-in fade-in duration-300">
      
      {/* Title & Introduction */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
          <span>Accredited Safety Standards & Protocols</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Water Safety & What You Should Do
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Comprehensive, evidence-based precautionary measures based on actual water quality measurements. Benchmarked against <strong>BIS IS 10500:2012</strong> and <strong>WHO Drinking-water Guidelines</strong>.
        </p>
      </div>

      {/* Critical Boiling Myth Callout Banner */}
      <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/20">
          <Flame className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-bold text-amber-900">
            Important Safety Principle: Boiling Does Not Fix All Contamination
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Boiling destroys biological pathogens (such as bacteria and cysts), but <strong>does NOT remove dissolved chemicals, nitrates, salts, or heavy metals</strong>. In fact, prolonged boiling evaporates clean water and <strong>concentrates chemical contaminants</strong>. Always treat water based on the specific type of contamination.
          </p>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeCategory === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All 3 Safety Categories
        </button>
        <button
          onClick={() => setActiveCategory('safe')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeCategory === 'safe'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
          }`}
        >
          Category A: Safe or Within Limits
        </button>
        <button
          onClick={() => setActiveCategory('attention')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeCategory === 'attention'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
          }`}
        >
          Category B: Needs Attention
        </button>
        <button
          onClick={() => setActiveCategory('unsafe')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeCategory === 'unsafe'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
          }`}
        >
          Category C: Potentially Unsafe
        </button>
      </div>

      {/* Three Safety Categories Grid */}
      <div className="space-y-6">
        {filteredCategories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div 
              key={cat.id} 
              className={`p-6 sm:p-7 rounded-3xl border shadow-sm space-y-4 ${cat.color}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${cat.badgeColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${cat.badgeColor}`}>
                      {cat.badge}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">{cat.title}</h2>
                  </div>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {cat.subtitle}
                </div>
              </div>

              {/* Action List */}
              <div className="bg-white/90 rounded-2xl p-4 border border-slate-200/60 space-y-2">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Recommended Protocols:
                </div>
                <ul className="text-xs text-slate-700 space-y-1.5 pl-5 list-disc leading-relaxed">
                  {cat.points.map((pt, pidx) => (
                    <li key={pidx}>{pt}</li>
                  ))}
                </ul>
              </div>

              {/* Caveat Box */}
              <div className="text-xs font-medium p-3 rounded-xl bg-white/80 border border-slate-200/80 leading-relaxed">
                {cat.caveat}
              </div>
            </div>
          );
        })}
      </div>

      {/* Parameter-Specific Safety Guidance Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Parameter-Specific Safety Guidance</h2>
          <p className="text-xs text-slate-500 mt-1">
            Precise remedial actions for individual contaminants identified in laboratory tests.
          </p>
        </div>

        <div className="space-y-3">
          {parameterGuidance.map((param) => {
            const isExpanded = expandedParam === param.id;
            return (
              <div 
                key={param.id}
                className="border border-slate-200 rounded-2xl overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setExpandedParam(isExpanded ? null : param.id)}
                  className="w-full p-4 text-left bg-slate-50/70 hover:bg-slate-100/70 flex items-center justify-between transition"
                >
                  <div className="space-y-0.5">
                    <div className="text-sm font-bold text-slate-900">{param.name}</div>
                    <div className="text-xs text-slate-500">{param.hazard}</div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>

                {isExpanded && (
                  <div className="p-4 bg-white border-t border-slate-200 space-y-2 animate-in fade-in duration-150">
                    <div className="text-xs font-bold text-slate-800">Corrective Measures & Precautions:</div>
                    <ul className="text-xs text-slate-700 space-y-1.5 pl-5 list-disc leading-relaxed">
                      {param.actions.map((act, idx) => (
                        <li key={idx}>{act}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Statutory Regulatory Disclaimer */}
      <div className="p-5 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-500 leading-relaxed">
        <strong>Statutory Regulatory Notice:</strong> AquaPulse AI is an artificial intelligence-powered analytical assistant designed to help interpret water testing documentation. It benchmarks values against BIS IS 10500:2012 and WHO guidelines. This software does not substitute for certified chemical and microbiological laboratory assays conducted by an accredited facility (e.g. NABL / EPA), nor does it override local public health directives.
      </div>

    </div>
  );
}
