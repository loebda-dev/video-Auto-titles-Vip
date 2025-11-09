
import React, { useState, useCallback } from 'react';

interface FileUploaderProps {
  onFilesSelected: (files: FileList) => void;
  disabled?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelected, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onFilesSelected(event.target.files);
      event.target.value = ''; // Reset input to allow selecting the same file again
    }
  };

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled && event.dataTransfer.items && event.dataTransfer.items.length > 0) {
        event.dataTransfer.dropEffect = 'copy';
    } else {
        event.dataTransfer.dropEffect = 'none';
    }
  }, [disabled]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (!disabled && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      onFilesSelected(event.dataTransfer.files);
      event.dataTransfer.clearData();
    }
  }, [onFilesSelected, disabled]);

  return (
    <div className="w-full max-w-3xl">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all duration-300
                    ${disabled ? 'border-gray-600 bg-gray-800 cursor-not-allowed' : 
                                 isDragging ? 'border-purple-500 bg-purple-900/30' : 'border-gray-500 hover:border-purple-400 bg-gray-800/50 hover:bg-gray-700/50'}`}
      >
        <svg className={`w-16 h-16 mb-4 ${disabled ? 'text-gray-500' : isDragging ? 'text-purple-400' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className={`mb-2 text-lg ${disabled ? 'text-gray-500' : 'text-gray-300'}`}>
          <span className="font-semibold">Click to upload</span> or drag and drop
        </p>
        <p className={`text-sm ${disabled ? 'text-gray-600' : 'text-gray-500'}`}>
          MP4, MOV, AVI, MKV (Video files only)
        </p>
        <input
          type="file"
          id="fileUpload"
          multiple
          accept="video/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
        <label
          htmlFor="fileUpload"
          className={`mt-4 px-6 py-2 text-sm font-medium rounded-lg transition-colors
                      ${disabled ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 
                                   'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'}`}
        >
          Select Files
        </label>
      </div>
    </div>
  );
};

export default FileUploader;
    