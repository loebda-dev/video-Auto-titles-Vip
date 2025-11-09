
import React, { useState, useCallback, useEffect } from 'react';
import { ProcessedFile, FileStatus } from './types';
import FileUploader from './components/FileUploader';
import FileList from './components/FileList';
import { analyzeVideoFrame } from './services/geminiService';
import { extractFrameFromVideo, sanitizeFilename } from './utils/fileUtils';
import { Spinner } from './components/Spinner';
import { XIcon } from './components/icons/XIcon';
import { PencilIcon } from './components/icons/PencilIcon';

const App: React.FC = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [autoDownload, setAutoDownload] = useState<boolean>(false);

  useEffect(() => {
    if (!process.env.API_KEY) {
      setApiKeyMissing(true);
      setGlobalError("Gemini API Key is missing. Please ensure it's set in your environment variables.");
    }
     try {
      const savedLogo = localStorage.getItem('appLogo');
      if (savedLogo) {
        setLogoUrl(savedLogo);
      }
    } catch (error) {
      console.error("Could not load logo from localStorage", error);
    }
  }, []);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        try {
          localStorage.setItem('appLogo', result);
          setLogoUrl(result);
        } catch (error) {
          console.error("Could not save logo to localStorage", error);
          setGlobalError("Failed to save logo. Local storage might be full.");
        }
      };
      reader.onerror = () => {
        setGlobalError("Failed to read the selected file.");
      };
      reader.readAsDataURL(file);
    } else if (file) {
        setGlobalError("Please select a valid image file.");
    }
    // Reset file input to allow re-selection of the same file
    event.target.value = '';
  };

  const handleRemoveLogo = () => {
    try {
      localStorage.removeItem('appLogo');
      setLogoUrl(null);
    } catch (error) {
        console.error("Could not remove logo from localStorage", error);
    }
  };


  const handleFilesSelected = (selectedFiles: FileList) => {
    setGlobalError(null);
    const newProcessedFiles: ProcessedFile[] = Array.from(selectedFiles)
      .filter(file => file.type.startsWith('video/'))
      .map((file) => ({
        id: crypto.randomUUID(),
        originalFile: file,
        originalName: file.name,
        suggestedName: '',
        status: FileStatus.PENDING,
        progress: 0,
        isSelected: true,
      }));
    
    setFiles(prevFiles => {
      const existingNames = new Set(prevFiles.map(f => f.originalName));
      const uniqueNewFiles = newProcessedFiles.filter(nf => !existingNames.has(nf.originalName));
      return [...prevFiles, ...uniqueNewFiles];
    });
  };

  const updateFileStatus = (id: string, status: FileStatus, progress?: number, suggestedName?: string) => {
    setFiles(prevFiles =>
      prevFiles.map(f =>
        f.id === id
          ? { ...f, status, progress: progress ?? f.progress, suggestedName: suggestedName ?? f.suggestedName }
          : f
      )
    );
  };

  const downloadFile = (file: ProcessedFile) => {
    if (!file.suggestedName) {
      console.error("Download called for a file with no suggested name.", file);
      updateFileStatus(file.id, FileStatus.ERROR, 0, 'Error: No name to download with.');
      return;
    }
    try {
      const originalExtension = file.originalName.slice(file.originalName.lastIndexOf('.'));
      const newName = sanitizeFilename(file.suggestedName, originalExtension);

      const blob = new Blob([file.originalFile], { type: file.originalFile.type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = newName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      updateFileStatus(file.id, FileStatus.RENAMED, 100);
    } catch (error) {
      console.error(`Error renaming file ${file.originalName}:`, error);
      updateFileStatus(file.id, FileStatus.ERROR, 0, 'Error during download.');
    }
  };

  const handleAnalyzeSelected = useCallback(async () => {
    if (apiKeyMissing) return;
    const filesToAnalyze = files.filter(f => f.isSelected && f.status !== FileStatus.ANALYZED && f.status !== FileStatus.ERROR);
    if (filesToAnalyze.length === 0) {
      setGlobalError("No files selected or all selected files already analyzed/failed.");
      return;
    }

    setIsAnalyzing(true);
    setGlobalError(null);

    for (const file of filesToAnalyze) {
      updateFileStatus(file.id, FileStatus.ANALYZING, 10);
      try {
        updateFileStatus(file.id, FileStatus.ANALYZING, 30, 'Extracting frame...');
        const frameDataUrl = await extractFrameFromVideo(file.originalFile);
        if (!frameDataUrl) {
          throw new Error("Could not extract frame.");
        }
        updateFileStatus(file.id, FileStatus.ANALYZING, 60, 'Brainstorming title...');
        
        const prompt = `This is a frame from a video called "${file.originalName}". Come up with a short, funny, and viral-style title for this video. Something that would make you laugh and click. Aim for 2-5 words. After the title, add 5 funny and relevant hashtags that are viral on platforms like YouTube, Facebook, and TikTok. For example: "Grandma's First VR Game #EpicFail #LOL #VR #Gaming #Funny". Output only the new title and hashtags.`;
        const analysisResult = await analyzeVideoFrame(frameDataUrl, prompt);
        
        updateFileStatus(file.id, FileStatus.ANALYZED, 100, analysisResult);

        if (autoDownload) {
          const fileToDownload: ProcessedFile = {
            ...file,
            suggestedName: analysisResult,
            status: FileStatus.ANALYZED,
          };
          downloadFile(fileToDownload);
        }

      } catch (error) {
        console.error(`Error analyzing file ${file.originalName}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during analysis.';
        updateFileStatus(file.id, FileStatus.ERROR, 0, `Error: ${errorMessage}`);
      }
    }
    setIsAnalyzing(false);
  }, [files, apiKeyMissing, autoDownload]);

  const handleRenameSelected = () => {
    if (apiKeyMissing) return;
    const filesToRename = files.filter(f => f.isSelected && f.status === FileStatus.ANALYZED && f.suggestedName);
    if (filesToRename.length === 0) {
      setGlobalError("No analyzed files selected with suggested names to rename.");
      return;
    }
    setIsRenaming(true);
    setGlobalError(null);

    filesToRename.forEach(downloadFile);
    
    setIsRenaming(false);
  };
  
  const toggleFileSelection = (id: string) => {
    setFiles(prevFiles => prevFiles.map(f => f.id === id ? {...f, isSelected: !f.isSelected} : f));
  };

  const toggleSelectAll = () => {
    const allSelected = files.every(f => f.isSelected);
    setFiles(prevFiles => prevFiles.map(f => ({...f, isSelected: !allSelected})));
  };
  
  const updateSuggestedName = (id: string, newName: string) => {
    setFiles(prevFiles => prevFiles.map(f => f.id === id ? {...f, suggestedName: newName} : f));
  };

  const removeFile = (id: string) => {
    setFiles(prevFiles => prevFiles.filter(f => f.id !== id));
  };

  const clearAllFiles = () => {
    setFiles([]);
    setGlobalError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-gray-100 flex flex-col items-center p-4 sm:p-8 selection:bg-purple-500 selection:text-white">
      <header className="w-full max-w-5xl mb-8 text-center relative group">
        <div className="min-h-[60px] flex items-center justify-center sm:min-h-[80px]">
            {logoUrl ? (
                <img src={logoUrl} alt="Custom app logo" className="max-h-20 mx-auto my-2" />
            ) : (
                <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
                    AI Video File Renamer
                </h1>
            )}
        </div>
        <p className="mt-2 text-lg text-gray-300">
          Upload your videos, let AI suggest new names, and rename them with a click!
        </p>

        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col sm:flex-row gap-2">
            <label htmlFor="logo-upload" title="Change logo" className="cursor-pointer p-2 bg-gray-700/80 hover:bg-gray-600/80 rounded-full backdrop-blur-sm">
                <PencilIcon className="w-5 h-5 text-gray-300 hover:text-white" />
                <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </label>
            {logoUrl && (
                <button onClick={handleRemoveLogo} title="Remove logo" className="p-2 bg-gray-700/80 hover:bg-gray-600/80 rounded-full backdrop-blur-sm">
                    <XIcon className="w-5 h-5 text-gray-300 hover:text-white" />
                </button>
            )}
        </div>
      </header>

      {apiKeyMissing && (
         <div className="w-full max-w-3xl p-4 mb-6 bg-red-800 border border-red-700 rounded-lg text-center">
          <p className="font-semibold text-lg">Configuration Error</p>
          <p className="text-red-200">{globalError}</p>
        </div>
      )}

      <FileUploader onFilesSelected={handleFilesSelected} disabled={isAnalyzing || isRenaming || apiKeyMissing} />

      {globalError && !apiKeyMissing && (
        <div className="w-full max-w-3xl p-3 my-4 bg-red-500 text-white rounded-md text-sm text-center">
          {globalError}
        </div>
      )}

      {files.length > 0 && (
        <div className="w-full max-w-5xl mt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
            <div className="flex items-center">
               <input 
                type="checkbox"
                id="selectAll"
                className="form-checkbox h-5 w-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                checked={files.length > 0 && files.every(f => f.isSelected)}
                onChange={toggleSelectAll}
                />
                <label htmlFor="selectAll" className="ml-2 text-gray-300">Select All ({files.filter(f => f.isSelected).length}/{files.length})</label>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex flex-wrap gap-2">
                    <button
                    onClick={handleAnalyzeSelected}
                    disabled={isAnalyzing || isRenaming || files.filter(f => f.isSelected && f.status !== FileStatus.ANALYZED && f.status !== FileStatus.ERROR).length === 0 || apiKeyMissing}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[150px]"
                    aria-label="Analyze selected files to suggest new names"
                    >
                    {isAnalyzing ? <Spinner className="w-5 h-5 mr-2" /> : 'Analyze Selected'}
                    </button>
                    <button
                    onClick={handleRenameSelected}
                    disabled={isRenaming || isAnalyzing || files.filter(f => f.isSelected && f.status === FileStatus.ANALYZED && f.suggestedName).length === 0 || apiKeyMissing}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[150px]"
                    aria-label="Download selected files with their new suggested names"
                    >
                    {isRenaming ? <Spinner className="w-5 h-5 mr-2" /> : 'Download Selected'}
                    </button>
                    <button
                    onClick={clearAllFiles}
                    disabled={isAnalyzing || isRenaming}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Clear all uploaded files from the list"
                    >
                    Clear All
                    </button>
                </div>
                <div className="flex items-center pt-2 sm:pt-0">
                    <input 
                        type="checkbox"
                        id="autoDownload"
                        className="form-checkbox h-5 w-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 cursor-pointer disabled:cursor-not-allowed"
                        checked={autoDownload}
                        onChange={(e) => setAutoDownload(e.target.checked)}
                        disabled={isAnalyzing || isRenaming}
                    />
                    <label htmlFor="autoDownload" className="ml-2 text-sm text-gray-300 whitespace-nowrap cursor-pointer">
                        Auto-download when complete
                    </label>
                </div>
            </div>
          </div>
          <FileList
            files={files}
            onToggleSelect={toggleFileSelection}
            onUpdateSuggestedName={updateSuggestedName}
            onRemoveFile={removeFile}
            isProcessing={isAnalyzing || isRenaming}
          />
        </div>
      )}
       <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>Powered by Gemini API. API Key for Gemini must be configured in environment variables.</p>
        <p>&copy; {new Date().getFullYear()} AI Video Renamer. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
