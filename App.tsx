import React, { useState, useRef, useEffect } from 'react';
import ImageDropzone from './components/ImageDropzone';
import { loadImage, splitImage, getTargetDimensions, imageToDataURL } from './utils/imageUtils';
import { downloadPanelsAsZip, downloadFaceTargetsAsZip, downloadChainHistoryAsZip } from './utils/downloadUtils';
import { reimagineImage, detectPanels, fixDetail, runChainCleaningStep, getStoredApiKey, setStoredApiKey } from './services/geminiService';
import { ExtractedPanel, Resolution, AspectRatio, ProcessingMode, GridLayout, BoundingBox, FaceTarget, ChainStep, FixType } from './types';
import { Download, RefreshCw, Trash2, Cpu, Image as ImageIcon, Loader2, Sparkles, Archive, X, CheckSquare, Square, ChevronRight, Zap, ExternalLink, Ban, Play, SlidersHorizontal, RefreshCcw, HelpCircle, Grid2X2, Grid3X3, Scan, FlaskConical, AlertTriangle, Key, LogIn, Columns, Ratio, Eraser, Layers, Plus, ArrowRight, Lock, Unlock, Wand2, ArrowDown, ChevronDown, ZoomIn, Eye, EyeOff, User, PenTool, ShieldCheck, AlertCircle } from 'lucide-react';

// Inline Logo Component for Header
const UngridLogoHeader = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="pixel-grid-header" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
        <path d="M 4 0 L 0 0 0 4" fill="none" stroke="black" strokeOpacity="0.2" strokeWidth="1"/>
      </pattern>
    </defs>
    <g className="fill-[#FFD43B]">
      <rect x="2" y="2" width="18" height="18" /><rect x="2" y="22" width="18" height="18" /><rect x="2" y="42" width="18" height="18" /><rect x="22" y="2" width="18" height="18" /><rect x="22" y="42" width="18" height="18" /><rect x="42" y="2" width="18" height="18" /><rect x="42" y="22" width="18" height="18" />
    </g>
    <g fill="url(#pixel-grid-header)">
      <rect x="2" y="2" width="18" height="18" /><rect x="2" y="22" width="18" height="18" /><rect x="2" y="42" width="18" height="18" /><rect x="22" y="2" width="18" height="18" /><rect x="22" y="42" width="18" height="18" /><rect x="42" y="2" width="18" height="18" /><rect x="42" y="22" width="18" height="18" />
    </g>
  </svg>
);

const LOADING_MESSAGES = [
  "INITIALIZING NEURAL LINK...", "ASKING GEMINI NICELY...", "DETECTING WEIRD SHAPES...", "ENHANCING PIXELS...", "HALLUCINATING DETAILS...", "CALCULATING AESTHETICS...", "RETICULATING SPLINES...", "DIVIDING BY ZERO...", "CONSULTING THE ORACLE...", "ANALYZING ODD PANELS...", "THINKING HARD...", "STILL THINKING...", "RE-ROLLING AESTHETICS...", "APPLYING MAGIC DUST...",
];

