import React, { useState, useRef, useEffect } from 'react';
import ImageDropzone from './components/ImageDropzone';
import { loadImage, splitImage, getTargetDimensions, imageToDataURL } from './utils/imageUtils';
import { downloadPanelsAsZip, downloadFaceTargetsAsZip, downloadChainHistoryAsZip } from './utils/downloadUtils';
import { reimagineImage, detectPanels, setStoredApiKey, getStoredApiKey, hasValidKey, fixDetail, runChainCleaningStep } from './services/geminiService';
import { ExtractedPanel, Resolution, AspectRatio, ProcessingMode, GridLayout, BoundingBox, FaceTarget, ChainStep, FixType } from './types';
import { Download, RefreshCw, Trash2, Cpu, Image as ImageIcon, Loader2, Sparkles, Archive, X, CheckSquare, Square, ChevronRight, Zap, ExternalLink, Ban, Play, SlidersHorizontal, RefreshCcw, HelpCircle, Grid2X2, Grid3X3, Scan, FlaskConical, AlertTriangle, Key, LogIn, Columns, Ratio, Eraser, Layers, Plus, ArrowRight, Lock, Unlock, Wand2, ArrowDown, ChevronDown, ZoomIn, Eye, EyeOff, User, PenTool } from 'lucide-react';

// Inline Logo Component for Header
const UngridLogoHeader = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="pixel-grid-header" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
        <path d="M 4 0 L 0 0 0 4" fill="none" stroke="black" strokeOpacity="0.2" strokeWidth="1"/>
      </pattern>
    </defs>
    <g className="fill-[#FFD43B]">
      <rect x="2" y="2" width="18" height="18" />
      <rect x="2" y="22" width="18" height="18" />
      <rect x="2" y="42" width="18" height="18" />
      <rect x="22" y="2" width="18" height="18" />
      <rect x="22" y="42" width="18" height="18" />
      <rect x="42" y="2" width="18" height="18" />
      <rect x="42" y="22" width="18" height="18" />
    </g>
    <g fill="url(#pixel-grid-header)">
      <rect x="2" y="2" width="18" height="18" />
      <rect x="2" y="22" width="18" height="18" />
      <rect x="2" y="42" width="18" height="18" />
      <rect x="22" y="2" width="18" height="18" />
      <rect x="22" y="42" width="18" height="18" />
      <rect x="42" y="2" width="18" height="18" />
      <rect x="42" y="22" width="18" height="18" />
    </g>
  </svg>
);

const LOADING_MESSAGES = [
  "INITIALIZING NEURAL LINK...",
  "ASKING GEMINI NICELY...",
  "DETECTING WEIRD SHAPES...",
  "ENHANCING PIXELS...",
  "HALLUCINATING DETAILS...",
  "CALCULATING AESTHETICS...",
  "RETICULATING SPLINES...",
  "DIVIDING BY ZERO...",
  "CONSULTING THE ORACLE...",
  "ANALYZING ODD PANELS...",
  "THINKING HARD...",
  "STILL THINKING...",
  "RE-ROLLING AESTHETICS...",
  "APPLYING MAGIC DUST...",
];

