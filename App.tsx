import React, { useState, useRef, useEffect } from 'react';
import ImageDropzone from './components/ImageDropzone';
import { loadImage, splitImage, getTargetDimensions, imageToDataURL } from './utils/imageUtils';
import { downloadPanelsAsZip } from './utils/downloadUtils';
import { reimagineImage, detectPanels, setStoredApiKey, getStoredApiKey, hasValidKey } from './services/geminiService';
import { ExtractedPanel, Resolution, AspectRatio, ProcessingMode, GridLayout, BoundingBox } from './types';
import { Download, RefreshCw, Trash2, Cpu, Image as ImageIcon, Loader2, Sparkles, Archive, X, CheckSquare, Square, ChevronRight, Zap, ExternalLink, Ban, Play, SlidersHorizontal, RefreshCcw, HelpCircle, Grid2X2, Grid3X3, Scan, FlaskConical, AlertTriangle, Key, LogIn } from 'lucide-react';

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
    question: "HOW_DO_I_LOGIN_OR_USE_A_KEY?",
    answer: "UnGrid is a 'Bring Your Own Key' application. You have two options:\n1. **Google Quick Connect:** Uses your Google account to authorize the app securely without copying keys.\n2. **Manual Key:** If you have a specific API key string, you can paste it manually. It is stored locally in your browser."
  },
  {
    question: "WHAT_GRID_SIZES_ARE_SUPPORTED?",
    answer: "We support standard 2x2 and 3x3 grids. We also support an **EXPERIMENTAL** 'Irregular / Auto-Detect' mode which uses Vision AI to detect panels. **Note: Auto-detect is experimental and may fail or hallucinate boxes.**"
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

const App: React.FC = () => {
  const [panels, setPanels] = useState<ExtractedPanel[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  
  // Configuration State
  const [resolution, setResolution] = useState<Resolution>('2K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [mode, setMode] = useState<ProcessingMode>('fidelity');
  const [gridLayout, setGridLayout] = useState<GridLayout>('3x3');
  
  const [isParamsOpen, setIsParamsOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // Ref to hold the AbortController for cancelling operations
  const abortControllerRef = useRef<AbortController | null>(null);

  const hasAiResults = panels.some(p => p.status === 'success');
  const isAllComplete = panels.length > 0 && panels.every(p => p.status === 'success');

  // Dynamic Loading Text Effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isProcessing) {
      // Set initial message if empty
      if (!statusMessage) setStatusMessage(LOADING_MESSAGES[0]);

      interval = setInterval(() => {
        setStatusMessage(prev => {
           const currentIdx = LOADING_MESSAGES.indexOf(prev);
           const nextIdx = (currentIdx + 1) % LOADING_MESSAGES.length;
           return LOADING_MESSAGES[nextIdx];
        });
      }, 2500); // Change message every 2.5 seconds
    }
    return () => clearInterval(interval);
  }, [isProcessing, statusMessage]);

  const handleImageSelected = async (file: File) => {
    try {
      const img = await loadImage(file);
      
      // Auto-detect aspect ratio
      const ratio = img.width / img.height;
      const detectedRatio: AspectRatio = Math.abs(ratio - 1) < 0.1 ? '1:1' : '16:9';
      setAspectRatio(detectedRatio);
      setOriginalImage(img.src);
      
      setPanels([]); 
    } catch (error) {
      console.error("Error loading image:", error);
      alert("Failed to load image");
    }
  };

  // Helper to process a single panel
  const processPanel = async (id: string, currentPanels: ExtractedPanel[], signal: AbortSignal) => {
    if (signal.aborted) return;

    // Update status to analyzing/generating
    setPanels(prev => prev.map(p => p.id === id ? { ...p, status: 'generating' } : p));
    
    const panel = currentPanels.find(p => p.id === id);
    if (!panel) return;

    try {
      if (signal.aborted) throw new Error("Cancelled");
      
      // Utilize Gemini with the selected mode
      const newImageUrl = await reimagineImage(panel.originalUrl, resolution, aspectRatio, mode);

      if (signal.aborted) throw new Error("Cancelled");

      setPanels(prev => prev.map(p => p.id === id ? { 
        ...p, 
        status: 'success', 
        aiGeneratedUrl: newImageUrl 
      } : p));

    } catch (error: any) {
      if (error.message === "Cancelled" || signal.aborted) {
        return;
      }
      
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
    if (!originalImage) return;

    // Check Key first
    if (!hasValidKey()) {
      setIsKeyModalOpen(true);
      return;
    }

    try {
      setIsProcessing(true);
      setStatusMessage('INITIALIZING NEURAL LINK...');

      // 2. Prepare Image
      const img = new Image();
      img.src = originalImage;
      await img.decode();

      const dims = getTargetDimensions(resolution, aspectRatio);
      
      let currentBoundingBoxes: BoundingBox[] | undefined = undefined;

      // 3. Detect Irregular Panels if selected
      if (gridLayout === 'irregular') {
         setStatusMessage('DETECTING WEIRD SHAPES...');
         try {
           // Resize image to max 1024px for detection to ensure high performance and fit within API limits
           const base64Str = imageToDataURL(img, 1024);
           currentBoundingBoxes = await detectPanels(base64Str);
           
           if (!currentBoundingBoxes || currentBoundingBoxes.length === 0) {
              console.warn("No panels detected, falling back to 3x3");
              alert("Auto-detect couldn't find any distinct panels. Falling back to default 3x3 grid.");
           }
         } catch (e: any) {
            if (e.message === "MISSING_API_KEY") {
              setIsKeyModalOpen(true);
              setIsProcessing(false);
              return;
            }
            console.error(e);
            alert("Auto-Detection Failed. The AI was unable to read the layout. Please try again or switch to manual 3x3/2x2.");
            setIsProcessing(false);
            setStatusMessage('');
            return;
         }
      }

      setStatusMessage('SPLITTING FRAMES...');
      // 4. Split Image based on Grid Layout (or Detected Boxes)
      const is3x3 = gridLayout === '3x3';
      const rows = is3x3 ? 3 : 2;
      const cols = is3x3 ? 3 : 2;

      const panelImages = splitImage(img, {
        rows,
        cols,
        targetWidth: dims.width,
        targetHeight: dims.height,
        boundingBoxes: currentBoundingBoxes
      });

      const newPanels: ExtractedPanel[] = panelImages.map((src, index) => ({
        id: crypto.randomUUID(),
        index,
        originalUrl: src,
        status: 'idle'
      }));

      setPanels(newPanels);
      setStatusMessage('THINKING HARD...');

      // 5. Start Processing Queue immediately
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Process strictly sequentially
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
      setStatusMessage('');
    }
  };

  const handleResumeProcessing = async () => {
    if (isProcessing) return;
    
    if (!hasValidKey()) {
      setIsKeyModalOpen(true);
      return;
    }

    // Check if there are any to process
    const remaining = panels.filter(p => p.status !== 'success');
    if (remaining.length === 0) return;

    try {
      setIsProcessing(true);
      setStatusMessage('RESUMING...');
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Process sequentially
      for (const panel of remaining) {
        if (signal.aborted) break;
        await processPanel(panel.id, panels, signal);
      }

      if (!signal.aborted) {
        setIsProcessing(false);
        setStatusMessage('');
      }
    } catch (error) {
      console.error("Error resuming process:", error);
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  const handleRetryPanel = async (id: string) => {
     if (isProcessing) return;
     
     if (!hasValidKey()) {
      setIsKeyModalOpen(true);
      return;
    }

     setIsProcessing(true);
     abortControllerRef.current = new AbortController();
     await processPanel(id, panels, abortControllerRef.current.signal);
     setIsProcessing(false);
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setIsProcessing(false);
    setStatusMessage('');

    setPanels(prev => prev.map(p => 
      (p.status === 'analyzing' || p.status === 'generating') 
        ? { ...p, status: 'idle' } 
        : p
    ));
  };

  const reset = () => {
    handleCancel();
    setPanels([]);
    setOriginalImage(null);
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
      
      <ApiKeyModal 
        isOpen={isKeyModalOpen} 
        onClose={() => setIsKeyModalOpen(false)} 
      />

      {/* Parameters Quick Menu */}
      {isParamsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
           <div className="bg-black border-2 border-[#5CFF72] p-6 w-80 shadow-[0_0_20px_rgba(92,255,114,0.2)] animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between mb-6 border-b border-[#2B2B2B] pb-2">
                <h3 className="text-[#5CFF72] font-bold text-lg flex items-center gap-2 uppercase">
                   <SlidersHorizontal size={20} /> Parameters
                </h3>
                <button onClick={() => setIsParamsOpen(false)} className="text-[#FFD43B] hover:text-[#5CFF72]">
                  <X size={20} strokeWidth={3} />
                </button>
              </div>
              
              <div className="space-y-6">
                   {/* Grid Layout */}
                   <div>
                    <label className="text-xs text-[#FFD43B] uppercase font-bold mb-2 block">Grid Layout</label>
                    <div className="grid grid-cols-3 gap-2">
                       <button 
                          onClick={() => setGridLayout('3x3')}
                          className={`p-2 border text-[10px] font-bold uppercase transition-all flex flex-col items-center justify-center gap-1
                          ${gridLayout === '3x3' ? 'bg-[#5CFF72] text-black border-[#5CFF72]' : 'border-[#2B2B2B] text-[#E0E083] hover:border-[#E0E083]'}`}
                        >
                           <Grid3X3 size={14} /> 3x3
                        </button>
                        <button 
                          onClick={() => setGridLayout('2x2')}
                          className={`p-2 border text-[10px] font-bold uppercase transition-all flex flex-col items-center justify-center gap-1
                          ${gridLayout === '2x2' ? 'bg-[#5CFF72] text-black border-[#5CFF72]' : 'border-[#2B2B2B] text-[#E0E083] hover:border-[#E0E083]'}`}
                        >
                           <Grid2X2 size={14} /> 2x2
                        </button>
                        <button 
                          onClick={() => setGridLayout('irregular')}
                          className={`p-2 border text-[10px] font-bold uppercase transition-all flex flex-col items-center justify-center gap-1
                          ${gridLayout === 'irregular' ? 'bg-[#5CFF72] text-black border-[#5CFF72]' : 'border-[#2B2B2B] text-[#E0E083] hover:border-[#E0E083]'}`}
                        >
                           <Scan size={14} /> AUTO (EXP)
                        </button>
                    </div>
                  </div>

                  {/* Mode */}
                  <div>
                    <label className="text-xs text-[#FFD43B] uppercase font-bold mb-2 block">Processing Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['fidelity', 'creative'] as ProcessingMode[]).map((m) => (
                        <button 
                          key={m}
                          onClick={() => setMode(m)}
                          className={`p-2 border text-xs font-bold uppercase transition-all flex items-center justify-center gap-2
                          ${mode === m ? 'bg-[#5CFF72] text-black border-[#5CFF72]' : 'border-[#2B2B2B] text-[#E0E083] hover:border-[#E0E083]'}`}
                        >
                           {m === 'fidelity' ? <Zap size={14}/> : <Sparkles size={14}/>}
                           {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Resolution */}
                  <div>
                    <label className="text-xs text-[#FFD43B] uppercase font-bold mb-2 block">Resolution</label>
                    <div className="flex gap-4">
                      {(['1K', '2K', '4K'] as Resolution[]).map((res) => (
                         <button
                           key={res}
                           onClick={() => setResolution(res)}
                           className={`px-6 py-3 border text-sm font-bold font-mono transition-all
                           ${resolution === res ? 'bg-[#FFD43B] text-black border-[#FFD43B]' : 'bg-transparent text-[#E0E083] border-[#2B2B2B] hover:border-[#FFD43B]'}`}
                         >
                           [{res}]
                         </button>
                      ))}
                    </div>
                  </div>

                <button 
                  onClick={() => setIsParamsOpen(false)}
                  className="w-full bg-[#2B2B2B] text-[#E0E083] font-bold py-2 border border-[#2B2B2B] hover:bg-[#5CFF72] hover:text-black hover:border-[#5CFF72] transition-colors uppercase text-sm"
                >
                  Apply & Close
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Header */}
      <header className="max-w-7xl mx-auto mb-12 border-b-2 border-[#2B2B2B] pb-6 flex flex-col items-center justify-center gap-6 relative">
         <div className="absolute right-0 top-0">
          <button 
            onClick={() => setIsKeyModalOpen(true)}
            className="flex items-center gap-2 text-[#2B2B2B] hover:text-[#5CFF72] transition-colors"
            title="Edit API Key"
          >
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
        
        {panels.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 items-center">
            {isProcessing ? (
               <button 
                onClick={handleCancel}
                className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-black uppercase text-sm font-bold flex items-center gap-2 transition-colors animate-pulse"
              >
                <Ban size={16} /> ABORT
              </button>
            ) : (
              <>
                 {!isAllComplete && (
                   <button 
                    onClick={handleResumeProcessing}
                    className="px-4 py-2 border border-[#5CFF72] text-[#5CFF72] hover:bg-[#5CFF72] hover:text-black uppercase text-sm font-bold flex items-center gap-2 transition-colors"
                  >
                    <Play size={16} /> RESUME
                  </button>
                 )}

                 <button 
                    onClick={handleStartProcessing}
                    className="px-4 py-2 border border-[#FFD43B] text-[#FFD43B] hover:bg-[#FFD43B] hover:text-black uppercase text-sm font-bold flex items-center gap-2 transition-colors"
                    title="Rerun All Frames with Current Settings"
                  >
                    <RefreshCcw size={16} /> RERUN ALL
                  </button>
                 
                 <button 
                  onClick={() => setIsParamsOpen(true)}
                  className="px-4 py-2 border border-[#E0E083] text-[#E0E083] hover:bg-[#E0E083] hover:text-black uppercase text-sm font-bold flex items-center gap-2 transition-colors"
                  title="Configure Parameters"
                >
                  <SlidersHorizontal size={16} /> CONFIG
                </button>

                 <button 
                  onClick={reset}
                  className="px-4 py-2 border border-[#2B2B2B] text-[#2B2B2B] hover:bg-[#2B2B2B] hover:text-[#E0E083] uppercase text-sm font-bold flex items-center gap-2 transition-colors"
                >
                  <Trash2 size={16} /> RESET
                </button>
              </>
            )}
            
            <div className="w-px h-6 bg-[#2B2B2B] mx-2 hidden md:block"></div>

            <button 
              onClick={() => downloadPanelsAsZip(panels, 'original', resolution)}
              className="px-4 py-2 border border-[#E0E083] text-[#E0E083] hover:bg-[#E0E083] hover:text-black uppercase text-sm font-bold flex items-center gap-2 transition-colors"
            >
              <Archive size={16} /> RAW
            </button>
             {hasAiResults && (
              <button 
                onClick={() => downloadPanelsAsZip(panels, 'ai', resolution)}
                className="px-4 py-2 bg-[#5CFF72] text-black border border-[#5CFF72] hover:bg-white uppercase text-sm font-bold flex items-center gap-2 transition-colors"
              >
                <Archive size={16} /> RESULTS
              </button>
            )}
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto">
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
                <button 
                  onClick={reset}
                  className="w-full text-[#E0E083] hover:text-[#FFD43B] text-xs font-mono py-2 text-right hover:underline"
                >
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
                   {/* Grid Layout */}
                  <div>
                    <label className="text-xs text-[#FFD43B] uppercase font-bold mb-3 block border-l-2 border-[#FFD43B] pl-2">Grid Layout</label>
                    <div className="grid grid-cols-3 gap-4">
                      <button 
                        onClick={() => setGridLayout('3x3')}
                        className={`p-4 border text-left transition-all ${gridLayout === '3x3' ? 'border-[#5CFF72] bg-[#5CFF72]/10' : 'border-[#2B2B2B] hover:border-[#E0E083]'}`}
                      >
                        <div className="flex items-center gap-2 mb-2 text-[#5CFF72] font-bold uppercase text-sm">
                          <Grid3X3 size={16} /> 3x3 Grid
                        </div>
                        <p className="text-[10px] text-[#E0E083] leading-snug font-mono">
                          > 9 PANELS<br/>
                        </p>
                      </button>

                      <button 
                        onClick={() => setGridLayout('2x2')}
                        className={`p-4 border text-left transition-all ${gridLayout === '2x2' ? 'border-[#5CFF72] bg-[#5CFF72]/10' : 'border-[#2B2B2B] hover:border-[#E0E083]'}`}
                      >
                         <div className="flex items-center gap-2 mb-2 text-[#FFD43B] font-bold uppercase text-sm">
                          <Grid2X2 size={16} /> 2x2 Grid
                        </div>
                        <p className="text-[10px] text-[#E0E083] leading-snug font-mono">
                          > 4 PANELS<br/>
                        </p>
                      </button>

                      <button 
                        onClick={() => setGridLayout('irregular')}
                        className={`p-4 border text-left transition-all ${gridLayout === 'irregular' ? 'border-[#5CFF72] bg-[#5CFF72]/10' : 'border-[#2B2B2B] hover:border-[#E0E083]'}`}
                      >
                         <div className="flex items-center gap-2 mb-2 text-[#5CFF72] font-bold uppercase text-sm">
                          <Scan size={16} /> Auto
                        </div>
                        <p className="text-[10px] text-[#E0E083] leading-snug font-mono">
                          > [EXPERIMENTAL]<br/>
                          > AI DETECT
                        </p>
                      </button>
                    </div>
                    {/* Disclaimer specifically for Auto */}
                    {gridLayout === 'irregular' && (
                       <div className="mt-3 flex items-start gap-2 text-[10px] text-red-400 border border-red-900/50 bg-red-900/10 p-2">
                          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                          <p>
                            WARN: Auto-detect is experimental and may fail or hallucinate shapes. 
                            If it fails, please revert to manual grid. Use at your own risk.
                          </p>
                       </div>
                    )}
                  </div>

                  {/* Mode */}
                  <div>
                    <label className="text-xs text-[#FFD43B] uppercase font-bold mb-3 block border-l-2 border-[#FFD43B] pl-2">Processing Mode</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button 
                        onClick={() => setMode('fidelity')}
                        className={`p-4 border text-left transition-all ${mode === 'fidelity' ? 'border-[#5CFF72] bg-[#5CFF72]/10' : 'border-[#2B2B2B] hover:border-[#E0E083]'}`}
                      >
                        <div className="flex items-center gap-2 mb-2 text-[#5CFF72] font-bold uppercase text-sm">
                          <Zap size={16} /> Fidelity
                        </div>
                        <p className="text-[10px] text-[#E0E083] leading-snug font-mono">
                          > STRICT REPRODUCTION<br/>
                          > MAINTAIN_STYLE: TRUE<br/>
                          > DETAIL_RESTORATION: TRUE
                        </p>
                      </button>

                      <button 
                        onClick={() => setMode('creative')}
                        className={`p-4 border text-left transition-all ${mode === 'creative' ? 'border-[#5CFF72] bg-[#5CFF72]/10' : 'border-[#2B2B2B] hover:border-[#E0E083]'}`}
                      >
                         <div className="flex items-center gap-2 mb-2 text-[#FFD43B] font-bold uppercase text-sm">
                          <Sparkles size={16} /> Creative
                        </div>
                        <p className="text-[10px] text-[#E0E083] leading-snug font-mono">
                          > ENHANCE_DETAILS: TRUE<br/>
                          > TEXTURE_UPGRADE: TRUE<br/>
                          > OPTIMIZE_AESTHETICS
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Resolution */}
                  <div>
                    <label className="text-xs text-[#FFD43B] uppercase font-bold mb-2 block">Resolution</label>
                    <div className="flex gap-4">
                      {(['1K', '2K', '4K'] as Resolution[]).map((res) => (
                         <button
                           key={res}
                           onClick={() => setResolution(res)}
                           className={`px-6 py-3 border text-sm font-bold font-mono transition-all
                           ${resolution === res ? 'bg-[#FFD43B] text-black border-[#FFD43B]' : 'bg-transparent text-[#E0E083] border-[#2B2B2B] hover:border-[#FFD43B]'}`}
                         >
                           [{res}]
                         </button>
                      ))}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="pt-4">
                     <button
                      onClick={handleStartProcessing}
                      disabled={isProcessing}
                      className={`w-full text-black text-lg font-bold py-4 border-2 transition-colors uppercase tracking-widest flex items-center justify-center gap-4 group
                      ${isProcessing 
                        ? 'bg-[#5CFF72]/20 border-[#5CFF72] text-[#5CFF72]' 
                        : 'bg-[#5CFF72] border-[#5CFF72] hover:bg-transparent hover:text-[#5CFF72]'}`}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 size={24} className="animate-spin" />
                          <span>PROCESSING...</span>
                        </>
                      ) : (
                        <>
                          <Cpu size={24} />
                          <span>EXECUTE_SPLIT</span>
                        </>
                      )}
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
              <div 
                key={panel.id} 
                className="relative group bg-[#050505] border border-[#2B2B2B] hover:border-[#5CFF72] transition-colors p-2"
              >
                {/* Status Indicator */}
                <div className="absolute top-4 left-4 z-10">
                   {panel.status === 'generating' && (
                     <div className="bg-black/80 text-[#5CFF72] px-2 py-1 text-xs font-bold border border-[#5CFF72] flex items-center gap-2">
                       <Loader2 size={12} className="animate-spin" /> GENERATING...
                     </div>
                   )}
                   {panel.status === 'error' && (
                     <div className="bg-red-900/90 text-white px-2 py-1 text-xs font-bold border border-red-500 flex items-center gap-2">
                       <AlertTriangle size={12} /> ERROR
                     </div>
                   )}
                   {panel.status === 'success' && (
                     <div className="bg-[#5CFF72]/90 text-black px-2 py-1 text-xs font-bold flex items-center gap-2">
                       <CheckSquare size={12} /> DONE
                     </div>
                   )}
                </div>

                {/* Panel Image */}
                <div className="relative aspect-video bg-black overflow-hidden mb-2">
                  <img 
                    src={panel.aiGeneratedUrl || panel.originalUrl} 
                    className={`w-full h-full object-cover transition-all duration-700 
                    ${panel.status === 'generating' ? 'opacity-50 blur-sm scale-105' : 'opacity-100 scale-100'}`}
                    alt={`Panel ${panel.index}`} 
                  />
                  
                  {/* Compare Hover (Only if AI done) */}
                  {panel.aiGeneratedUrl && (
                     <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 flex flex-col items-center justify-center p-4">
                        <p className="text-[#FFD43B] text-xs font-bold mb-4 uppercase">View Original</p>
                        <img src={panel.originalUrl} className="w-48 border border-[#2B2B2B]" />
                     </div>
                  )}
                </div>

                <div className="flex items-center justify-between px-2">
                  <span className="text-[#E0E083] font-mono text-xs">PANEL_0{panel.index + 1}</span>
                  <div className="flex gap-2">
                     <button 
                        onClick={() => handleRetryPanel(panel.id)}
                        disabled={isProcessing}
                        className="p-1.5 text-[#E0E083] hover:text-[#FFD43B] hover:bg-[#2B2B2B]"
                        title="Regenerate this panel"
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

        {/* Status Bar Footer */}
        <div className="fixed bottom-0 left-0 w-full bg-black/90 backdrop-blur border-t border-[#2B2B2B] py-2 px-4 flex justify-between items-center text-[10px] font-mono text-[#5CFF72] z-40">
           <div className="flex gap-4">
             <span>STATUS: {isProcessing ? 'PROCESSING' : 'IDLE'}</span>
             <span className="text-[#E0E083]">{statusMessage}</span>
           </div>
           <div className="flex gap-4 text-[#2B2B2B]">
             <span>MEM: {Math.round((performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0)}MB</span>
             <span>VER: 1.0.4</span>
           </div>
        </div>

      </main>
    </div>
  );
};

export default App;