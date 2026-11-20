import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle, 
  CheckCheck, 
  Clock, 
  RefreshCw, 
  Filter, 
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { getAlerts, getAlertsSummary, acknowledgeAlert, acknowledgeAllAlerts } from '../api/client';

export default function AlertCenter({ stations, onAlertCountChange }) {
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // 'active', 'acknowledged', 'all'
  const [selectedStation, setSelectedStation] = useState('');
  const [loading, setLoading] = useState(false);
  const [operatorName, setOperatorName] = useState('Duty Environmental Chemist');

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, statusFilter, selectedStation]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const isAck = statusFilter === 'active' ? false : statusFilter === 'acknowledged' ? true : null;
      const [alertList, sumData] = await Promise.all([
        getAlerts(selectedStation || null, severityFilter || null, isAck),
        getAlertsSummary()
      ]);
      setAlerts(alertList);
      setSummary(sumData);
      if (onAlertCountChange && sumData) {
        onAlertCountChange(sumData.total_active);
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await acknowledgeAlert(alertId, operatorName);
      fetchAlerts();
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const handleAcknowledgeAll = async () => {
    try {
      await acknowledgeAllAlerts(selectedStation || null, operatorName);
      fetchAlerts();
    } catch (err) {
      console.error('Failed to acknowledge all alerts:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Critical Alerts */}
        <div className="bg-slate-900/80 border border-rose-900/60 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-rose-300">Active Critical Alerts</span>
            <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-400 mt-2">
            {summary?.active_critical ?? 0}
          </div>
          <p className="text-xs text-rose-300/70 mt-1">Requires immediate intervention</p>
        </div>

        {/* Warning Alerts */}
        <div className="bg-slate-900/80 border border-amber-900/60 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-amber-300">Active Warnings</span>
            <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-400 mt-2">
            {summary?.active_warning ?? 0}
          </div>
          <p className="text-xs text-amber-300/70 mt-1">Borderline threshold deviations</p>
        </div>

        {/* Total Active Alerts */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-slate-400">Total Unacknowledged</span>
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-100 mt-2">
            {summary?.total_active ?? 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">Pending operator sign-off</p>
        </div>

        {/* Historical Logs */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-slate-400">Historical Event Archive</span>
            <div className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-100 mt-2">
            {summary?.total_historical ?? 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">Total alerts recorded in audit trail</p>
        </div>
      </div>

      {/* Main Alert List & Filter Controls */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <span>Intelligent Early Warning & Alert Management Center</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated notifications with root-cause diagnostics and remediation guidance
            </p>
          </div>

          {/* Filtering options and Acknowledge All */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Station Filter */}
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

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 font-medium focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="WARNING">Warnings Only</option>
            </select>

            {/* Status Switcher */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  statusFilter === 'active' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('acknowledged')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  statusFilter === 'acknowledged' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Resolved
              </button>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  statusFilter === 'all' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
            </div>

            {/* Acknowledge All */}
            {summary?.total_active > 0 && statusFilter === 'active' && (
              <button
                onClick={handleAcknowledgeAll}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                <CheckCheck className="w-4 h-4 text-emerald-400" />
                <span>Acknowledge All</span>
              </button>
            )}

            <button
              onClick={fetchAlerts}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Refresh alerts"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Alert Cards List */}
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-2">
              <ShieldCheck className="w-10 h-10 text-emerald-500/60" />
              <p className="text-sm font-medium text-slate-300">No alerts found matching filter criteria.</p>
              <p className="text-xs text-slate-500">All monitored water bodies are operating within nominal specifications.</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const isCrit = alert.severity === 'CRITICAL';
              const dateStr = new Date(alert.timestamp).toLocaleString();

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-2xl border transition ${
                    alert.is_acknowledged
                      ? 'bg-slate-950/40 border-slate-800 opacity-70'
                      : isCrit
                      ? 'bg-rose-950/30 border-rose-800/80 shadow-md shadow-rose-950/20'
                      : 'bg-amber-950/20 border-amber-800/70'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      {/* Badge Row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                            isCrit
                              ? 'bg-rose-950 text-rose-300 border-rose-700'
                              : 'bg-amber-950 text-amber-300 border-amber-700'
                          }`}
                        >
                          {alert.severity}
                        </span>

                        <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono font-medium border border-slate-700">
                          {alert.station_name}
                        </span>

                        <span className="text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">
                          {alert.alert_type}
                        </span>

                        <span className="text-xs text-slate-500 font-mono flex items-center">
                          <Clock className="w-3 h-3 mr-1" /> {dateStr}
                        </span>
                      </div>

                      {/* Message */}
                      <h4 className="text-sm font-semibold text-slate-100">
                        {alert.message}
                      </h4>

                      {/* Diagnostic details */}
                      <div className="flex items-center space-x-3 text-xs text-slate-300 font-mono">
                        {alert.current_value !== null && (
                          <span>Observed Value: <strong className="text-rose-400">{alert.current_value}</strong></span>
                        )}
                        {alert.threshold_value !== null && (
                          <span>| Threshold Limit: <strong className="text-slate-400">{alert.threshold_value}</strong></span>
                        )}
                      </div>

                      {/* Recommendation Box */}
                      {alert.recommendation && (
                        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300">
                          <span className="font-bold text-amber-400">⚡ Prescriptive Remediation: </span>
                          <span>{alert.recommendation}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Column */}
                    <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0">
                      {!alert.is_acknowledged ? (
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition whitespace-nowrap"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Acknowledge</span>
                        </button>
                      ) : (
                        <div className="text-right text-[11px] text-slate-400 space-y-0.5">
                          <span className="inline-flex items-center text-emerald-400 font-medium">
                            <UserCheck className="w-3.5 h-3.5 mr-1" /> Acknowledged
                          </span>
                          <p className="text-slate-500">{alert.acknowledged_by}</p>
                          <p className="text-slate-500 font-mono text-[10px]">
                            {new Date(alert.acknowledged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
