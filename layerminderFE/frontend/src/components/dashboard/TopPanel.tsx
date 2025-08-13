'use client';

import { useState } from 'react';
import React from 'react';
import { ChevronLeft, ChevronRight, X, Sparkles, BookOpen, Hash } from 'lucide-react';

interface TopPanelProps {
  mode: 'brand' | 'generate' | 'details';
  selectedRowData?: {
    rowIndex: number;
    images: Array<{ id: number; src: string; isPinned: boolean }>;
    keyword: string;
    startImageIndex?: number;
    story?: string;
    generatedKeywords?: string[];
    recommendationImage?: string;
  } | null;
  onClose?: () => void;
}

export default function TopPanel({ 
  mode, 
  selectedRowData, 
  onClose,
}: TopPanelProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(selectedRowData?.startImageIndex || 0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'images' | 'story' | 'keywords' | 'recommendation'>('images');

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

  // Generate 모드 렌더링 (새로운 SSE 결과 표시)
  const renderGenerateMode = () => {
    if (!selectedRowData) return null;

    const { images, keyword, story, generatedKeywords, recommendationImage } = selectedRowData;
    const outputImages = images.filter(img => img.type === 'output');
    const currentImage = outputImages[currentImageIndex] || images[currentImageIndex];

    const nextImage = () => {
      setCurrentImageIndex((prev) => (prev + 1) % outputImages.length);
    };

    const prevImage = () => {
      setCurrentImageIndex((prev) => (prev - 1 + outputImages.length) % outputImages.length);
    };

    const handleImageClick = () => {
      setIsExpanded(!isExpanded);
    };

    if (isExpanded) {
      return (
        <div className="grid grid-cols-6 gap-2 relative">
          {/* 확장된 이미지 */}
          <div 
            className="absolute top-0 left-0 bg-gray-200 overflow-hidden z-50"
            style={{ 
              width: 'calc(30% + 33.333333% + 6rem)',
              height: 'calc(100vh - 96px)',
              marginLeft: 'calc(-30% - 7rem)'
            }}
            onClick={handleImageClick}
          >
            <img 
              src={currentImage.src} 
              alt="" 
              className="w-full h-full object-cover cursor-pointer"
            />
            
            {/* 네비게이션 버튼들 */}
            {outputImages.length > 1 && (
              <>
                <button 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full shadow-lg z-10"
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full shadow-lg z-10"
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* 닫기 버튼 */}
            <button 
              className="absolute top-4 right-4 p-2 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full shadow-lg z-10"
              onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
            >
              <X size={20} />
            </button>
          </div>

          {/* 기본 이미지 영역 (그대로 유지) */}
          <div className="col-span-2 relative group cursor-pointer" onClick={handleImageClick}>
            <div className="aspect-square bg-gray-200 overflow-hidden">
              <img 
                src={currentImage.src} 
                alt="" 
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
            
            {outputImages.length > 1 && (
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
          </div>

          {/* 설명 영역 */}
          <div className="col-span-4 flex flex-col justify-start pl-4">
            <h2 className="text-lg font-light text-gray-600 leading-relaxed mb-4">
              Generated Results - {keyword}
            </h2>
            
            {/* 탭 네비게이션 */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('images')}
                className={`flex items-center gap-1 px-3 py-1 text-sm rounded ${
                  activeTab === 'images' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Sparkles size={14} />
                Images
              </button>
              
              {story && (
                <button
                  onClick={() => setActiveTab('story')}
                  className={`flex items-center gap-1 px-3 py-1 text-sm rounded ${
                    activeTab === 'story' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <BookOpen size={14} />
                  Story
                </button>
              )}
              
              {generatedKeywords && generatedKeywords.length > 0 && (
                <button
                  onClick={() => setActiveTab('keywords')}
                  className={`flex items-center gap-1 px-3 py-1 text-sm rounded ${
                    activeTab === 'keywords' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Hash size={14} />
                  Keywords
                </button>
              )}
              
              {recommendationImage && (
                <button
                  onClick={() => setActiveTab('recommendation')}
                  className={`flex items-center gap-1 px-3 py-1 text-sm rounded ${
                    activeTab === 'recommendation' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  💡 Recommendation
                </button>
              )}
            </div>

            {/* 탭 콘텐츠 */}
            <div className="text-sm text-gray-700 leading-relaxed">
              {activeTab === 'images' && (
                <div>
                  <p className="mb-2">
                    These images have been generated based on your selected references and the "{keyword}" keyword. 
                    Each result reflects the AI&apos;s interpretation of your creative direction, 
                    combining traditional design elements with contemporary aesthetics.
                  </p>
                  <p className="mb-2">
                    The generation process considers the visual characteristics of your input images 
                    and Layer Minder&apos;s heritage-focused design philosophy 
                    to create furniture concepts that bridge past and future.
                  </p>
                  <p>
                    Total generated: {outputImages.length} variations
                  </p>
                </div>
              )}
              
              {activeTab === 'story' && story && (
                <div className="whitespace-pre-wrap">
                  {story}
                </div>
              )}
              
              {activeTab === 'keywords' && generatedKeywords && (
                <div>
                  <p className="mb-3">AI-extracted design keywords from the generated images:</p>
                  <div className="flex flex-wrap gap-2">
                    {generatedKeywords.map((kw, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {activeTab === 'recommendation' && recommendationImage && (
                <div>
                  <p className="mb-3">AI-recommended complementary design:</p>
                  <img 
                    src={recommendationImage} 
                    alt="AI Recommendation" 
                    className="max-w-full h-32 object-cover rounded"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 닫기 버튼 (우상단) */}
          <button 
            className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded z-10"
            onClick={onClose}
          >
            <X size={16} />
          </button>
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

        {/* 이미지 영역 */}
        <div className="col-span-2 relative group cursor-pointer" onClick={handleImageClick}>
          <div className="aspect-square bg-gray-200 overflow-hidden">
            <img 
              src={currentImage.src} 
              alt="" 
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
          
          {outputImages.length > 1 && (
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
          {outputImages.length > 1 && (
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded">
              {currentImageIndex + 1} / {outputImages.length}
            </div>
          )}
        </div>

        {/* 설명 영역 */}
        <div className="col-span-4 flex flex-col justify-start pl-4">
          <h2 className="text-lg font-light text-gray-600 leading-relaxed mb-4">
            Generated Results - {keyword}
          </h2>
          
          {/* 탭 네비게이션 */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('images')}
              className={`flex items-center gap-1 px-3 py-1 text-sm rounded ${
                activeTab === 'images' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Sparkles size={14} />
              Images
            </button>
            
            {story && (
              <button
                onClick={() => setActiveTab('story')}
                className={`flex items-center gap-1 px-3 py-1 text-sm rounded ${
                  activeTab === 'story' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <BookOpen size={14} />
                Story
              </button>
            )}
            
            {generatedKeywords && generatedKeywords.length > 0 && (
              <button
                onClick={() => setActiveTab('keywords')}
                className={`flex items-center gap-1 px-3 py-1 text-sm rounded ${
                  activeTab === 'keywords' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Hash size={14} />
                Keywords
              </button>
            )}
            
            {recommendationImage && (
              <button
                onClick={() => setActiveTab('recommendation')}
                className={`flex items-center gap-1 px-3 py-1 text-sm rounded ${
                  activeTab === 'recommendation' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                💡 Recommendation
              </button>
            )}
          </div>

          {/* 탭 콘텐츠 */}
          <div className="text-sm text-gray-700 leading-relaxed">
            {activeTab === 'images' && (
              <div>
                <p className="mb-2">
                  These images have been generated based on your selected references and the "{keyword}" keyword. 
                  Each result reflects the AI&apos;s interpretation of your creative direction, 
                  combining traditional design elements with contemporary aesthetics.
                </p>
                <p className="mb-2">
                  The generation process considers the visual characteristics of your input images 
                  and Layer Minder&apos;s heritage-focused design philosophy 
                  to create furniture concepts that bridge past and future.
                </p>
                <p>
                  Total generated: {outputImages.length} variations
                </p>
              </div>
            )}
            
            {activeTab === 'story' && story && (
              <div className="whitespace-pre-wrap">
                {story}
              </div>
            )}
            
            {activeTab === 'keywords' && generatedKeywords && (
              <div>
                <p className="mb-3">AI-extracted design keywords from the generated images:</p>
                <div className="flex flex-wrap gap-2">
                  {generatedKeywords.map((kw, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'recommendation' && recommendationImage && (
              <div>
                <p className="mb-3">AI-recommended complementary design:</p>
                <img 
                  src={recommendationImage} 
                  alt="AI Recommendation" 
                  className="max-w-full h-32 object-cover rounded"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Details 모드 렌더링 (기존과 동일)
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
      return (
        <div className="grid grid-cols-6 gap-2 relative">
          {/* 확장된 이미지 */}
          <div 
            className="absolute top-0 left-0 bg-gray-200 overflow-hidden z-50"
            style={{ 
              width: 'calc(30% + 33.333333% + 7rem)',
              height: 'calc(100vh - 96px)',
              marginLeft: 'calc(-30% - 7rem)'
            }}
            onClick={handleImageClick}
          >
            <img 
              src={currentImage.src} 
              alt="" 
              className="w-full h-full object-cover cursor-pointer"
            />
            
            {/* 네비게이션 버튼들 */}
            {images.length > 1 && (
              <>
                <button 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full shadow-lg z-10"
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full shadow-lg z-10"
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* 닫기 버튼 */}
            <button 
              className="absolute top-4 right-4 p-2 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full shadow-lg z-10"
              onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
            >
              <X size={20} />
            </button>
          </div>

          {/* 기본 이미지 영역 */}
          <div className="col-span-2 relative group cursor-pointer" onClick={handleImageClick}>
            <div className="aspect-square bg-gray-200 overflow-hidden">
              <img 
                src={currentImage.src} 
                alt="" 
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
            
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

          {/* 닫기 버튼 (우상단) */}
          <button 
            className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded z-10"
            onClick={onClose}
          >
            <X size={16} />
          </button>
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

        {/* 이미지 영역 */}
        <div className="col-span-2 relative group cursor-pointer" onClick={handleImageClick}>
          <div className="aspect-square bg-gray-200 overflow-hidden">
            <img 
              src={currentImage.src} 
              alt="" 
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
          
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