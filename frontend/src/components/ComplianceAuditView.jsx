import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  ShieldCheck,
  AlertTriangle,
  Download,
  Calendar,
  CheckCircle2,
  XCircle,
  TrendingUp,
  RefreshCw,
  Award,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';
import { getComplianceReport, getExportReadingsUrl } from '../api/client';

export default function ComplianceAuditView({ stations }) {
  const [days, setDays] = useState(14);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCompliance();
  }, [days]);

  const fetchCompliance = async () => {
    setLoading(true);
    try {
      const data = await getComplianceReport(days);
      setReport(data);
    } catch (err) {
      console.error('Failed to load compliance audit report:', err);
    } finally {
      setLoading(false);
    }
  };

  const paramViolationsData = report?.parameter_violations_breakdown ? [
    { name: 'pH Out-of-Bounds', count: report.parameter_violations_breakdown.ph || 0, color: '#38bdf8' },
    { name: 'High Turbidity (>5 NTU)', count: report.parameter_violations_breakdown.turbidity || 0, color: '#f59e0b' },
    { name: 'Low DO / Hypoxia (<5 mg/L)', count: report.parameter_violations_breakdown.dissolved_oxygen || 0, color: '#10b981' },
    { name: 'Excessive TDS (>500 mg/L)', count: report.parameter_violations_breakdown.tds || 0, color: '#a855f7' },
    { name: 'High Conductivity (>800 µS/cm)', count: report.parameter_violations_breakdown.conductivity || 0, color: '#06b6d4' },
    { name: 'Thermal Anomaly (>30 °C)', count: report.parameter_violations_breakdown.temperature || 0, color: '#f43f5e' },
  ] : [];

  const getGradeBadge = (grade) => {
    if (grade.startsWith('A')) return 'bg-emerald-950 border-emerald-700 text-emerald-300';
    if (grade.startsWith('B')) return 'bg-cyan-950 border-cyan-700 text-cyan-300';
    if (grade.startsWith('C')) return 'bg-amber-950 border-amber-700 text-amber-300';
    if (grade.startsWith('D')) return 'bg-orange-950 border-orange-700 text-orange-300';
    return 'bg-rose-950 border-rose-700 text-rose-300';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <span>Water Quality Compliance & Environmental Audit Hub</span>
            </h2>
            <p className="text-xs text-slate-400">
              Benchmarked against standard statutory guidelines from the World Health Organization (WHO) & US EPA
            </p>
          </div>
        </div>

        {/* Time Window Switcher & Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {[7, 14, 30, 60].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  days === d ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>

          <a
            href={getExportReadingsUrl(null, days)}
            download
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Export Audit Telemetry (CSV)</span>
          </a>

          <button
            onClick={fetchCompliance}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* High-Level Compliance Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Compliance */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase font-bold text-slate-400">Overall Compliance Rate</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">
            {report?.overall_compliance_rate ?? '--'}%
          </div>
          <p className="text-xs text-slate-400 mt-1">Samples strictly within safe limits</p>
        </div>

        {/* Total Samples Audited */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase font-bold text-slate-400">Total Samples Audited</span>
            <Layers className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-slate-100">
            {report?.total_readings_audited ?? '--'}
          </div>
          <p className="text-xs text-slate-400 mt-1">Across all 5 monitoring facilities</p>
        </div>

        {/* Total Threshold Violations */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase font-bold text-slate-400">Total Violations</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400">
            {report?.total_violations_recorded ?? '--'}
          </div>
          <p className="text-xs text-slate-400 mt-1">Exceedances over {days} days</p>
        </div>

        {/* Benchmark Standard */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase font-bold text-slate-400">Statutory Benchmark</span>
            <Award className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-purple-300 mt-1">WHO & US EPA</div>
          <p className="text-xs text-slate-400 mt-1">Weighted Arithmetic WQI Method</p>
        </div>
      </div>

      {/* Parameter Violations Chart & Safety Standards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-slate-100 mb-1 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Threshold Exceedances by Parameter</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Count of readings breaching standard statutory limits over the past {days} days
          </p>

          <div className="h-64 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paramViolationsData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#475569" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" stroke="#475569" tick={{ fontSize: 9 }} width={140} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-slate-200">{d.name}</p>
                          <p className="text-amber-400 font-bold">Total Violations: {d.count}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {paramViolationsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regulatory Standard Reference Table (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Statutory Safety Benchmarks</span>
          </h3>
          <p className="text-xs text-slate-400">
            Target thresholds enforced across surveillance models:
          </p>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-sky-400 block">pH Level</span>
                <span className="text-[11px] text-slate-400">Corrosion & Acidity Band</span>
              </div>
              <span className="font-mono font-bold text-slate-200">6.5 - 8.5 pH</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-amber-400 block">Turbidity</span>
                <span className="text-[11px] text-slate-400">Suspended Particulates</span>
              </div>
              <span className="font-mono font-bold text-slate-200">&lt; 5.0 NTU</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-emerald-400 block">Dissolved Oxygen</span>
                <span className="text-[11px] text-slate-400">Aeration & Hypoxia Standard</span>
              </div>
              <span className="font-mono font-bold text-slate-200">&gt; 5.0 mg/L</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-purple-400 block">Total Dissolved Solids</span>
                <span className="text-[11px] text-slate-400">Mineral & Salt Concentration</span>
              </div>
              <span className="font-mono font-bold text-slate-200">&lt; 500 mg/L</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-cyan-400 block">Conductivity</span>
                <span className="text-[11px] text-slate-400">Electrolytic Ionization</span>
              </div>
              <span className="font-mono font-bold text-slate-200">&lt; 800 µS/cm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Station Scorecard Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-base font-bold text-slate-100 mb-1">
          Station-Wise Compliance Scorecards
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Detailed safety compliance audit and rating breakdown per water monitoring facility
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-3.5 py-3">Facility</th>
                <th className="px-3.5 py-3">Water Body</th>
                <th className="px-3.5 py-3">Samples Audited</th>
                <th className="px-3.5 py-3">Compliant</th>
                <th className="px-3.5 py-3">Violations</th>
                <th className="px-3.5 py-3">Compliance Rate</th>
                <th className="px-3.5 py-3">Avg WQI</th>
                <th className="px-3.5 py-3">Potable %</th>
                <th className="px-3.5 py-3">Compliance Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
              {report?.station_scorecards?.map((stn) => (
                <tr key={stn.station_id} className="hover:bg-slate-800/40 transition">
                  <td className="px-3.5 py-3">
                    <span className="font-bold text-slate-100 block">{stn.station_name}</span>
                    <span className="font-mono text-[11px] text-slate-500">{stn.station_code}</span>
                  </td>
                  <td className="px-3.5 py-3 text-slate-300">{stn.water_body_type}</td>
                  <td className="px-3.5 py-3 font-mono">{stn.total_samples}</td>
                  <td className="px-3.5 py-3 font-mono text-emerald-400 font-semibold">{stn.compliant_samples}</td>
                  <td className="px-3.5 py-3 font-mono text-rose-400 font-semibold">{stn.violation_samples}</td>
                  <td className="px-3.5 py-3 font-mono font-bold text-cyan-400">
                    {stn.compliance_percentage}%
                  </td>
                  <td className="px-3.5 py-3 font-mono font-semibold text-slate-200">
                    {stn.average_wqi}
                  </td>
                  <td className="px-3.5 py-3 font-mono text-emerald-400">
                    {stn.potable_percentage}%
                  </td>
                  <td className="px-3.5 py-3">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${getGradeBadge(stn.grade)}`}>
                      {stn.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
