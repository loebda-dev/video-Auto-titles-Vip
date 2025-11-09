
import React from 'react';
import { ProcessedFile, FileStatus } from '../types';
import { VideoIcon } from './icons/VideoIcon';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';
import { Spinner } from './Spinner';


interface FileListItemProps {
  file: ProcessedFile;
  onToggleSelect: () => void;
  onUpdateSuggestedName: (newName: string) => void;
  onRemoveFile: () => void;
  isProcessing: boolean; // Global processing state for disabling edits
}

const FileListItem: React.FC<FileListItemProps> = ({ file, onToggleSelect, onUpdateSuggestedName, onRemoveFile, isProcessing }) => {
  const getStatusColor = () => {
    switch (file.status) {
      case FileStatus.PENDING:
        return 'text-yellow-400';
      case FileStatus.ANALYZING:
        return 'text-blue-400';
      case FileStatus.ANALYZED:
        return 'text-green-400';
      case FileStatus.RENAMED:
        return 'text-teal-400';
      case FileStatus.ERROR:
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (file.status) {
      case FileStatus.ANALYZING:
        return <Spinner className="w-4 h-4" />;
      case FileStatus.ANALYZED:
      case FileStatus.RENAMED:
        return <CheckIcon className="w-4 h-4 text-green-400" />;
      case FileStatus.ERROR:
        return <XIcon className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSuggestedName(e.target.value);
  };
  
  const fileSize = (file.originalFile.size / (1024 * 1024)).toFixed(2) + ' MB';

  return (
    <div className="flex items-center p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-sm hover:bg-gray-700/70 transition-colors duration-150">
      <input
        type="checkbox"
        className="form-checkbox h-5 w-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 mr-4 flex-shrink-0"
        checked={file.isSelected}
        onChange={onToggleSelect}
        disabled={isProcessing}
      />
      <VideoIcon className="w-10 h-10 text-purple-400 mr-3 flex-shrink-0" />
      <div className="flex-grow min-w-0">
        <p className="text-sm font-medium text-gray-200 truncate" title={file.originalName}>
          {file.originalName}
        </p>
        <p className="text-xs text-gray-400">{fileSize}</p>
        {file.status === FileStatus.ANALYZING && file.progress > 0 && (
          <div className="w-full bg-gray-600 rounded-full h-1.5 mt-1">
            <div
              className="bg-purple-500 h-1.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${file.progress}%` }}
            ></div>
          </div>
        )}
      </div>
      <div className="flex-grow mx-4 min-w-0">
        {file.status === FileStatus.ANALYZED || file.status === FileStatus.RENAMED || (file.status === FileStatus.ERROR && file.suggestedName) ? (
          <input
            type="text"
            value={file.suggestedName}
            onChange={handleNameChange}
            disabled={isProcessing || file.status === FileStatus.RENAMED}
            className={`w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded-md focus:ring-1 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500 ${file.status === FileStatus.ERROR ? 'text-red-400' : 'text-gray-200'}`}
            placeholder="Suggested name..."
          />
        ) : (
           <p className={`text-xs italic truncate ${getStatusColor()}`} title={typeof file.suggestedName === 'string' && file.status !== FileStatus.ERROR ? file.suggestedName : file.status}>
            {file.status === FileStatus.ANALYZING && typeof file.suggestedName === 'string' ? file.suggestedName : file.status}
          </p>
        )}
      </div>
      <div className="w-16 text-right flex-shrink-0 flex items-center justify-end">
        {getStatusIcon()}
      </div>
      <button 
        onClick={onRemoveFile} 
        disabled={isProcessing}
        className="ml-3 p-1 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Remove file"
      >
        <XIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default FileListItem;
