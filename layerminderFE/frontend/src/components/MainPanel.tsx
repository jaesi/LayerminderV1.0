'use client';

import { useState, useRef } from 'react';
import { X } from 'lucide-react';

interface MainPanelProps {
  onGenerate: () => void;
}

export default function MainPanel({ 
  onGenerate 
}: MainPanelProps) {
  const [droppedImages, setDroppedImages] = useState<string[]>([]);
  const [droppedKeywords, setDroppedKeywords] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && droppedImages.length < 2) {
      const newImages = Array.from(files)
        .slice(0, 2 - droppedImages.length)
        .map(file => URL.createObjectURL(file));
      setDroppedImages(prev => [...prev, ...newImages]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    const imageSrc = e.dataTransfer.getData('image/src');
    const keyword = e.dataTransfer.getData('keyword');
    
    if (imageSrc && droppedImages.length < 2) {
      // Gallery에서 드래그한 이미지 (최대 2개)
      setDroppedImages(prev => [...prev, imageSrc]);
    } else if (keyword && droppedKeywords.length < 1) {
      // Gallery에서 드래그한 키워드 (최대 1개)
      setDroppedKeywords(prev => [...prev, keyword]);
    } else if (files && droppedImages.length < 2) {
      // 파일 드롭 (최대 2개까지)
      const newImages = Array.from(files)
        .slice(0, 2 - droppedImages.length)
        .map(file => URL.createObjectURL(file));
      setDroppedImages(prev => [...prev, ...newImages]);
    }
  };

  const removeDroppedImage = (index: number) => {
    setDroppedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeDroppedKeyword = (index: number) => {
    setDroppedKeywords(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 pl-4">
      <div className="flex flex-col items-center gap-6">
        {/* Generate 버튼 */}
        <div className="w-80 h-80 flex flex-col items-center justify-center">
          <div className="w-3 h-3 bg-gray-800 rounded-full mb-2"></div>
          <button className="text-2xl italic font-light text-gray-700 hover:text-gray-900 transition-colors"
            onClick={onGenerate}>
            Generate
          </button>
        </div>

        {/* Drop image 영역 */}
        <div
          className="w-80 h-80 text-gray-800 flex items-center justify-center cursor-pointer hover:bg-gray-100 border-2 border-dashed border-gray-300"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="text-center">
            <div className="w-3 h-3 bg-gray-800 rounded-full mb-2 mx-auto"></div>
            <p className="text-3xl italic font-light">Drop image</p>
            <p className="text-sm text-gray-500 mt-2">최대 2개 이미지, 1개 키워드</p>
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

        {/* 드롭된 이미지와 키워드 표시 */}
        {(droppedImages.length > 0 || droppedKeywords.length > 0) && (
          <div className="flex flex-wrap gap-3 justify-center max-w-80">
            {/* 드롭된 이미지들 */}
            {droppedImages.map((img, idx) => (
              <div key={`image-${idx}`} className="relative w-24 h-24">
                <div className="w-full h-full overflow-hidden border-2 border-gray-300">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
                <button
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                  onClick={() => removeDroppedImage(idx)}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            
            {/* 드롭된 키워드들 */}
            {droppedKeywords.map((keyword, idx) => (
              <div key={`keyword-${idx}`} className="relative w-24 h-24">
                <div className="w-full h-full bg-gray-800 text-white flex items-center justify-center border-2 border-gray-300">
                  <span className="text-xs font-medium text-center px-1">{keyword}</span>
                </div>
                <button
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                  onClick={() => removeDroppedKeyword(idx)}
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