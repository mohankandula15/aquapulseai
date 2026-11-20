import React, { useState } from 'react';
import { 
  Activity, 
  TrendingUp, 
  ShieldAlert, 
  AlertTriangle, 
  BrainCircuit, 
  FileSpreadsheet, 
  FileCheck, 
  MapPin, 
  Radio, 
  Zap, 
  Play, 
  RefreshCw 
} from 'lucide-react';

import FriendlyParameterCards from './FriendlyParameterCards';
import TelemetryCharts from './TelemetryCharts';
import ForecastingView from './ForecastingView';
import AlertCenter from './AlertCenter';
import AnomalyMonitor from './AnomalyMonitor';
import XaiPredictorLab from './XaiPredictorLab';
import BatchCsvLab from './BatchCsvLab';
import ComplianceAuditView from './ComplianceAuditView';
import StationMap from './StationMap';

export default function AdvancedAnalyticsView({
  stations,
  selectedStationId,
  setSelectedStationId,
  readings,
  timeRange,
  setTimeRange,
  modelInfo,
  activeAlertCount,
  onSimulateTick,
  onOpenAnomalyModal,
  isSimulating,
  onRefresh,
  isStreaming,
  onToggleStreaming
}) {
  const [subTab, setSubTab] = useState('telemetry');

  const selectedStation = stations.find(s => s.id === selectedStationId) || stations[0];

  const subNavItems = [
    { id: 'telemetry', label: 'Station Telemetry', icon: Activity },
    { id: 'forecasting', label: '24-48h Forecast', icon: TrendingUp },
    { id: 'alerts', label: 'Alert Center', icon: ShieldAlert, badge: activeAlertCount },
    { id: 'anomalies', label: 'Anomaly Log', icon: AlertTriangle },
    { id: 'xai', label: 'XAI Predictor Lab', icon: BrainCircuit },
    { id: 'batch', label: 'Batch CSV Lab', icon: FileSpreadsheet },
    { id: 'compliance', label: 'Compliance Audit', icon: FileCheck },
    { id: 'map', label: 'Station Map', icon: MapPin },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Sub-header with Station Selector and Simulator Controls */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Station Picker */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Monitoring Station:
            </span>
            <select
              value={selectedStationId || ''}
              onChange={(e) => setSelectedStationId(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500/20"
            >
              {stations.map(stn => (
                <option key={stn.id} value={stn.id}>
                  {stn.name} ({stn.code}) - {stn.water_body_type || 'Surface'}
                </option>
              ))}
            </select>
          </div>

          {selectedStation && (
            <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
              📍 {selectedStation.location}
            </span>
          )}
        </div>

        {/* Right: IoT Sensor Simulator Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Live Sensor Stream Toggle */}
          <button
            onClick={onToggleStreaming}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
              isStreaming
                ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Toggle simulated IoT live data stream"
          >
            <Radio className={`w-3.5 h-3.5 ${isStreaming ? 'text-rose-600 animate-spin' : 'text-slate-400'}`} />
            <span>{isStreaming ? 'Streaming Live (6s)' : 'Start Sensor Stream'}</span>
          </button>

          {/* Trigger 1-tick reading */}
          <button
            onClick={onSimulateTick}
            disabled={isSimulating}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-semibold transition"
            title="Simulate 1 new telemetry reading"
          >
            <Play className={`w-3.5 h-3.5 text-sky-600 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>Tick Sensor</span>
          </button>

          {/* Inject Anomaly */}
          <button
            onClick={onOpenAnomalyModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition"
            title="Inject an artificial water anomaly"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Inject Anomaly</span>
          </button>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Refresh telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Sub-Navigation Pills */}
      <div className="flex items-center overflow-x-auto pb-2 gap-1.5 border-b border-slate-200">
        {subNavItems.map(item => {
          const Icon = item.icon;
          const isActive = subTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSubTab(item.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-white text-sky-700 font-extrabold' : 'bg-amber-500 text-white'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <div>
        {subTab === 'telemetry' && (
          <div className="space-y-6">
            <FriendlyParameterCards readings={readings} station={selectedStation} />
            <TelemetryCharts
              readings={readings}
              timeRange={timeRange}
              setTimeRange={setTimeRange}
              stationName={selectedStation?.name}
            />
          </div>
        )}

        {subTab === 'forecasting' && (
          <ForecastingView stationId={selectedStationId} />
        )}

        {subTab === 'alerts' && (
          <AlertCenter stationId={selectedStationId} onAlertUpdated={onRefresh} />
        )}

        {subTab === 'anomalies' && (
          <AnomalyMonitor stationId={selectedStationId} />
        )}

        {subTab === 'xai' && (
          <XaiPredictorLab stationId={selectedStationId} />
        )}

        {subTab === 'batch' && (
          <BatchCsvLab />
        )}

        {subTab === 'compliance' && (
          <ComplianceAuditView stationId={selectedStationId} />
        )}

        {subTab === 'map' && (
          <StationMap stations={stations} selectedStationId={selectedStationId} onSelectStation={setSelectedStationId} />
        )}
      </div>

    </div>
  );
}
