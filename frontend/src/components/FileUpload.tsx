import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, Music, File, X } from 'lucide-react';

export interface UploadedFileItem {
  file: File;
  id: string;
  progress?: number;
}

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  helperText?: string;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  files,
  onFilesChange,
  accept = '.pdf,.jpg,.jpeg,.png,.webp,.mp3,.wav,.m4a',
  maxFiles = 10,
  maxSizeMB = 20,
  helperText = 'Upload shift documents, photographs, or audio notes (PDF, JPG, PNG, WEBP, MP3, WAV, M4A up to 20MB)',
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const validateAndAddFiles = (newFiles: FileList | File[]) => {
    setErrorMessage(null);
    const addedList: File[] = [];

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      if (file.size > maxSizeMB * 1024 * 1024) {
        setErrorMessage(`File "${file.name}" exceeds maximum allowed size of ${maxSizeMB}MB.`);
        continue;
      }
      if (files.length + addedList.length >= maxFiles) {
        setErrorMessage(`Maximum limit of ${maxFiles} files reached.`);
        break;
      }
      // Check duplicate
      const exists = files.some((f) => f.name === file.name && f.size === file.size);
      if (!exists) {
        addedList.push(file);
      }
    }

    if (addedList.length > 0) {
      onFilesChange([...files, ...addedList]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onFilesChange(updated);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    const name = file.name.toLowerCase();
    if (type.startsWith('image/') || name.match(/\.(jpg|jpeg|png|webp)$/)) {
      return <ImageIcon className="w-4 h-4 text-emerald-600" />;
    }
    if (type.startsWith('audio/') || name.match(/\.(mp3|wav|m4a|ogg)$/)) {
      return <Music className="w-4 h-4 text-amber-600" />;
    }
    if (type === 'application/pdf' || name.endsWith('.pdf')) {
      return <FileText className="w-4 h-4 text-red-600" />;
    }
    return <File className="w-4 h-4 text-slate-500" />;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-forest-600 bg-forest-50/50'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50/40 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <div className="flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-forest-100 flex items-center justify-center text-forest-800 mb-2">
            <UploadCloud className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-800">
            <span className="text-forest-700 underline underline-offset-2">Click to upload</span> or drag and drop files here
          </p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-md">{helperText}</p>
        </div>
      </div>

      {errorMessage && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
          {errorMessage}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-slate-600">Attached Files ({files.length}):</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {files.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between p-2 bg-white rounded border border-slate-200 text-xs shadow-xs"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="shrink-0">{getFileIcon(file)}</div>
                  <div className="truncate">
                    <p className="font-medium text-slate-800 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-400">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(idx);
                  }}
                  className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 transition-colors shrink-0 ml-2"
                  title="Remove file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
