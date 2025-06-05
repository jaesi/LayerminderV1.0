'use client';

import { useState, useRef } from 'react';

interface MainPanelProps {
  selectedImages: string[];
  onImageSelect: (imageSrc: string) => void;
}

export default function MainPanel({ selectedImages, onImageSelect }: MainPanelProps) {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setUploadedImages(prev => [...prev, ...newImages]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    const imageSrc = e.dataTransfer.getData('image/src');
    
    if (imageSrc) {
      // Gallery에서 드래그한 이미지
      onImageSelect(imageSrc);
    } else if (files) {
      // 파일 드롭
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setUploadedImages(prev => [...prev, ...newImages]);
    }
  };

  const allImages = [...uploadedImages, ...selectedImages];

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 pl-4">
      <div className="flex flex-col items-center gap-6">
        {/* Generate 버튼 */}
        <div className="w-80 h-80 flex flex-col items-center justify-center rounded-sm">
          <div className="w-3 h-3 bg-gray-800 rounded-full mb-2"></div>
          <button className="text-2xl italic font-light text-gray-700">
            Generate
          </button>
        </div>

        {/* Drop image 영역 */}
        <div
          className="w-80 h-80 text-gray-800 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-sm"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="text-center">
            <div className="w-3 h-3 bg-gray-800 rounded-full mb-2 mx-auto"></div>
            <p className="text-3xl italic font-light">Drop image</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* 선택된 이미지들 표시 */}
        {allImages.length > 0 && (
          <div className="flex flex-wrap gap-3 justify-center max-w-80">
            {allImages.slice(0, 3).map((img, idx) => (
              <div key={idx} className="w-24 h-24 overflow-hidden rounded-sm border-2 border-gray-300">
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* 키워드 선택 영역 - 주석처리 */}
        {/*
        <div className="w-80 bg-gray-800 text-white rounded-sm overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-gray-600">
            {keywords.map((keyword, idx) => (
              <button
                key={keyword}
                onClick={() => toggleKeyword(keyword)}
                className={`p-4 text-sm hover:bg-gray-700 transition-colors
                  ${idx >= 2 && idx < 4 ? 'border-t border-gray-600' : ''}
                  ${idx >= 4 ? 'border-t border-gray-600' : ''}
                  ${selectedKeywords.includes(keyword) ? 'bg-gray-600' : ''}`}
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
        */}

        {/* 선택된 키워드 표시 - 주석처리 */}
        {/*
        {selectedKeywords.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center max-w-80">
            {selectedKeywords.map(keyword => (
              <span key={keyword} className="px-3 py-1 bg-gray-200 rounded-full text-sm">
                {keyword}
              </span>
            ))}
          </div>
        )}
        */}
      </div>
    </div>
  );
}