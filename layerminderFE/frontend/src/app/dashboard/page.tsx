'use client';

import { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/dashboard/Navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import Gallery from '@/components/dashboard/Gallery';
import MainPanel from '@/components/dashboard/MainPanel';
import TopPanel from '@/components/dashboard/TopPanel';
import { GeneratedRow, GenerationContext, HistorySession, ProcessedHistoryRow } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { addImageToRoom, getUserHistoryImages, getUserHistorySession } from '@/lib/api'; 
import { getRooms, deleteRoom } from '@/lib/api';
import { LayerRoom } from '@/types';
import RoomModal from '@/components/dashboard/RoomModal';
import SaveToRoomModal from '@/components/dashboard/SaveToRoomModal';
import { createRoom, updateRoom } from '@/lib/api';
import { CreateRoomRequest, UpdateRoomRequest } from '@/types';
import { getRoomImages, RoomImage } from '@/lib/api';
import { removeImageFromRoom } from '@/lib/api';
import { v4 as uuidv4 } from 'uuid';

interface RowSelectData {
  rowIndex: number;
  images: Array<{ id: number; src: string; isPinned: boolean }>;
  keyword: string;
  startImageIndex?: number;
  story?: string;
  generatedKeywords?: string[];
  recommendationImage?: string;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pinnedImages, setPinnedImages] = useState<number[]>([]);
  const [topPanelMode, setTopPanelMode] = useState<'brand' | 'generate' | 'details'>('brand');
  const [selectedRowData, setSelectedRowData] = useState<RowSelectData | null>(null);

  const [isHistoryView, setIsHistoryView] = useState(true); 
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'history' | 'room'>('history'); 
  const [userHistorySession, setUserHistorySession] = useState<HistorySession | null>(null); 
  const [historyImages, setHistoryImages] = useState<ProcessedHistoryRow[]>([]);
  const [historyImagesLoading, setHistoryImagesLoading] = useState(false);
  
  const [generatedRows, setGeneratedRows] = useState<GeneratedRow[]>([]);
  const [rooms, setRooms] = useState<LayerRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);  
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [roomModalMode, setRoomModalMode] = useState<'create' | 'edit'>('create');
  const [editingRoom, setEditingRoom] = useState<LayerRoom | undefined>(undefined);
  const [saveToRoomModalOpen, setSaveToRoomModalOpen] = useState(false);
  const [savingHistoryId, setSavingHistoryId] = useState<string>('');
  const [modalLoading, setModalLoading] = useState(false);
  const [roomImages, setRoomImages] = useState<RoomImage[]>([]);
  const [roomImagesLoading, setRoomImagesLoading] = useState(false);  

  // 현재 컨텍스트 계산
  const getCurrentContext = useCallback((): GenerationContext => {
    if (selectedRoomId) {
      return {
        mode: 'room',
        targetId: selectedRoomId // Room ID 전달
      };
    }
    
    // 기본적으로 항상 history 모드
    return { 
      mode: 'history',
      targetId: userHistorySession?.session_id
    };
  }, [selectedRoomId, userHistorySession?.session_id]);

  // Room 목록 로드 함수
  const loadRooms = async () => {
    if (user) {
      setRoomsLoading(true);
      try {
        const roomList = await getRooms({ mine: true, size: 100 });
        if (roomList) {
          setRooms(roomList);
          console.log('✅ Rooms loaded:', roomList.length);
        }
      } catch (error) {
        console.error('Failed to load rooms:', error);
      } finally {
        setRoomsLoading(false);
      }
    }
  };

   // 히스토리 이미지 로드 함수
  const loadHistoryImages = async () => {
    if (user) {
      setHistoryImagesLoading(true);
      try {
        const historyData = await getUserHistoryImages();
        if (historyData) {
          // 백엔드 데이터를 프론트엔드 형식으로 변환
          const processedRows: ProcessedHistoryRow[] = historyData.map((record, index) => {
            const images = [
              {
                id: Date.now() + index * 10 + 1,
                src: record.gen_image_1,
                isPinned: false,
                type: 'output' as const,
                imageId: `${record.record_id}_gen1`
              },
              {
                id: Date.now() + index * 10 + 2,
                src: record.gen_image_2,
                isPinned: false,
                type: 'output' as const,
                imageId: `${record.record_id}_gen2`
              },
              {
                id: Date.now() + index * 10 + 3,
                src: record.gen_image_3,
                isPinned: false,
                type: 'output' as const,
                imageId: `${record.record_id}_gen3`
              },
              {
                id: Date.now() + index * 10 + 4,
                src: record.gen_image_4,
                isPinned: false,
                type: 'output' as const,
                imageId: `${record.record_id}_gen4`
              },
              {
                id: Date.now() + index * 10 + 5,
                src: record.reference_image_url,
                isPinned: false,
                type: 'reference' as const,
                imageId: `${record.record_id}_ref`
              }
            ];

            return {
              recordId: record.record_id,
              keyword: record.keywords[0] || 'Generated',
              keywords: record.keywords,
              images,
              createdAt: record.created_at,
              createdDay: record.created_day
            };
          });

          setHistoryImages(processedRows);
          console.log('✅ History images processed:', processedRows.length);
        }
      } catch (error) {
        console.error('Failed to load history images:', error);
      } finally {
        setHistoryImagesLoading(false);
      }
    }
  };

  // Room 이미지 로드 함수
  const loadRoomImages = async (roomId: string) => {
    setRoomImagesLoading(true);
    try {
      const images = await getRoomImages(roomId);
      if (images) {
        setRoomImages(images);
        console.log('✅ Room images loaded:', images.length);
      }
    } catch (error) {
      console.error('Failed to load room images:', error);
    } finally {
      setRoomImagesLoading(false);
    }
  };

  // 사용자의 단일 히스토리 세션 로드
  const loadUserHistorySession = async () => {
    if (user) {
      try {
        const session = await getUserHistorySession();
        if (session) {
          setUserHistorySession({
            session_id: session.session_id,
            user_id: session.user_id,
            created_at: session.created_at,
            updated_at: session.updated_at
          });
          console.log('✅ User history session loaded:', session.session_id);
        }
      } catch (error) {
        console.error('Failed to load user history session:', error);
      }
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {

          // 단일 히스토리 세션 로드
          await loadUserHistorySession();
          // 히스토리 이미지 로드
          await loadHistoryImages();
          // Room 목록 로드
          await loadRooms();

        } catch (error) {
          console.error('Failed to load data:', error);
        }
      }
    };
    loadData();
  }, [user]);

  // 로딩 중이거나 로그인되지 않은 경우 처리
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: '#edeae3' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 게스트 모드가 아닌데 로그인하지 않은 경우
  if (!user && typeof window !== 'undefined' && !window.location.search.includes('guest=true')) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: '#edeae3' }}>
        <div className="text-center">
          <p className="text-gray-600 mb-4">로그인이 필요합니다.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    );
  }

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleTogglePin = async (imageId: number, roomId?: string, createNew?: boolean) => {
    // createNew가 true이면 새 room 생성
    if (createNew) {
      handleCreateRoom();
      return;
    }

    const isCurrentlyPinned = pinnedImages.includes(imageId);

    if (isCurrentlyPinned) {
      // 이미지가 이미 핀된 상태라면 핀 해제
      if (roomId && confirm('이 이미지를 룸에서 제거하시겠습니까?')) {
        try {
          const roomImage = roomImages.find(img =>
            img.url === generatedRows
              .flatMap(row => row.images)
              .find(img => img.id === imageId)?.src
          );

          if (roomImage) {
            await removeImageFromRoom(roomId, roomImage.id);
            await loadRoomImages(roomId); // 룸 이미지 새로고침
            await loadRooms(); // 룸 목록 새로고침 (pin_count 업데이트)
          }
        } catch (error) {
          console.error('Failed to remove image from room:', error);
        }
      }
      setPinnedImages(prev => prev.filter(id => id !== imageId));
    } else {
      // 이미지가 핀되지 않은 상태라면 핀 추가
      if (!roomId) {
        alert('Room을 선택해주세요.');
        return;
      }

      try {
        // 이미지 정보 찾기
        let imageData: {imageId: string, url: string; note: string} | null = null;

        for (const row of generatedRows) {
          const foundImage = row.images.find(img => img.id === imageId);
          if (foundImage) {
            
                console.log('🔍 Found image for pinning:');
                console.log('  - Frontend ID:', foundImage.id);
                console.log('  - Backend ImageID:', foundImage.imageId);
                console.log('  - URL:', foundImage.src);
                console.log('  - Type:', typeof foundImage.imageId);
  
            imageData = {
              imageId: foundImage.imageId || `fallback_${uuidv4()}`,
              url: foundImage.src,
              note: `Generated from: ${row.keyword || 'Unknown'}`
            };
            break;
          }
        }

        // Room 이미지에서도 검색
        if (!imageData && roomImages.length > 0) {
          const foundRoomImage = roomImages.find(img => img.room_image_id === imageId.toString());
          if (foundRoomImage) {
            imageData = {
              imageId: foundRoomImage.image_id,
              url: foundRoomImage.url,
              note: foundRoomImage.note || 'Pinned Image'
            };
          }
        }

        if (!imageData) {
          alert('이미지를 찾을 수 없습니다.');
          return;
        }

        console.log('📌 Adding image to room:', { roomId, imageData });

        const result = await addImageToRoom(roomId, {
          image_id: imageData.imageId,
          note: imageData.note,
          seq: roomImages.length + pinnedImages.length
        });

        console.log('🔄 addImageToRoom result:', result); 

        if (result) {
          console.log('✅ Image successfully added to room');
          setPinnedImages(prev => [...prev, imageId]);

          // 현재 선택된 Room이 저장한 Room과 같은 경우에만 이미지 목록 새로고침
          if (selectedRoomId === roomId) {
            await loadRoomImages(roomId);
          }

          await loadRooms(); // Room 목록 새로고침 (pin_count 업데이트)
          alert(`이미지가 "${rooms.find(r => r.id === roomId)?.name}" Room에 저장되었습니다.`);
        } else {
          alert('이미지 핀에 실패했습니다.');
        }
      } catch (error) {
        console.error('Failed to add image to room:', error);
        alert('이미지 핀에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  // 새로운 생성 결과 처리 (SSE를 통해 받은 완전한 결과)
  const handleGenerationComplete = (result: GeneratedRow) => {
    console.log('🎉 Generation completed:', result);
    
    const context = getCurrentContext();
    
    if (context.mode === 'room') {
      // Room 모드: Room 이미지 목록 새로고침
      if (selectedRoomId) {
        loadRoomImages(selectedRoomId);
        loadRooms(); // pin_count 업데이트
      }
    } else {
      // History 모드: 생성된 결과를 목록에 추가
      setGeneratedRows(prev => [result, ...prev]);
    }

    // UI 상태 업데이트 (공통)
    setTopPanelMode('generate');
    setSelectedRowData({
      rowIndex: 0,
      images: result.images,
      keyword: result.keyword || 'Generated',
      startImageIndex: 0,
      story: result.story,
      generatedKeywords: result.generatedKeywords,
      recommendationImage: result.recommendationImage
    });
  };

  // 행 선택 핸들러
  const handleRowSelect = (rowData: RowSelectData) => {
    setSelectedRowData(rowData);
    
    // 새로 생성된 이미지인 경우 generate 모드로, 기존 이미지인 경우 details 모드로
    const isNewlyGenerated = generatedRows.some(row => 
      row.images.some(img => 
        rowData.images.some(selectedImg => selectedImg.src === img.src)
      )
    );
    
    setTopPanelMode(isNewlyGenerated ? 'generate' : 'details');
  };

  const handleCloseTopPanel = () => {
    setTopPanelMode('brand');
    setSelectedRowData(null);
  };

  // History 뷰 토글 핸들러
  const handleHistoryToggle = () => {
    setIsHistoryView(true);
    setSelectedRoomId(null);
    setViewMode('history');
    setTopPanelMode('brand');
    setSelectedRowData(null);
    setRoomImages([]); // Room 이미지 클리어
    loadHistoryImages(); // 히스토리 이미지 새로고침
  };

  // Room 선택 핸들러
  const handleRoomSelect = async (roomId: string | null) => {
    setSelectedRoomId(roomId);
    setIsHistoryView(false);
    setViewMode(roomId ? 'room' : 'history');
    setTopPanelMode('brand');
    setSelectedRowData(null);

    // Room 선택시 해당 Room의 이미지 로드
    if (roomId) {
      await loadRoomImages(roomId);
    } else {
      setRoomImages([]);
    }
  };

  const handleRoomDelete = async (roomId: string) => {
    try {
      console.log('🗑️ Starting room deletion:', roomId);
      
      const success = await deleteRoom(roomId);
      
      if (success) {
        console.log('✅ Room deletion successful');
        
        // 선택된 룸인 경우 상태 초기화
        if (selectedRoomId === roomId) {
          setSelectedRoomId(null);
          setIsHistoryView(true);
          setViewMode('history');
          setSelectedRowData(null);
        }
        
        // 목록 새로고침
        await loadRooms();
        console.log('✅ Room list refreshed');
      } else {
        console.error('❌ Room deletion failed');
        alert('룸 삭제에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('❌ Room deletion error:', error);
      alert('룸 삭제 중 오류가 발생했습니다.');
    }
  };

  // Room 생성 핸들러
  const handleCreateRoom = () => {
    setRoomModalMode('create');
    setEditingRoom(undefined);
    setRoomModalOpen(true);
  };

  // Room 수정 핸들러
  const handleEditRoom = (room: LayerRoom) => {
    setRoomModalMode('edit');
    setEditingRoom(room);
    setRoomModalOpen(true);
  };

  // Room 공개/비공개 토글 핸들러
  const handleToggleRoomVisibility = async (room: LayerRoom) => {
    setModalLoading(true);
    try {
      const updateData: UpdateRoomRequest = {
        is_public: !room.is_public
      };
      
      const updatedRoom = await updateRoom(room.id, updateData);
      if (updatedRoom) {
        console.log('✅ Room visibility toggled:', updatedRoom.id);
        await loadRooms(); // 목록 새로고침
      }
    } catch (error) {
      console.error('Failed to toggle room visibility:', error);
      alert('공개 설정 변경에 실패했습니다.');
    } finally {
      setModalLoading(false);
    }
  };

  // Room 모달 제출 핸들러
  const handleRoomModalSubmit = async (data: CreateRoomRequest | UpdateRoomRequest) => {
    setModalLoading(true);
    try {
      if (roomModalMode === 'create') {
        const newRoom = await createRoom(data as CreateRoomRequest);
        if (newRoom) {
          console.log('✅ Room created:', newRoom.id);
          await loadRooms(); // 목록 새로고침
        }
      } else if (roomModalMode === 'edit' && editingRoom) {
        const updatedRoom = await updateRoom(editingRoom.id, data as UpdateRoomRequest);
        if (updatedRoom) {
          console.log('✅ Room updated:', updatedRoom.id);
          await loadRooms(); // 목록 새로고침
        }
      }
    } catch (error) {
      console.error('Room operation failed:', error);
      alert(roomModalMode === 'create' ? '룸 생성에 실패했습니다.' : '룸 수정에 실패했습니다.');
      throw error; // 모달이 닫히지 않도록
    } finally {
      setModalLoading(false);
    }
  };

  // History를 Room으로 저장하는 핸들러 (레거시 - 단일 세션에서는 사용하지 않을 예정)
  // const handleSaveToRoom = (historyId: string) => {
  //   setSavingHistoryId(historyId);
  //   setSaveToRoomModalOpen(true);
  // };

  // Room에 History 저장 실행 (레거시)
  const handleSaveHistoryToRoom = async (roomId: string, historyId: string) => {
    setModalLoading(true);
    try {
      // TODO: 히스토리의 이미지들을 가져와서 Room에 추가하는 로직
      console.log('Saving history to room:', { historyId, roomId });
      
      alert('히스토리가 룸에 저장되었습니다.');
      await loadRooms(); // Room 목록 새로고침 (pin_count 업데이트)
    } catch (error) {
      console.error('Failed to save history to room:', error);
      alert('룸에 저장하는데 실패했습니다.');
      throw error;
    } finally {
      setModalLoading(false);
    }
  };

  // Room 이미지 삭제 핸들러
  const handleRemoveImageFromRoom = async (roomImageId: string, imageId: string) => {
    if (!selectedRoomId) return;
    
    if (confirm('이 이미지를 룸에서 제거하시겠습니까?')) {
      try {
        const success = await removeImageFromRoom(selectedRoomId, imageId);
        if (success) {
          console.log('✅ Image removed from room:', imageId);
          // Room 이미지 목록 새로고침
          await loadRoomImages(selectedRoomId);
          // Room 목록도 새로고침 (pin_count 업데이트)
          await loadRooms();
        } else {
          alert('이미지 제거에 실패했습니다.');
        }
      } catch (error) {
        console.error('Failed to remove image from room:', error);
        alert('이미지 제거 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <Navigation onToggleSidebar={handleToggleSidebar} />
      
      <div className="flex-1 flex pt-16 min-h-0">
        <Sidebar 
          isOpen={isSidebarOpen}
          rooms={rooms}
          roomsLoading={roomsLoading}
          selectedRoomId={selectedRoomId}
          isHistoryView={isHistoryView} 
          onHistoryToggle={handleHistoryToggle} 
          onRoomSelect={handleRoomSelect}
          onRoomDelete={handleRoomDelete}
          onRoomsRefresh={loadRooms}
          onCreateRoom={handleCreateRoom}
          onEditRoom={handleEditRoom}
          onToggleRoomVisibility={handleToggleRoomVisibility}
        />
        
        <div className={`flex-1 flex transition-all duration-300 min-h-0 ${
          isSidebarOpen ? 'ml-64' : 'ml-0'
        }`}>
          {/* Main Panel */}
          <div className="w-[30%] flex-shrink-0">
            <MainPanel 
              onGenerate={handleGenerationComplete}
              context={getCurrentContext()}
            />
          </div>
          
          {/* Gallery Area with TopPanel */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Top Panel */}
            <div className="h-80 flex-shrink-0 mb-2">
              <TopPanel 
                mode={topPanelMode}
                selectedRowData={selectedRowData}
                onClose={handleCloseTopPanel}
              />
            </div>
              
            {/* Gallery */}
            <div className="flex-1 min-w-0 mt-5 overflow-y-auto">
              <Gallery 
                onTogglePin={handleTogglePin}
                pinnedImages={pinnedImages}
                rooms={rooms}
                onRowSelect={handleRowSelect}
                viewMode={viewMode}
                selectedHistoryId={userHistorySession?.session_id || null} 
                selectedRoomId={selectedRoomId}
                generatedRows={generatedRows}
                historySessions={userHistorySession ? [userHistorySession] : []} 
                roomImages={roomImages}
                roomImagesLoading={roomImagesLoading}
                onRemoveImageFromRoom={handleRemoveImageFromRoom}
                historyImages={historyImages}
                historyImagesLoading={historyImagesLoading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Room 생성/수정 모달 */}
      <RoomModal 
        isOpen={roomModalOpen}
        mode={roomModalMode}
        room={editingRoom}
        onClose={() => setRoomModalOpen(false)}
        onSubmit={handleRoomModalSubmit}
        loading={modalLoading}
      />

      {/* History를 Room에 저장하는 모달 (레거시 - 단일 세션에서는 사용하지 않을 예정) */}
      <SaveToRoomModal
        isOpen={saveToRoomModalOpen}
        historyId={savingHistoryId}
        rooms={rooms}
        onClose={() => setSaveToRoomModalOpen(false)}
        onSaveToRoom={handleSaveHistoryToRoom}
        onCreateNewRoom={() => {
          setSaveToRoomModalOpen(false);
          handleCreateRoom();
        }}
        loading={modalLoading}
      />
    </div>
  );
}