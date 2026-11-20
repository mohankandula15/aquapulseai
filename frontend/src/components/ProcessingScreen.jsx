import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Loader2, 
  FileSearch, 
  SlidersHorizontal, 
  ShieldCheck, 
  BrainCircuit, 
  AlertCircle, 
  Sparkles,
  FileCheck2
} from 'lucide-react';

const STAGES = [
  { id: 1, label: 'Reading uploaded report document', desc: 'Parsing PDF text stream and structure', icon: FileSearch },
  { id: 2, label: 'Extracting water parameters & units', desc: 'Isolating chemical, physical and biological values', icon: SlidersHorizontal },
  { id: 3, label: 'Validating measurements & limits', desc: 'Verifying physical bounds and reference units', icon: ShieldCheck },
  { id: 4, label: 'Comparing with reference standards', desc: 'Benchmarking against BIS IS 10500:2012 & WHO', icon: FileCheck2 },
  { id: 5, label: 'Running ML prediction model', desc: 'Random Forest potability classifier inference', icon: BrainCircuit },
  { id: 6, label: 'Detecting abnormal patterns', desc: 'Isolation Forest anomaly detection check', icon: AlertCircle },
  { id: 7, label: 'Generating AI explanation', desc: 'Translating findings into human-first language', icon: Sparkles },
  { id: 8, label: 'Preparing safety recommendations', desc: 'Formulating tailored precautions and next steps', icon: CheckCircle2 },
];

export default function ProcessingScreen({ onComplete }) {
  const [currentStage, setCurrentStage] = useState(1);

  useEffect(() => {
    // Progress through the 8 stages with realistic timing
    const interval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev < STAGES.length) {
          return prev + 1;
        } else {
          clearInterval(interval);
          if (onComplete) {
            setTimeout(onComplete, 600);
          }
          return prev;
        }
      });
    }, 450);

    return () => clearInterval(interval);
  }, [onComplete]);

  const progressPercent = Math.round((currentStage / STAGES.length) * 100);

  return (
    <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl text-center animate-in fade-in zoom-in-95 duration-300">
      
      {/* Top Animated Pulse */}
      <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-sky-100 animate-ping opacity-75" />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
        Analyzing Water Quality Report
      </h2>
      <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
        AquaPulse AI is benchmarking your water parameters against accredited drinking water standards.
      </p>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-3 mb-8 overflow-hidden p-0.5 border border-slate-200">
        <div 
          className="bg-gradient-to-r from-sky-500 to-cyan-500 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Stages List */}
      <div className="text-left space-y-3 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80">
        {STAGES.map((st) => {
          const isDone = st.id < currentStage;
          const isCurrent = st.id === currentStage;
          const isPending = st.id > currentStage;
          const Icon = st.icon;

          return (
            <div 
              key={st.id}
              className={`flex items-center justify-between p-2.5 rounded-xl transition-all ${
                isCurrent 
                  ? 'bg-white shadow-xs border border-sky-200' 
                  : isDone 
                  ? 'opacity-90' 
                  : 'opacity-40'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  isDone 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : isCurrent 
                    ? 'bg-sky-600 text-white animate-pulse' 
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : st.id}
                </div>
                <div>
                  <div className={`text-xs font-bold ${isCurrent ? 'text-sky-900' : 'text-slate-800'}`}>
                    {st.label}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {st.desc}
                  </div>
                </div>
              </div>

              <div>
                {isDone && (
                  <span className="text-[11px] font-semibold text-emerald-600 px-2 py-0.5 rounded-full bg-emerald-50">
                    Complete
                  </span>
                )}
                {isCurrent && (
                  <span className="flex items-center space-x-1 text-[11px] font-bold text-sky-600 px-2 py-0.5 rounded-full bg-sky-50">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Processing</span>
                  </span>
                )}
                {isPending && (
                  <span className="text-[10px] text-slate-400">Queued</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
