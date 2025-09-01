'use client';

import { useState, useEffect } from 'react';
import { Pin, X, Trash2 } from 'lucide-react';
// import { dummyImages, keywords } from '@/data/dummyData';
import { HistorySession, GeneratedRow, RoomImage, LayerRoom, ProcessedHistoryRow } from '@/types';

interface GalleryProps {
  onTogglePin: (imageId: number, boardName?: string, createNew?: boolean) => void;
  pinnedImages: number[];
  rooms: LayerRoom[];
  onRowSelect: (rowData: {
    rowIndex: number;
    images: Array<{ 
      id: number; 
      src: string; 
      isPinned: boolean;
      type?: 'output' | 'reference' | 'recommendation'; 
      imageId?: string;
      fileKey?: string;
      roomImageId?: string; 
    }>;
    keyword: string;
    startImageIndex?: number;
    story?: string;
    generatedKeywords?: string[];
    recommendationImage?: string;
  }) => void;
  viewMode: 'history' | 'room' | 'default';
  selectedHistoryId: string | null;
  selectedRoomId: string | null;
  generatedRows: GeneratedRow[];
  historySessions: HistorySession[];
  roomImages: RoomImage[];
  roomImagesLoading: boolean;
  onRemoveImageFromRoom?: (roomImageId: string, imageId: string) => Promise<void>;
  historyImages: ProcessedHistoryRow[];
  historyImagesLoading: boolean;
}

