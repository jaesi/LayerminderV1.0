'use client';

import { useState, useRef } from 'react';

const keywords = ['Bold', 'Subtle', 'Minimal', 'Maximal', 'Geometric', 'Organic'];

export default function MainPanel() {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setUploadedImages(prev => [...prev, ...newImages].slice(0, 2)); // 최대 2개
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setUploadedImages(prev => [...prev, ...newImages].slice(0, 2));
    }
  };

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev =>
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
  };

  // 이미지가 없을 때 - Drop the image 버튼만 표시
  if (uploadedImages.length === 0) {
    return (
      <div className="bg-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="w-48 h-48">
            <div
              className="w-full h-full bg-gray-900 text-white flex items-center justify-center cursor-pointer hover:bg-gray-800"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="text-center">
                <p className="text-2xl italic">&quot;Drop</p>
                <p className="text-2xl italic">the</p>
                <p className="text-2xl italic">image&quot;</p>
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
          </div>
        </div>
      </div>
    );
  }

  // 이미지가 있을 때 - 5개 박스 표시
  return (
    <div className="bg-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex gap-0">
          {/* Generate 버튼 */}
          <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
            <button className="text-xl italic font-medium">
              Generate
            </button>
          </div>

          {/* Drop the image 박스 */}
          <div
            className="w-48 h-48 bg-gray-900 text-white flex items-center justify-center cursor-pointer hover:bg-gray-800"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="text-center">
              <p className="text-xl italic">&quot;Drop</p>
              <p className="text-xl italic">the</p>
              <p className="text-xl italic">image&quot;</p>
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

          {/* 업로드된 이미지 표시 (2개) */}
          {uploadedImages.map((img, idx) => (
            <div key={idx} className="w-48 h-48 overflow-hidden">
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
          
          {/* 빈 이미지 슬롯 */}
          {uploadedImages.length < 2 && 
            Array(2 - uploadedImages.length).fill(null).map((_, idx) => (
              <div key={`empty-${idx}`} className="w-48 h-48 bg-gray-200"></div>
            ))
          }

          {/* 키워드 박스 - 2x3 그리드 */}
          <div className="w-48 h-48 bg-gray-800 text-white">
            <div className="grid grid-cols-2 h-full">
              {keywords.map((keyword, idx) => (
                <button
                  key={keyword}
                  onClick={() => toggleKeyword(keyword)}
                  className={`border-gray-700 flex items-center justify-center text-sm hover:bg-gray-700 
                    ${idx % 2 === 0 ? 'border-r' : ''} 
                    ${idx < 4 ? 'border-b' : ''}
                    ${selectedKeywords.includes(keyword) ? 'bg-gray-600' : ''}`}
                >
                  {keyword}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}