const FAQ_ITEMS = [
  { question: "WHAT_IS_UNGRID?", answer: "UnGrid is a specialized tool for deconstructing grid-based image compositions into high-fidelity panels using Gemini 3 Pro." },
  { question: "IS_IT_FREE_TO_USE?", answer: "The interface is free, but you must provide your own API key. This protects the developer from credit leaks." },
  { question: "DOES_IT_SAVE_MY_KEY?", answer: "If you use the 'Manual Entry' tab, your key is saved securely in your browser's localStorage." }
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <div className="w-full border-t border-[#2B2B2B] pt-8 mt-8">
      <h3 className="text-[#5CFF72] font-bold text-sm mb-6 uppercase tracking-widest flex items-center gap-2"><span className="text-[#FFD43B]">//</span> SYSTEM_FAQ_DATABASE</h3>
      <div className="space-y-3">
        {FAQ_ITEMS.map((item, idx) => (
          <div key={idx} className="border border-[#2B2B2B] bg-[#050505] transition-colors hover:border-[#E0E083]/50">
            <button onClick={() => setOpenIndex(openIndex === idx ? null : idx)} className="w-full flex items-center justify-between p-4 text-left group outline-none">
              <span className={`font-mono font-bold text-xs uppercase tracking-wider transition-colors ${openIndex === idx ? 'text-[#FFD43B]' : 'text-[#E0E083] group-hover:text-[#FFD43B]'}`}>{item.question}</span>
              <ChevronRight size={16} className={`text-[#5CFF72] transition-transform duration-300 ${openIndex === idx ? 'rotate-90' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === idx ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
              <p className="px-4 pb-4 text-[11px] text-[#E0E083]/70 font-mono leading-relaxed whitespace-pre-line border-t border-[#2B2B2B] pt-3">{item.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface LightboxProps {
  data: { url: string; originalUrl?: string; title?: string };
  onClose: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ data, onClose }) => {
  const [showOriginal, setShowOriginal] = useState(false);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.code === 'Space') { e.preventDefault(); if(data.originalUrl) setShowOriginal(true); }
    };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') setShowOriginal(false); };
    window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [onClose, data]);
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
       <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute top-6 right-6 text-[#E0E083] hover:text-white p-2 z-50"><X size={32} /></button>
       <div className="relative max-w-full max-h-[85vh] group select-none" onClick={(e) => e.stopPropagation()}>
          <img src={showOriginal && data.originalUrl ? data.originalUrl : data.url} className="max-w-full max-h-[85vh] object-contain border-2 border-[#5CFF72] shadow-[0_0_50px_rgba(92,255,114,0.1)] bg-[#111]" alt="Full view" />
          {data.originalUrl && (
             <div className="absolute top-4 left-4 bg-black/80 border border-[#FFD43B] text-[#FFD43B] px-3 py-1 text-xs font-bold uppercase tracking-widest flex items-center gap-2 pointer-events-none">
                 {showOriginal ? <Eye size={14} /> : <EyeOff size={14} />} {showOriginal ? "ORIGINAL" : "RESULT"}
             </div>
          )}
       </div>
       <div className="mt-6 flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
          {data.originalUrl && (
             <button onMouseDown={() => setShowOriginal(true)} onMouseUp={() => setShowOriginal(false)} onMouseLeave={() => setShowOriginal(false)} className="px-6 py-3 border border-[#FFD43B] text-[#FFD43B] hover:bg-[#FFD43B] hover:text-black font-bold uppercase text-sm tracking-widest flex items-center gap-2 transition-colors"><Layers size={18} /> Hold [Space] to Compare</button>
          )}
          <button onClick={() => { const a = document.createElement('a'); a.href = showOriginal && data.originalUrl ? data.originalUrl : data.url; a.download = `ungrid-view.png`; a.click(); }} className="px-6 py-3 bg-[#5CFF72] text-black border border-[#5CFF72] hover:bg-white font-bold uppercase text-sm tracking-widest flex items-center gap-2 transition-colors"><Download size={18} /> Download</button>
       </div>
    </div>
  );
};

const AuthOverlay = ({ onAuthorize }: { onAuthorize: (method: 'platform' | 'manual', key?: string) => void }) => {
  const [activeTab, setActiveTab] = useState<'platform' | 'manual'>('platform');
  const [manualKey, setManualKey] = useState('');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
      <div className="w-full max-w-xl bg-black border-2 border-[#FFD43B] p-10 shadow-[0_0_100px_rgba(255,212,59,0.1)] relative">
        <h2 className="text-3xl font-black text-[#FFD43B] mb-6 uppercase tracking-tighter text-center">AUTHENTICATION_GATEWAY</h2>
        
        <div className="flex border-b border-[#2B2B2B] mb-8">
           <button onClick={() => setActiveTab('platform')} className={`flex-1 py-3 text-xs font-bold uppercase transition-all ${activeTab === 'platform' ? 'text-[#FFD43B] border-b-2 border-[#FFD43B]' : 'text-[#555] hover:text-[#E0E083]'}`}>Quick Connect</button>
           <button onClick={() => setActiveTab('manual')} className={`flex-1 py-3 text-xs font-bold uppercase transition-all ${activeTab === 'manual' ? 'text-[#FFD43B] border-b-2 border-[#FFD43B]' : 'text-[#555] hover:text-[#E0E083]'}`}>Manual Entry</button>
        </div>

        {activeTab === 'platform' ? (
           <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-[#E0E083] text-sm font-mono mb-8 text-center leading-relaxed">Securely select a Gemini API Key from your Google AI Studio projects.</p>
              <button onClick={() => onAuthorize('platform')} className="w-full bg-[#FFD43B] text-black font-black py-4 hover:bg-white transition-all uppercase text-lg flex items-center justify-center gap-3"><Zap size={20} fill="black" /> CONNECT WITH GOOGLE</button>
           </div>
        ) : (
           <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-[#E0E083] text-sm font-mono mb-6 text-center leading-relaxed">Paste your API Key string. It will be saved locally in your browser storage.</p>
              <input type="password" value={manualKey} onChange={(e) => setManualKey(e.target.value)} placeholder="AIzaSy..." className="w-full bg-[#111] border border-[#2B2B2B] text-white px-4 py-4 focus:outline-none focus:border-[#FFD43B] font-mono text-sm mb-4" />
              <button onClick={() => onAuthorize('manual', manualKey)} disabled={!manualKey.trim()} className="w-full bg-[#5CFF72] text-black font-black py-4 hover:bg-white transition-all uppercase text-lg disabled:bg-[#2B2B2B] disabled:text-[#555]">SAVE_AND_LOGIN</button>
           </div>
        )}

        <div className="mt-8 pt-6 border-t border-[#2B2B2B] text-center">
           <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[#E0E083] text-xs font-mono underline hover:text-[#5CFF72] flex items-center justify-center gap-2">Get your personal key here <ExternalLink size={10} /></a>
        </div>
      </div>
    </div>
  );
};

type AppMode = 'grid_split' | 'face_fix' | 'chain_clean';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>('grid_split');
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [panels, setPanels] = useState<ExtractedPanel[]>([]);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resolution, setResolution] = useState<Resolution>('2K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [mode, setMode] = useState<ProcessingMode>('fidelity');
  const [gridLayout, setGridLayout] = useState<GridLayout>('3x3');
  const [ffTargets, setFfTargets] = useState<FaceTarget[]>([]);
  const [stagingTarget, setStagingTarget] = useState<string | null>(null);
  const [stagingRef, setStagingRef] = useState<string | null>(null);
  const [stagingPos, setStagingPos] = useState<string>('');
  const [stagingFixType, setStagingFixType] = useState<FixType>('face');
  const [isRefLocked, setIsRefLocked] = useState(false);
  const [chainSource, setChainSource] = useState<string | null>(null);
  const [chainRef, setChainRef] = useState<string | null>(null);
  const [chainSteps, setChainSteps] = useState<ChainStep[]>([]);
  const [chainInputText, setChainInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isParamsOpen, setIsParamsOpen] = useState(false);
  const [lightboxData, setLightboxData] = useState<{ url: string; originalUrl?: string; title?: string } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (getStoredApiKey()) {
        setIsAuthorized(true);
        return;
      }
      const win = window as any;
      if (win.aistudio?.hasSelectedApiKey) {
        if (await win.aistudio.hasSelectedApiKey()) setIsAuthorized(true);
      }
    };
    checkAuth();
  }, []);

  const handleAuthorize = async (method: 'platform' | 'manual', key?: string) => {
    if (method === 'manual' && key) {
      setStoredApiKey(key.trim());
      setIsAuthorized(true);
    } else {
      const win = window as any;
      if (win.aistudio?.openSelectKey) {
         await win.aistudio.openSelectKey();
         setIsAuthorized(true);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ungrid_user_api_key');
    window.location.reload();
  };

  const handleImageSelected = async (file: File) => {
    try {
      const img = await loadImage(file);
      const ratio = img.width / img.height;
      let detectedRatio: AspectRatio = ratio > 1.2 ? '16:9' : ratio < 0.8 ? '9:16' : '1:1';
      setAspectRatio(detectedRatio); setOriginalImage(img.src); setPanels([]); 
    } catch (e) { alert("Failed to load image"); }
  };

  const processPanel = async (id: string, currentPanels: ExtractedPanel[], signal: AbortSignal) => {
    if (signal.aborted) return;
    setPanels(prev => prev.map(p => p.id === id ? { ...p, status: 'generating' } : p));
    const panel = currentPanels.find(p => p.id === id);
    if (!panel) return;
    try {
      const newImageUrl = await reimagineImage(panel.originalUrl, resolution, aspectRatio, mode);
      if (!signal.aborted) setPanels(prev => prev.map(p => p.id === id ? { ...p, status: 'success', aiGeneratedUrl: newImageUrl } : p));
    } catch (error: any) {
      if (!signal.aborted) setPanels(prev => prev.map(p => p.id === id ? { ...p, status: 'error' } : p));
    }
  };

  const handleStartProcessing = async () => {
    if (!originalImage) return;
    setIsProcessing(true); setStatusMessage('SPLITTING FRAMES...');
    try {
      const img = new Image(); img.src = originalImage; await img.decode();
      const dims = getTargetDimensions(resolution, aspectRatio);
      let boxes: BoundingBox[] | undefined;
      if (gridLayout === 'irregular') boxes = await detectPanels(imageToDataURL(img, 1024));
      const panelImages = splitImage(img, { rows: gridLayout === '2x2' ? 2 : 3, cols: gridLayout === '2x2' ? 2 : gridLayout === '1x3' ? 1 : 3, targetWidth: dims.width, targetHeight: dims.height, boundingBoxes: boxes });
      const newPanels: ExtractedPanel[] = panelImages.map((src, index) => ({ id: crypto.randomUUID(), index, originalUrl: src, status: 'idle' }));
      setPanels(newPanels);
      abortControllerRef.current = new AbortController();
      for (const panel of newPanels) { if (abortControllerRef.current.signal.aborted) break; await processPanel(panel.id, newPanels, abortControllerRef.current.signal); }
    } finally { setIsProcessing(false); setStatusMessage(''); }
  };

  const reset = () => { if (abortControllerRef.current) abortControllerRef.current.abort(); setIsProcessing(false); setOriginalImage(null); setPanels([]); setFfTargets([]); setChainSource(null); setChainSteps([]); };

  return (
    <div className="min-h-screen bg-black p-4 md:p-8 relative selection:bg-[#5CFF72] selection:text-black">
      {!isAuthorized && <AuthOverlay onAuthorize={handleAuthorize} />}
      {lightboxData && <Lightbox data={lightboxData} onClose={() => setLightboxData(null)} />}

      <header className="max-w-7xl mx-auto mb-8 border-b-2 border-[#2B2B2B] pb-6 flex flex-col items-center gap-6 relative">
         <div className="absolute right-0 top-0">
          <button onClick={handleLogout} className="flex items-center gap-2 text-[#2B2B2B] hover:text-red-500 transition-colors uppercase text-xs font-bold"><Key size={14} /> [ LOGOUT ]</button>
        </div>
        <div className="text-center flex flex-col items-center">
          <UngridLogoHeader className="w-16 h-16 mb-4" />
          <h1 className="text-5xl md:text-6xl font-black mb-1 leading-none tracking-tighter"><span className="text-[#5CFF72] glow-text-green">UNGRID</span><span className="text-xs align-top ml-2 text-[#2B2B2B]">v1.2</span></h1>
          <p className="text-[#FFD43B] font-bold text-lg tracking-widest bg-[#FFD43B]/10 px-2">FRAME BREAKER</p>
        </div>
        <div className="flex bg-[#111] p-1 border border-[#2B2B2B]">
           <button onClick={() => { setAppMode('grid_split'); reset(); }} className={`px-6 py-2 uppercase text-xs font-bold ${appMode === 'grid_split' ? 'bg-[#5CFF72] text-black' : 'text-[#E0E083]'}`}>Grid Split</button>
           <button onClick={() => { setAppMode('face_fix'); reset(); }} className={`px-6 py-2 uppercase text-xs font-bold ${appMode === 'face_fix' ? 'bg-[#5CFF72] text-black' : 'text-[#E0E083]'}`}>Detail Fix</button>
           <button onClick={() => { setAppMode('chain_clean'); reset(); }} className={`px-6 py-2 uppercase text-xs font-bold ${appMode === 'chain_clean' ? 'bg-[#5CFF72] text-black' : 'text-[#E0E083]'}`}>Chain Clean</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {appMode === 'grid_split' && (
          <>
            {!originalImage && <div className="mt-12"><ImageDropzone onImageSelected={handleImageSelected} /><div className="max-w-2xl mx-auto"><FAQSection /></div></div>}
            {originalImage && panels.length === 0 && (
              <div className="grid lg:grid-cols-12 gap-8 border-t border-[#2B2B2B] pt-8">
                 <div className="lg:col-span-5 bg-[#050505] p-6 border border-[#2B2B2B]"><img src={originalImage} className="w-full mb-4" /><button onClick={reset} className="w-full text-[#E0E083] text-xs font-mono uppercase">Change Image</button></div>
                 <div className="lg:col-span-7 bg-[#050505] p-6 border border-[#2B2B2B]">
                    <h2 className="text-xl font-bold text-[#5CFF72] mb-6 uppercase">Parameters</h2>
                    <div className="space-y-8">
                       <div><label className="text-xs text-[#FFD43B] uppercase mb-2 block">Resolution</label><div className="flex gap-2">{(['1K', '2K', '4K'] as Resolution[]).map(r => <button key={r} onClick={() => setResolution(r)} className={`flex-1 py-2 border font-mono ${resolution === r ? 'bg-[#FFD43B] text-black' : 'text-[#E0E083]'}`}>{r}</button>)}</div></div>
                       <button onClick={handleStartProcessing} disabled={isProcessing} className="w-full bg-[#5CFF72] text-black font-bold py-4 uppercase flex items-center justify-center gap-4">{isProcessing ? <Loader2 className="animate-spin" /> : <Cpu />} EXECUTE_SPLIT</button>
                    </div>
                 </div>
              </div>
            )}
            {panels.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-12 pb-24">
                {panels.map((panel) => (
                  <div key={panel.id} className="relative bg-[#050505] border border-[#2B2B2B] p-2 hover:border-[#5CFF72]">
                    <div className={`aspect-video overflow-hidden cursor-pointer`} onClick={() => setLightboxData({ url: panel.aiGeneratedUrl || panel.originalUrl, originalUrl: panel.originalUrl })}>
                      <img src={panel.aiGeneratedUrl || panel.originalUrl} className={`w-full h-full object-cover ${panel.status === 'generating' ? 'opacity-50 blur-sm' : ''}`} />
                    </div>
                    <div className="flex justify-between mt-2 px-1"><span className="text-[#E0E083] font-mono text-xs">PANEL_0{panel.index+1}</span>{panel.aiGeneratedUrl && <button onClick={() => { const a = document.createElement('a'); a.href = panel.aiGeneratedUrl!; a.download = `panel.png`; a.click(); }} className="text-[#5CFF72]"><Download size={14} /></button>}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <div className="fixed bottom-0 left-0 w-full bg-black/90 border-t border-[#2B2B2B] py-2 px-4 flex justify-between items-center text-[10px] font-mono text-[#5CFF72] z-50">
           <div>STATUS: {isProcessing ? 'PROCESSING' : 'IDLE'} <span className="text-[#E0E083] ml-4">{statusMessage}</span></div>
           <div className="text-[#2B2B2B]">BYOK_MODE // VER_1.2.5</div>
      </div>
    </div>
  );
};

export default App;