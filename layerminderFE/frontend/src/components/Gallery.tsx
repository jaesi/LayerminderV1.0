'use client';

import { useState, useEffect } from 'react';
import { Pin } from 'lucide-react';
import { dummyImages, keywords } from '@/data/dummyData';

interface GalleryProps {
  onTogglePin: (imageId: number, boardName?: string) => void;
  pinnedImages: number[];
  boardNames: string[];
  onRowSelect: (rowData: {
    rowIndex: number;
    images: Array<{ id: number; src: string; isPinned: boolean }>;
    keyword: string;
    startImageIndex?: number;
  }) => void;
}

export default function Gallery({ 
  onTogglePin, 
  pinnedImages, 
  boardNames,
  onRowSelect
}: GalleryProps) {
  const [pinModalImageId, setPinModalImageId] = useState<number | null>(null);
  const [pinModalPosition, setPinModalPosition] = useState<{top: number, left: number, width: number, height: number} | null>(null);
  const [boardSearchTerm, setBoardSearchTerm] = useState('');
  const [isClient, setIsClient] = useState(false);

  // 클라이언트 사이드에서만 랜덤 배치 활성화
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 시드 기반 랜덤 함수 (일관된 결과 보장)
  const seededRandom = (seed: number) => {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // 배열 셔플 함수 (시드 기반)
  const shuffleArray = <T,>(array: T[], seed: number): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const randomValue = seededRandom(seed + i);
      const j = Math.floor(randomValue * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  // 3행 6열 구성: 각 행마다 output 4개 + reference 1개 + keyword 1개
  const createRow = (rowIndex: number) => {
    const outputImages = dummyImages.outputs.slice(rowIndex * 4, (rowIndex + 1) * 4);
    const referenceImage = dummyImages.references[rowIndex] || dummyImages.references[0];
    const keyword = keywords[rowIndex] || keywords[0];

    // 6개 아이템 배열로 만들고 타입 구분
    const items = [
      ...outputImages.map(img => ({ type: 'output' as const, data: img})),
      { type: 'reference' as const, data: referenceImage },
      { type: 'keyword' as const, data: keyword }
    ];

    // 클라이언트에서만 랜덤하게 섞기 (시드 사용으로 일관성 보장)
    const shuffledItems = isClient ? shuffleArray(items, rowIndex * 1000) : items;
    
    return {
      items: shuffledItems,
      allImages: [...outputImages, referenceImage] // 원본 순서 유지
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
    
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const galleryContainer = target.closest('.grid.grid-cols-6');
    const containerRect = galleryContainer?.getBoundingClientRect();
    
    if (containerRect) {
      // 이미지 하나의 크기 + gap (갤러리 컨테이너 너비 / 6)
      const imageSize = containerRect.width / 6;
      const gap = 8; // gap-2 = 0.5rem = 8px
      // 2x2 모달 크기 (이미지 2개 + gap 1개) - 절대값으로 계산
      const modalWidth = imageSize * 2 + gap;
      const modalHeight = imageSize * 2 + gap;
      
      // 현재 이미지의 갤러리 내 상대적 위치
      const relativeLeft = rect.left - containerRect.left;
      const relativeTop = rect.top - containerRect.top;
      
      // 가능한 위치들 체크 (우선순위: 우측 -> 좌측 -> 하단 -> 상단)
      let modalLeft = relativeLeft;
      let modalTop = relativeTop;
      
      // 우측에 공간이 있는지 체크
      if (relativeLeft + imageSize + gap + modalWidth <= containerRect.width) {
        modalLeft = relativeLeft + imageSize + gap;
      }
      // 좌측에 공간이 있는지 체크
      else if (relativeLeft - modalWidth - gap >= 0) {
        modalLeft = relativeLeft - modalWidth - gap;
      }
      // 하단에 공간이 있는지 체크
      else if (relativeTop + imageSize + gap + modalHeight <= containerRect.height) {
        modalTop = relativeTop + imageSize + gap;
      }
      // 상단에 공간이 있는지 체크
      else if (relativeTop - modalHeight - gap >= 0) {
        modalTop = relativeTop - modalHeight - gap;
      }
      
      setPinModalPosition({ 
        top: modalTop, 
        left: modalLeft,
        width: modalWidth,
        height: modalHeight
      });
    }
    
    setPinModalImageId(imageId);
    setBoardSearchTerm(''); // 검색어 초기화
  };

  const handleBoardSelect = (boardName: string) => {
    if (pinModalImageId !== null) {
      onTogglePin(pinModalImageId, boardName);
      setPinModalImageId(null);
      setPinModalPosition(null);
      setBoardSearchTerm('');
    }
  };

  const handleRowClick = (rowIndex: number, clickedImageId?: number) => {
    const row = rows[rowIndex];
    const allImages = row.allImages;

    // 클릭된 이미지의 인덱스 찾기
    let startImageIndex = 0;
    if (clickedImageId) {
      const clickedIndex = allImages.findIndex(img => img.id === clickedImageId);
      if (clickedIndex !== -1) {
        startImageIndex = clickedIndex;
      }
    }

    // keyword 추출
    const keywordItem = row.items.find(item => item.type === 'keyword');
    const keyword = keywordItem ? keywordItem.data : '';
    
    onRowSelect({
      rowIndex,
      images: allImages,
      keyword: keyword,
      startImageIndex
    });
  };

  // 검색된 보드 필터링
  const filteredBoards = boardNames.filter(board => 
    board.toLowerCase().includes(boardSearchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto relative">
      <div className="px-4 pt-1 pb-4 space-y-2">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex}>
            <div className="grid grid-cols-6 gap-2">
              {row.items.map((item, itemIndex) => {
                if (item.type === 'output') {
                  const image = item.data;
                  return (
                    <div
                      key={`output-${image.id}`}
                      className="relative group cursor-pointer"
                      draggable
                      onDragStart={(e) => handleImageDragStart(e, image.src)}
                      onClick={() => handleRowClick(rowIndex, image.id)}
                    >
                      <div className="aspect-square bg-gray-200 overflow-hidden">
                        <img
                          src={image.src}
                          alt=""
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                      
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
                  );
                }
                
                if (item.type === 'reference') {
                  const image = item.data;
                  return (
                    <div
                      key={`reference-${image.id}`}
                      className="relative group cursor-pointer"
                      draggable
                      onDragStart={(e) => handleImageDragStart(e, image.src)}
                      onClick={() => handleRowClick(rowIndex, image.id)}
                    >
                      <div className="aspect-square bg-gray-200 overflow-hidden">
                        <img
                          src={image.src}
                          alt=""
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                      
                      {/* Reference 표시 - 좌측 상단 검정 원 */}
                      <div className="absolute top-1 left-1 w-3 h-3 bg-black rounded-full"></div>
                      
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
                  );
                }
                
                if (item.type === 'keyword') {
                  const keyword = item.data;
                  return (
                    <div 
                      key={`keyword-${keyword}`}
                      className="aspect-square flex items-center justify-center cursor-pointer transition-colors bg-transparent text-gray-800 border border-gray-300 hover:bg-gray-100"
                      draggable
                      onDragStart={(e) => handleKeywordDragStart(e, keyword)}
                      onClick={() => handleRowClick(rowIndex)}
                    >
                      <span className="text-sm font-medium">{keyword}</span>
                    </div>
                  );
                }
                
                return null;
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 핀 보드 선택 모달 */}
      {pinModalImageId !== null && pinModalPosition && (
        <>
          {/* 모달 */}
          <div 
            className="absolute z-50 bg-white border border-gray-300 shadow-lg overflow-hidden flex flex-col"
            style={{
              top: `${pinModalPosition.top}px`,
              left: `${pinModalPosition.left}px`,
              width: `${pinModalPosition.width}px`,
              height: `${pinModalPosition.height}px`,
            }}
          >
            {/* 검색창 */}
            <div className="p-2 border-b border-gray-200 flex-shrink-0">
              <input
                type="text"
                placeholder="보드 검색..."
                value={boardSearchTerm}
                onChange={(e) => setBoardSearchTerm(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 focus:outline-none focus:border-gray-500"
                autoFocus
              />
            </div>
            
            {/* 보드 목록 */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-1">
                {filteredBoards.length > 0 ? (
                  filteredBoards.map((boardName) => (
                    <button
                      key={boardName}
                      onClick={() => handleBoardSelect(boardName)}
                      className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 transition-colors block"
                    >
                      {boardName}
                    </button>
                  ))
                ) : (
                  <div className="px-2 py-1 text-xs text-gray-500">
                    검색 결과가 없습니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}