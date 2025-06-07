'use client';

import { useState, useRef } from 'react';

interface MainPanelProps {
  selectedImages: string[];
  onImageSelect: (imageSrc: string) => void;
  selectedKeywords: string[];
  onKeywordSelect: (keyword: string) => void;
}

export default function MainPanel({ 
  selectedImages, 
  onImageSelect, 
  selectedKeywords, 
  onKeywordSelect 
}: MainPanelProps) {
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
    const keyword = e.dataTransfer.getData('keyword');
    
    if (imageSrc) {
      // Gallery에서 드래그한 이미지
      onImageSelect(imageSrc);
    } else if (keyword) {
      // Gallery에서 드래그한 키워드
      onKeywordSelect(keyword);
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
        <div className="w-80 h-80 flex flex-col items-center justify-center">
          <div className="w-3 h-3 bg-gray-800 rounded-full mb-2"></div>
          <button className="text-2xl italic font-light text-gray-700">
            Generate
          </button>
        </div>

        {/* Drop image 영역 */}
        <div
          className="w-80 h-80 text-gray-800 flex items-center justify-center cursor-pointer hover:bg-gray-100"
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
              <div key={idx} className="w-24 h-24 overflow-hidden border-2 border-gray-300">
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* 선택된 키워드 표시 */}
        {selectedKeywords.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center max-w-80">
            {selectedKeywords.map(keyword => (
              <span 
                key={keyword} 
                className="px-3 py-1 bg-gray-800 text-white text-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}