'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/dashboard/Navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import Gallery from '@/components/dashboard/Gallery';
import MainPanel from '@/components/dashboard/MainPanel';
import TopPanel from '@/components/dashboard/TopPanel';
import { boardsData } from '@/data/dummyData';
import { GeneratedRow, HistorySession } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { getHistorySessions } from '@/lib/api';

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pinnedImages, setPinnedImages] = useState<number[]>([]);
  const [topPanelMode, setTopPanelMode] = useState<'brand' | 'generate' | 'details'>('brand');
  const [selectedRowData, setSelectedRowData] = useState<{
    rowIndex: number;
    images: Array<{ id: number; src: string; isPinned: boolean }>;
    keyword: string;
    startImageIndex?: number;
  } | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null);
  const [generatedRows, setGeneratedRows] = useState<GeneratedRow[]>([]);
  const [historySessions, setHistorySessions] = useState<HistorySession[]>([]);

  const [boardNames, setBoardNames] = useState([
    'Sofa', 'Lounge Chair', 'Coffee Table', 'Stool', 'Bench', 'Daybed',
    'Console', 'Dining Table', 'Armless Chair', 'Arm Chair', 'Bar Chair',
    'Desk', 'Storage', 'Cabinet', 'Bed Headboard', 'Mirror', 'Lighting', 'Artwork'
  ]);

  // 히스토리 세션 로드
  useEffect(() => {
    const loadHistorySessions = async () => {
      if (user) {
        try {
          const sessions = await getHistorySessions();
          if (sessions) {
            setHistorySessions(sessions);
            console.log('✅ History sessions loaded:', sessions.length);
          }
        } catch (error) {
          console.error('Failed to load history sessions:', error);
        }
      }
    };

    loadHistorySessions();
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

  // 현재 선택된 보드의 키워드 가져오기
  const getBoardKeyword = (boardId: number): string => {
    const board = boardsData.find(b => b.id === boardId);
    return board?.keyword || 'Generated';
  };

  // 새로운 생성 결과 처리 (SSE를 통해 받은 완전한 결과)
  const handleGenerationComplete = (result: GeneratedRow) => {
    console.log('🎉 Generation completed:', result);
    
    // 생성된 행을 목록에 추가
    setGeneratedRows(prev => [result, ...prev]);
    
    // TopPanel을 generate 모드로 전환하고 결과 표시
    setTopPanelMode('generate');
    setSelectedRowData({
      rowIndex: 0, // 새로 생성된 첫 번째 행
      images: result.images,
      keyword: result.keyword || 'Generated',
      startImageIndex: 0
    });

    // 히스토리 세션 목록 새로고침 (새 세션이 생성되었을 수 있음)
    if (user) {
      getHistorySessions().then(sessions => {
        if (sessions) {
          setHistorySessions(sessions);
        }
      });
    }
  };

  const handleRowSelect = (rowData: {
    rowIndex: number;
    images: Array<{ id: number; src: string; isPinned: boolean }>;
    keyword: string;
    startImageIndex?: number;
  }) => {
    setSelectedRowData(rowData);
    setTopPanelMode('details');
  };

  const handleCloseTopPanel = () => {
    setTopPanelMode('brand');
    setSelectedRowData(null);
  };

  const handleBoardSelect = (boardId: number | null) => {
    setSelectedBoardId(boardId);
    setTopPanelMode('brand');
    setSelectedRowData(null);
  };

  return (
    <div className="h-screen flex flex-col">
      <Navigation onToggleSidebar={handleToggleSidebar} />
      
      <div className="flex-1 flex pt-16 min-h-0">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onBoardSelect={handleBoardSelect}
          selectedBoardId={selectedBoardId}
        />
        
        <div className={`flex-1 flex transition-all duration-300 min-h-0 ${
          isSidebarOpen ? 'ml-64' : 'ml-0'
        }`}>
          {/* Main Panel */}
          <div className="w-[30%] flex-shrink-0">
            <MainPanel onGenerate={handleGenerationComplete} />
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
                selectedBoardId={selectedBoardId}
                generatedRows={generatedRows}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* 개발 정보 디스플레이 */}
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
    </div>
  );
}