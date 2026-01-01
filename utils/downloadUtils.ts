import JSZip from 'jszip';
import { ExtractedPanel, Resolution, FaceTarget, ChainStep } from '../types';

export const downloadPanelsAsZip = async (
  panels: ExtractedPanel[], 
  type: 'original' | 'ai', 
  resolution: Resolution
) => {
  const zip = new JSZip();
  // Create a folder inside the zip
  const folderName = `ungrid-${type}-${resolution}`;
  const folder = zip.folder(folderName);
  
  if (!folder) return;

  let hasContent = false;

  panels.forEach((panel) => {
    // Select the correct URL based on requested type
    const dataUrl = type === 'ai' ? panel.aiGeneratedUrl : panel.originalUrl;
    
    // Only add if the url exists (e.g. for AI type, it might not be generated yet)
    if (dataUrl) {
      hasContent = true;
      // data:image/png;base64,......
      const base64Data = dataUrl.split(',')[1];
      folder.file(`panel-${panel.index + 1}.png`, base64Data, { base64: true });
    }
  });

  if (!hasContent) {
    alert("No images available to zip.");
    return;
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${folderName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadFaceTargetsAsZip = async (
  targets: FaceTarget[],
  resolution: Resolution
) => {
  const zip = new JSZip();
  const folderName = `ungrid-detailfix-${resolution}`;
  const folder = zip.folder(folderName);
  
  if (!folder) return;
  let hasContent = false;

  targets.forEach((target, index) => {
    if (target.result) {
      hasContent = true;
      const base64Data = target.result.split(',')[1];
      const typeLabel = target.fixType === 'face' ? 'face' : 'line';
      folder.file(`${typeLabel}-fix-${index + 1}.png`, base64Data, { base64: true });
    }
  });

  if (!hasContent) {
    alert("No processed images to download.");
    return;
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${folderName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadChainHistoryAsZip = async (
    steps: ChainStep[],
    resolution: Resolution
) => {
    const zip = new JSZip();
    const folderName = `ungrid-chain-clean-${resolution}`;
    const folder = zip.folder(folderName);

    if (!folder) return;
    let hasContent = false;

    steps.forEach((step, index) => {
        if (step.resultUrl) {
            hasContent = true;
            const base64Data = step.resultUrl.split(',')[1];
            // Sanitize filename from instruction
            const safeName = step.instruction.replace(/[^a-z0-9]/gi, '_').substring(0, 20);
            folder.file(`step-${index + 1}-${safeName}.png`, base64Data, { base64: true });
        }
    });

    if (!hasContent) {
        alert("No completed steps to download.");
        return;
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${folderName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};