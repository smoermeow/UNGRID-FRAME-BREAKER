import React, { useCallback, useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface ImageDropzoneProps {
  onImageSelected: (file: File) => void;
  title?: string;
  description?: React.ReactNode;
  compact?: boolean;
}

const ImageDropzone: React.FC<ImageDropzoneProps> = ({ 
  onImageSelected, 
  title = "> UPLOAD_GRID", 
  description,
  compact = false
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateAndUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('ERR: INVALID_FILE_TYPE');
      return;
    }
    setError(null);
    onImageSelected(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  }, [onImageSelected]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files[0]);
    }
  };

  return (
    <div 
      className={`relative w-full mx-auto border-2 transition-all duration-75 flex flex-col items-center justify-center text-center
      ${compact ? 'h-48 p-4' : 'h-80 p-8'}
      ${dragActive 
        ? 'border-[#5CFF72] bg-[#5CFF72]/10' 
        : 'border-[#FFD43B] bg-black hover:bg-[#FFD43B]/5'}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id={`image-upload-${title.replace(/\s/g, '')}`}
        className="hidden"
        accept="image/*"
        onChange={handleChange}
      />
      
      {/* Decorative Corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#5CFF72]"></div>
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#5CFF72]"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#5CFF72]"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#5CFF72]"></div>

      <h3 className={`${compact ? 'text-lg' : 'text-2xl'} font-bold text-[#5CFF72] mb-2 glow-text-green uppercase tracking-wider`}>
        {title}
      </h3>
      
      {description ? (
        <div className="text-[#E0E083] max-w-md mb-4 font-mono text-xs leading-relaxed">
          {description}
        </div>
      ) : (
        <p className="text-[#E0E083] max-w-md mb-8 font-mono text-sm">
          [INPUT REQ]: 3x3 OR 2x2 GRID COMPOSITION<br/>
          [FORMATS]: 16:9 || 9:16 || 1:1<br/>
        </p>
      )}

      <label
        htmlFor={`image-upload-${title.replace(/\s/g, '')}`}
        className="px-6 py-2 border border-[#FFD43B] bg-transparent hover:bg-[#FFD43B] hover:text-black text-[#FFD43B] font-bold cursor-pointer transition-colors uppercase tracking-widest text-xs flex items-center gap-2"
      >
        <span className="cursor-blink">></span> SELECT_FILE
      </label>

      {error && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-red-500 bg-red-900/20 px-4 py-2 border border-red-500 whitespace-nowrap">
          <AlertCircle size={16} />
          <span className="text-sm font-bold">{error}</span>
        </div>
      )}
    </div>
  );
};

export default ImageDropzone;