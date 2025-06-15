'use client';

import { useState, useEffect } from 'react';
import { Pin, X } from 'lucide-react';
import { dummyImages, keywords, boardsData } from '@/data/dummyData';

interface GalleryProps {
  onTogglePin: (imageId: number, boardName?: string, createNew?: boolean) => void;

  pinnedImages: number[];
  boardNames: string[];
  onRowSelect: (rowData: {
    rowIndex: number;
    images: Array<{ id: number; src: string; isPinned: boolean }>;
    keyword: string;
    startImageIndex?: number;
  }) => void;
  selectedBoardId: number | null;
  generatedRows: Array<{
    images: Array<{ id: number; src: string; isPinned: boolean; type: 'output' | 'reference' }>;
    keyword: string;
  }>;

}

export default function Gallery({ 
  onTogglePin, 
  pinnedImages, 
  boardNames,
  onRowSelect,
  selectedBoardId,
  generatedRows

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
    const x = Math.sin(seed) * 10000;
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

  // 보드가 선택된 경우 해당 보드의 데이터만 표시
  const getDisplayRows = () => {
    if (selectedBoardId) {
      const selectedBoard = boardsData.find(board => board.id === selectedBoardId);
      if (selectedBoard) {
        // 보드 데이터를 갤러리 형식으로 변환
        const boardImages = selectedBoard.images.filter(img => img.type === 'output');
        const boardReference = selectedBoard.images.find(img => img.type === 'reference');
        const boardKeyword = selectedBoard.keyword;

        const items = [
          ...boardImages.map(img => ({ type: 'output' as const, data: img})),
          ...(boardReference ? [{ type: 'reference' as const, data: boardReference }] : []),
          { type: 'keyword' as const, data: boardKeyword }
        ];

        const shuffledItems = isClient ? shuffleArray(items, selectedBoardId * 1000) : items;
        
        return [{
          items: shuffledItems,
          allImages: [...boardImages, ...(boardReference ? [boardReference] : [])]
        }];
      }
    }

    // 기본 3행 6열 구성 + 생성된 행들
    const defaultRows = [0, 1, 2].map(createDefaultRow);
    const generatedRowsFormatted = generatedRows.map((genRow, index) => {
      const outputImages = genRow.images.filter(img => img.type === 'output');
      const referenceImage = genRow.images.find(img => img.type === 'reference');
      const keyword = genRow.keyword;

      const items = [
        ...outputImages.map(img => ({ type: 'output' as const, data: img})),
        ...(referenceImage ? [{ type: 'reference' as const, data: referenceImage }] : []),
        { type: 'keyword' as const, data: keyword }
      ];

      const shuffledItems = isClient ? shuffleArray(items, (index + 1000) * 1000) : items;
      
      return {
        items: shuffledItems,
        allImages: [...outputImages, ...(referenceImage ? [referenceImage] : [])]
      };
    });

    // 생성된 행들을 최상단에 배치
    return [...generatedRowsFormatted, ...defaultRows];
  };
  
  // 기본 3행 6열 구성: 각 행마다 output 4개 + reference 1개 + keyword 1개
  const createDefaultRow = (rowIndex: number) => {
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

  const rows = getDisplayRows();

  const handleImageDragStart = (e: React.DragEvent, imageSrc: string) => {
    e.dataTransfer.setData('image/src', imageSrc);
  };

  const handleKeywordDragStart = (e: React.DragEvent, keyword: string) => {
    e.dataTransfer.setData('keyword', keyword);
  };

  const handlePinClick = (e: React.MouseEvent, imageId: number) => {
    e.stopPropagation();
  
    // 클릭된 핀 버튼에서 이미지 컨테이너 찾기
    const pinButton = e.currentTarget as HTMLElement;
    const imageContainer = pinButton.closest('.relative.group') as HTMLElement;
    
    if (!imageContainer) return;
    
    // 이미지 컨테이너의 viewport 기준 절대 위치
    const imageRect = imageContainer.getBoundingClientRect();
    
    // 실제 렌더링된 이미지 크기
    const actualImageSize = imageRect.width;
    
    // 모달 크기 (2x2 이미지 크기)
    const modalWidth = actualImageSize * 2 + 8;
    const modalHeight = actualImageSize * 2 + 8;
    
    // 기본 위치: 이미지 좌측 (viewport 기준)
    let modalLeft = imageRect.left; // 이미지 우측 끝
    let modalTop = imageRect.top;    // 이미지 상단
    
    // 화면 경계 체크
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // 우측 경계 체크 - 넘어가면 좌측으로
    if (modalLeft + modalWidth > windowWidth) {
      modalLeft = imageRect.left - modalWidth; // 이미지 좌측으로
    }
    
    // 좌측 경계 체크 - 넘어가면 이미지 우측으로 조정
    if (modalLeft < 0) {
      modalLeft = imageRect.right;
      // 그래도 넘어가면 화면 내부로 강제 조정
      if (modalLeft + modalWidth > windowWidth) {
        modalLeft = windowWidth - modalWidth;
      }
    }
    
    // 하단 경계 체크 - 넘어가면 위로 이동
    if (modalTop + modalHeight > windowHeight) {
      modalTop = imageRect.bottom - modalHeight; // 이미지 하단에 맞춤
    }
    
    // 상단 경계 체크 - 넘어가면 하단으로 조정
    if (modalTop < 0) {
      modalTop = imageRect.bottom;
      // 그래도 넘어가면 화면 내부로 강제 조정
      if (modalTop + modalHeight > windowHeight) {
        modalTop = windowHeight - modalHeight;
      }
    }
    
    // 최종 안전 체크
    modalLeft = Math.max(0, Math.min(modalLeft, windowWidth - modalWidth));
    modalTop = Math.max(0, Math.min(modalTop, windowHeight - modalHeight));
    
    setPinModalPosition({ 
      top: modalTop, 
      left: modalLeft,
      width: modalWidth,
      height: modalHeight
    });
    
    setPinModalImageId(imageId);
    setBoardSearchTerm('');
  };

  const handleBoardSelect = () => {
    if (pinModalImageId !== null) {
      onTogglePin(pinModalImageId);
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

  const handleCloseModal = () => {
    setPinModalImageId(null);
    setPinModalPosition(null);
    setBoardSearchTerm('');
  };

  // 검색된 보드 필터링
  const filteredBoards = boardNames.filter(board => 
    board.toLowerCase().includes(boardSearchTerm.toLowerCase())
  );

  //  새 보드 생성 핸들러
  const handleCreateBoard = (newBoardName: string) => {
  if (pinModalImageId !== null) {
    // 새 보드 생성 로직을 부모 컴포넌트로 전달
    onTogglePin(pinModalImageId, newBoardName, true); // 세 번째 매개변수로 새 보드 생성 플래그
    setPinModalImageId(null);
    setPinModalPosition(null);
    setBoardSearchTerm('');
  }
};

  return (
    <div className="flex-1 h-full">
      <div className="px-4 pt-1 pb-4 space-y-2">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex}>
            <div className="grid grid-cols-6 gap-2">
              {row.items.map((item, itemIndex) => {
                if (item.type === 'output') {
                  const image = item.data;
                  return (
                    <div
                      key={`output-${image.id}-${itemIndex}`}
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
                      key={`reference-${image.id}-${itemIndex}`}
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
                      key={`keyword-${keyword}-${itemIndex}`}
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

        {/* 핀 보드 선택 모달 - Fixed 포지셔닝 사용 */}
    {pinModalImageId !== null && pinModalPosition && (
      <>
        {/* 오버레이 */}
        <div 
          className="fixed inset-0 z-40"
          onClick={handleCloseModal}
        />
        
        {/* 모달 - Fixed 포지셔닝으로 viewport 기준 위치, 검정 배경 */}
        <div 
          className="fixed z-50 bg-black bg-opacity-90 border border-gray-600 shadow-lg overflow-hidden flex flex-col text-white"
          style={{
            top: `${pinModalPosition.top}px`,
            left: `${pinModalPosition.left}px`,
            width: `${pinModalPosition.width}px`,
            height: `${pinModalPosition.height}px`,
          }}
        >
          {/* 모달 헤더 */}
          <div className="p-2 border-b border-gray-600 flex-shrink-0 flex items-center justify-between">
            <input
              type="text"
              placeholder="보드 검색..."
              value={boardSearchTerm}
              onChange={(e) => setBoardSearchTerm(e.target.value)}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 bg-white text-black placeholder-gray-500 focus:outline-none focus:border-gray-500"
              autoFocus
            />
            <button
              onClick={handleCloseModal}
              className="ml-2 p-1 hover:bg-gray-700 rounded text-white"
            >
              <X size={12} />
            </button>
          </div>
          
          {/* 보드 목록 */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-1">
              {filteredBoards.length > 0 ? (
                filteredBoards.map((boardName) => (
                  <button
                    key={boardName}
                    onClick={handleBoardSelect}
                    className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 transition-colors block"
                  >
                    {boardName}
                  </button>
                ))
              ) : (
                <div>
                  <div className="px-2 py-1 text-xs text-gray-500">
                    검색 결과가 없습니다.
                  </div>
                  {boardSearchTerm.trim() && (
                    <button
                      onClick={() => handleCreateBoard(boardSearchTerm.trim())}
                      className="w-full text-left px-2 py-1 text-xs hover:bg-blue-50 text-blue-600 transition-colors"
                    >
                      &apos;{boardSearchTerm.trim()}&apos; 보드 만들기
                    </button>
                  )}
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