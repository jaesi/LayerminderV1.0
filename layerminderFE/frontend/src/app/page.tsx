'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import MainPanel from '@/components/MainPanel';
import Gallery from '@/components/Gallery';
import Sidebar from '@/components/Sidebar';
import TopPanel from '@/components/TopPanel';
import { dummyGeneratedImages } from '@/data/dummyData';

export default function HomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pinnedImages, setPinnedImages] = useState<number[]>([]);
  
  // TopPanel 상태 관리
  const [topPanelMode, setTopPanelMode] = useState<'brand' | 'generate' | 'details'>('brand');
  const [selectedRowData, setSelectedRowData] = useState<{
    rowIndex: number;
    images: Array<{ id: number; src: string; isPinned: boolean }>;
    keyword: string;
    startImageIndex?: number;
  } | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  // 보드 이름들
  const boardNames = [
    'Sofa', 'Lounge Chair', 'Coffee Table', 'Stool', 'Bench', 'Daybed',
    'Console', 'Dining Table', 'Armless Chair', 'Arm Chair', 'Bar Chair',
    'Desk', 'Storage', 'Cabinet', 'Bed Headboard', 'Mirror', 'Lighting', 'Artwork'
  ];

  const togglePin = (imageId: number, boardName?: string) => {
    setPinnedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
    // TODO: 실제로는 여기서 boardName에 따라 해당 보드에 이미지를 저장하는 로직 추가
    if (boardName) {
      console.log(`Image ${imageId} pinned to board: ${boardName}`);
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

  const handleGenerate = () => {
    // TODO: 실제 AI 생성 로직
    // 임시로 더미 이미지들 사용
    setGeneratedImages(dummyGeneratedImages);
    setTopPanelMode('generate');
  };

  const handleTopPanelClose = () => {
    setTopPanelMode('brand');
    setSelectedRowData(null);
    setGeneratedImages([]);
  };

  return (
    <div className="min-h-screen">
      {/* 네비게이션 바 */}
      <Navigation onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex h-screen pt-16">
        {/* 사이드바 */}
        <Sidebar 
          isOpen={isSidebarOpen}
          pinnedImages={pinnedImages}
        />
        
        {/* 메인 콘텐츠 영역 */}
        <div className={`flex flex-1 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
          {/* 메인 인터랙션 패널 */}
          <div className="w-3/10">
            <MainPanel 
              onGenerate={handleGenerate}
            />
          </div>
          
          {/* 갤러리 */}
          <div className="w-7/10 flex flex-col">
            {/* 상단 패널 (브랜드 정보 / 생성 결과 / 상세 정보) */}
            <TopPanel
              mode={topPanelMode}
              selectedRowData={selectedRowData}
              generatedImages={generatedImages}
              onClose={handleTopPanelClose}
            />
            
            <Gallery 
              onTogglePin={togglePin}
              pinnedImages={pinnedImages}
              boardNames={boardNames}
              onRowSelect={handleRowSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}