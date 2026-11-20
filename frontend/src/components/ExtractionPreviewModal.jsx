import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ArrowRight, 
  FileText, 
  Plus, 
  Trash2,
  Calendar,
  Building,
  MapPin,
  HelpCircle,
  Sparkles
} from 'lucide-react';

export default function ExtractionPreviewModal({ 
  isOpen, 
  onClose, 
  extractedData, 
  onConfirmAnalysis,
  intendedUse,
  setIntendedUse
}) {
  if (!isOpen || !extractedData) return null;

  const [parameters, setParameters] = useState(extractedData.parameters || {});
  const [metadata, setMetadata] = useState(extractedData.metadata || {});
  const [newParameterKey, setNewParameterKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newUnit, setNewUnit] = useState('mg/L');

  const warnings = extractedData.verification_warnings || [];

  const handleParamChange = (key, field, val) => {
    setParameters(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: field === 'value' ? (parseFloat(val) || 0) : val
      }
    }));
  };

  const handleRemoveParam = (key) => {
    setParameters(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleAddParam = () => {
    if (!newParameterKey.trim() || newValue === '') return;
    const cleanKey = newParameterKey.trim().toLowerCase().replace(/[\s\-]+/g, '_');
    setParameters(prev => ({
      ...prev,
      [cleanKey]: {
        name: newParameterKey.trim(),
        value: parseFloat(newValue) || 0,
        unit: newUnit,
        requires_verification: false
      }
    }));
    setNewParameterKey('');
    setNewValue('');
  };

  const handleMetadataChange = (field, val) => {
    setMetadata(prev => ({ ...prev, [field]: val }));
  };

  const handleProceed = () => {
    onConfirmAnalysis({
      filename: extractedData.filename,
      file_type: extractedData.file_type,
      file_size: extractedData.file_size,
      intended_use: intendedUse,
      sample_metadata: metadata,
      parameters: parameters
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-sky-50 via-cyan-50 to-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Verify Extracted Water Parameters</h2>
              <p className="text-xs text-slate-500">
                AI extracted the following values from <span className="font-semibold text-slate-800">{extractedData.filename}</span>. Please review and verify accuracy before analysis.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">

          {/* Intended Use Selector Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Intended Water Use (Controls Reference Standards Applied):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'drinking', label: 'Drinking Water', desc: 'BIS IS 10500 & WHO' },
                { id: 'household', label: 'Household Use', desc: 'Washing & Cooking' },
                { id: 'agricultural', label: 'Agricultural', desc: 'Irrigation & Farming' },
                { id: 'industrial', label: 'Industrial', desc: 'Cooling & Process' },
                { id: 'other', label: 'Other', desc: 'General Surface' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setIntendedUse(opt.id)}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    intendedUse === opt.id
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm font-semibold'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300'
                  }`}
                >
                  <div className="text-xs font-bold">{opt.label}</div>
                  <div className={`text-[10px] ${intendedUse === opt.id ? 'text-sky-100' : 'text-slate-400'}`}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Verification Warnings (if any values were unclear) */}
          {warnings.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Verification Notes:</span>
              </div>
              <ul className="text-xs space-y-1 pl-6 list-disc text-amber-700">
                {warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Sample Metadata Cards (Editable) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1">
                <Building className="w-3.5 h-3.5 text-sky-600" />
                <span>Laboratory Name</span>
              </div>
              <input
                type="text"
                value={metadata.laboratory_name || ''}
                onChange={(e) => handleMetadataChange('laboratory_name', e.target.value)}
                placeholder="e.g. State Water Testing Lab"
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1">
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                <span>Sample Date</span>
              </div>
              <input
                type="text"
                value={metadata.sample_date || ''}
                onChange={(e) => handleMetadataChange('sample_date', e.target.value)}
                placeholder="YYYY-MM-DD"
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                <span>Sample Location</span>
              </div>
              <input
                type="text"
                value={metadata.sample_location || ''}
                onChange={(e) => handleMetadataChange('sample_location', e.target.value)}
                placeholder="e.g. Kitchen Tap / Borewell"
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Extracted Parameters Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-slate-900">
                Extracted Parameters ({Object.keys(parameters).length})
              </div>
              <span className="text-xs text-slate-500">
                You can adjust numbers or units if the AI misread any character.
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Parameter</th>
                    <th className="py-2.5 px-4">Measured Value</th>
                    <th className="py-2.5 px-4">Unit</th>
                    <th className="py-2.5 px-4">Reported Limit</th>
                    <th className="py-2.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {Object.entries(parameters).map(([key, item]) => {
                    const isFlagged = item.requires_verification;
                    return (
                      <tr key={key} className={isFlagged ? 'bg-amber-50/50' : 'hover:bg-slate-50'}>
                        <td className="py-2 px-4 font-semibold text-slate-800">
                          <div className="flex items-center space-x-2">
                            <span>{item.name || key.toUpperCase()}</span>
                            {isFlagged && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">
                                Verify
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-4">
                          <input
                            type="number"
                            step="any"
                            value={item.value ?? ''}
                            onChange={(e) => handleParamChange(key, 'value', e.target.value)}
                            className="w-28 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:bg-white focus:ring-1 focus:ring-sky-500"
                          />
                        </td>
                        <td className="py-2 px-4">
                          <input
                            type="text"
                            value={item.unit || ''}
                            onChange={(e) => handleParamChange(key, 'unit', e.target.value)}
                            className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:bg-white focus:ring-1 focus:ring-sky-500"
                          />
                        </td>
                        <td className="py-2 px-4 text-slate-500">
                          {item.reported_limit || 'Standard'}
                        </td>
                        <td className="py-2 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveParam(key)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition"
                            title="Remove parameter"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Quick Add Parameter */}
            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Add Missing Parameter:</span>
              <input
                type="text"
                placeholder="e.g. Lead, Arsenic, Fluoride"
                value={newParameterKey}
                onChange={(e) => setNewParameterKey(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs w-44"
              />
              <input
                type="number"
                step="any"
                placeholder="Value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs w-20"
              />
              <input
                type="text"
                placeholder="Unit"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs w-20"
              />
              <button
                type="button"
                onClick={handleAddParam}
                className="flex items-center space-x-1 px-3 py-1 bg-sky-600 text-white rounded-lg text-xs font-semibold hover:bg-sky-700 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
          >
            Cancel / Choose Another File
          </button>
          
          <button
            type="button"
            onClick={handleProceed}
            className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white text-sm font-bold rounded-xl shadow-md shadow-sky-500/20 hover:shadow-lg transition-all"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>Confirm & Run AI Analysis</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>

      </div>
    </div>
  );
}
