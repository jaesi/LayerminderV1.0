'use client';

import { useState } from 'react';
import React from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface TopPanelProps {
  mode: 'brand' | 'generate' | 'details';
  selectedRowData?: {
    rowIndex: number;
    images: Array<{ id: number; src: string; isPinned: boolean, type?: 'output' | 'reference' | 'recommendation'; }>;
    keyword: string;
    startImageIndex?: number;
    story?: string;
    generatedKeywords?: string[];
    recommendationImage?: string;
  } | null;
  onClose?: () => void;
  // 애니메이션 상태
  animationState?: {
    animatedImages: string[];
    animatedImageIds: string[];
    imageAnimationComplete: boolean;
    animatedStoryText: string;
    storyAnimationComplete: boolean;
    animatedKeywords: string[];
    keywordAnimationComplete: boolean;
    recommendationVisible: boolean;
  };
  // 생성 중인지 여부
  isGenerating?: boolean; 
}

export default function TopPanel({ 
  mode, 
  selectedRowData, 
  onClose,
  animationState,
  isGenerating = false
}: TopPanelProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(selectedRowData?.startImageIndex || 0);
  const [isExpanded, setIsExpanded] = useState(false);

  // 컨테이너 높이 계산 (패딩 제외)
  const containerHeight = 'calc(320px - 2rem)'; // h-80 - pt-4 - pb-1

  // selectedRowData가 변경되면 currentImageIndex 업데이트
  React.useEffect(() => {
    if (selectedRowData?.startImageIndex !== undefined) {
      setCurrentImageIndex(selectedRowData.startImageIndex);
    }
  }, [selectedRowData]);

  // 브랜드 모드 렌더링
  const renderBrandMode = () => (
    <div className="grid grid-cols-6 gap-2" style={{ height: containerHeight }}>
      {/* 브랜드 이미지 */}
      <div className="col-span-2 flex items-start justify-center">
        <img 
          src="/images/layminder.png" 
          alt="Layer Minder Brand" 
          className="w-full h-auto object-contain"
        />
      </div>

      {/* 설명 영역 - 스크롤 추가 */}
      <div className="col-span-4 flex flex-col pl-4" style={{ height: containerHeight }}>
        <div className="h-full overflow-y-auto pr-2">
          <h2 className="text-lg font-light text-gray-600 leading-relaxed mb-4">
            &quot;Redefining Heritage<br />
            for a Creative Future&quot;
          </h2>
          <div className="text-sm text-gray-700 leading-relaxed">
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
    </div>
  );

  // Generate 모드 렌더링 (애니메이션 지원)
  const renderGenerateMode = () => {
    if (!selectedRowData && !animationState) return null;

    // 애니메이션 상태에서 이미지 정보 가져오기
    const animatedImages = animationState?.animatedImages || [];
    const animatedImageIds = animationState?.animatedImageIds || [];
    
    // 현재 표시할 이미지들 (애니메이션 진행 중이면 애니메이션 상태, 아니면 완성된 데이터)
    const displayImages = isGenerating && animatedImages.length > 0
      ? animatedImages.map((url, index) => ({
          id: Date.now() + index,
          src: url,
          isPinned: false,
          type: 'output' as const,
          imageId: animatedImageIds[index]
        }))
      : selectedRowData?.images.filter(img => img.type === 'output') || [];

    // 현재 표시할 스토리 (애니메이션 진행 중이면 애니메이션 텍스트, 아니면 완성된 스토리)
    const displayStory = isGenerating && animationState?.animatedStoryText
      ? animationState.animatedStoryText
      : selectedRowData?.story || '';

    // 현재 표시할 키워드들 (애니메이션 진행 중이면 애니메이션 키워드들, 아니면 완성된 키워드들)
    const displayKeywords = isGenerating && animationState && animationState.animatedKeywords.length > 0
      ? animationState.animatedKeywords
      : selectedRowData?.generatedKeywords || [];

    // 추천 이미지 표시 여부
    const showRecommendation = isGenerating 
      ? animationState?.recommendationVisible || false
      : !!selectedRowData?.recommendationImage;

    const currentImage = displayImages[currentImageIndex] || displayImages[0];
    const keyword = selectedRowData?.keyword || 'Generated';

    const nextImage = () => {
      if (displayImages.length > 1) {
        setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
      }
    };

    const prevImage = () => {
      if (displayImages.length > 1) {
        setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
      }
    };

    const handleImageClick = () => {
      if (displayImages.length > 0) {
        setIsExpanded(!isExpanded);
      }
    };

    // 확장 모드 렌더링
    if (isExpanded && currentImage) {
      return (
        <div className="grid grid-cols-6 gap-2 relative" style={{ height: containerHeight }}>
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
            {displayImages.length > 1 && (
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
            
            {displayImages.length > 1 && (
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
          <div className="col-span-4 flex flex-col pl-4" style={{ height: containerHeight }}>
            <h2 className="text-lg font-light text-gray-600 leading-relaxed mb-4 flex-shrink-0">
              Generated Results - {keyword}
            </h2>
            
            {/* 키워드 영역 - 애니메이션 지원 */}
            {displayKeywords.length > 0 && (
              <div className="mb-2 flex-shrink-0">
                <div className="flex flex-wrap gap-2">
                  {displayKeywords.map((kw, index) => (
                    <span 
                      key={index}
                      className={`px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded transition-all duration-200 ${
                        isGenerating ? 'animate-fadeIn' : ''
                      }`}
                      style={{ 
                        animationDelay: isGenerating ? `${index * 200}ms` : '0ms' 
                      }}
                    >
                      {kw}
                    </span>
                  ))}
                  {/* 키워드 로딩 중일 때 표시 */}
                  {isGenerating && !animationState?.keywordAnimationComplete && (
                    <div className="px-2 py-1 bg-gray-100 text-gray-400 text-xs rounded animate-pulse">
                      ...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 스토리 영역 - 타이핑 애니메이션 지원 */}
            <div className="flex-1 overflow-y-auto text-sm text-gray-700 leading-relaxed pr-2">
              {displayStory ? (
                <div className="whitespace-pre-wrap">
                  {displayStory}
                  {/* 타이핑 중일 때 커서 표시 */}
                  {isGenerating && !animationState?.storyAnimationComplete && (
                    <span className="animate-pulse">|</span>
                  )}
                </div>
              ) : (
                // 스토리 로딩 중일 때 표시
                isGenerating && (
                  <div className="text-gray-400 animate-pulse">
                    Generating story...
                  </div>
                )
              )}
              
              {/* 기본 설명 (스토리가 없을 때) */}
              {!displayStory && !isGenerating && (
                <div>
                  <p className="mb-2">
                    These images have been generated based on your selected references and the &quot;{keyword}&quot; keyword. 
                    Each result reflects the AI&apos;s interpretation of your creative direction, 
                    combining traditional design elements with contemporary aesthetics.
                  </p>
                  <p className="mb-2">
                    The generation process considers the visual characteristics of your input images 
                    and Layer Minder&apos;s heritage-focused design philosophy 
                    to create furniture concepts that bridge past and future.
                  </p>
                  <p>
                    Total generated: {displayImages.length} variations
                  </p>
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
      <div className="grid grid-cols-6 gap-2 relative" style={{ height: containerHeight }}>
        {/* 닫기 버튼 */}
        <button 
          className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded z-10"
          onClick={onClose}
        >
          <X size={16} />
        </button>

        {/* 이미지 영역 - 애니메이션 지원 */}
        <div className="col-span-2 relative">
          {displayImages.length > 0 && currentImage ? (
            <div className="group cursor-pointer" onClick={handleImageClick}>
              <div className="aspect-square bg-gray-200 overflow-hidden">
                <img 
                  src={currentImage.src} 
                  alt="" 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              
              {displayImages.length > 1 && (
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
              {displayImages.length > 1 && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded">
                  {currentImageIndex + 1} / {displayImages.length}
                </div>
              )}
            </div>
          ) : (
            // 이미지 로딩 중일 때 표시
            <div className="aspect-square bg-gray-100 overflow-hidden flex items-center justify-center">
              <div className="text-gray-400 animate-pulse">
                {isGenerating ? 'Generating images...' : 'No images'}
              </div>
            </div>
          )}
        </div>

        {/* 설명 영역 */}
        <div className="col-span-4 flex flex-col pl-4" style={{ height: containerHeight }}>
          <h2 className="text-lg font-light text-gray-600 leading-relaxed mb-4 flex-shrink-0">
            Generated Results - {keyword}
          </h2>
          
          {/* 키워드 영역 - 애니메이션 지원 */}
          {displayKeywords.length > 0 && (
            <div className="mb-2 flex-shrink-0">
              <div className="flex flex-wrap gap-2">
                {displayKeywords.map((kw, index) => (
                  <span 
                    key={index}
                    className={`px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded transition-all duration-200 ${
                      isGenerating ? 'animate-fadeIn' : ''
                    }`}
                    style={{ 
                      animationDelay: isGenerating ? `${index * 200}ms` : '0ms' 
                    }}
                  >
                    {kw}
                  </span>
                ))}
                {/* 키워드 로딩 중일 때 표시 */}
                {isGenerating && !animationState?.keywordAnimationComplete && (
                  <div className="px-2 py-1 bg-gray-100 text-gray-400 text-xs rounded animate-pulse">
                    ...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 스토리 영역 - 타이핑 애니메이션 지원 */}
          <div className="flex-1 overflow-y-auto text-sm text-gray-700 leading-relaxed pr-2">
            {displayStory ? (
              <div className="whitespace-pre-wrap">
                {displayStory}
                {/* 타이핑 중일 때 커서 표시 */}
                {isGenerating && !animationState?.storyAnimationComplete && (
                  <span className="animate-pulse">|</span>
                )}
              </div>
            ) : (
              // 스토리 로딩 중일 때 표시
              isGenerating && (
                <div className="text-gray-400 animate-pulse">
                  Generating story...
                </div>
              )
            )}
            
            {/* 기본 설명 (스토리가 없을 때) */}
            {!displayStory && !isGenerating && (
              <div>
                <p className="mb-2">
                  These images have been generated based on your selected references and the &quot;{keyword}&quot; keyword. 
                  Each result reflects the AI&apos;s interpretation of your creative direction, 
                  combining traditional design elements with contemporary aesthetics.
                </p>
                <p className="mb-2">
                  The generation process considers the visual characteristics of your input images 
                  and Layer Minder&apos;s heritage-focused design philosophy 
                  to create furniture concepts that bridge past and future.
                </p>
                <p>
                  Total generated: {displayImages.length} variations
                </p>
              </div>
            )}
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
      return (
        <div className="grid grid-cols-6 gap-2 relative" style={{ height: containerHeight }}>
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

          {/* 설명 영역 - 높이 맞춤 및 스크롤 */}
          <div className="col-span-4 flex flex-col pl-4" style={{ height: containerHeight }}>
            <h2 className="text-lg font-light text-gray-600 leading-relaxed mb-4 flex-shrink-0">
              Row {selectedRowData.rowIndex + 1} - {keyword} Collection
            </h2>
            
            <div className="flex-1 overflow-y-auto text-sm text-gray-700 leading-relaxed pr-2">
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
            <div className="flex gap-2 flex-wrap mt-4 flex-shrink-0">
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
      <div className="grid grid-cols-6 gap-2 relative" style={{ height: containerHeight }}>
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

        {/* 설명 영역 - 높이 맞춤 및 스크롤 */}
        <div className="col-span-4 flex flex-col pl-4" style={{ height: containerHeight }}>
          <h2 className="text-lg font-light text-gray-600 leading-relaxed mb-4 flex-shrink-0">
            Row {selectedRowData.rowIndex + 1} - {keyword} Collection
          </h2>
          
          <div className="flex-1 overflow-y-auto text-sm text-gray-700 leading-relaxed pr-2">
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
          <div className="flex gap-2 flex-wrap mt-4 flex-shrink-0">
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
    <div className="px-4 pt-4 pb-1 h-80 max-h-80" style={{ backgroundColor: '#edeae3' }}>
      {mode === 'brand' && renderBrandMode()}
      {mode === 'generate' && renderGenerateMode()}
      {mode === 'details' && renderDetailsMode()}

      {/* Tailwind CSS 애니메이션 클래스 추가 */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>

    </div>
  );
}