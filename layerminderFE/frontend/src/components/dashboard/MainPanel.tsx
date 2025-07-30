'use client';

import React, { useState, useRef } from 'react';
import { X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { DroppedFile } from '@/types';

interface MainPanelProps {
  onGenerate: (files: DroppedFile[], keywords: string[]) => Promise<void>;
  isGenerating?: boolean;
}

// 간단한 파일 검증
function validateFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (file.size > MAX_SIZE) {
    return { valid: false, error: `파일이 너무 큽니다 (최대 10MB)` };
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: '지원하지 않는 파일 형식입니다' };
  }
  
  return { valid: true };
}

export default function MainPanel({ 
  onGenerate,
  isGenerating = false
}: MainPanelProps) {
  const [droppedFiles, setDroppedFiles] = useState<DroppedFile[]>([]);
  const [droppedKeywords, setDroppedKeywords] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && droppedFiles.length < 2) {
      const errors: string[] = [];
      const validFiles: DroppedFile[] = [];
      
      Array.from(files)
        .slice(0, 2 - droppedFiles.length)
        .forEach(file => {
          const validation = validateFile(file);
          
          if (!validation.valid) {
            errors.push(`${file.name}: ${validation.error}`);
          } else {
            validFiles.push({
              id: `file_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              file: file,
              previewUrl: URL.createObjectURL(file)
            });
          }
        });
      
      setValidationErrors(errors);
      if (validFiles.length > 0) {
        setDroppedFiles(prev => [...prev, ...validFiles]);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    const imageSrc = e.dataTransfer.getData('image/src');
    const keyword = e.dataTransfer.getData('keyword');
    
    if (imageSrc && droppedFiles.length < 2) {
      try {
        const response = await fetch(imageSrc);
        const blob = await response.blob();
        const fileName = `gallery_image_${Date.now()}.jpg`;
        const file = new File([blob], fileName, { type: blob.type });
        
        const validation = validateFile(file);
        if (!validation.valid) {
          setValidationErrors([validation.error!]);
          return;
        }
        
        const newDroppedFile: DroppedFile = {
          id: `gallery_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          file: file,
          previewUrl: imageSrc
        };
        
        setDroppedFiles(prev => [...prev, newDroppedFile]);
        setValidationErrors([]);
      } catch (error) {
        console.error('Failed to convert gallery image:', error);
        setValidationErrors(['갤러리 이미지 변환에 실패했습니다.']);
      }
    }
    else if (keyword && droppedKeywords.length < 1) {
      setDroppedKeywords(prev => [...prev, keyword]);
    }
    else if (files && droppedFiles.length < 2) {
      const errors: string[] = [];
      const validFiles: DroppedFile[] = [];
      
      Array.from(files)
        .slice(0, 2 - droppedFiles.length)
        .forEach(file => {
          const validation = validateFile(file);
          
          if (!validation.valid) {
            errors.push(`${file.name}: ${validation.error}`);
          } else {
            validFiles.push({
              id: `dropped_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              file: file,
              previewUrl: URL.createObjectURL(file)
            });
          }
        });
      
      setValidationErrors(errors);
      if (validFiles.length > 0) {
        setDroppedFiles(prev => [...prev, ...validFiles]);
      }
    }
  };

  const removeDroppedFile = (fileId: string) => {
    setDroppedFiles(prev => {
      const updated = prev.filter(item => item.id !== fileId);
      const removedFile = prev.find(item => item.id === fileId);
      if (removedFile) {
        URL.revokeObjectURL(removedFile.previewUrl);
      }
      return updated;
    });
  };

  const removeDroppedKeyword = (index: number) => {
    setDroppedKeywords(prev => prev.filter((_, i) => i !== index));
  };

  const clearValidationErrors = () => {
    setValidationErrors([]);
  };

  const handleGenerateClick = async () => {
    if (droppedFiles.length === 0) {
      setValidationErrors(['이미지를 먼저 선택해주세요.']);
      return;
    }

    const errors: string[] = [];
    droppedFiles.forEach(item => {
      const validation = validateFile(item.file);
      if (!validation.valid) {
        errors.push(`${item.file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);

    try {
      await onGenerate(droppedFiles, droppedKeywords);
      
      droppedFiles.forEach(item => {
        URL.revokeObjectURL(item.previewUrl);
      });
      setDroppedFiles([]);
      setDroppedKeywords([]);
      
    } catch (error) {
      console.error('Generate failed:', error);
      setValidationErrors([
        error instanceof Error ? error.message : '생성에 실패했습니다. 다시 시도해주세요.'
      ]);
    }
  };

  React.useEffect(() => {
    return () => {
      droppedFiles.forEach(item => {
        URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 pl-4">
      <div className="flex flex-col items-center gap-6">
        {/* 에러 메시지 */}
        {validationErrors.length > 0 && (
          <div className="w-80 p-3 bg-red-50 border border-red-200 rounded">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-red-500" />
              <span className="text-sm font-medium text-red-700">오류</span>
              <button 
                onClick={clearValidationErrors}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <X size={14} />
              </button>
            </div>
            <ul className="text-xs text-red-600 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Generate 버튼 */}
        <div className="w-80 h-80 flex flex-col items-center justify-center">
          <div className="w-3 h-3 bg-gray-800 rounded-full mb-2"></div>
          <button 
            className={`text-2xl italic font-light transition-colors flex items-center gap-2 ${
              isGenerating || droppedFiles.length === 0
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-700 hover:text-gray-900'
            }`}
            onClick={handleGenerateClick}
            disabled={isGenerating || droppedFiles.length === 0}
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                Generating...
              </>
            ) : (
              'Generate'
            )}
          </button>
        </div>

        {/* Drop 영역 */}
        <div
          className={`w-80 h-80 text-gray-800 flex items-center justify-center cursor-pointer transition-colors border-2 border-dashed border-gray-300 ${
            isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 hover:border-gray-400'
          }`}
          onClick={() => !isGenerating && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => e.preventDefault()}
        >
          <div className="text-center">
            <div className="w-3 h-3 bg-gray-800 rounded-full mb-2 mx-auto"></div>
            <p className="text-2xl italic font-light">Drop image</p>
            {droppedFiles.length > 0 && (
              <div className="flex items-center justify-center gap-1 mt-1">
                <CheckCircle size={14} className="text-green-500" />
                <p className="text-sm text-gray-500">
                  {droppedFiles.length}/2 images selected
                </p>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">
              JPG, PNG, WebP (최대 10MB)
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleImageUpload}
            className="hidden"
            disabled={isGenerating}
          />
        </div>

        {/* 드롭된 파일들 표시 */}
        {(droppedFiles.length > 0 || droppedKeywords.length > 0) && (
          <div className="flex flex-wrap gap-3 justify-center max-w-80">
            {droppedFiles.map((item) => (
              <div key={item.id} className="relative w-24 h-24">
                <div className="w-full h-full overflow-hidden border-2 border-gray-300 rounded">
                  <img 
                    src={item.previewUrl} 
                    alt={item.file.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <button
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 disabled:opacity-50"
                  onClick={() => removeDroppedFile(item.id)}
                  disabled={isGenerating}
                >
                  <X size={12} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 opacity-0 hover:opacity-100 transition-opacity rounded-b">
                  {item.file.name} ({(item.file.size / 1024).toFixed(1)}KB)
                </div>
              </div>
            ))}
            
            {droppedKeywords.map((keyword, idx) => (
              <div key={`keyword-${idx}`} className="relative w-24 h-24">
                <div className="w-full h-full bg-gray-800 text-white flex items-center justify-center border-2 border-gray-300 rounded">
                  <span className="text-xs font-medium text-center px-1">{keyword}</span>
                </div>
                <button
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 disabled:opacity-50"
                  onClick={() => removeDroppedKeyword(idx)}
                  disabled={isGenerating}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}