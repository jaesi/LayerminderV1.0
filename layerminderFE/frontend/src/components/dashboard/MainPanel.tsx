'use client';

import React, { useState, useRef } from 'react';
import { X, Loader2, AlertCircle, CheckCircle, Zap, Clock } from 'lucide-react';
import { DroppedFile, GeneratedRow } from '@/types';
import { useGeneration } from '@/hooks/useGeneration';

interface MainPanelProps {
  onGenerate: (result: GeneratedRow) => void;
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

export default function MainPanel({ onGenerate }: MainPanelProps) {
  const [droppedFiles, setDroppedFiles] = useState<DroppedFile[]>([]);
  const [droppedKeywords, setDroppedKeywords] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 새로운 생성 훅 사용
  const {
    status,
    progress,
    currentStep,
    error: generationError,
    sessionId,
    recordId,
    isGenerating,
    isSSEConnected,
    generate,
    cancelGeneration,
    reset
  } = useGeneration({
    onComplete: (result) => {
      console.log('✅ Generation completed:', result);
      onGenerate(result);
      
      // 파일들 정리
      droppedFiles.forEach(item => {
        URL.revokeObjectURL(item.previewUrl);
      });
      setDroppedFiles([]);
      setDroppedKeywords([]);
      setValidationErrors([]);
    },
    onError: (error) => {
      console.error('❌ Generation failed:', error);
      setValidationErrors([error]);
    },
    onProgress: (step, progressValue) => {
      console.log(`📊 Progress: ${step} (${progressValue}%)`);
    }
  });

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

    if (isGenerating) {
      cancelGeneration();
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
      await generate(droppedFiles, droppedKeywords);
    } catch (error) {
      console.error('Generate failed:', error);
      setValidationErrors([
        error instanceof Error ? error.message : '생성에 실패했습니다. 다시 시도해주세요.'
      ]);
    }
  };

  // 현재 에러 목록 (검증 에러 + 생성 에러)
  const allErrors = [...validationErrors, ...(generationError ? [generationError] : [])];

  // 생성 상태에 따른 버튼 텍스트 및 아이콘
  const getButtonContent = () => {
    if (isGenerating) {
      return (
        <>
          <Loader2 className="animate-spin" size={24} />
          {status === 'creating_session' && 'Creating Session...'}
          {status === 'uploading' && 'Uploading...'}
          {status === 'generating' && 'Generating...'}
          {!['creating_session', 'uploading', 'generating'].includes(status) && 'Processing...'}
        </>
      );
    }
    
    if (status === 'completed') {
      return (
        <>
          <CheckCircle size={24} />
          &apos;Completed!&apos;
        </>
      );
    }
    
    return (
      <>
        <Zap size={24} />
        &apos;Generate&apos;
      </>
    );
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
        {allErrors.length > 0 && (
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
              {allErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 생성 상태 정보 */}
        {isGenerating && (
          <div className="w-80 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="animate-spin text-blue-500" size={16} />
              <span className="text-sm font-medium text-blue-700">
                {currentStep || 'Processing...'}
              </span>
              {isSSEConnected && (
                <div className="ml-auto flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600">Live</span>
                </div>
              )}
            </div>
            
            {/* 진행률 바 */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-xs text-blue-600">
              <span>{progress}% 완료</span>
              {sessionId && (
                <span>Session: {sessionId.substring(0, 8)}...</span>
              )}
            </div>
          </div>
        )}

        {/* Generate 버튼 */}
        <div className="w-80 h-80 flex flex-col items-center justify-center">
          <div className="w-3 h-3 bg-gray-800 rounded-full mb-2"></div>
          <button 
            className={`text-2xl italic font-light transition-colors flex items-center gap-2 ${
              isGenerating 
                ? 'text-blue-600 cursor-pointer hover:text-blue-800' 
                : droppedFiles.length === 0
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 hover:text-gray-900'
            }`}
            onClick={handleGenerateClick}
            disabled={droppedFiles.length === 0 && !isGenerating}
          >
            {getButtonContent()}
          </button>
          
          {/* 예상 소요 시간 */}
          {!isGenerating && droppedFiles.length > 0 && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <Clock size={12} />
              <span>예상 소요시간: 20-30초</span>
            </div>
          )}
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