'use client';

import { useState } from 'react';
import { Pin, X } from 'lucide-react';
import { dummyImages, keywords } from '@/data/dummyData';

interface GalleryProps {
  onTogglePin: (imageId: number, boardName?: string) => void;
  pinnedImages: number[];
  onImageSelect: (imageSrc: string) => void;
  onKeywordSelect: (keyword: string) => void;
  selectedKeywords: string[];
  boardNames: string[];
}

export default function Gallery({ 
  onTogglePin, 
  pinnedImages, 
  onImageSelect, 
  onKeywordSelect,
  selectedKeywords,
  boardNames 
}: GalleryProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [pinModalImageId, setPinModalImageId] = useState<number | null>(null);
  
  // 3행 6열 구성: 각 행마다 output 4개 + reference 1개 + keyword 1개
  const createRow = (rowIndex: number) => {
    const outputImages = dummyImages.outputs.slice(rowIndex * 4, (rowIndex + 1) * 4);
    const referenceImage = dummyImages.references[rowIndex] || dummyImages.references[0];
    const keyword = keywords[rowIndex] || keywords[0];
    
    return {
      outputs: outputImages,
      reference: referenceImage,
      keyword: keyword
    };
  };

  const rows = [0, 1, 2].map(createRow);

  const handleImageDragStart = (e: React.DragEvent, imageSrc: string) => {
    e.dataTransfer.setData('image/src', imageSrc);
  };

  const handleKeywordDragStart = (e: React.DragEvent, keyword: string) => {
    e.dataTransfer.setData('keyword', keyword);
  };

  const handlePinClick = (e: React.MouseEvent, imageId: number) => {
    e.stopPropagation();
    setPinModalImageId(imageId);
  };

  const handleBoardSelect = (boardName: string) => {
    if (pinModalImageId !== null) {
      onTogglePin(pinModalImageId, boardName);
      setPinModalImageId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto relative">
      <div className="p-4 space-y-3">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex}>
            {/* 이미지 행 - 6열 그리드 */}
            <div className="grid grid-cols-6 gap-2">
              {/* Output 이미지 4개 */}
              {row.outputs.map((image) => (
                <div
                  key={image.id}
                  className="relative group cursor-pointer"
                  draggable
                  onDragStart={(e) => handleImageDragStart(e, image.src)}
                  onClick={() => {
                    setExpandedRow(expandedRow === rowIndex ? null : rowIndex);
                    onImageSelect(image.src);
                  }}
                >
                  <div className="aspect-square bg-gray-200 overflow-hidden">
                    <img
                      src={image.src}
                      alt=""
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                  
                  {/* 핀 버튼 (호버시 표시) */}
                  <button
                    className="absolute top-1 right-1 p-1 bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handlePinClick(e, image.id)}
                  >
                    <Pin
                      size={12}
                      className={pinnedImages.includes(image.id) ? 'fill-current text-blue-500' : 'text-gray-600'}
                    />
                  </button>
                </div>
              ))}
              
              {/* Reference 이미지 1개 */}
              <div
                className="relative group cursor-pointer"
                draggable
                onDragStart={(e) => handleImageDragStart(e, row.reference.src)}
                onClick={() => {
                  setExpandedRow(expandedRow === rowIndex ? null : rowIndex);
                  onImageSelect(row.reference.src);
                }}
              >
                <div className="aspect-square bg-gray-200 overflow-hidden">
                  <img
                    src={row.reference.src}
                    alt=""
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
                
                {/* Reference 표시 - 좌측 상단 검정 원 */}
                <div className="absolute top-1 left-1 w-3 h-3 bg-black rounded-full"></div>
                
                {/* 핀 버튼 */}
                <button
                  className="absolute top-1 right-1 p-1 bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handlePinClick(e, row.reference.id)}
                >
                  <Pin
                    size={12}
                    className={pinnedImages.includes(row.reference.id) ? 'fill-current text-blue-500' : 'text-gray-600'}
                  />
                </button>
              </div>
              
              {/* Keyword 박스 1개 */}
              <div 
                className={`aspect-square flex items-center justify-center cursor-pointer transition-colors ${
                  selectedKeywords.includes(row.keyword) 
                    ? 'bg-gray-800 text-white' 
                    : 'bg-transparent text-gray-800 border border-gray-300 hover:bg-gray-100'
                }`}
                draggable
                onDragStart={(e) => handleKeywordDragStart(e, row.keyword)}
                onClick={() => onKeywordSelect(row.keyword)}
              >
                <span className="text-sm font-medium">{row.keyword}</span>
              </div>
            </div>

            {/* 확장된 상세 정보 */}
            {expandedRow === rowIndex && (
              <div className="mt-2 p-3 bg-white bg-opacity-50">
                <h4 className="font-medium text-sm mb-1">상세 정보</h4>
                <p className="text-gray-600 text-xs mb-2">
                  이 행의 이미지들에 대한 상세 정보가 여기에 표시됩니다.
                </p>
                <div className="flex gap-1 flex-wrap">
                  <span className="px-2 py-1 bg-gray-200 rounded-full text-xs">
                    {row.keyword}
                  </span>
                  <span className="px-2 py-1 bg-gray-200 rounded-full text-xs">
                    Modern
                  </span>
                  <span className="px-2 py-1 bg-gray-200 rounded-full text-xs">
                    Wood
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 핀 보드 선택 모달 */}
      {pinModalImageId !== null && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 w-80 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">핀할 보드 선택</h3>
              <button 
                onClick={() => setPinModalImageId(null)}
                className="p-1 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2">
              {boardNames.map((boardName) => (
                <button
                  key={boardName}
                  onClick={() => handleBoardSelect(boardName)}
                  className="w-full text-left p-3 hover:bg-gray-100 border border-gray-200 transition-colors"
                >
                  {boardName}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}