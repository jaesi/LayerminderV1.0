'use client';

import React, { useState, useRef } from 'react';
import { X, Loader2 } from 'lucide-react';
import { DroppedFile } from '@/types';

interface MainPanelProps {
  onGenerate: (files: DroppedFile[], keywords: string[]) => Promise<void>;
  isGenerating?: boolean;
}

export default function MainPanel({ 
  onGenerate,
  isGenerating = false
}: MainPanelProps) {
  const [droppedFiles, setDroppedFiles] = useState<DroppedFile[]>([]);
  const [droppedKeywords, setDroppedKeywords] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && droppedFiles.length < 2) {
      const newFiles = Array.from(files)
        .slice(0, 2 - droppedFiles.length)
        .map(file => ({
          id: `file_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          file: file,
          previewUrl: URL.createObjectURL(file)
        }));
      
      setDroppedFiles(prev => [...prev, ...newFiles]);
    }
  };

  // MainPanel.tsx
const handleDrop = async (e: React.DragEvent) => {
  e.preventDefault();
  const files = e.dataTransfer.files;
  const imageSrc = e.dataTransfer.getData('image/src');
  const keyword = e.dataTransfer.getData('keyword');
  
  if (imageSrc && droppedFiles.length < 2) {
    try {
      // 🔥 현재: 단순하게 URL을 File로 변환
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const fileName = `gallery_image_${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: blob.type });
      
      const newDroppedFile: DroppedFile = {
        id: `gallery_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        file: file,
        previewUrl: imageSrc
      };
      
      setDroppedFiles(prev => [...prev, newDroppedFile]);
    } catch (error) {
      console.error('Failed to convert gallery image:', error);
      alert('갤러리 이미지 변환에 실패했습니다.');
    }
  }
  
  // 키워드 처리
  else if (keyword && droppedKeywords.length < 1) {
    setDroppedKeywords(prev => [...prev, keyword]);
  }
  
  // 파일 드롭 처리
  else if (files && droppedFiles.length < 2) {
    // 기존 로직 그대로
  }
};

  const removeDroppedFile = (fileId: string) => {
    setDroppedFiles(prev => {
      const updated = prev.filter(item => item.id !== fileId);
      
      // 제거되는 파일의 previewUrl 메모리 해제
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

  const handleGenerateClick = async () => {
    if (droppedFiles.length === 0) {
      alert('이미지를 먼저 선택해주세요.');
      return;
    }

    try {
      await onGenerate(droppedFiles, droppedKeywords);
      
      // 성공 시 상태 초기화
      droppedFiles.forEach(item => {
        URL.revokeObjectURL(item.previewUrl);
      });
      setDroppedFiles([]);
      setDroppedKeywords([]);
      
    } catch (error) {
      console.error('Generate failed:', error);
      alert('생성에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 컴포넌트 언마운트 시 메모리 정리
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

        {/* Drop image 영역 */}
        <div
          className={`w-80 h-80 text-gray-800 flex items-center justify-center cursor-pointer transition-colors ${
            isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
          }`}
          onClick={() => !isGenerating && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="text-center">
            <div className="w-3 h-3 bg-gray-800 rounded-full mb-2 mx-auto"></div>
            <p className="text-2xl italic font-light">Drop image</p>
            {droppedFiles.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {droppedFiles.length}/2 images selected
              </p>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={isGenerating}
          />
        </div>

        {/* 드롭된 이미지와 키워드 표시 */}
        {(droppedFiles.length > 0 || droppedKeywords.length > 0) && (
          <div className="flex flex-wrap gap-3 justify-center max-w-80">
            {/* 드롭된 이미지들 */}
            {droppedFiles.map((item) => (
              <div key={item.id} className="relative w-24 h-24">
                <div className="w-full h-full overflow-hidden border-2 border-gray-300">
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
                {/* 파일 정보 툴팁 */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 opacity-0 hover:opacity-100 transition-opacity">
                  {item.file.name} ({(item.file.size / 1024).toFixed(1)}KB)
                </div>
              </div>
            ))}
            
            {/* 드롭된 키워드들 */}
            {droppedKeywords.map((keyword, idx) => (
              <div key={`keyword-${idx}`} className="relative w-24 h-24">
                <div className="w-full h-full bg-gray-800 text-white flex items-center justify-center border-2 border-gray-300">
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