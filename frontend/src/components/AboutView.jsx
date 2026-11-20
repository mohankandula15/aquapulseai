import React from 'react';
import { 
  Droplets, 
  ShieldCheck, 
  FileCheck2, 
  BrainCircuit, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export default function AboutView() {
  return (
    <div className="max-w-5xl mx-auto space-y-10 py-4 animate-in fade-in duration-300">
      
      {/* Hero */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-sky-500/20">
          <Droplets className="w-7 h-7" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          About AquaPulse AI
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          Smart Water Quality Analysis & Safety Assistant. Transforming laboratory test sheets into immediate, human-understandable safety insights and automated decision support.
        </p>
      </div>

      {/* Core Mission & Standards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Standards Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-3 text-sky-700 font-bold text-base">
            <ShieldCheck className="w-5 h-5 text-sky-600" />
            <h2>Accredited Reference Standards</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            AquaPulse AI checks every extracted measurement against recognized global and national regulatory benchmarks:
          </p>
          <ul className="text-xs text-slate-700 space-y-2 pl-4 list-disc">
            <li>
              <strong>Bureau of Indian Standards (BIS IS 10500:2012):</strong> Drinking water specification detailing desirable limits and permissible limits in the absence of an alternative source.
            </li>
            <li>
              <strong>WHO Guidelines for Drinking-water Quality (4th Edition):</strong> Global international health guidelines for microbial, chemical, radiological, and aesthetic aspects.
            </li>
            <li>
              <strong>Central Pollution Control Board (CPCB):</strong> Designated Best Use water quality criteria (Class A through E).
            </li>
            <li>
              <strong>FAO Irrigation Water Standards:</strong> Agricultural salinity, sodicity, and crop toxicity criteria.
            </li>
          </ul>
        </div>

        {/* AI & Methodology Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-3 text-sky-700 font-bold text-base">
            <BrainCircuit className="w-5 h-5 text-sky-600" />
            <h2>AI & Analytical Methodology</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Our multi-stage pipeline integrates data analytics with predictive modeling:
          </p>
          <ul className="text-xs text-slate-700 space-y-2 pl-4 list-disc">
            <li>
              <strong>Document Parser:</strong> Robust extraction engine supporting native PDF text parsing, optical character recognition fallback, and regex entity resolution.
            </li>
            <li>
              <strong>Weighted Arithmetic WQI:</strong> Standard Brown et al. Water Quality Index formulation calculating aggregate environmental health scores from 0 to 100.
            </li>
            <li>
              <strong>Random Forest Potability Classifier:</strong> Supervised ensemble model trained on 3,276 validated laboratory records to classify complex multi-parameter interactions.
            </li>
            <li>
              <strong>Isolation Forest Anomaly Detection:</strong> Unsupervised outlier detector identifying irregular sensor telemetry and hidden contamination signatures.
            </li>
          </ul>
        </div>

      </div>

      {/* Crucial Potability Distinction Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-amber-50/70 border border-amber-200 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-amber-900 font-bold text-base">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h2>Why Machine Learning Predictions Are Not Potability Guarantees</h2>
        </div>
        <p className="text-xs text-amber-900 leading-relaxed">
          AquaPulse AI strictly adheres to domain principles: <strong>Never declare water safe to drink solely on an ML prediction</strong>. Machine learning models assess non-linear correlation among tested chemical parameters. However, true drinking water potability depends equally on the confirmed absence of microscopic biological pathogens (such as <em>E. coli</em> and fecal coliforms) and trace heavy metals. If a report omits these tests, water cannot be guaranteed safe even if chemical scores are optimal.
        </p>
      </div>

      {/* Benchmark Summary Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Key Drinking Water Benchmark Limits</h2>
          <p className="text-xs text-slate-500">Summary of BIS IS 10500:2012 parameters used in automated report verification.</p>
        </div>

        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Parameter</th>
                <th className="py-2.5 px-4">Desirable Limit (Acceptable)</th>
                <th className="py-2.5 px-4">Permissible Limit (No Alternate)</th>
                <th className="py-2.5 px-4">Key Health / Aesthetic Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              <tr>
                <td className="py-2.5 px-4 font-bold">pH Value</td>
                <td className="py-2.5 px-4">6.5 – 8.5</td>
                <td className="py-2.5 px-4">6.5 – 8.5</td>
                <td className="py-2.5 px-4 text-slate-500">Pipe corrosion (&lt;6.5) or bitter taste / scaling (&gt;8.5)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold">Turbidity</td>
                <td className="py-2.5 px-4">1.0 NTU</td>
                <td className="py-2.5 px-4">5.0 NTU</td>
                <td className="py-2.5 px-4 text-slate-500">Shields pathogens from disinfection</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold">Total Dissolved Solids (TDS)</td>
                <td className="py-2.5 px-4">500 mg/L</td>
                <td className="py-2.5 px-4">2000 mg/L</td>
                <td className="py-2.5 px-4 text-slate-500">Palatability loss, scaling, gastrointestinal irritation</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold">Nitrate (as NO3)</td>
                <td className="py-2.5 px-4">45 mg/L</td>
                <td className="py-2.5 px-4">45 mg/L</td>
                <td className="py-2.5 px-4 text-slate-500">Methemoglobinemia in infants under 6 months</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold">Total Coliform & E. coli</td>
                <td className="py-2.5 px-4">0 MPN/100ml</td>
                <td className="py-2.5 px-4">0 MPN/100ml</td>
                <td className="py-2.5 px-4 text-slate-500">Severe waterborne biological infections</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Statutory Disclaimer */}
      <div className="p-4 rounded-2xl bg-slate-100 text-xs text-slate-500 leading-relaxed border border-slate-200">
        <strong>Statutory Regulatory Notice:</strong> AquaPulse AI is an automated decision-support platform designed to assist users in understanding water quality testing reports. It is not an accredited physical laboratory and does not provide legally binding certifications of water potability.
      </div>

    </div>
  );
}