const FAQ_ITEMS = [
  {
    question: "WHAT_IS_UNGRID?",
    answer: "UnGrid is a specialized tool for deconstructing grid-based image compositions (like 3x3 or 2x2 generated grids) into individual, high-fidelity panels. It uses AI to essentially 're-photograph' each crop at a higher resolution."
  },
  {
    question: "WHAT_IS_DETAIL_FIX?",
    answer: "Detail Fix (formerly Face Fix) is a targeted cleaning tool with two modes:\n1. **Face Fix:** Specialized for restoring eyes, mouths, and expressions on facial crops.\n2. **Linework Fix:** Specialized for cleaning up full-body outlines, removing artifacts, and applying style references to larger character poses."
  },
  {
    question: "WHAT_IS_CHAIN_CLEANING?",
    answer: "Chain Cleaning is a multi-turn restoration tool. You build a 'Recipe' of steps (e.g., 1. Denoise, 2. Fix Eyes). The app executes them in order, feeding the result of step 1 into step 2, allowing for precise, layered restoration without manual re-uploading."
  },
  {
    question: "HOW_DO_I_LOGIN_OR_USE_A_KEY?",
    answer: "UnGrid is a 'Bring Your Own Key' application. You have two options:\n1. **Google Quick Connect:** Uses your Google account to authorize the app securely without copying keys.\n2. **Manual Key:** If you have a specific API key string, you can paste it manually. It is stored locally in your browser."
  },
  {
    question: "IS_IT_FREE_TO_USE?",
    answer: "The interface is free, but you need a Gemini API Key (paid or free tier) from Google AI Studio. We provide links to get one in the API menu."
  }
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="w-full border-t border-[#2B2B2B] pt-8 mt-8">
      <h3 className="text-[#5CFF72] font-bold text-sm mb-6 uppercase tracking-widest flex items-center gap-2">
        <span className="text-[#FFD43B]">//</span> SYSTEM_FAQ_DATABASE
      </h3>
      <div className="space-y-3">
        {FAQ_ITEMS.map((item, idx) => (
          <div key={idx} className="border border-[#2B2B2B] bg-[#050505] transition-colors hover:border-[#E0E083]/50">
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full flex items-center justify-between p-4 text-left group outline-none"
            >
              <span className={`font-mono font-bold text-xs uppercase tracking-wider transition-colors ${openIndex === idx ? 'text-[#FFD43B]' : 'text-[#E0E083] group-hover:text-[#FFD43B]'}`}>
                {item.question}
              </span>
              <ChevronRight 
                size={16} 
                className={`text-[#5CFF72] transition-transform duration-300 ${openIndex === idx ? 'rotate-90' : ''}`}
              />
            </button>
            <div 
              className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === idx ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <p className="px-4 pb-4 text-[11px] text-[#E0E083]/70 font-mono leading-relaxed whitespace-pre-line border-t border-[#2B2B2B] pt-3">
                {item.answer}
              </p>
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
      if (e.code === 'Space') {
          // Prevent scrolling, but be careful with buttons
          e.preventDefault(); 
          if(data.originalUrl) setShowOriginal(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space') setShowOriginal(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onClose, data]);

  const downloadCurrent = () => {
      const a = document.createElement('a');
      a.href = showOriginal && data.originalUrl ? data.originalUrl : data.url;
      a.download = `ungrid-view-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
       <button 
         onClick={(e) => { e.stopPropagation(); onClose(); }} 
         className="absolute top-6 right-6 text-[#E0E083] hover:text-white p-2 z-50"
       >
         <X size={32} />
       </button>
       
       <div 
         className="relative max-w-full max-h-[85vh] group select-none"
         onClick={(e) => e.stopPropagation()}
       >
          <img 
            src={showOriginal && data.originalUrl ? data.originalUrl : data.url} 
            className="max-w-full max-h-[85vh] object-contain border-2 border-[#5CFF72] shadow-[0_0_50px_rgba(92,255,114,0.1)] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMTExIi8+CjxwYXRoIGQ9Ik0wIDBMODg4IiBzdHJva2U9IiMyMjIiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')]"
            alt="Full view"
          />
          {data.originalUrl && (
             <div className="absolute top-4 left-4 bg-black/80 border border-[#FFD43B] text-[#FFD43B] px-3 py-1 text-xs font-bold uppercase tracking-widest flex items-center gap-2 pointer-events-none">
                 {showOriginal ? <Eye size={14} /> : <EyeOff size={14} />}
                 {showOriginal ? "ORIGINAL SOURCE" : "AI RESULT"}
             </div>
          )}
       </div>

       <div 
         className="mt-6 flex items-center gap-4"
         onClick={(e) => e.stopPropagation()}
       >
          {data.originalUrl && (
             <button 
                onMouseDown={() => setShowOriginal(true)}
                onMouseUp={() => setShowOriginal(false)}
                onMouseLeave={() => setShowOriginal(false)}
                onTouchStart={() => setShowOriginal(true)}
                onTouchEnd={() => setShowOriginal(false)}
                className="px-6 py-3 border border-[#FFD43B] text-[#FFD43B] hover:bg-[#FFD43B] hover:text-black font-bold uppercase text-sm tracking-widest flex items-center gap-2 transition-colors"
             >
                <Layers size={18} /> Hold [Space] to Compare
             </button>
          )}
          <button 
            onClick={downloadCurrent}
            className="px-6 py-3 bg-[#5CFF72] text-black border border-[#5CFF72] hover:bg-white font-bold uppercase text-sm tracking-widest flex items-center gap-2 transition-colors"
          >
             <Download size={18} /> Download
          </button>
       </div>
    </div>
  );
};

const ApiKeyModal = ({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void 
}) => {
  const [key, setKey] = useState('');
  
  useEffect(() => {
    if (isOpen) {
      setKey(getStoredApiKey() || '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (key.trim().length > 0) {
      setStoredApiKey(key.trim());
      onClose();
    }
  };

  const handleGoogleConnect = async () => {
    try {
      // Cast to any to avoid TypeScript conflicts if window.aistudio types are globally defined differently
      const win = window as any;
      if (win.aistudio && win.aistudio.openSelectKey) {
        await win.aistudio.openSelectKey();
        onClose();
      } else {
        alert("Google AI Studio integration is not available in this environment. Please use manual entry.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to connect with Google.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-lg bg-black border-2 border-[#FFD43B] p-8 shadow-[0_0_50px_rgba(255,212,59,0.2)]">
        <h2 className="text-2xl font-black text-[#FFD43B] mb-2 uppercase tracking-tight flex items-center gap-2">
           <Key className="inline" /> Authentication
        </h2>
        <p className="text-[#E0E083] text-xs font-mono mb-6 leading-relaxed">
          UnGrid requires access to the Gemini API. Choose your preferred method.
        </p>

        {/* Option 1: Google Connect */}
        <div className="mb-8 border-b border-[#2B2B2B] pb-8">
           <h3 className="text-[#5CFF72] font-bold uppercase text-sm mb-3">Option 1: Quick Connect (Recommended)</h3>
           <p className="text-[#E0E083]/60 text-[10px] mb-4">Securely authorize using your Google Account via AI Studio.</p>
           <button 
             onClick={handleGoogleConnect}
             className="w-full bg-[#5CFF72] text-black font-bold py-3 hover:bg-white transition-colors uppercase text-sm flex items-center justify-center gap-2"
           >
             <Zap size={16} fill="black"/> Connect with Google
           </button>
        </div>

        {/* Option 2: Manual */}
        <div className="mb-6">
          <h3 className="text-[#FFD43B] font-bold uppercase text-sm mb-3">Option 2: Manual Entry</h3>
          <p className="text-[#E0E083]/60 text-[10px] mb-4">Paste your API Key directly. It is stored locally in your browser.</p>
          <input 
            type="password" 
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full bg-[#111] border border-[#2B2B2B] text-white px-4 py-3 focus:outline-none focus:border-[#FFD43B] font-mono text-sm mb-3"
          />
          <button 
            onClick={handleSave}
            className="w-full bg-[#2B2B2B] border border-[#FFD43B] text-[#FFD43B] font-bold py-2 hover:bg-[#FFD43B] hover:text-black transition-colors uppercase text-xs"
           >
             Save Manual Key
           </button>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#2B2B2B]">
           <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#E0E083] text-xs font-mono underline hover:text-white flex items-center gap-1"
          >
            Don't have a key? Get one here <ExternalLink size={10} />
          </a>
           <button 
             onClick={onClose}
             className="text-[#E0E083] hover:text-white uppercase text-xs font-bold"
           >
             [ Close ]
           </button>
        </div>
      </div>
    </div>
  );
};

type AppMode = 'grid_split' | 'face_fix' | 'chain_clean';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>('grid_split');

  // --- Grid Split State ---
  const [panels, setPanels] = useState<ExtractedPanel[]>([]);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resolution, setResolution] = useState<Resolution>('2K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [mode, setMode] = useState<ProcessingMode>('fidelity');
  const [gridLayout, setGridLayout] = useState<GridLayout>('3x3');
  
  // --- Detail Fix (Face/Line) State ---
  const [ffTargets, setFfTargets] = useState<FaceTarget[]>([]);
  const [stagingTarget, setStagingTarget] = useState<string | null>(null);
  const [stagingRef, setStagingRef] = useState<string | null>(null);
  const [stagingPos, setStagingPos] = useState<string>('');
  const [stagingFixType, setStagingFixType] = useState<FixType>('face');
  const [isRefLocked, setIsRefLocked] = useState(false);

  // --- Chain Cleaning State ---
  const [chainSource, setChainSource] = useState<string | null>(null);
  const [chainRef, setChainRef] = useState<string | null>(null);
  const [chainSteps, setChainSteps] = useState<ChainStep[]>([]);
  const [chainInputText, setChainInputText] = useState('');

  // --- Shared State ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isParamsOpen, setIsParamsOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [lightboxData, setLightboxData] = useState<{ url: string; originalUrl?: string; title?: string } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const hasAiResults = panels.some(p => p.status === 'success');
  const isAllComplete = panels.length > 0 && panels.every(p => p.status === 'success');

  // --- Effects ---

  // Auto-switch aspect ratio based on layout (Grid Split)
  useEffect(() => {
    if (gridLayout === '1x3') {
      setAspectRatio('9:16');
    }
  }, [gridLayout]);

  // Dynamic Loading Text
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isProcessing) {
      // Check if current message is one of the generic ones (or empty).
      // If it is NOT (e.g., "FIXING FACE 1..."), we do NOT cycle.
      const isGeneric = !statusMessage || LOADING_MESSAGES.includes(statusMessage);

      if (!isGeneric) {
        // Stop any existing cycle and respect the custom message.
        return; 
      }

      if (!statusMessage) setStatusMessage(LOADING_MESSAGES[0]);
      
      interval = setInterval(() => {
        setStatusMessage(prev => {
           // Double check inside interval
           if (!LOADING_MESSAGES.includes(prev)) return prev;

           const currentIdx = LOADING_MESSAGES.indexOf(prev);
           const nextIdx = (currentIdx + 1) % LOADING_MESSAGES.length;
           return LOADING_MESSAGES[nextIdx];
        });
      }, 15000); // 15 seconds
    }
    return () => clearInterval(interval);
  }, [isProcessing, statusMessage]);

  // --- Handlers: Grid Split ---

  const handleImageSelected = async (file: File) => {
    try {
      const img = await loadImage(file);
      const ratio = img.width / img.height;
      let detectedRatio: AspectRatio = '16:9';
      
      if (Math.abs(ratio - 1) < 0.15) detectedRatio = '1:1';
      else if (ratio < 0.8) detectedRatio = '9:16';
      else detectedRatio = '16:9';

      setAspectRatio(detectedRatio);
      setOriginalImage(img.src);
      
      if (detectedRatio === '16:9') setGridLayout('3x3');

      setPanels([]); 
    } catch (error) {
      console.error("Error loading image:", error);
      alert("Failed to load image");
    }
  };

  const processPanel = async (id: string, currentPanels: ExtractedPanel[], signal: AbortSignal) => {
    if (signal.aborted) return;
    setPanels(prev => prev.map(p => p.id === id ? { ...p, status: 'generating' } : p));
    const panel = currentPanels.find(p => p.id === id);
    if (!panel) return;

    try {
      if (signal.aborted) throw new Error("Cancelled");
      const newImageUrl = await reimagineImage(panel.originalUrl, resolution, aspectRatio, mode);
      if (signal.aborted) throw new Error("Cancelled");

      setPanels(prev => prev.map(p => p.id === id ? { 
        ...p, 
        status: 'success', 
        aiGeneratedUrl: newImageUrl 
      } : p));
    } catch (error: any) {
      if (error.message === "Cancelled" || signal.aborted) return;
      if (error.message === "MISSING_API_KEY") {
        setIsKeyModalOpen(true);
        setIsProcessing(false);
        return;
      }
      console.error(error);
      setPanels(prev => prev.map(p => p.id === id ? { ...p, status: 'error' } : p));
    }
  };

  const handleStartProcessing = async () => {
    if (!originalImage || !hasValidKey()) {
      if (!hasValidKey()) setIsKeyModalOpen(true);
      return;
    }

    try {
      setIsProcessing(true);
      setStatusMessage('INITIALIZING NEURAL LINK...');
      const img = new Image();
      img.src = originalImage;
      await img.decode();
      const dims = getTargetDimensions(resolution, aspectRatio);
      
      let currentBoundingBoxes: BoundingBox[] | undefined = undefined;
      if (gridLayout === 'irregular') {
         setStatusMessage('DETECTING WEIRD SHAPES...');
         try {
           const base64Str = imageToDataURL(img, 1024);
           currentBoundingBoxes = await detectPanels(base64Str);
           if (!currentBoundingBoxes || currentBoundingBoxes.length === 0) {
              alert("Auto-detect couldn't find any distinct panels. Falling back to default grid.");
           }
         } catch (e: any) {
            if (e.message === "MISSING_API_KEY") {
              setIsKeyModalOpen(true);
              setIsProcessing(false);
              return;
            }
            alert("Auto-Detection Failed.");
            setIsProcessing(false);
            return;
         }
      }

      setStatusMessage('SPLITTING FRAMES...');
      let rows = 3; let cols = 3;
      if (gridLayout === '2x2') { rows = 2; cols = 2; }
      else if (gridLayout === '1x3') { rows = 1; cols = 3; }

      const panelImages = splitImage(img, { rows, cols, targetWidth: dims.width, targetHeight: dims.height, boundingBoxes: currentBoundingBoxes });
      const newPanels: ExtractedPanel[] = panelImages.map((src, index) => ({ id: crypto.randomUUID(), index, originalUrl: src, status: 'idle' }));
      setPanels(newPanels);
      setStatusMessage('THINKING HARD...');

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      for (const panel of newPanels) {
        if (signal.aborted) break;
        await processPanel(panel.id, newPanels, signal);
      }
      if (!signal.aborted) {
        setIsProcessing(false);
        setStatusMessage('');
      }
    } catch (error: any) {
      console.error("Error starting process:", error);
      setIsProcessing(false);
    }
  };

  const handleResumeProcessing = async () => {
    if (isProcessing || !hasValidKey()) {
      if (!hasValidKey()) setIsKeyModalOpen(true);
      return;
    }
    const remaining = panels.filter(p => p.status !== 'success');
    if (remaining.length === 0) return;
    setIsProcessing(true);
    setStatusMessage('RESUMING...');
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    for (const panel of remaining) {
      if (signal.aborted) break;
      await processPanel(panel.id, panels, signal);
    }
    if (!signal.aborted) setIsProcessing(false);
  };

  const handleRetryPanel = async (id: string) => {
     if (isProcessing || !hasValidKey()) {
      if (!hasValidKey()) setIsKeyModalOpen(true);
      return;
    }
     setIsProcessing(true);
     abortControllerRef.current = new AbortController();
     await processPanel(id, panels, abortControllerRef.current.signal);
     setIsProcessing(false);
  };

  // --- Handlers: Face Fix / Detail Fix ---

  const handleStagingTargetSelected = async (file: File) => {
    try {
      const img = await loadImage(file);
      setStagingTarget(img.src);
    } catch(e) { alert("Error loading target"); }
  };

  const handleStagingRefSelected = async (file: File) => {
    try {
      const img = await loadImage(file);
      setStagingRef(img.src);
    } catch(e) { alert("Error loading reference"); }
  };

  const handleAddToQueue = () => {
    if (!stagingTarget || !stagingRef) return;
    
    if (ffTargets.length >= 5) {
      alert("Max 5 jobs in queue allowed.");
      return;
    }

    const newJob: FaceTarget = {
      id: crypto.randomUUID(),
      targetUrl: stagingTarget,
      referenceUrl: stagingRef,
      fixType: stagingFixType,
      position: stagingPos,
      status: 'idle',
      result: null
    };

    setFfTargets(prev => [...prev, newJob]);
    setStagingTarget(null);
    if (!isRefLocked) {
        setStagingRef(null);
    }
    setStagingPos('');
  };

  const handleRemoveJob = (id: string) => {
    if (isProcessing) return;
    setFfTargets(prev => prev.filter(t => t.id !== id));
  };

  const handleExecuteFaceFix = async (forceAll: boolean = false) => {
    if (ffTargets.length === 0) return;
    if (!hasValidKey()) {
      setIsKeyModalOpen(true);
      return;
    }

    const toProcess = forceAll ? ffTargets : ffTargets.filter(t => t.status !== 'success');
    if (toProcess.length === 0) {
      if (window.confirm("All items are complete. Re-run all?")) {
         handleExecuteFaceFix(true);
         return;
      } else {
        return;
      }
    }

    setIsProcessing(true);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      for (const job of toProcess) {
        if (signal.aborted) break;
        setFfTargets(prev => prev.map(t => t.id === job.id ? { ...t, status: 'processing' } : t));
        const typeLabel = job.fixType === 'face' ? 'FACE' : 'LINES';
        setStatusMessage(`FIXING ${typeLabel} ${ffTargets.findIndex(t => t.id === job.id) + 1} / ${ffTargets.length}...`);

        try {
          const targetImg = new Image(); targetImg.src = job.targetUrl; await targetImg.decode();
          const targetBase64 = imageToDataURL(targetImg);
          const refImg = new Image(); refImg.src = job.referenceUrl; await refImg.decode();
          const refBase64 = imageToDataURL(refImg);
          
          const resultBase64 = await fixDetail(targetBase64, refBase64, resolution, job.fixType, job.position);
          
          if (signal.aborted) break;
          setFfTargets(prev => prev.map(t => t.id === job.id ? { ...t, status: 'success', result: resultBase64 } : t));
        } catch (e: any) {
          if (signal.aborted) break;
          console.error(e);
          setFfTargets(prev => prev.map(t => t.id === job.id ? { ...t, status: 'error' } : t));
        }
      }
    } catch (error: any) {
      console.error(error);
      alert("Batch processing stopped: " + error.message);
    } finally {
      setIsProcessing(false);
      // Only clear if successful finish or full abort, if loop broke early it clears too.
      // But we might want to see the last message? 
      // The requirement was about cycling speed. We clear it to be clean.
      setStatusMessage('');
    }
  };

  const handleRerunSingleFaceFix = async (id: string) => {
     if (isProcessing || !hasValidKey()) {
         if (!hasValidKey()) setIsKeyModalOpen(true);
         return;
     }
     
     const target = ffTargets.find(t => t.id === id);
     if (!target) return;

     setIsProcessing(true);
     abortControllerRef.current = new AbortController();
     const signal = abortControllerRef.current.signal;

     setFfTargets(prev => prev.map(t => t.id === id ? { ...t, status: 'processing' } : t));
     setStatusMessage("RE-RUNNING SINGLE JOB...");

     try {
          const targetImg = new Image(); targetImg.src = target.targetUrl; await targetImg.decode();
          const targetBase64 = imageToDataURL(targetImg);
          const refImg = new Image(); refImg.src = target.referenceUrl; await refImg.decode();
          const refBase64 = imageToDataURL(refImg);
          
          const resultBase64 = await fixDetail(targetBase64, refBase64, resolution, target.fixType, target.position);
          
          if (!signal.aborted) {
              setFfTargets(prev => prev.map(t => t.id === id ? { ...t, status: 'success', result: resultBase64 } : t));
          }
     } catch (e) {
          if (!signal.aborted) {
               console.error(e);
               setFfTargets(prev => prev.map(t => t.id === id ? { ...t, status: 'error' } : t));
          }
     } finally {
          setIsProcessing(false);
          setStatusMessage('');
     }
  };

  // --- Handlers: Chain Cleaning ---

  const handleChainSourceSelected = async (file: File) => {
    try {
        const img = await loadImage(file);
        setChainSource(img.src);
    } catch(e) { alert("Error loading source"); }
  };

  const handleChainRefSelected = async (file: File) => {
    try {
        const img = await loadImage(file);
        setChainRef(img.src);
    } catch(e) { alert("Error loading reference"); }
  };

  const handleAddChainStep = (instruction: string) => {
      setChainSteps(prev => [...prev, {
          id: crypto.randomUUID(),
          instruction,
          status: 'pending'
      }]);
      setChainInputText('');
  };

  const handleRemoveChainStep = (id: string) => {
      if (isProcessing) return;
      setChainSteps(prev => prev.filter(s => s.id !== id));
  };

  const handleExecuteChain = async () => {
      if (!chainSource || chainSteps.length === 0) return;
      if (!hasValidKey()) { setIsKeyModalOpen(true); return; }

      setIsProcessing(true);
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Prepare Initial Image
      let currentImage = chainSource;
      let refImageBase64: string | null = null;

      if (chainRef) {
          const refImg = new Image(); refImg.src = chainRef; await refImg.decode();
          refImageBase64 = imageToDataURL(refImg);
      }

      try {
          // Reset steps to pending if re-running
          setChainSteps(prev => prev.map(s => ({ ...s, status: 'pending', resultUrl: undefined })));

          for (let i = 0; i < chainSteps.length; i++) {
              if (signal.aborted) break;

              const step = chainSteps[i];
              setChainSteps(prev => prev.map(s => s.id === step.id ? { ...s, status: 'processing' } : s));
              setStatusMessage(`EXECUTING CHAIN STEP ${i+1}/${chainSteps.length}: ${step.instruction.toUpperCase()}...`);

              try {
                 // Ensure currentImage is base64 for API
                 const imgObj = new Image(); imgObj.src = currentImage; await imgObj.decode();
                 const currentBase64 = imageToDataURL(imgObj);

                 const result = await runChainCleaningStep(currentBase64, refImageBase64, step.instruction, resolution);
                 
                 if (signal.aborted) break;

                 // Update step with result
                 setChainSteps(prev => prev.map(s => s.id === step.id ? { ...s, status: 'completed', resultUrl: result } : s));
                 
                 // Update current image for next iteration
                 currentImage = result;

              } catch (e) {
                 if (signal.aborted) break;
                 console.error(e);
                 setChainSteps(prev => prev.map(s => s.id === step.id ? { ...s, status: 'error' } : s));
                 // Break chain on error
                 break;
              }
          }

      } catch (error: any) {
          console.error(error);
          alert("Chain execution failed: " + error.message);
      } finally {
          setIsProcessing(false);
          setStatusMessage('');
      }
  };

  // --- Shared Handlers ---

  const handleCancel = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setIsProcessing(false);
    setStatusMessage('');
    if (appMode === 'grid_split') {
        setPanels(prev => prev.map(p => (p.status === 'analyzing' || p.status === 'generating') ? { ...p, status: 'idle' } : p));
    } else if (appMode === 'face_fix') {
        setFfTargets(prev => prev.map(t => t.status === 'processing' ? { ...t, status: 'idle' } : t));
    } else if (appMode === 'chain_clean') {
        // Chain clean usually just stops where it is
    }
  };

  const reset = () => {
    handleCancel();
    if (appMode === 'grid_split') {
        setPanels([]);
        setOriginalImage(null);
    } else if (appMode === 'face_fix') {
        setFfTargets([]);
        setStagingTarget(null);
        setStagingRef(null);
        setStagingPos('');
        setStagingFixType('face');
        setIsRefLocked(false);
    } else if (appMode === 'chain_clean') {
        setChainSource(null);
        setChainRef(null);
        setChainSteps([]);
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-black p-4 md:p-8 relative selection:bg-[#5CFF72] selection:text-black">
      
      <ApiKeyModal isOpen={isKeyModalOpen} onClose={() => setIsKeyModalOpen(false)} />
      
      {lightboxData && (
          <Lightbox 
             data={lightboxData} 
             onClose={() => setLightboxData(null)} 
          />
      )}

      {/* Grid Split Config Modal */}
      {isParamsOpen && appMode === 'grid_split' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
           <div className="bg-black border-2 border-[#5CFF72] p-6 w-96 shadow-[0_0_20px_rgba(92,255,114,0.2)] animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between mb-6 border-b border-[#2B2B2B] pb-2">
                <h3 className="text-[#5CFF72] font-bold text-lg flex items-center gap-2 uppercase">
                   <SlidersHorizontal size={20} /> Parameters
                </h3>
                <button onClick={() => setIsParamsOpen(false)} className="text-[#FFD43B] hover:text-[#5CFF72]">
                  <X size={20} strokeWidth={3} />
                </button>
              </div>
              <div className="space-y-6">
                   <div>
                    <label className="text-xs text-[#FFD43B] uppercase font-bold mb-2 block">Grid Layout</label>
                    <div className="grid grid-cols-4 gap-2">
                       <button onClick={() => setGridLayout('3x3')} className={`p-2 border text-[10px] font-bold uppercase transition-all flex flex-col items-center justify-center gap-1 ${gridLayout === '3x3' ? 'bg-[#5CFF72] text-black border-[#5CFF72]' : 'border-[#2B2B2B] text-[#E0E083] hover:border-[#E0E083]'}`}>
                           <Grid3X3 size={14} /> 3x3
                        </button>
                        <button onClick={() => setGridLayout('2x2')} className={`p-2 border text-[10px] font-bold uppercase transition-all flex flex-col items-center justify-center gap-1 ${gridLayout === '2x2' ? 'bg-[#5CFF72] text-black border-[#5CFF72]' : 'border-[#2B2B2B] text-[#E0E083] hover:border-[#E0E083]'}`}>
                           <Grid2X2 size={14} /> 2x2
                        </button>
                        <button onClick={() => setGridLayout('1x3')} className={`p-2 border text-[10px] font-bold uppercase transition-all flex flex-col items-center justify-center gap-1 ${gridLayout === '1x3' ? 'bg-[#5CFF72] text-black border-[#5CFF72]' : 'border-[#2B2B2B] text-[#E0E083] hover:border-[#E0E083]'}`}>
                           <Columns size={14} /> 1x3
                        </button>
                        <button onClick={() => setGridLayout('irregular')} className={`p-4 border text-left transition-all ${gridLayout === 'irregular' ? 'border-[#5CFF72] bg-[#5CFF72]/10' : 'border-[#2B2B2B] hover:border-[#E0E083]'}`}>
                           <Scan size={14} /> AUTO
                        </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#FFD43B] uppercase font-bold mb-2 block">Panel Aspect Ratio</label>
                    <div className="grid grid-cols-3 gap-2">
                       <button onClick={() => setAspectRatio('16:9')} className={`p-2 border text-[10px] font-bold uppercase transition-all ${aspectRatio === '16:9' ? 'bg-[#5CFF72] text-black border-[#5CFF72]' : 'border-[#2B2B2B] text-[#E0E083] hover:border-[#E0E083]'}`}>16:9</button>
                        <button onClick={() => setAspectRatio('1:1')} className={`p-2 border text-[10px] font-bold uppercase transition-all ${aspectRatio === '1:1' ? 'bg-[#5CFF72] text-black border-[#5CFF72]' : 'border-[#2B2B2B] text-[#E0E083] hover:border-[#E0E083]'}`}>1:1</button>
                        <button onClick={() => setAspectRatio('9:16')} className={`p-2 border text-[10px] font-bold uppercase transition-all ${aspectRatio === '9:16' ? 'bg-[#5CFF72] text-black border-[#5CFF72]' : 'border-[#2B2B2B] text-[#E0E083] hover:border-[#E0E083]'}`}>9:16</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#FFD43B] uppercase font-bold mb-2 block">Processing Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['fidelity', 'creative'] as ProcessingMode[]).map((m) => (
                        <button key={m} onClick={() => setMode(m)} className={`p-2 border text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${mode === m ? 'bg-[#5CFF72] text-black border-[#5CFF72]' : 'border-[#2B2B2B] text-[#E0E083] hover:border-[#E0E083]'}`}>
                           {m === 'fidelity' ? <Zap size={14}/> : <Sparkles size={14}/>} {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#FFD43B] uppercase font-bold mb-2 block">Resolution</label>
                    <div className="flex gap-4">
                      {(['1K', '2K', '4K'] as Resolution[]).map((res) => (
                         <button key={res} onClick={() => setResolution(res)} className={`px-6 py-3 border text-sm font-bold font-mono transition-all ${resolution === res ? 'bg-[#FFD43B] text-black border-[#FFD43B]' : 'bg-transparent text-[#E0E083] border-[#2B2B2B] hover:border-[#FFD43B]'}`}>[{res}]</button>
                      ))}
                    </div>
                  </div>
                <button onClick={() => setIsParamsOpen(false)} className="w-full bg-[#2B2B2B] text-[#E0E083] font-bold py-2 border border-[#2B2B2B] hover:bg-[#5CFF72] hover:text-black hover:border-[#5CFF72] transition-colors uppercase text-sm">Apply & Close</button>
              </div>
           </div>
        </div>
      )}

      {/* Header & Navigation */}
      <header className="max-w-7xl mx-auto mb-8 border-b-2 border-[#2B2B2B] pb-6 flex flex-col items-center justify-center gap-6 relative">
         <div className="absolute right-0 top-0">
          <button onClick={() => setIsKeyModalOpen(true)} className="flex items-center gap-2 text-[#2B2B2B] hover:text-[#5CFF72] transition-colors" title="Edit API Key">
             <Key size={16} />
             <span className="text-xs font-bold uppercase hidden md:inline">API KEY</span>
          </button>
        </div>

        <div className="text-center flex flex-col items-center">
          <div className="mb-4">
            <UngridLogoHeader className="w-16 h-16 drop-shadow-[0_0_8px_rgba(255,212,59,0.3)]" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-1 leading-none tracking-tighter">
            <span className="text-[#5CFF72] glow-text-green">UNGRID</span>
            <span className="text-xs align-top ml-2 text-[#2B2B2B]">v1.0</span>
          </h1>
          <p className="text-[#FFD43B] font-bold text-lg tracking-widest bg-[#FFD43B]/10 inline-block px-2 mb-2">
            FRAME BREAKER
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center justify-center gap-1 bg-[#111] p-1 border border-[#2B2B2B] rounded-sm">
           <button 
             onClick={() => { setAppMode('grid_split'); reset(); }}
             className={`px-6 py-2 uppercase text-xs font-bold transition-all flex items-center gap-2 
             ${appMode === 'grid_split' ? 'bg-[#5CFF72] text-black' : 'text-[#E0E083] hover:text-white'}`}
           >
             <Grid2X2 size={14} /> Grid Split
           </button>
           <button 
             onClick={() => { setAppMode('face_fix'); reset(); }}
             className={`px-6 py-2 uppercase text-xs font-bold transition-all flex items-center gap-2 
             ${appMode === 'face_fix' ? 'bg-[#5CFF72] text-black' : 'text-[#E0E083] hover:text-white'}`}
           >
             <Eraser size={14} /> Detail Fix
           </button>
           <button 
             onClick={() => { setAppMode('chain_clean'); reset(); }}
             className={`px-6 py-2 uppercase text-xs font-bold transition-all flex items-center gap-2 
             ${appMode === 'chain_clean' ? 'bg-[#5CFF72] text-black' : 'text-[#E0E083] hover:text-white'}`}
           >
             <Wand2 size={14} /> Chain Clean
           </button>
        </div>
        
        {/* Toolbar - Conditional */}
        {appMode === 'grid_split' && panels.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 items-center mt-4 animate-in fade-in slide-in-from-top-4">
            {isProcessing ? (
               <button onClick={handleCancel} className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-black uppercase text-sm font-bold flex items-center gap-2 transition-colors animate-pulse">
                <Ban size={16} /> ABORT
              </button>
            ) : (
              <>
                 {!isAllComplete && (
                   <button onClick={handleResumeProcessing} className="px-4 py-2 border border-[#5CFF72] text-[#5CFF72] hover:bg-[#5CFF72] hover:text-black uppercase text-sm font-bold flex items-center gap-2 transition-colors">
                    <Play size={16} /> RESUME
                  </button>
                 )}
                 <button onClick={handleStartProcessing} className="px-4 py-2 border border-[#FFD43B] text-[#FFD43B] hover:bg-[#FFD43B] hover:text-black uppercase text-sm font-bold flex items-center gap-2 transition-colors">
                    <RefreshCcw size={16} /> RERUN ALL
                  </button>
                 <button onClick={() => setIsParamsOpen(true)} className="px-4 py-2 border border-[#E0E083] text-[#E0E083] hover:bg-[#E0E083] hover:text-black uppercase text-sm font-bold flex items-center gap-2 transition-colors">
                  <SlidersHorizontal size={16} /> CONFIG
                </button>
                 <button onClick={reset} className="px-4 py-2 border border-[#2B2B2B] text-[#2B2B2B] hover:bg-[#2B2B2B] hover:text-[#E0E083] uppercase text-sm font-bold flex items-center gap-2 transition-colors">
                  <Trash2 size={16} /> RESET
                </button>
              </>
            )}
            <div className="w-px h-6 bg-[#2B2B2B] mx-2 hidden md:block"></div>
            <button onClick={() => downloadPanelsAsZip(panels, 'original', resolution)} className="px-4 py-2 border border-[#E0E083] text-[#E0E083] hover:bg-[#E0E083] hover:text-black uppercase text-sm font-bold flex items-center gap-2 transition-colors">
              <Archive size={16} /> RAW
            </button>
             {hasAiResults && (
              <button onClick={() => downloadPanelsAsZip(panels, 'ai', resolution)} className="px-4 py-2 bg-[#5CFF72] text-black border border-[#5CFF72] hover:bg-white uppercase text-sm font-bold flex items-center gap-2 transition-colors">
                <Archive size={16} /> RESULTS
              </button>
            )}
          </div>
        )}

        {/* Toolbar - Face Fix */}
        {appMode === 'face_fix' && (ffTargets.length > 0 || stagingTarget || stagingRef) && (
           <div className="flex flex-wrap justify-center gap-2 items-center mt-4">
             {isProcessing ? (
                <button onClick={handleCancel} className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-black uppercase text-sm font-bold flex items-center gap-2 transition-colors animate-pulse">
                <Ban size={16} /> ABORT
              </button>
             ) : (
                <>
                  {ffTargets.some(t => t.result) && (
                     <button onClick={() => downloadFaceTargetsAsZip(ffTargets, resolution)} className="px-4 py-2 bg-[#5CFF72] text-black border border-[#5CFF72] hover:bg-white uppercase text-sm font-bold flex items-center gap-2 transition-colors">
                        <Archive size={16} /> DOWNLOAD ALL
                     </button>
                  )}
                  {ffTargets.length > 0 && (
                     <button onClick={() => handleExecuteFaceFix(true)} className="px-4 py-2 border border-[#FFD43B] text-[#FFD43B] hover:bg-[#FFD43B] hover:text-black uppercase text-sm font-bold flex items-center gap-2 transition-colors">
                        <RefreshCcw size={16} /> RERUN ALL
                     </button>
                  )}
                  <button onClick={reset} className="px-4 py-2 border border-[#2B2B2B] text-[#2B2B2B] hover:bg-[#2B2B2B] hover:text-[#E0E083] uppercase text-sm font-bold flex items-center gap-2 transition-colors">
                    <Trash2 size={16} /> START OVER
                  </button>
                </>
             )}
           </div>
        )}

        {/* Toolbar - Chain Clean */}
        {appMode === 'chain_clean' && (
           <div className="flex flex-wrap justify-center gap-2 items-center mt-4">
             {isProcessing ? (
                <button onClick={handleCancel} className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-black uppercase text-sm font-bold flex items-center gap-2 transition-colors animate-pulse">
                <Ban size={16} /> ABORT
              </button>
             ) : (
                <>
                 {chainSteps.some(s => s.resultUrl) && (
                     <button onClick={() => downloadChainHistoryAsZip(chainSteps, resolution)} className="px-4 py-2 bg-[#5CFF72] text-black border border-[#5CFF72] hover:bg-white uppercase text-sm font-bold flex items-center gap-2 transition-colors">
                        <Archive size={16} /> DOWNLOAD STEPS
                     </button>
                  )}
                  {chainSource && chainSteps.length > 0 && (
                     <button onClick={handleExecuteChain} className="px-4 py-2 bg-[#5CFF72] text-black border border-[#5CFF72] hover:bg-white uppercase text-sm font-bold flex items-center gap-2 transition-colors">
                        <Play size={16} /> RUN CHAIN
                     </button>
                  )}
                  {chainSource && (
                    <button onClick={reset} className="px-4 py-2 border border-[#2B2B2B] text-[#2B2B2B] hover:bg-[#2B2B2B] hover:text-[#E0E083] uppercase text-sm font-bold flex items-center gap-2 transition-colors">
                        <Trash2 size={16} /> START OVER
                    </button>
                  )}
                </>
             )}
           </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto">
        
        {/* --- GRID SPLIT MODE --- */}
        {appMode === 'grid_split' && (
          <>
            {/* VIEW 1: UPLOAD */}
            {!originalImage && (
              <div className="mt-12">
                <ImageDropzone onImageSelected={handleImageSelected} />
                <div className="max-w-2xl mx-auto">
                   <FAQSection />
                </div>
              </div>
            )}

            {/* VIEW 2: CONFIGURATION DASHBOARD */}
            {originalImage && panels.length === 0 && (
              <div className="grid lg:grid-cols-12 gap-8 border-t border-l border-[#2B2B2B] p-1">
                 {/* Left Column: Preview */}
                 <div className="lg:col-span-5 bg-[#050505] p-6 border-b border-r border-[#2B2B2B]">
                    <div className="flex items-center justify-between text-[#FFD43B] mb-4 text-xs font-bold uppercase tracking-widest">
                      <span>> Source_Preview</span>
                      <span>{aspectRatio}</span>
                    </div>
                    <div className="relative border border-[#2B2B2B] mb-4 group">
                      <img src={originalImage} className="w-full h-auto transition-all" alt="Original" />
                    </div>
                    <button onClick={reset} className="w-full text-[#E0E083] hover:text-[#FFD43B] text-xs font-mono py-2 text-right hover:underline">
                      [ ABORT_SELECTION ]
                    </button>
                    <FAQSection />
                 </div>

                 {/* Right Column: Parameters */}
                 <div className="lg:col-span-7 bg-[#050505] p-6 border-b border-r border-[#2B2B2B] flex flex-col h-full">
                    <h2 className="text-xl font-bold text-[#5CFF72] mb-6 border-b border-[#5CFF72] inline-block pb-1 uppercase">
                      Operation Parameters
                    </h2>
                    <div className="space-y-8 flex-grow">
                      <div>
                        <label className="text-xs text-[#FFD43B] uppercase font-bold mb-3 block border-l-2 border-[#FFD43B] pl-2">1. Grid Layout</label>
                        <div className="grid grid-cols-4 gap-4">
                          <button onClick={() => setGridLayout('3x3')} className={`p-4 border text-left transition-all ${gridLayout === '3x3' ? 'border-[#5CFF72] bg-[#5CFF72]/10' : 'border-[#2B2B2B] hover:border-[#E0E083]'}`}>
                            <div className="flex items-center gap-2 mb-2 text-[#5CFF72] font-bold uppercase text-sm"><Grid3X3 size={16} /> 3x3 Grid</div>
                          </button>
                          <button onClick={() => setGridLayout('2x2')} className={`p-4 border text-left transition-all ${gridLayout === '2x2' ? 'border-[#5CFF72] bg-[#5CFF72]/10' : 'border-[#2B2B2B] hover:border-[#E0E083]'}`}>
                             <div className="flex items-center gap-2 mb-2 text-[#FFD43B] font-bold uppercase text-sm"><Grid2X2 size={16} /> 2x2 Grid</div>
                          </button>
                          <button onClick={() => setGridLayout('1x3')} className={`p-4 border text-left transition-all ${gridLayout === '1x3' ? 'border-[#5CFF72] bg-[#5CFF72]/10' : 'border-[#2B2B2B] hover:border-[#E0E083]'}`}>
                             <div className="flex items-center gap-2 mb-2 text-[#5CFF72] font-bold uppercase text-sm"><Columns size={16} /> 1x3 Strip</div>
                          </button>
                          <button onClick={() => setGridLayout('irregular')} className={`p-4 border text-left transition-all ${gridLayout === 'irregular' ? 'border-[#5CFF72] bg-[#5CFF72]/10' : 'border-[#2B2B2B] hover:border-[#E0E083]'}`}>
                             <div className="flex items-center gap-2 mb-2 text-[#5CFF72] font-bold uppercase text-sm"><Scan size={16} /> Auto</div>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div>
                            <label className="text-xs text-[#FFD43B] uppercase font-bold mb-3 block border-l-2 border-[#FFD43B] pl-2">2. Processing Mode</label>
                            <div className="flex gap-2">
                                <button onClick={() => setMode('fidelity')} className={`flex-1 py-3 border text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${mode === 'fidelity' ? 'bg-[#5CFF72] text-black border-[#5CFF72]' : 'border-[#2B2B2B] text-[#E0E083] hover:border-[#E0E083]'}`}>
                                   <Zap size={14}/> Fidelity
                                </button>
                                <button onClick={() => setMode('creative')} className={`flex-1 py-3 border text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${mode === 'creative' ? 'bg-[#5CFF72] text-black border-[#5CFF72]' : 'border-[#2B2B2B] text-[#E0E083] hover:border-[#E0E083]'}`}>
                                   <Sparkles size={14}/> Creative
                                </button>
                            </div>
                         </div>
                         <div>
                            <label className="text-xs text-[#FFD43B] uppercase font-bold mb-3 block border-l-2 border-[#FFD43B] pl-2">3. Aspect Ratio</label>
                            <div className="flex gap-2">
                                <button onClick={() => setAspectRatio('16:9')} className={`flex-1 py-3 border text-[10px] font-bold uppercase transition-all ${aspectRatio === '16:9' ? 'bg-[#5CFF72] text-black border-[#5CFF72]' : 'border-[#2B2B2B] text-[#E0E083] hover:border-[#E0E083]'}`}>16:9</button>
                                <button onClick={() => setAspectRatio('1:1')} className={`flex-1 py-3 border text-[10px] font-bold uppercase transition-all ${aspectRatio === '1:1' ? 'bg-[#5CFF72] text-black border-[#5CFF72]' : 'border-[#2B2B2B] text-[#E0E083] hover:border-[#E0E083]'}`}>1:1</button>
                                <button onClick={() => setAspectRatio('9:16')} className={`flex-1 py-3 border text-[10px] font-bold uppercase transition-all ${aspectRatio === '9:16' ? 'bg-[#5CFF72] text-black border-[#5CFF72]' : 'border-[#2B2B2B] text-[#E0E083] hover:border-[#E0E083]'}`}>9:16</button>
                            </div>
                         </div>
                      </div>

                      <div>
                          <label className="text-xs text-[#FFD43B] uppercase font-bold mb-3 block border-l-2 border-[#FFD43B] pl-2">4. Target Resolution</label>
                          <div className="flex gap-4">
                            {(['1K', '2K', '4K'] as Resolution[]).map((res) => (
                               <button key={res} onClick={() => setResolution(res)} className={`flex-1 py-4 border text-sm font-bold font-mono transition-all ${resolution === res ? 'bg-[#FFD43B] text-black border-[#FFD43B]' : 'bg-transparent text-[#E0E083] border-[#2B2B2B] hover:border-[#FFD43B]'}`}>[{res}]</button>
                            ))}
                          </div>
                      </div>

                      <div className="pt-4">
                         <button onClick={handleStartProcessing} disabled={isProcessing} className={`w-full text-black text-lg font-bold py-4 border-2 transition-colors uppercase tracking-widest flex items-center justify-center gap-4 group ${isProcessing ? 'bg-[#5CFF72]/20 border-[#5CFF72] text-[#5CFF72]' : 'bg-[#5CFF72] border-[#5CFF72] hover:bg-transparent hover:text-[#5CFF72]'}`}>
                          {isProcessing ? (<><Loader2 size={24} className="animate-spin" /><span>PROCESSING...</span></>) : (<><Cpu size={24} /><span>EXECUTE_SPLIT</span></>)}
                        </button>
                      </div>
                    </div>
                 </div>
              </div>
            )}

            {/* VIEW 3: RESULTS GRID */}
            {panels.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-12">
                {panels.map((panel) => (
                  <div key={panel.id} className="relative group bg-[#050505] border border-[#2B2B2B] hover:border-[#5CFF72] transition-colors p-2">
                    <div className="absolute top-4 left-4 z-10 pointer-events-none">
                       {panel.status === 'generating' && (<div className="bg-black/80 text-[#5CFF72] px-2 py-1 text-xs font-bold border border-[#5CFF72] flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> GENERATING...</div>)}
                       {panel.status === 'error' && (<div className="bg-red-900/90 text-white px-2 py-1 text-xs font-bold border border-red-500 flex items-center gap-2"><AlertTriangle size={12} /> ERROR</div>)}
                       {panel.status === 'success' && (<div className="bg-[#5CFF72]/90 text-black px-2 py-1 text-xs font-bold flex items-center gap-2"><CheckSquare size={12} /> DONE</div>)}
                    </div>
                    <div 
                      onClick={() => setLightboxData({ url: panel.aiGeneratedUrl || panel.originalUrl, originalUrl: panel.originalUrl })}
                      className={`relative ${aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'} bg-black overflow-hidden mb-2 cursor-pointer`}
                    >
                      <img src={panel.aiGeneratedUrl || panel.originalUrl} className={`w-full h-full object-cover transition-all duration-700 ${panel.status === 'generating' ? 'opacity-50 blur-sm scale-105' : 'opacity-100 scale-100'}`} alt={`Panel ${panel.index}`} />
                      
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 flex items-center justify-center">
                         <div className="bg-black/80 border border-[#5CFF72] text-[#5CFF72] p-2 rounded-full">
                            <ZoomIn size={24} />
                         </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-2">
                      <span className="text-[#E0E083] font-mono text-xs">PANEL_0{panel.index + 1}</span>
                      <div className="flex gap-2">
                         <button 
                            onClick={() => handleRetryPanel(panel.id)} 
                            disabled={isProcessing} 
                            className="p-1.5 text-[#E0E083] hover:text-[#FFD43B] hover:bg-[#2B2B2B]"
                            title="Rerun this panel"
                          >
                           <RefreshCw size={14} className={isProcessing ? 'opacity-50' : ''} />
                         </button>
                         {panel.aiGeneratedUrl && (
                           <button 
                             onClick={() => downloadImage(panel.aiGeneratedUrl!, `ungrid-panel-${panel.index+1}.png`)} 
                             className="p-1.5 text-[#5CFF72] hover:text-white hover:bg-[#2B2B2B]"
                             title="Download"
                           >
                              <Download size={14} />
                           </button>
                         )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* --- FACE FIX / DETAIL FIX MODE --- */}
        {appMode === 'face_fix' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
             
             {/* 1. COMPOSE JOB AREA: Side by Side */}
             <div className="mb-12 border-b border-[#2B2B2B] pb-8">
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-2">
                     <h2 className="text-[#5CFF72] font-bold text-sm uppercase">1. Compose New Job</h2>
                     <span className="text-[#E0E083] text-xs font-mono">({ffTargets.length}/5 in queue)</span>
                   </div>
                   <button onClick={() => { setStagingTarget(null); setStagingRef(null); setStagingPos(''); setIsRefLocked(false); }} className="text-[#E0E083] text-[10px] hover:text-white uppercase">Clear Staging</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8 mb-4">
                  {/* LEFT: TARGET */}
                  <div className="relative">
                     {stagingTarget ? (
                       <div className="h-64 border border-[#5CFF72] bg-[#050505] relative flex flex-col">
                          <div className="absolute top-2 right-2 z-10">
                             <button onClick={() => setStagingTarget(null)} className="bg-black/80 text-red-500 hover:text-white p-1 border border-red-500"><X size={14}/></button>
                          </div>
                          <div className="flex-grow flex items-center justify-center p-2 overflow-hidden">
                             <img src={stagingTarget} className="max-w-full max-h-full object-contain" />
                          </div>
                          <div className="bg-[#5CFF72] text-black text-[10px] font-bold px-2 py-1 uppercase text-center">
                             Target Image
                          </div>
                       </div>
                     ) : (
                       <div className="h-64">
                          <ImageDropzone 
                            onImageSelected={handleStagingTargetSelected} 
                            title="> TARGET IMAGE"
                            description="Image to be fixed (Face crop or Full Body)"
                            compact={true}
                          />
                       </div>
                     )}
                  </div>

                  {/* RIGHT: REFERENCE */}
                  <div className="relative">
                     {stagingRef ? (
                       <div className={`h-64 border ${isRefLocked ? 'border-[#5CFF72] shadow-[0_0_10px_rgba(92,255,114,0.2)]' : 'border-[#FFD43B]'} bg-[#050505] relative flex flex-col transition-all duration-300`}>
                          <div className="absolute top-2 right-2 z-10 flex gap-2">
                             <button 
                               onClick={() => setIsRefLocked(!isRefLocked)} 
                               className={`p-1 border transition-all ${isRefLocked ? 'bg-[#5CFF72] text-black border-[#5CFF72]' : 'bg-black/80 text-[#FFD43B] border-[#FFD43B] hover:text-white'}`}
                               title={isRefLocked ? "Reference Locked (Won't clear after add)" : "Reference Unlocked (Will clear after add)"}
                             >
                               {isRefLocked ? <Lock size={14} /> : <Unlock size={14} />}
                             </button>
                             <button onClick={() => { setStagingRef(null); setIsRefLocked(false); }} className="bg-black/80 text-red-500 hover:text-white p-1 border border-red-500"><X size={14}/></button>
                          </div>
                          <div className="flex-grow flex items-center justify-center p-2 overflow-hidden">
                             <img src={stagingRef} className="max-w-full max-h-full object-contain" />
                          </div>
                          <div className={`${isRefLocked ? 'bg-[#5CFF72]' : 'bg-[#FFD43B]'} text-black text-[10px] font-bold px-2 py-1 uppercase text-center flex items-center justify-center gap-2`}>
                             {isRefLocked ? <Lock size={10} /> : null} Reference Image
                          </div>
                       </div>
                     ) : (
                       <div className="h-64">
                          <ImageDropzone 
                            onImageSelected={handleStagingRefSelected} 
                            title="> REFERENCE"
                            description="Source / Character Sheet (High Fidelity)"
                            compact={true}
                          />
                       </div>
                     )}
                  </div>
                </div>

                {/* BOTTOM: CONTEXT, MODE & ADD */}
                <div className="flex flex-col md:flex-row gap-4 items-stretch">
                   {/* Mode Selector */}
                   <div className="flex gap-2 bg-[#111] p-1 border border-[#2B2B2B]">
                      <button
                        onClick={() => setStagingFixType('face')}
                        className={`px-4 py-2 uppercase text-[10px] font-bold transition-all flex items-center gap-2 
                        ${stagingFixType === 'face' ? 'bg-[#5CFF72] text-black' : 'text-[#E0E083] hover:text-white'}`}
                      >
                         <User size={14} /> Face Fix
                      </button>
                      <button
                        onClick={() => setStagingFixType('line')}
                        className={`px-4 py-2 uppercase text-[10px] font-bold transition-all flex items-center gap-2 
                        ${stagingFixType === 'line' ? 'bg-[#FFD43B] text-black' : 'text-[#E0E083] hover:text-white'}`}
                      >
                         <PenTool size={14} /> Linework Fix
                      </button>
                   </div>

                   <div className="flex-grow">
                      <input 
                        type="text" 
                        value={stagingPos}
                        onChange={(e) => setStagingPos(e.target.value)}
                        placeholder="Optional Context: e.g. looking left, cinematic lighting..."
                        className="w-full h-full bg-[#111] border border-[#2B2B2B] text-white px-4 py-3 focus:outline-none focus:border-[#5CFF72] font-mono text-sm placeholder:text-[#333]"
                      />
                   </div>
                   <button 
                     onClick={handleAddToQueue}
                     disabled={!stagingTarget || !stagingRef || ffTargets.length >= 5}
                     className={`px-8 py-3 uppercase font-bold text-sm flex items-center gap-2 transition-all
                     ${(!stagingTarget || !stagingRef || ffTargets.length >= 5) 
                        ? 'bg-[#2B2B2B] text-[#555] cursor-not-allowed' 
                        : 'bg-[#5CFF72] text-black hover:bg-white'}`}
                   >
                     <Plus size={18} /> Add to Queue
                   </button>
                </div>
             </div>

             {/* 2. QUEUE LIST */}
             {ffTargets.length > 0 && (
                <div className="mb-12 animate-in slide-in-from-bottom-2">
                   <div className="flex items-center gap-2 mb-4">
                     <h2 className="text-[#FFD43B] font-bold text-sm uppercase">2. Processing Queue</h2>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-4">
                      {ffTargets.map((job, index) => (
                         <div key={job.id} className={`border p-2 bg-[#050505] flex flex-col md:flex-row gap-4 transition-all relative ${job.status === 'processing' ? 'border-[#5CFF72] shadow-[0_0_15px_rgba(92,255,114,0.1)]' : 'border-[#2B2B2B]'}`}>
                            
                            {/* Inputs Column */}
                            <div className="flex flex-col gap-2 w-full md:w-48 shrink-0">
                               <div className="flex justify-between items-center">
                                  <span className="text-[#5CFF72] font-bold text-xs uppercase">> JOB_0{index + 1}</span>
                                  <div className="flex items-center gap-2">
                                     {job.status === 'success' && <CheckSquare size={14} className="text-[#5CFF72]" />}
                                     {job.status === 'error' && <AlertTriangle size={14} className="text-red-500" />}
                                     {job.status === 'processing' && <Loader2 size={14} className="animate-spin text-[#5CFF72]" />}
                                     <button onClick={() => handleRemoveJob(job.id)} className={`text-red-500 hover:text-white ${isProcessing ? 'hidden' : ''}`}><X size={14}/></button>
                                  </div>
                               </div>

                               <div className={`text-[10px] font-bold uppercase px-2 py-1 text-center border
                                 ${job.fixType === 'face' ? 'border-[#5CFF72] text-[#5CFF72]' : 'border-[#FFD43B] text-[#FFD43B]'}`}>
                                   {job.fixType === 'face' ? 'FACE FIX' : 'LINE FIX'}
                               </div>

                               <div className="flex gap-1 h-20">
                                  <div className="w-1/2 border border-[#2B2B2B] relative group">
                                     <img src={job.targetUrl} className="w-full h-full object-cover opacity-70" />
                                     <div className="absolute bottom-0 left-0 bg-black/80 text-[8px] text-[#5CFF72] px-1 w-full truncate">TARGET</div>
                                  </div>
                                  <div className="w-1/2 border border-[#2B2B2B] relative group">
                                     <img src={job.referenceUrl} className="w-full h-full object-cover opacity-70" />
                                     <div className="absolute bottom-0 left-0 bg-black/80 text-[8px] text-[#FFD43B] px-1 w-full truncate">REF</div>
                                  </div>
                               </div>
                               <div className="text-[10px] text-[#555] truncate font-mono px-1">
                                 {job.position || "No context"}
                               </div>
                            </div>

                            {/* Result Area (Takes remaining space) */}
                            <div className="flex-grow bg-black/30 border-l border-[#2B2B2B] pl-0 md:pl-4 min-h-[150px] flex items-center justify-center relative">
                               {job.result ? (
                                 <div 
                                    onClick={() => setLightboxData({ url: job.result!, title: `Detail Fix Result #${index+1}` })}
                                    className="relative w-full h-full flex items-center justify-center group cursor-pointer"
                                 >
                                    <img src={job.result} className="max-w-full max-h-[300px] object-contain shadow-lg" />
                                    {/* Overlay Actions */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 pointer-events-none">
                                        <div className="bg-black border border-[#5CFF72] text-[#5CFF72] p-2 rounded-full">
                                            <ZoomIn size={24} />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-2 right-2 flex gap-2 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                       <button 
                                          onClick={(e) => { e.stopPropagation(); handleRerunSingleFaceFix(job.id); }}
                                          disabled={isProcessing}
                                          className="bg-[#2B2B2B] text-[#FFD43B] p-2 rounded-full border border-[#FFD43B] hover:bg-[#FFD43B] hover:text-black transition-colors"
                                          title="Rerun this job"
                                       >
                                          <RefreshCw size={20} className={isProcessing ? 'animate-spin' : ''} />
                                       </button>
                                       <button 
                                          onClick={(e) => { e.stopPropagation(); downloadImage(job.result!, `detail-fix-${index+1}.png`); }}
                                          className="bg-[#5CFF72] text-black p-2 rounded-full border border-[#5CFF72] hover:bg-white transition-colors"
                                          title="Download result"
                                       >
                                          <Download size={20} />
                                       </button>
                                    </div>
                                 </div>
                               ) : (
                                 <div className="text-[#333] text-xs font-mono flex flex-col items-center gap-2">
                                    <Sparkles size={16} />
                                    <span>PENDING EXECUTION</span>
                                 </div>
                               )}
                            </div>

                         </div>
                      ))}
                   </div>
                </div>
             )}

             {/* 3. EXECUTION CONTROL */}
             {ffTargets.length > 0 && (
                <div className="max-w-2xl mx-auto border-t border-[#2B2B2B] pt-8 pb-20">
                   {/* Resolution Selector for Face Fix */}
                   <div className="mb-8">
                      <label className="text-[#FFD43B] text-xs font-bold uppercase mb-2 block text-center">
                        Global Target Resolution
                      </label>
                      <div className="flex justify-center gap-4">
                        {(['1K', '2K', '4K'] as Resolution[]).map((res) => (
                           <button
                             key={res}
                             onClick={() => setResolution(res)}
                             className={`px-6 py-2 border text-sm font-bold font-mono transition-all
                             ${resolution === res ? 'bg-[#FFD43B] text-black border-[#FFD43B]' : 'bg-transparent text-[#E0E083] border-[#2B2B2B] hover:border-[#FFD43B]'}`}
                           >
                             [{res}]
                           </button>
                        ))}
                      </div>
                   </div>

                   <button
                      onClick={() => handleExecuteFaceFix(false)}
                      disabled={isProcessing}
                      className={`w-full text-black text-lg font-bold py-4 border-2 transition-colors uppercase tracking-widest flex items-center justify-center gap-4 group
                      ${isProcessing 
                        ? 'bg-[#5CFF72]/20 border-[#5CFF72] text-[#5CFF72]' 
                        : 'bg-[#5CFF72] border-[#5CFF72] hover:bg-transparent hover:text-[#5CFF72]'}`}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 size={24} className="animate-spin" />
                          <span>PROCESSING BATCH...</span>
                        </>
                      ) : (
                        <>
                          <Zap size={24} />
                          <span>EXECUTE SEQUENCE</span>
                        </>
                      )}
                    </button>
                </div>
             )}
             
             {ffTargets.length === 0 && !stagingTarget && !stagingRef && (
                <div className="max-w-2xl mx-auto mt-12">
                   <FAQSection />
                </div>
             )}
          </div>
        )}

        {/* --- CHAIN CLEAN MODE --- */}
        {appMode === 'chain_clean' && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pb-20">
               
               {/* COLUMN 1: INPUTS */}
               <div className="lg:col-span-3 space-y-4">
                  <div className="bg-[#050505] border border-[#2B2B2B] p-4">
                      <h3 className="text-[#5CFF72] font-bold text-xs uppercase mb-3 flex items-center gap-2"><ImageIcon size={14}/> 1. Source Image</h3>
                      {chainSource ? (
                          <div className="relative border border-[#2B2B2B] group">
                              <img src={chainSource} className="w-full h-auto" />
                              <button onClick={() => setChainSource(null)} className="absolute top-1 right-1 bg-black text-red-500 p-1 border border-red-500"><X size={12}/></button>
                          </div>
                      ) : (
                          <ImageDropzone 
                            onImageSelected={handleChainSourceSelected} 
                            compact={true} 
                            title="SOURCE"
                            description="[INPUT]: Source Image (To be cleaned)"
                          />
                      )}
                  </div>
                  <div className="bg-[#050505] border border-[#2B2B2B] p-4">
                      <h3 className="text-[#FFD43B] font-bold text-xs uppercase mb-3 flex items-center gap-2"><Layers size={14}/> 2. Reference (Opt)</h3>
                      {chainRef ? (
                          <div className="relative border border-[#2B2B2B] group">
                              <img src={chainRef} className="w-full h-auto" />
                              <button onClick={() => setChainRef(null)} className="absolute top-1 right-1 bg-black text-red-500 p-1 border border-red-500"><X size={12}/></button>
                          </div>
                      ) : (
                          <ImageDropzone 
                            onImageSelected={handleChainRefSelected} 
                            compact={true} 
                            title="REF STYLE" 
                            description="[INPUT]: Reference Image (For Style/Details)"
                          />
                      )}
                  </div>
                  <div className="bg-[#050505] border border-[#2B2B2B] p-4">
                       <h3 className="text-[#E0E083] font-bold text-xs uppercase mb-3">Resolution</h3>
                       <div className="flex gap-2">
                        {(['1K', '2K', '4K'] as Resolution[]).map((res) => (
                           <button
                             key={res}
                             onClick={() => setResolution(res)}
                             className={`flex-1 py-1 border text-xs font-bold font-mono transition-all
                             ${resolution === res ? 'bg-[#E0E083] text-black border-[#E0E083]' : 'bg-transparent text-[#555] border-[#2B2B2B] hover:border-[#E0E083]'}`}
                           >
                             {res}
                           </button>
                        ))}
                      </div>
                  </div>
               </div>

               {/* COLUMN 2: RECIPE BUILDER */}
               <div className="lg:col-span-4 bg-[#050505] border border-[#2B2B2B] p-4 flex flex-col h-[80vh] sticky top-4">
                   <h3 className="text-[#5CFF72] font-bold text-xs uppercase mb-4 flex items-center gap-2"><Wand2 size={14}/> 3. Chain Recipe</h3>
                   
                   <div className="flex-grow overflow-y-auto space-y-4 mb-4 pr-2">
                       {chainSteps.length === 0 && (
                           <div className="text-center text-[#333] py-12 text-xs font-mono border-2 border-dashed border-[#2B2B2B]">
                               NO STEPS ADDED.<br/>ADD INSTRUCTIONS BELOW.
                           </div>
                       )}
                       {chainSteps.map((step, index) => (
                           <div key={step.id} className="relative flex items-center">
                               {/* Connector Line */}
                               {index < chainSteps.length - 1 && (
                                   <div className="absolute left-[15px] top-[30px] w-0.5 h-10 bg-[#2B2B2B] z-0"></div>
                               )}
                               
                               <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-black
                                   ${step.status === 'completed' ? 'border-[#5CFF72] text-[#5CFF72]' : 
                                     step.status === 'processing' ? 'border-[#FFD43B] text-[#FFD43B]' : 
                                     step.status === 'error' ? 'border-red-500 text-red-500' : 
                                     'border-[#555] text-[#555]'}`}>
                                   <span className="text-xs font-bold">{index + 1}</span>
                               </div>
                               <div className={`ml-4 flex-grow p-3 border text-xs font-bold uppercase flex justify-between items-center
                                   ${step.status === 'processing' ? 'bg-[#FFD43B]/10 border-[#FFD43B] text-[#FFD43B]' : 
                                     step.status === 'completed' ? 'bg-[#5CFF72]/10 border-[#5CFF72] text-[#5CFF72]' :
                                     'bg-[#111] border-[#2B2B2B] text-[#E0E083]'}`}>
                                   <span>{step.instruction}</span>
                                   <button 
                                      onClick={() => handleRemoveChainStep(step.id)} 
                                      className="text-red-500 opacity-50 hover:opacity-100"
                                      disabled={isProcessing}
                                    >
                                       <X size={14}/>
                                   </button>
                               </div>
                           </div>
                       ))}
                   </div>

                   {/* Add Step Controls */}
                   <div className="border-t border-[#2B2B2B] pt-4">
                       <label className="text-[#555] text-[10px] font-bold uppercase mb-2 block">Quick Presets</label>
                       <div className="flex flex-wrap gap-2 mb-4">
                           {["Denoise", "Deblur", "Fix Eyes", "Clean Lines", "Fix Distortion"].map(preset => (
                               <button 
                                 key={preset}
                                 onClick={() => handleAddChainStep(preset)}
                                 disabled={isProcessing}
                                 className="px-2 py-1 border border-[#2B2B2B] text-[#E0E083] text-[10px] hover:bg-[#E0E083] hover:text-black uppercase transition-colors"
                               >
                                   + {preset}
                               </button>
                           ))}
                       </div>
                       <div className="flex gap-2">
                           <input 
                             type="text" 
                             value={chainInputText}
                             onChange={(e) => setChainInputText(e.target.value)}
                             onKeyDown={(e) => e.key === 'Enter' && handleAddChainStep(chainInputText)}
                             placeholder="Custom instruction..."
                             disabled={isProcessing}
                             className="flex-grow bg-[#111] border border-[#2B2B2B] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#5CFF72]"
                           />
                           <button 
                             onClick={() => handleAddChainStep(chainInputText)}
                             disabled={!chainInputText.trim() || isProcessing}
                             className="bg-[#2B2B2B] text-[#5CFF72] px-3 py-2 border border-[#2B2B2B] hover:bg-[#5CFF72] hover:text-black font-bold uppercase text-xs"
                           >
                               ADD
                           </button>
                       </div>
                   </div>
               </div>

               {/* COLUMN 3: EXECUTION / OUTPUT */}
               <div className="lg:col-span-5 space-y-6">
                   <h3 className="text-[#FFD43B] font-bold text-xs uppercase flex items-center gap-2 border-b border-[#2B2B2B] pb-2">
                       <Sparkles size={14}/> 4. Chain Output Visualization
                   </h3>
                   
                   {!chainSource && (
                       <div className="h-64 border border-[#2B2B2B] bg-[#050505] flex items-center justify-center text-[#333] text-xs font-mono">
                           WAITING FOR SOURCE...
                       </div>
                   )}

                   {chainSource && chainSteps.length === 0 && (
                       <div className="h-64 border border-[#2B2B2B] bg-[#050505] flex items-center justify-center text-[#333] text-xs font-mono">
                           ADD STEPS TO VISUALIZE CHAIN...
                       </div>
                   )}

                   {chainSource && chainSteps.length > 0 && (
                       <div className="space-y-0 relative">
                           {/* Source Node */}
                           <div className="flex gap-4">
                               <div className="flex flex-col items-center">
                                   <div className="w-2 h-full bg-[#2B2B2B] mb-2"></div>
                               </div>
                               <div className="w-24 h-16 bg-[#111] border border-[#2B2B2B] overflow-hidden shrink-0 opacity-50 grayscale">
                                   <img src={chainSource} className="w-full h-full object-cover" />
                               </div>
                               <div className="py-4 text-[#555] text-xs font-mono">ORIGINAL SOURCE</div>
                           </div>

                           {/* Render Steps */}
                           {chainSteps.map((step, idx) => (
                               <div key={step.id} className="flex gap-4 animate-in fade-in slide-in-from-top-4">
                                   <div className="flex flex-col items-center ml-[3px]">
                                        <ArrowDown size={16} className="text-[#5CFF72] mb-1" />
                                        <div className={`w-0.5 h-full ${step.status === 'completed' ? 'bg-[#5CFF72]' : 'bg-[#2B2B2B]'}`}></div>
                                   </div>
                                   
                                   <div className="flex-grow pb-8">
                                       <div className={`border p-1 bg-black relative group transition-all duration-500
                                           ${step.status === 'completed' ? 'border-[#5CFF72] shadow-[0_0_20px_rgba(92,255,114,0.1)]' : 'border-[#2B2B2B]'}`}>
                                           
                                           <div 
                                              onClick={() => step.resultUrl && setLightboxData({ url: step.resultUrl, title: step.instruction })}
                                              className={`aspect-video bg-[#050505] flex items-center justify-center overflow-hidden cursor-pointer
                                               ${step.status === 'processing' ? 'animate-pulse' : ''}`}
                                           >
                                               {step.resultUrl ? (
                                                   <>
                                                     <img src={step.resultUrl} className="w-full h-full object-contain" />
                                                     <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 flex items-center justify-center">
                                                         <div className="bg-black/80 border border-[#5CFF72] text-[#5CFF72] p-2 rounded-full">
                                                            <ZoomIn size={16} />
                                                         </div>
                                                     </div>
                                                   </>
                                               ) : (
                                                   <div className="text-[#333] text-[10px] font-mono">
                                                       {step.status === 'pending' ? 'WAITING...' : step.status === 'processing' ? 'GENERATING...' : 'FAILED'}
                                                   </div>
                                               )}
                                           </div>

                                           {step.resultUrl && (
                                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                      onClick={(e) => { e.stopPropagation(); downloadImage(step.resultUrl!, `chain-step-${idx+1}.png`); }} 
                                                      className="bg-black text-[#5CFF72] p-1 border border-[#5CFF72] hover:bg-[#5CFF72] hover:text-black"
                                                    >
                                                      <Download size={14}/>
                                                    </button>
                                                </div>
                                           )}
                                           
                                           <div className="absolute -left-[54px] top-6 bg-black border border-[#2B2B2B] text-[9px] text-[#E0E083] px-1 py-0.5 uppercase w-10 text-center">
                                               STEP {idx + 1}
                                           </div>
                                       </div>
                                       <div className="mt-1 text-[#E0E083] text-xs font-bold uppercase tracking-wide">
                                           {step.instruction}
                                       </div>
                                   </div>
                               </div>
                           ))}

                           {/* Final Arrow */}
                           {chainSteps.every(s => s.status === 'completed') && (
                               <div className="flex gap-4">
                                   <div className="flex flex-col items-center ml-[3px]">
                                        <div className="w-2 h-2 bg-[#5CFF72]"></div>
                                   </div>
                                   <div className="text-[#5CFF72] text-xs font-bold font-mono">CHAIN COMPLETE</div>
                               </div>
                           )}
                       </div>
                   )}
               </div>
           </div>
        )}

        {/* Status Bar Footer */}
        <div className="fixed bottom-0 left-0 w-full bg-black/90 backdrop-blur border-t border-[#2B2B2B] py-2 px-4 flex justify-between items-center text-[10px] font-mono text-[#5CFF72] z-40">
           <div className="flex gap-4">
             <span>STATUS: {isProcessing ? 'PROCESSING' : 'IDLE'}</span>
             <span className="text-[#E0E083]">{statusMessage}</span>
           </div>
           <div className="flex gap-4 text-[#2B2B2B]">
             <span>MEM: {Math.round((performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0)}MB</span>
             <span>VER: 1.2.0</span>
           </div>
        </div>

      </main>
    </div>
  );
};

export default App;