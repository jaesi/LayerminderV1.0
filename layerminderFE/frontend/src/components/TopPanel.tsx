'use client';

import { useState } from 'react';
import React from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface TopPanelProps {
  mode: 'brand' | 'generate' | 'details';
  selectedRowData?: {
    rowIndex: number;
    images: Array<{ id: number; src: string; isPinned: boolean }>;
    keyword: string;
    startImageIndex?: number;
  } | null;
  generatedImages?: string[];
  onClose?: () => void;
}

export default function TopPanel({ 
  mode, 
  selectedRowData, 
  generatedImages, 
  onClose,
}: TopPanelProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(selectedRowData?.startImageIndex || 0);
  const [isExpanded, setIsExpanded] = useState(false);

  // selectedRowData가 변경되면 currentImageIndex 업데이트
  React.useEffect(() => {
    if (selectedRowData?.startImageIndex !== undefined) {
      setCurrentImageIndex(selectedRowData.startImageIndex);
    }
  }, [selectedRowData]);

  // 브랜드 모드 렌더링
  const renderBrandMode = () => (
    <div className="grid grid-cols-6 gap-2">
      {/* 브랜드 이미지 */}
      <div className="col-span-2 flex items-start justify-center">
        <img 
          src="/images/layminder.png" 
          alt="Layer Minder Brand" 
          className="w-full h-auto object-contain"
        />
      </div>

      <div className="col-span-4 flex flex-col justify-start pl-4">
        <h2 className="text-lg font-light text-gray-600 leading-relaxed mb-4">
          &quot;Redefining Heritage<br />
          for a Creative Future&quot;
        </h2>
        <div className="mt-4 text-sm text-gray-700 leading-relaxed">
          <p className="mb-2">
            Layer Minder aims to uncover new possibilities for the future by reimagining 
            heritage industries rooted in local identity. We believe that tradition and 
            innovation are not opposing forces but complementary layers in the story of 
            human creativity.
          </p>
          <p className="mb-2">
            By integrating advanced AI technology with the timeless values of craftsmanship, 
            we seek to preserve the cultural essence of heritage industries 
            while propelling them into new directions. Layer Minder is committed to ensuring 
            that these traditions not only survive but thrive, inspiring contemporary 
            audiences and shaping a more connected, creative future.
          </p>
          <p className="mb-2">
            Together, we are building a bridge between the past and the future, enabling
            everyone to explore and create with the transformative power of design.
          </p>
        </div>
      </div>
    </div>
  );

  // Generate 모드 렌더링
  const renderGenerateMode = () => {
    if (!generatedImages || generatedImages.length === 0) return null;

    const currentImage = generatedImages[currentImageIndex];

    const nextImage = () => {
      setCurrentImageIndex((prev) => (prev + 1) % generatedImages.length);
    };

    const prevImage = () => {
      setCurrentImageIndex((prev) => (prev - 1 + generatedImages.length) % generatedImages.length);
    };

    const handleImageClick = () => {
      setIsExpanded(!isExpanded);
    };

    if (isExpanded) {
      // 확장된 이미지 뷰
      return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center" onClick={() => setIsExpanded(false)}>
          <div className="relative max-w-4xl max-h-4xl bg-white p-4" onClick={e => e.stopPropagation()}>
            <button 
              className="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded"
              onClick={() => setIsExpanded(false)}
            >
              <X size={24} />
            </button>
            
            <div className="aspect-square w-full max-w-2xl mx-auto">
              <img 
                src={currentImage} 
                alt="" 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* 네비게이션 버튼들 */}
            <div className="absolute inset-y-0 left-4 flex items-center">
              <button 
                onClick={prevImage}
                className="p-2 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full shadow-lg"
              >
                <ChevronLeft size={24} />
              </button>
            </div>
            <div className="absolute inset-y-0 right-4 flex items-center">
              <button 
                onClick={nextImage}
                className="p-2 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full shadow-lg"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-6 gap-2 relative">
        {/* 닫기 버튼 */}
        <button 
          className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded z-10"
          onClick={onClose}
        >
          <X size={16} />
        </button>

        {/* 이미지 영역 (클릭하면 확장) */}
        <div className="col-span-2 relative group cursor-pointer" onClick={handleImageClick}>
          <div className="aspect-square bg-gray-200 overflow-hidden">
            <img 
              src={currentImage} 
              alt="" 
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
          
          {/* 이미지 네비게이션 버튼들 */}
          {generatedImages.length > 1 && (
            <>
              <button 
                className="absolute left-1 top-1/2 transform -translate-y-1/2 p-1 bg-white bg-opacity-75 hover:bg-opacity-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 bg-white bg-opacity-75 hover:bg-opacity-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
          
          {/* 이미지 카운터 */}
          {generatedImages.length > 1 && (
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded">
              {currentImageIndex + 1} / {generatedImages.length}
            </div>
          )}
        </div>

        {/* 설명 영역 */}
        <div className="col-span-4 flex flex-col justify-start pl-4">
          <h2 className="text-lg font-light text-gray-600 leading-relaxed mb-4">
            Generated Results
          </h2>
          <div className="mt-4 text-sm text-gray-700 leading-relaxed">
            <p className="mb-2">
              These images have been generated based on your selected references and keywords. 
              Each result reflects the AI`&apos;`s interpretation of your creative direction, 
              combining traditional design elements with contemporary aesthetics.
            </p>
            <p className="mb-2">
              The generation process considers the visual characteristics of your input images, 
              the stylistic keywords you`&apos;`ve chosen, and Layer Minder`&apos;`s heritage-focused design philosophy 
              to create furniture concepts that bridge past and future.
            </p>
            <p className="mb-2">
              Use these generated concepts as inspiration for your next design iteration, 
              or select the ones that resonate most with your vision to refine further.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Details 모드 렌더링
  const renderDetailsMode = () => {
    if (!selectedRowData) return null;

    const { images, keyword } = selectedRowData;
    const currentImage = images[currentImageIndex];

    const nextImage = () => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const handleImageClick = () => {
      setIsExpanded(!isExpanded);
    };

    if (isExpanded) {
      // 확장된 이미지 뷰 (그리드 2칸 + MainPanel 영역까지)
      return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center" onClick={() => setIsExpanded(false)}>
          <div className="relative max-w-4xl max-h-4xl bg-white p-4" onClick={e => e.stopPropagation()}>
            <button 
              className="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded"
              onClick={() => setIsExpanded(false)}
            >
              <X size={24} />
            </button>
            
            <div className="aspect-square w-full max-w-2xl mx-auto">
              <img 
                src={currentImage.src} 
                alt="" 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* 네비게이션 버튼들 */}
            <div className="absolute inset-y-0 left-4 flex items-center">
              <button 
                onClick={prevImage}
                className="p-2 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full shadow-lg"
              >
                <ChevronLeft size={24} />
              </button>
            </div>
            <div className="absolute inset-y-0 right-4 flex items-center">
              <button 
                onClick={nextImage}
                className="p-2 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full shadow-lg"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-6 gap-2 relative">
        {/* 닫기 버튼 */}
        <button 
          className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded z-10"
          onClick={onClose}
        >
          <X size={16} />
        </button>

        {/* 이미지 영역 (클릭하면 확장) */}
        <div className="col-span-2 relative group cursor-pointer" onClick={handleImageClick}>
          <div className="aspect-square bg-gray-200 overflow-hidden">
            <img 
              src={currentImage.src} 
              alt="" 
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
          
          {/* 이미지 네비게이션 버튼들 */}
          {images.length > 1 && (
            <>
              <button 
                className="absolute left-1 top-1/2 transform -translate-y-1/2 p-1 bg-white bg-opacity-75 hover:bg-opacity-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 bg-white bg-opacity-75 hover:bg-opacity-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
          
          {/* 이미지 카운터 */}
          {images.length > 1 && (
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded">
              {currentImageIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* 설명 영역 */}
        <div className="col-span-4 flex flex-col justify-start pl-4">
          <h2 className="text-lg font-light text-gray-600 leading-relaxed mb-4">
            Row {selectedRowData.rowIndex + 1} - {keyword} Collection
          </h2>
          <div className="mt-4 text-sm text-gray-700 leading-relaxed">
            <p className="mb-2">
              This collection showcases the &quot;{keyword}&quot; aesthetic through various furniture pieces. 
              Each piece in this series embodies the core principles of {keyword.toLowerCase()} design, 
              focusing on clean lines, functional beauty, and timeless appeal.
            </p>
            <p className="mb-2">
              The {keyword.toLowerCase()} approach emphasizes the harmony between form and function, 
              creating pieces that serve both practical and aesthetic purposes. These designs 
              represent our commitment to sustainable and thoughtful creation.
            </p>
            <p className="mb-2">
              Explore this collection to understand how traditional craftsmanship meets contemporary 
              design philosophy, resulting in furniture that speaks to both heritage and innovation.
            </p>
          </div>
          
          {/* 키워드 태그 */}
          <div className="flex gap-2 flex-wrap mt-4">
            <span className="px-3 py-1 bg-gray-800 text-white text-sm rounded">
              {keyword}
            </span>
            <span className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded">
              Modern
            </span>
            <span className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded">
              Sustainable
            </span>
            <span className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded">
              Heritage
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 pt-4 pb-1" style={{ backgroundColor: '#edeae3' }}>
      {mode === 'brand' && renderBrandMode()}
      {mode === 'generate' && renderGenerateMode()}
      {mode === 'details' && renderDetailsMode()}
    </div>
  );
}