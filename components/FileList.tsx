
import React from 'react';
import { ProcessedFile } from '../types';
import FileListItem from './FileListItem';

interface FileListProps {
  files: ProcessedFile[];
  onToggleSelect: (id: string) => void;
  onUpdateSuggestedName: (id: string, newName: string) => void;
  onRemoveFile: (id: string) => void;
  isProcessing: boolean;
}

const FileList: React.FC<FileListProps> = ({ files, onToggleSelect, onUpdateSuggestedName, onRemoveFile, isProcessing }) => {
  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No files uploaded yet. Add some videos to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 bg-gray-800/50 p-4 rounded-lg shadow-xl">
      {files.map(file => (
        <FileListItem
          key={file.id}
          file={file}
          onToggleSelect={() => onToggleSelect(file.id)}
          onUpdateSuggestedName={(newName) => onUpdateSuggestedName(file.id, newName)}
          onRemoveFile={() => onRemoveFile(file.id)}
          isProcessing={isProcessing}
        />
      ))}
    </div>
  );
};

export default FileList;
    