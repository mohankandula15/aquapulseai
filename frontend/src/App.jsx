import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingUpload from './components/LandingUpload';
import ExtractionPreviewModal from './components/ExtractionPreviewModal';
import ProcessingScreen from './components/ProcessingScreen';
import ReportResultsView from './components/ReportResultsView';
import WaterSafetyView from './components/WaterSafetyView';
import AnalysisHistoryView from './components/AnalysisHistoryView';
import AdvancedAnalyticsView from './components/AdvancedAnalyticsView';
import AboutView from './components/AboutView';
import SimulationModal from './components/SimulationModal';
import WaterGuideModal from './components/WaterGuideModal';

import { 
  getStations, 
  getReadings, 
  getAlertsSummary, 
  getModelInfo, 
  triggerSimulatorTick,
  extractWaterReport,
  analyzeWaterReport,
  getSamplePresets
} from './api/client';

export default function App() {
  // Navigation: 'dashboard', 'analyze', 'safety', 'history', 'advanced', 'about'
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Technical monitoring state
  const [stations, setStations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState(null);
  const [readings, setReadings] = useState([]);
  const [timeRange, setTimeRange] = useState(72);
  const [modelInfo, setModelInfo] = useState(null);
  const [activeAlertCount, setActiveAlertCount] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isAnomalyModalOpen, setIsAnomalyModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(true);

  // Water Report Analysis Workflow State
  const [intendedUse, setIntendedUse] = useState('drinking');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [pendingAnalysisPayload, setPendingAnalysisPayload] = useState(null);

  // Initial Load of Stations and Telemetry
  useEffect(() => {
    loadAllData();
  }, []);

  // When selected station or timeRange changes
  useEffect(() => {
    if (selectedStationId) {
      loadReadings(selectedStationId, timeRange);
    }
  }, [selectedStationId, timeRange]);

  // Automated IoT Telemetry Streaming loop (every 6 seconds when active)
  useEffect(() => {
    let interval = null;
    if (isStreaming) {
      interval = setInterval(async () => {
        try {
          await triggerSimulatorTick(selectedStationId);
          await loadAllData();
        } catch (err) {
          console.error('Streaming tick failed:', err);
        }
      }, 6000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming, selectedStationId]);

  const loadAllData = async () => {
    try {
      const [stnList, alertSum, mInfo] = await Promise.all([
        getStations(),
        getAlertsSummary(),
        getModelInfo(),
      ]);
      setStations(stnList || []);
      setActiveAlertCount(alertSum?.total_active || 0);
      setModelInfo(mInfo);

      const firstId = selectedStationId || (stnList && stnList[0]?.id) || 1;
      setSelectedStationId(firstId);
      await loadReadings(firstId, timeRange);
    } catch (err) {
      console.error('Failed to load initial application state:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReadings = async (stationId, hours) => {
    try {
      const data = await getReadings(stationId, hours);
      setReadings(data || []);
    } catch (err) {
      console.error('Failed to load readings:', err);
    }
  };

  const handleSimulateTick = async () => {
    setIsSimulating(true);
    try {
      await triggerSimulatorTick(selectedStationId);
      await loadAllData();
    } catch (err) {
      console.error('Failed to trigger simulator tick:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // 1. Upload & Extract Document
  const handleFileSelect = async (file, usePurpose) => {
    setIsExtracting(true);
    setExtractionError(null);
    try {
      const result = await extractWaterReport(file);
      setExtractedData(result);
      setIntendedUse(usePurpose || 'drinking');
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('Extraction failed:', err);
      const detail = err.response?.data?.detail || err.message || 'Failed to extract text from document';
      setExtractionError(detail);
    } finally {
      setIsExtracting(false);
    }
  };

  // 2. Load 1-Click Sample Test Case
  const handleLoadSample = async (samplePresetId) => {
    try {
      const presets = await getSamplePresets();
      const match = presets.find(p => p.id === samplePresetId) || presets[0];
      if (match) {
        setExtractedData({
          filename: `${match.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
          file_type: 'pdf',
          file_size: 1024 * 45,
          metadata: match.sample_metadata || {},
          parameters: match.parameters || {},
          verification_warnings: []
        });
        setIntendedUse(match.intended_use || 'drinking');
        setIsPreviewOpen(true);
      }
    } catch (err) {
      console.error('Failed to load sample preset:', err);
      alert('Failed to load preset: ' + err.message);
    }
  };

  // 3. User Confirms Verified Parameters -> Trigger Analysis with 8-Stage Processing Screen
  const handleConfirmAnalysis = async (verifiedPayload) => {
    setIsPreviewOpen(false);
    setIsProcessing(true);
    setPendingAnalysisPayload(verifiedPayload);

    try {
      const analysisResult = await analyzeWaterReport(verifiedPayload);
      setCurrentAnalysis(analysisResult);
    } catch (err) {
      console.error('Analysis failed:', err);
      alert('Analysis failed: ' + (err.response?.data?.detail || err.message));
      setIsProcessing(false);
    }
  };

  // 4. Processing Screen completes animation
  const handleProcessingComplete = () => {
    setIsProcessing(false);
    setActiveTab('analyze');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 5. Reset to upload another report
  const handleResetAnalysis = () => {
    setCurrentAnalysis(null);
    setExtractedData(null);
    setIsPreviewOpen(false);
    setIsProcessing(false);
    setExtractionError(null);
    setActiveTab('analyze');
  };

  // 6. Select a previous report from History
  const handleSelectHistoryReport = (reportRecord) => {
    setCurrentAnalysis(reportRecord);
    setActiveTab('analyze');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      
      {/* SaaS Navbar with 6 core navigation items */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeAlertCount={activeAlertCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Verification & Parameter Preview Modal */}
        <ExtractionPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          extractedData={extractedData}
          onConfirmAnalysis={handleConfirmAnalysis}
          intendedUse={intendedUse}
          setIntendedUse={setIntendedUse}
        />

        {/* 8-Stage Progress Tracker */}
        {isProcessing && (
          <ProcessingScreen onComplete={handleProcessingComplete} />
        )}

        {/* Tab 1: Dashboard / Landing Page */}
        {!isProcessing && activeTab === 'dashboard' && (
          <LandingUpload
            onFileSelect={handleFileSelect}
            onLoadSample={handleLoadSample}
            isExtracting={isExtracting}
            error={extractionError}
            intendedUse={intendedUse}
            setIntendedUse={setIntendedUse}
          />
        )}

        {/* Tab 2: Analyze Report */}
        {!isProcessing && activeTab === 'analyze' && (
          currentAnalysis ? (
            <ReportResultsView
              analysis={currentAnalysis}
              onReset={handleResetAnalysis}
              onNavigateSafety={() => setActiveTab('safety')}
            />
          ) : (
            <LandingUpload
              onFileSelect={handleFileSelect}
              onLoadSample={handleLoadSample}
              isExtracting={isExtracting}
              error={extractionError}
              intendedUse={intendedUse}
              setIntendedUse={setIntendedUse}
            />
          )
        )}

        {/* Tab 3: Water Safety Guide (3 Categories & Parameter Precautions) */}
        {!isProcessing && activeTab === 'safety' && (
          <WaterSafetyView currentAnalysis={currentAnalysis} />
        )}

        {/* Tab 4: Analysis History */}
        {!isProcessing && activeTab === 'history' && (
          <AnalysisHistoryView
            onSelectReport={handleSelectHistoryReport}
            onNavigateAnalyze={() => {
              setCurrentAnalysis(null);
              setActiveTab('analyze');
            }}
          />
        )}

        {/* Tab 5: Advanced Analytics (Preserves all technical features) */}
        {!isProcessing && activeTab === 'advanced' && (
          <AdvancedAnalyticsView
            stations={stations}
            selectedStationId={selectedStationId}
            setSelectedStationId={setSelectedStationId}
            readings={readings}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            modelInfo={modelInfo}
            activeAlertCount={activeAlertCount}
            onSimulateTick={handleSimulateTick}
            onOpenAnomalyModal={() => setIsAnomalyModalOpen(true)}
            isSimulating={isSimulating}
            onRefresh={loadAllData}
            isStreaming={isStreaming}
            onToggleStreaming={() => setIsStreaming(!isStreaming)}
          />
        )}

        {/* Tab 6: About */}
        {!isProcessing && activeTab === 'about' && (
          <AboutView />
        )}

      </main>

      {/* Modern SaaS Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-slate-800">AquaPulse AI</span>
            <span>•</span>
            <span>Smart Water Quality Analysis & Safety Assistant</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-500">
            <button onClick={() => setActiveTab('about')} className="hover:text-sky-600 transition">
              BIS IS 10500:2012 & WHO Standards
            </button>
            <span>•</span>
            <button onClick={() => setActiveTab('safety')} className="hover:text-sky-600 transition">
              Water Safety Protocols
            </button>
            <span>•</span>
            <button onClick={() => setIsGuideOpen(true)} className="hover:text-sky-600 transition">
              Parameter Guide
            </button>
          </div>
        </div>
      </footer>

      {/* Simulator Modal */}
      <SimulationModal
        isOpen={isAnomalyModalOpen}
        onClose={() => setIsAnomalyModalOpen(false)}
        stations={stations}
        onInjected={loadAllData}
      />

      {/* Water Guide Modal */}
      <WaterGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

    </div>
  );
}
