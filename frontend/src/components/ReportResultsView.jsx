import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Download, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  AlertOctagon, 
  Info,
  Calendar,
  Building,
  MapPin,
  ExternalLink,
  ChevronRight,
  FileText
} from 'lucide-react';
import { getReportPdfUrl } from '../api/client';

export default function ReportResultsView({ analysis, onReset, onNavigateSafety }) {
  if (!analysis) return null;

  const [downloading, setDownloading] = useState(false);

  const overallQuality = analysis.overall_quality || 'Moderate';
  const wqiScore = analysis.wqi_score ?? 0;
  const riskLevel = analysis.risk_level || 'Moderate Risk';
  const safetyCategory = analysis.safety_category || 'Needs Attention';
  const evalParams = analysis.evaluated_parameters || {};
  const potentialRisks = analysis.potential_risks || [];
  const recs = analysis.recommendations || {};
  const meta = analysis.sample_metadata || {};
  const missingTests = analysis.missing_critical_tests || [];
  const pGuidance = analysis.parameter_safety_guidance || [];

  const handleDownloadPdf = () => {
    if (!analysis.id) {
      alert("Please ensure the report has been saved before downloading.");
      return;
    }
    window.open(getReportPdfUrl(analysis.id), '_blank');
  };

  // Badge styles based on classification
  const qualityColorMap = {
    Good: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      ring: 'ring-emerald-500/20',
      icon: CheckCircle2,
      badge: 'bg-emerald-600'
    },
    Moderate: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      ring: 'ring-amber-500/20',
      icon: AlertTriangle,
      badge: 'bg-amber-600'
    },
    Poor: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-700',
      ring: 'ring-rose-500/20',
      icon: XCircle,
      badge: 'bg-rose-600'
    }
  };

  const style = qualityColorMap[overallQuality] || qualityColorMap.Moderate;
  const StatusIcon = style.icon;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onReset}
          className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Upload Another Report</span>
        </button>

        <div className="flex items-center space-x-3">
          {analysis.id && (
            <button
              onClick={handleDownloadPdf}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold shadow-md shadow-sky-500/20 hover:shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Detailed Report (PDF)</span>
            </button>
          )}
        </div>
      </div>

      {/* Source File & Sample Metadata Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-sky-600" />
          <span className="font-semibold text-slate-800">{analysis.filename || 'Direct Upload'}</span>
          <span className="text-slate-400">|</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
            Intended for: {analysis.intended_use ? analysis.intended_use.toUpperCase() : 'DRINKING'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-slate-500">
          {meta.laboratory_name && (
            <div className="flex items-center space-x-1">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>{meta.laboratory_name}</span>
            </div>
          )}
          {meta.sample_date && (
            <div className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Date: {meta.sample_date}</span>
            </div>
          )}
          {meta.sample_location && (
            <div className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{meta.sample_location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Section A: Overall Water Quality Assessment Badge & Metric Card */}
      <div className={`p-6 sm:p-8 rounded-3xl border ${style.border} ${style.bg} shadow-sm relative overflow-hidden`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {/* Main Classification */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white ${style.badge}`}>
                {overallQuality} Quality
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Risk Level: <strong className="text-slate-800">{riskLevel}</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Overall Water Quality: <span className={style.text}>{overallQuality}</span>
            </h1>

            <p className="text-sm text-slate-700 leading-relaxed">
              {analysis.ai_explanation}
            </p>

            {/* Crucial Potability Caution Banner */}
            <div className="mt-3 p-3 rounded-xl bg-white/80 border border-slate-200/80 text-xs text-slate-600 flex items-start space-x-2.5">
              <Info className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Safety Verification Note:</strong> Water quality classification measures compliance of tested chemical parameters. It does <em>not</em> automatically certify drinking safety without verified microbial screening (such as E. coli) and local municipal authority approval.
              </div>
            </div>
          </div>

          {/* WQI Gauge Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Water Quality Index (WQI)
            </div>
            <div className="text-4xl sm:text-5xl font-black text-slate-900">
              {wqiScore}
              <span className="text-lg font-bold text-slate-400">/100</span>
            </div>
            <div className="text-xs font-medium text-slate-500">
              Weighted Arithmetic Index Method (Brown et al.)
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  wqiScore >= 70 ? 'bg-emerald-500' : wqiScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, wqiScore))}%` }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Section C: Simple AI Explanation ("What Does Your Water Report Mean?") */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-sky-700 font-bold text-base">
          <Sparkles className="w-5 h-5 text-sky-500" />
          <h2>What Does Your Water Report Mean?</h2>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          {analysis.ai_explanation}
        </p>
      </div>

      {/* Section B: Parameter Analysis Table */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Observed Water Parameters</h2>
            <p className="text-xs text-slate-500">
              Benchmarked against <strong>BIS IS 10500:2012</strong> and <strong>WHO Drinking-water Guidelines</strong>. Only tested parameters are listed.
            </p>
          </div>
          
          {/* Legend */}
          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600">Within Range</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-600">Attention</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-600">Exceeds Limit</span>
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Parameter</th>
                <th className="py-3 px-4">Observed Value</th>
                <th className="py-3 px-4">Reference Range</th>
                <th className="py-3 px-4">Standard Benchmark</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {Object.entries(evalParams).map(([key, item]) => {
                const st = item.status || 'grey';
                return (
                  <tr key={key} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.name || key.toUpperCase()}</div>
                      {item.health_significance && (
                        <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                          {item.health_significance}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-sm text-slate-900">
                        {item.value}
                      </span>{' '}
                      <span className="text-slate-500 font-medium">{item.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {item.reference_range || '--'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {item.standard_source || 'BIS IS 10500:2012'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {st === 'green' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Within Range</span>
                        </span>
                      )}
                      {st === 'yellow' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Attention</span>
                        </span>
                      )}
                      {st === 'red' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Exceeded</span>
                        </span>
                      )}
                      {st === 'grey' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                          <span>Not Tested</span>
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

      {/* Section D: Potential Risks (if any abnormalities) */}
      {potentialRisks.length > 0 && (
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-rose-700 font-bold text-base">
            <AlertOctagon className="w-5 h-5 text-rose-600" />
            <h2>Potential Risks & Abnormal Parameters Detected</h2>
          </div>
          <p className="text-xs text-slate-500">
            The following parameters deviate from recommended safety baselines. Please review the implications and suggested actions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {potentialRisks.map((risk, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-rose-50/40 border border-rose-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{risk.parameter}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    risk.severity === 'High' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {risk.severity} Severity
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  <strong>Observed:</strong> {risk.observed_value} (Standard: {risk.reference_range})
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {risk.implications}
                </p>
                <div className="pt-2 border-t border-rose-100 text-xs text-rose-900">
                  <strong>Recommended Next Step:</strong> {risk.recommended_next_step}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 6: Water Safety & Precautionary Guidance Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-sky-50 via-cyan-50 to-white border border-sky-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Water Safety & What You Should Do</h2>
              <p className="text-xs text-slate-500">
                Actionable precautions tailored to your specific water test results.
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateSafety}
            className="hidden sm:inline-flex items-center space-x-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 bg-white px-3.5 py-2 rounded-xl border border-sky-200 shadow-xs hover:shadow transition"
          >
            <span>View Full Safety Guide</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-sky-100 space-y-3">
          <div className="font-bold text-sm text-slate-900">
            {recs.status_title || 'Safety Status Summary'}
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            {recs.primary_notice}
          </p>

          {recs.actions && recs.actions.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <div className="text-xs font-bold text-slate-800">Key Practical Actions:</div>
              <ul className="text-xs space-y-1 text-slate-700 pl-5 list-disc">
                {recs.actions.map((act, i) => (
                  <li key={i}>{act}</li>
                ))}
              </ul>
            </div>
          )}

          {recs.potability_caveat && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 mt-2">
              <strong>Precaution:</strong> {recs.potability_caveat}
            </div>
          )}
        </div>

        {/* Parameter Specific Guidance Snippets */}
        {pGuidance.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {pGuidance.slice(0, 2).map((item, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5">
                <div className="text-xs font-bold text-slate-900">{item.title}</div>
                <div className="text-[11px] text-slate-500">{item.issue}</div>
                <ul className="text-[11px] text-slate-700 space-y-1 pl-4 list-disc">
                  {item.guidance.slice(0, 2).map((g, gi) => (
                    <li key={gi}>{g}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Missing Critical Tests Note */}
      {missingTests.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
          <div className="font-bold text-slate-800 flex items-center space-x-1.5">
            <Info className="w-4 h-4 text-slate-500" />
            <span>Recommended Additional Tests Not Detected in This Report:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {missingTests.map((m, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="font-bold text-slate-800 text-[11px]">{m.name}</div>
                <div className="text-[10px] text-slate-500">{m.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statutory Disclaimer */}
      <div className="p-4 rounded-2xl bg-slate-100 text-[11px] text-slate-500 leading-relaxed border border-slate-200">
        <strong>Statutory Regulatory Disclaimer:</strong> {analysis.statutory_disclaimer || "AquaPulse AI provides algorithmic decision support based on BIS IS 10500:2012 and WHO guidelines. This does not constitute an accredited laboratory certificate of potability."}
      </div>

    </div>
  );
}
