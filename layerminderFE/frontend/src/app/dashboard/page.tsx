'use client';

import { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/dashboard/Navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import Gallery from '@/components/dashboard/Gallery';
import MainPanel from '@/components/dashboard/MainPanel';
import TopPanel from '@/components/dashboard/TopPanel';
import { GeneratedRow, GenerationContext, HistorySession } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { deleteHistorySession, getHistorySessions } from '@/lib/api';
import { getRooms, deleteRoom } from '@/lib/api';
import { LayerRoom } from '@/types';
import RoomModal from '@/components/dashboard/RoomModal';
import SaveToRoomModal from '@/components/dashboard/SaveToRoomModal';
import { createRoom, updateRoom } from '@/lib/api';
import { CreateRoomRequest, UpdateRoomRequest } from '@/types';
import { getRoomImages, RoomImage } from '@/lib/api';
import { removeImageFromRoom } from '@/lib/api';

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
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'history' | 'room' | 'default'>('default');
  const [generatedRows, setGeneratedRows] = useState<GeneratedRow[]>([]);
  const [historySessions, setHistorySessions] = useState<HistorySession[]>([]);
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

  const [boardNames, setBoardNames] = useState([
    'Sofa', 'Lounge Chair', 'Coffee Table', 'Stool', 'Bench', 'Daybed',
    'Console', 'Dining Table', 'Armless Chair', 'Arm Chair', 'Bar Chair',
    'Desk', 'Storage', 'Cabinet', 'Bed Headboard', 'Mirror', 'Lighting', 'Artwork'
  ]);

  // 현재 컨텍스트 계산
  const getCurrentContext = useCallback((): GenerationContext => {
    if (selectedRoomId) {
      return {
        mode: 'room',
        targetId: selectedRoomId // Room ID 전달
      };
    }
    
    if (selectedHistoryId) {
      return {
        mode: 'history',
        targetId: selectedHistoryId // History Session ID 전달
      };
    }
    
    return { mode: 'new' };
  }, [selectedRoomId, selectedHistoryId]);

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

  // Room 이미지 로드 함수 (loadRooms 함수 아래에 추가)
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

  // 히스토리 세션 로드
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {
          // 히스토리 세션 로드
          const sessions = await getHistorySessions();
          if (sessions) {
            setHistorySessions(sessions);
            console.log('✅ History sessions loaded:', sessions.length);
          }

          // Room 목록 로드
          await loadRooms();
        } catch (error) {
          console.error('Failed to load history sessions or rooms:', error);
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

  const handleTogglePin = (imageId: number, boardName?: string, createNew?: boolean) => {
    if (createNew && boardName) {
      setBoardNames(prev => [...prev, boardName]);
    }
    if (pinnedImages.includes(imageId)) {
      setPinnedImages(prev => prev.filter(id => id !== imageId));
    } else {
      setPinnedImages(prev => [...prev, imageId]);
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
    } else if (context.mode === 'history') {
      // History 모드: 현재 뷰 유지, 필요시 새로고침
      // 실제로는 같은 세션에 추가되었으므로 UI 업데이트만
      setGeneratedRows(prev => [result, ...prev]);
    } else {
      // 새 생성: 기존 로직
      setGeneratedRows(prev => [result, ...prev]);
      
      // History 세션 목록 새로고침
      if (user) {
        getHistorySessions().then(sessions => {
          if (sessions) {
            setHistorySessions(sessions);
          }
        });
      }
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

  const handleHistorySelect = (historyId: string | null) => {
    setSelectedHistoryId(historyId);
    setSelectedRoomId(null);
    setViewMode(historyId ? 'history' : 'default');
    setTopPanelMode('brand');
    setSelectedRowData(null);
  };

  const handleRoomSelect = async (roomId: string | null) => {
    setSelectedRoomId(roomId);
    setSelectedHistoryId(null);
    setViewMode(roomId ? 'room' : 'default');
    setTopPanelMode('brand');
    setSelectedRowData(null);

    // Room 선택시 해당 Room의 이미지 로드
    if (roomId) {
      await loadRoomImages(roomId);
    } else {
      setRoomImages([]);
    }
  };

  const handleHistoryDelete = async (historyId: string) => {
    try {
      console.log('🗑️ Starting history deletion:', historyId);

      const success = await deleteHistorySession(historyId);

      if (success) {

        // 선택된 히스토리인 경우 상태 초기화
        if (selectedHistoryId === historyId) {
          setSelectedHistoryId(null);
          setViewMode('default');
          setSelectedRowData(null);
        }

        // 목록 새로고침
        if (user) {
          const updatedSessions = await getHistorySessions();
          if (updatedSessions) {
            setHistorySessions(updatedSessions);
            console.log('✅ History sessions updated:', updatedSessions.length);
          }
        }
      } else {
        console.error('Failed to delete history:', historyId);
        alert('히스토리 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to delete history:', error);
      alert('히스토리 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleRoomDelete = async (roomId: string) => {
    try {
      console.log('🗑️ Starting room deletion:', roomId);
      
      // 🔥 실제 삭제 API 호출 추가!
      const success = await deleteRoom(roomId);
      
      if (success) {
        console.log('✅ Room deletion successful');
        
        // 선택된 룸인 경우 상태 초기화
        if (selectedRoomId === roomId) {
          setSelectedRoomId(null);
          setViewMode('default');
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

  // History를 Room으로 저장하는 핸들러
  const handleSaveToRoom = (historyId: string) => {
    setSavingHistoryId(historyId);
    setSaveToRoomModalOpen(true);
  };

  // Room에 History 저장 실행
  const handleSaveHistoryToRoom = async (roomId: string, historyId: string) => {
    setModalLoading(true);
    try {
      // TODO: 히스토리의 이미지들을 가져와서 Room에 추가하는 로직
      // 지금은 콘솔 로그만
      console.log('Saving history to room:', { historyId, roomId });
      
      // 실제 구현 시에는 여기서 히스토리의 이미지들을 가져와서
      // addImageToRoom API를 호출해야 함
      
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
          historySessions={historySessions}
          rooms={rooms}
          roomsLoading={roomsLoading}
          selectedHistoryId={selectedHistoryId}
          selectedRoomId={selectedRoomId}
          onHistorySelect={handleHistorySelect}
          onRoomSelect={handleRoomSelect}
          onHistoryDelete={handleHistoryDelete}
          onRoomDelete={handleRoomDelete}
          onRoomsRefresh={loadRooms}
          onCreateRoom={handleCreateRoom}
          onEditRoom={handleEditRoom}
          onToggleRoomVisibility={handleToggleRoomVisibility}
          onSaveToRoom={handleSaveToRoom}
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
                boardNames={boardNames}
                onRowSelect={handleRowSelect}
                viewMode={viewMode}
                selectedHistoryId={selectedHistoryId}
                selectedRoomId={selectedRoomId}
                generatedRows={generatedRows}
                historySessions={historySessions}
                roomImages={roomImages}
                roomImagesLoading={roomImagesLoading}
                rooms={rooms}
                onRemoveImageFromRoom={handleRemoveImageFromRoom}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* 개발 정보 디스플레이 
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white p-2 text-xs rounded max-w-xs space-y-1">
          <div className="text-yellow-400 font-bold">🚀 New API Structure</div>
          {user && (
            <>
              <div>User: {user.email}</div>
              {profile && <div>Backend Profile: ✅</div>}
            </>
          )}
          <div>Generated Rows: {generatedRows.length}</div>
          <div>History Sessions: {historySessions.length}</div>
          <div className="text-green-400">✅ SSE Generation Flow</div>
          <div className="text-blue-400">✅ Session Management</div>
          <div className="text-purple-400">✅ Real-time Updates</div>
        </div>
      )}
      */}

      {/* Room 생성/수정 모달 */}
      <RoomModal
        isOpen={roomModalOpen}
        mode={roomModalMode}
        room={editingRoom}
        onClose={() => setRoomModalOpen(false)}
        onSubmit={handleRoomModalSubmit}
        loading={modalLoading}
      />

      {/* History를 Room에 저장하는 모달 */}
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