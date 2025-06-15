'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Sidebar from '@/components/Sidebar';
import Gallery from '@/components/Gallery';
import MainPanel from '@/components/MainPanel';
import TopPanel from '@/components/TopPanel';
import { dummyGeneratedImages } from '@/data/dummyData';

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pinnedImages, setPinnedImages] = useState<number[]>([]);
  const [topPanelMode, setTopPanelMode] = useState<'brand' | 'generate' | 'details'>('brand');
  const [selectedRowData, setSelectedRowData] = useState<{
    rowIndex: number;
    images: Array<{ id: number; src: string; isPinned: boolean }>;
    keyword: string;
    startImageIndex?: number;
  } | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null);
  const [generatedRows, setGeneratedRows] = useState<Array<{
    images: Array<{ id: number; src: string; isPinned: boolean; type: 'output' | 'reference' }>;
    keyword: string;
  }>>([]);

  const [boardNames, setBoardNames] = useState([
  'Sofa', 'Lounge Chair', 'Coffee Table', 'Stool', 'Bench', 'Daybed',
  'Console', 'Dining Table', 'Armless Chair', 'Arm Chair', 'Bar Chair',
  'Desk', 'Storage', 'Cabinet', 'Bed Headboard', 'Mirror', 'Lighting', 'Artwork'
]);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleTogglePin = (imageId: number, boardName?: string, createNew?: boolean) => {
    if (createNew && boardName) {
    // 새 보드를 boardNames 배열에 추가
    setBoardNames(prev => [...prev, boardName]);
    }
    if (pinnedImages.includes(imageId)) {
      setPinnedImages(prev => prev.filter(id => id !== imageId));
    } else {
      setPinnedImages(prev => [...prev, imageId]);
    }
  };

  const handleGenerate = () => {
    // AI 이미지 생성 시뮬레이션
    const newGeneratedImages = [...dummyGeneratedImages];
    setGeneratedImages(newGeneratedImages);
    setTopPanelMode('generate');

    // 새로 생성된 행을 Gallery에 추가
    const newGeneratedRow = {
      images: [
        { id: Date.now() + 1, src: newGeneratedImages[0], isPinned: false, type: 'output' as const },
        { id: Date.now() + 2, src: newGeneratedImages[1], isPinned: false, type: 'output' as const },
        { id: Date.now() + 3, src: newGeneratedImages[2], isPinned: false, type: 'output' as const },
        { id: Date.now() + 4, src: newGeneratedImages[3], isPinned: false, type: 'output' as const },
        { id: Date.now() + 5, src: '/images/references/ref1.jpg', isPinned: false, type: 'reference' as const },
      ],
      keyword: 'Generated'
    };

    setGeneratedRows(prev => [newGeneratedRow, ...prev]);
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
    setGeneratedImages([]);
  };

  const handleBoardSelect = (boardId: number | null) => {
    setSelectedBoardId(boardId);
    // 보드 선택 시 TopPanel을 브랜드 모드로 초기화
    setTopPanelMode('brand');
    setSelectedRowData(null);
    setGeneratedImages([]);
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
          <MainPanel onGenerate={handleGenerate} />
        </div>
        
        {/* Gallery Area with TopPanel */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top Panel - Gallery 영역 위쪽만 차지 */}
          <div className="h-80 flex-shrink-0 mb-2">
            <TopPanel 
              mode={topPanelMode}
              selectedRowData={selectedRowData}
              generatedImages={generatedImages}
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
    </div>
  );
}