import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  X, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  FileCheck2, 
  AlertCircle,
  FileSpreadsheet,
  Image as ImageIcon,
  FlaskConical
} from 'lucide-react';

export default function LandingUpload({ 
  onFileSelect, 
  onLoadSample, 
  isExtracting, 
  error, 
  intendedUse, 
  setIntendedUse 
}) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const supportedFormats = [
    { ext: 'PDF', label: 'Lab Reports', icon: FileText },
    { ext: 'JPG / PNG', label: 'Scanned Photos', icon: ImageIcon },
    { ext: 'CSV', label: 'Data Tables', icon: FileSpreadsheet },
  ];

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files[0]);
    }
  };

  const handleFiles = (file) => {
    // Validate format
    const name = file.name.toLowerCase();
    const valid = ['.pdf', '.jpg', '.jpeg', '.png', '.csv'].some(ext => name.endsWith(ext));
    if (!valid) {
      alert("Unsupported file format. Please upload a PDF, JPG, PNG, or CSV document.");
      return;
    }
    // Validate size (25MB)
    if (file.size > 25 * 1024 * 1024) {
      alert("File size exceeds 25 MB limit.");
      return;
    }
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyzeClick = () => {
    if (!selectedFile) return;
    onFileSelect(selectedFile, intendedUse);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-4">
      
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200/80 text-sky-700 text-xs font-semibold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-sky-500" />
          <span>Smart Water Quality Analysis & Safety Assistant</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Understand Your <br />
          <span className="bg-gradient-to-r from-sky-600 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
            Water Quality with AI
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          Upload your water testing report to discover its quality, identify potential risks, and receive personalized safety recommendations.
        </p>
      </div>

      {/* Main Upload Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl shadow-slate-200/50 space-y-6">
        
        {/* Intended Use Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Intended Water Use:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[
              { id: 'drinking', label: 'Drinking Water', desc: 'BIS IS 10500 / WHO' },
              { id: 'household', label: 'Household Use', desc: 'Washing & Sanitary' },
              { id: 'agricultural', label: 'Agricultural', desc: 'Farming & Crops' },
              { id: 'industrial', label: 'Industrial Use', desc: 'Process & Cooling' },
              { id: 'other', label: 'Other / General', desc: 'Baseline Survey' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setIntendedUse(opt.id)}
                className={`p-3 rounded-2xl text-left border transition-all ${
                  intendedUse === opt.id
                    ? 'bg-sky-50 border-sky-500 text-sky-900 ring-2 ring-sky-500/20 font-bold shadow-xs'
                    : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-bold">{opt.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Drag and Drop Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !selectedFile && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
            dragOver 
              ? 'border-sky-500 bg-sky-50/70 scale-[0.99]' 
              : selectedFile
              ? 'border-emerald-300 bg-emerald-50/30'
              : 'border-slate-300 hover:border-sky-400 bg-slate-50/50 hover:bg-sky-50/20'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".pdf,.jpg,.jpeg,.png,.csv"
            className="hidden"
          />

          {!selectedFile ? (
            <div className="space-y-4 max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-sky-100 text-sky-600 mx-auto flex items-center justify-center shadow-inner">
                <UploadCloud className="w-8 h-8" />
              </div>
              
              <div>
                <div className="text-base font-bold text-slate-800">
                  Drag & drop your water report here
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  or browse your computer to select a file
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-5 py-2 rounded-xl bg-white text-sky-700 text-xs font-bold border border-slate-200 shadow-xs hover:bg-slate-50 hover:border-sky-300 transition"
              >
                Choose File
              </button>

              <div className="pt-2 flex items-center justify-center space-x-3 text-[11px] text-slate-400">
                <span>Supported: PDF, JPG, PNG, CSV</span>
                <span>•</span>
                <span>Max size: 25 MB</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white rounded-2xl border border-emerald-200 shadow-sm gap-4">
              <div className="flex items-center space-x-3 text-left">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                    {selectedFile.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready for extraction
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
                >
                  Replace File
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                  title="Remove file"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Prominent Action Button */}
        <div>
          <button
            type="button"
            disabled={!selectedFile || isExtracting}
            onClick={handleAnalyzeClick}
            className={`w-full py-4 rounded-2xl font-bold text-base shadow-lg flex items-center justify-center space-x-2 transition-all ${
              selectedFile && !isExtracting
                ? 'bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-500 hover:from-sky-700 hover:to-teal-600 text-white shadow-sky-500/25 cursor-pointer transform hover:-translate-y-0.5'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span>{isExtracting ? 'Reading & Extracting Document...' : 'Analyze My Water Report'}</span>
            {!isExtracting && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>

        {/* One-Click Real World Sample Reports */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
              <FlaskConical className="w-4 h-4 text-sky-600" />
              <span>Or try with pre-loaded lab reports (1-Click Test):</span>
            </div>
            <span className="text-[11px] text-slate-400">Instant Demo</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => onLoadSample('sample-safe-tap')}
              className="p-3 rounded-xl bg-slate-50 hover:bg-sky-50/70 border border-slate-200 hover:border-sky-300 text-left transition group"
            >
              <div className="text-xs font-bold text-slate-800 group-hover:text-sky-700">
                1. Safe Tap Water
              </div>
              <div className="text-[10px] text-slate-500">
                BIS IS 10500 Compliant (Low TDS, balanced pH)
              </div>
            </button>

            <button
              type="button"
              onClick={() => onLoadSample('sample-borewell-hard')}
              className="p-3 rounded-xl bg-slate-50 hover:bg-amber-50/70 border border-slate-200 hover:border-amber-300 text-left transition group"
            >
              <div className="text-xs font-bold text-slate-800 group-hover:text-amber-700">
                2. Hard Borewell Water
              </div>
              <div className="text-[10px] text-slate-500">
                Elevated TDS & Hardness (Attention Needed)
              </div>
            </button>

            <button
              type="button"
              onClick={() => onLoadSample('sample-agricultural-runoff')}
              className="p-3 rounded-xl bg-slate-50 hover:bg-rose-50/70 border border-slate-200 hover:border-rose-300 text-left transition group"
            >
              <div className="text-xs font-bold text-slate-800 group-hover:text-rose-700">
                3. Agricultural Runoff
              </div>
              <div className="text-[10px] text-slate-500">
                High Nitrate & Microbial Risk (Potentially Unsafe)
              </div>
            </button>
          </div>
        </div>

      </div>

      {/* 4-Step Process Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { step: '01', title: 'Upload Report', desc: 'Submit any PDF lab result, photo or dataset.', icon: UploadCloud },
          { step: '02', title: 'AI Parameter Extraction', desc: 'Automatically parses values, units and lab dates.', icon: Sparkles },
          { step: '03', title: 'Standards Benchmark', desc: 'Compares against BIS IS 10500 & WHO guidelines.', icon: ShieldCheck },
          { step: '04', title: 'Actionable Advice', desc: 'Tailored safety steps and downloadable report.', icon: FileCheck2 },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-black text-xs">
                  {item.step}
                </div>
                <Icon className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-xs font-bold text-slate-900">{item.title}</div>
              <div className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