export default function Gallery({ 
  onTogglePin, 
  pinnedImages, 
  onRowSelect,
  viewMode,
  selectedHistoryId,
  selectedRoomId,
  generatedRows,
  historySessions,
  roomImages,
  roomImagesLoading,
  rooms,
  onRemoveImageFromRoom,
  historyImages,
  historyImagesLoading
}: GalleryProps) {
  const [pinModalImageId, setPinModalImageId] = useState<number | null>(null);
  const [pinModalPosition, setPinModalPosition] = useState<{top: number, left: number, width: number, height: number} | null>(null);
  const [roomSearchTerm, setRoomSearchTerm] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const shuffleArray = <T,>(array: T[], seed: number): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const randomValue = seededRandom(seed + i);
      const j = Math.floor(randomValue * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const getDisplayRows = () => {
    if (viewMode === 'history') {
      // 히스토리 로딩 중
      if (historyImagesLoading) {
        return [];
      }

      const rows = [];

      // 1. 먼저 새로 생성된 이미지들 추가 (최신이 맨 위에)
      const historyGeneratedRows = generatedRows;
      const generatedRowsData = historyGeneratedRows.map((genRow, index) => {
        const outputImages = genRow.images.filter(img => img.type === 'output');
        const keyword = genRow.keyword;

        const items = [
          ...outputImages.map(img => ({ type: 'output' as const, data: img})),
          ...(genRow.recommendationImage ? [{
            type: 'recommendation' as const, 
            data: { 
              id: Date.now() + 9999 + index, 
              src: genRow.recommendationImage, 
              isPinned: false, 
              type: 'recommendation' as const 
            }
          }] : []),
          { type: 'keyword' as const, data: keyword }
        ];

        const shuffledItems = isClient ? shuffleArray(items, index * 1000) : items;
        
        return {
          items: shuffledItems,
          allImages: [
            ...outputImages,
            ...(genRow.recommendationImage ? [{
              id: Date.now() + 9999 + index,
              src: genRow.recommendationImage,
              isPinned: false,
              type: 'recommendation' as const,
            }] : [])
          ]
        };
      });

      // 2. 새로 생성된 행들을 먼저 추가
      rows.push(...generatedRowsData);

      // 3. 그 다음에 기존 히스토리 이미지들 추가
      if (historyImages.length > 0) {
        // 최신순 정렬
        const sortedHistoryImages = [...historyImages].sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        const historyRowsData = sortedHistoryImages.map((historyRow, index) => {
          // 렌덤 키워드 선택 로직
          const getRandomKeyword = (keywords: string[], fallback: string = 'Generated'): string => {
            if (!keywords || keywords.length === 0) return fallback;

            if (keywords.length === 1) return keywords[0];

            // 시드 기반 랜덤 선택 (일관성을 위해)
            // recordId를 기반으로 시드 생성하여 같은 레코드는 항상 같은 키워드 선택
            const seed = historyRow.recordId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const randomIndex = seed % keywords.length;
            
            return keywords[randomIndex];
          }

          // 랜덤하게 선택된 키워드
          const randomKeyword = getRandomKeyword(historyRow.keywords, historyRow.keyword);

          const items = [
            // 생성된 이미지 4개
            ...historyRow.images.filter(img => img.type === 'output').map(img => ({ 
              type: 'output' as const, 
              data: img
            })),
            // 레퍼런스 이미지 1개
            ...historyRow.images.filter(img => img.type === 'recommendation').map(img => ({ 
              type: 'recommendation' as const, 
              data: img
            })),
            // 키워드
            { type: 'keyword' as const, data: randomKeyword }
          ];

          // generatedRows와 겹치지 않도록 다른 seed 사용
          const shuffledItems = isClient ? shuffleArray(items, (index + 10000) * 1000) : items;
          
          return {
            items: shuffledItems,
            allImages: historyRow.images,
            historyData: historyRow, // 히스토리 데이터 추가
            // 🔍 디버깅용: 원본 키워드들과 선택된 키워드 정보
            originalKeywords: historyRow.keywords,
            selectedKeyword: randomKeyword
          };
        });

        // 히스토리 행들 추가
        rows.push(...historyRowsData);

        // 🔍 디버깅용 로그 (개발 모드에서만)
        // if (process.env.NODE_ENV === 'development') {
        //   console.log('🎲 Random keyword selection results:');
        //   historyRowsData.forEach((row, index) => {
        //     console.log(`Row ${index + 1}:`, {
        //       recordId: row.historyData?.recordId,
        //       originalKeywords: row.originalKeywords,
        //       selectedKeyword: row.selectedKeyword
        //     });
        //   });
        // }
      }

      return rows;
    }

    if (viewMode === 'room' && selectedRoomId) {
      // Room 이미지들을 Gallery 형식으로 변환
      if (roomImagesLoading) {
        return []; // 로딩 중에는 빈 배열
      }
      
      if (roomImages.length === 0) {
        return []; // 이미지가 없으면 빈 배열
      }
      
      // Room 이미지들을 6개씩 묶어서 행으로 만들기
      const rows = [];
      const imagesPerRow = 6;
      
      for (let i = 0; i < roomImages.length; i += imagesPerRow - 1) { // -1은 키워드 공간 확보
        const rowImages = roomImages.slice(i, i + imagesPerRow - 1);
        
        const items = [
          ...rowImages.map((roomImg, index) => ({ 
            type: 'output' as const, 
            data: {
              id: Date.now() + i + index,
              src: roomImg.url,
              isPinned: false,
              type: 'output' as const,
              imageId: roomImg.image_id,
              roomImageId: roomImg.room_image_id // Room에서 삭제할 때 필요
            }
          })),
          { type: 'keyword' as const, data: 'Room Images' }
        ];
        
        rows.push({
          items,
          allImages: rowImages.map((roomImg, index) => ({
            id: Date.now() + i + index,
            src: roomImg.url,
            isPinned: false,
            type: 'output' as const,
            imageId: roomImg.image_id,
            roomImageId: roomImg.room_image_id
          }))
        });
      }
      
      return rows;
    }
    
    return [];
  };
  
  // const createDefaultRow = (rowIndex: number) => {
  //   const outputImages = dummyImages.outputs.slice(rowIndex * 4, (rowIndex + 1) * 4);
  //   const referenceImage = dummyImages.references[rowIndex] || dummyImages.references[0];
  //   const keyword = keywords[rowIndex] || keywords[0];

  //   const items = [
  //     ...outputImages.map(img => ({ type: 'output' as const, data: img})),
  //     { type: 'reference' as const, data: referenceImage },
  //     { type: 'keyword' as const, data: keyword }
  //   ];

  //   const shuffledItems = isClient ? shuffleArray(items, rowIndex * 1000) : items;
    
  //   return {
  //     items: shuffledItems,
  //     allImages: [...outputImages, referenceImage]
  //   };
  // };

  const rows = getDisplayRows();

  const handleImageDragStart = (e: React.DragEvent, imageSrc: string) => {
    e.dataTransfer.setData('image/src', imageSrc);
  };

  const handleKeywordDragStart = (e: React.DragEvent, keyword: string) => {
    e.dataTransfer.setData('keyword', keyword);
  };

  const handlePinClick = (e: React.MouseEvent, imageId: number) => {
    console.log('🔥 [DEBUG] Pin button clicked!', { imageId });
    e.stopPropagation();
  
    const pinButton = e.currentTarget as HTMLElement;
    const imageContainer = pinButton.closest('.relative.group') as HTMLElement;
    
    if (!imageContainer) return;
    
    const imageRect = imageContainer.getBoundingClientRect();
    const actualImageSize = imageRect.width;
    const modalWidth = actualImageSize * 2 + 8;
    const modalHeight = actualImageSize * 2 + 8;
    
    let modalLeft = imageRect.left;
    let modalTop = imageRect.top;
    
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    if (modalLeft + modalWidth > windowWidth) {
      modalLeft = imageRect.left - modalWidth;
    }
    
    if (modalLeft < 0) {
      modalLeft = imageRect.right;
      if (modalLeft + modalWidth > windowWidth) {
        modalLeft = windowWidth - modalWidth;
      }
    }
    
    if (modalTop + modalHeight > windowHeight) {
      modalTop = imageRect.bottom - modalHeight;
    }
    
    if (modalTop < 0) {
      modalTop = imageRect.bottom;
      if (modalTop + modalHeight > windowHeight) {
        modalTop = windowHeight - modalHeight;
      }
    }
    
    modalLeft = Math.max(0, Math.min(modalLeft, windowWidth - modalWidth));
    modalTop = Math.max(0, Math.min(modalTop, windowHeight - modalHeight));
    
    setPinModalPosition({ 
      top: modalTop, 
      left: modalLeft,
      width: modalWidth,
      height: modalHeight
    });
    
    setPinModalImageId(imageId);
    setRoomSearchTerm('');

    console.log('✅ [DEBUG] Pin modal state updated');
  };

  const handleRoomSelect = (roomId: string) => {
    console.log('🎯 [DEBUG] Room selected!', { roomId, pinModalImageId });
    if (pinModalImageId !== null) {
      onTogglePin(pinModalImageId, roomId);
      setPinModalImageId(null);
      setPinModalPosition(null);
      setRoomSearchTerm('');
    }
  };

  const handleRowClick = (rowIndex: number, clickedImageId?: number) => {
    const row = rows[rowIndex];
    const allImages = row.allImages;

    let startImageIndex = 0;
    if (clickedImageId) {
      const clickedIndex = allImages.findIndex(img => img.id === clickedImageId);
      if (clickedIndex !== -1) {
        startImageIndex = clickedIndex;
      }
    }

    const keywordItem = row.items.find(item => item.type === 'keyword');
    const keyword = keywordItem ? keywordItem.data : '';

    const generatedRow = generatedRows.find(genRow =>
      genRow.images.some(img => allImages.some(allImg => allImg.src === img.src))
    );

    // 히스토리 데이터에서도 찾기
    const historyRow = historyImages.find(histRow =>
      histRow.images.some(img => allImages.some(allImg => allImg.src === img.src))
    );

    onRowSelect({
    rowIndex,
    images: allImages,
    keyword: keyword ?? '',
    startImageIndex,
    story: generatedRow?.story,
    generatedKeywords: generatedRow?.generatedKeywords || historyRow?.keywords,
    recommendationImage: generatedRow?.recommendationImage
  });
  };

  const handleCloseModal = () => {
    setPinModalImageId(null);
    setPinModalPosition(null);
    setRoomSearchTerm('');
  };

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(roomSearchTerm.toLowerCase())
  );

  const handleCreateRoom = () => {
    if (pinModalImageId !== null) {
      onTogglePin(pinModalImageId, undefined, true);
      setPinModalImageId(null);
      setPinModalPosition(null);
      setRoomSearchTerm('');
    }
  };

  return (
    <div className="flex-1 h-full">
      <div className="px-4 pt-1 pb-4 space-y-2">

        {/* 히스토리 로딩 상태 표시 */}
        {viewMode === 'history' && historyImagesLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2 text-gray-600">히스토리를 불러오는 중...</span>
          </div>
        )}

        {/* 히스토리 데이터가 없을 때 */}
        {viewMode === 'history' && !historyImagesLoading && historyImages.length === 0 && generatedRows.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <span className="text-gray-500">생성된 이미지가 없습니다.</span>
          </div>
        )}

        {/* Room 로딩 상태 표시 */}
        {viewMode === 'room' && roomImagesLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2 text-gray-600">룸 이미지를 불러오는 중...</span>
          </div>
        )}

        {/* Room 데이터가 없을 때 */}
        {viewMode === 'room' && !roomImagesLoading && roomImages.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <span className="text-gray-500">룸에 저장된 이미지가 없습니다.</span>
          </div>
        )}

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
                      
                      {/* AI 생성 이미지 표시 */}
                      {image.imageId && (
                        <div className="absolute top-1 left-1 w-3 h-3 bg-blue-500 rounded-full" title="AI Generated"></div>
                      )}
                      
                      {/* Room 모드에서 삭제 버튼 추가 */}
                      {viewMode === 'room' && onRemoveImageFromRoom && 'roomImageId' in image && image.roomImageId && (
                        <button
                          className="absolute top-1 left-1 p-1 bg-red-500 text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveImageFromRoom(image.roomImageId!, image.imageId || '');
                          }}
                          title="룸에서 제거"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                      
                      <button
                        className="absolute top-1 right-1 p-1 bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handlePinClick(e, image.id)}
                        title={viewMode === 'room' ? '다른 룸에 복사' : '룸에 저장'}
                      >
                        <Pin
                          size={12}
                          className={pinnedImages.includes(image.id) ? 'fill-current text-blue-500' : 'text-gray-600'}
                        />
                      </button>
                    </div>
                  );
                }
                
                if (item.type === 'recommendation') {
                  const image = item.data;
                  return (
                    <div
                      key={`recommendation-${image.id}-${itemIndex}`}
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
                      onDragStart={(e) => handleKeywordDragStart(e, keyword ?? '')}
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

      {/* 핀 룸 선택 모달 */}
      {pinModalImageId !== null && pinModalPosition && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={handleCloseModal}
          />
          
          <div 
            className="fixed z-50 bg-black bg-opacity-90 border border-gray-600 shadow-lg overflow-hidden flex flex-col text-white"
            style={{
              top: `${pinModalPosition.top}px`,
              left: `${pinModalPosition.left}px`,
              width: `${pinModalPosition.width}px`,
              height: `${pinModalPosition.height}px`,
            }}
          >
            <div className="p-2 border-b border-gray-600 flex-shrink-0 flex items-center justify-between">
              <input
                type="text"
                placeholder="룸 검색..."
                value={roomSearchTerm}
                onChange={(e) => setRoomSearchTerm(e.target.value)}
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
            
            <div className="flex-1 overflow-y-auto">
              <div className="p-1">
                {filteredRooms.length > 0 ? (
                  filteredRooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => handleRoomSelect(room.id)}
                      className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 transition-colors block"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {room.name}
                        </div>
                        {room.description && (
                            <div className="text-gray-500 text-xs truncate">
                              {room.description}
                            </div>
                          )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-400">({room.pin_count})</span>
                        {room.is_public && <span className="text-green-400">🌍</span>}
                      </div>
                    </button>
                  ))
                ) : (
                  <div>
                    <div className="px-2 py-1 text-xs text-gray-500">
                      검색 결과가 없습니다.
                    </div>
                    {roomSearchTerm.trim() && (
                      <button
                        onClick={() => handleCreateRoom}
                        className="w-full text-left px-2 py-1 text-xs hover:bg-blue-50 text-blue-600 transition-colors"
                      >
                        &apos;{roomSearchTerm.trim()}&apos; 룸 만들기
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