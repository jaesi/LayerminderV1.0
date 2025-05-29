'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import MainPanel from '@/components/MainPanel';
import Gallery from '@/components/Gallery';
import Sidebar from '@/components/Sidebar';

export default function HomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pinnedImages, setPinnedImages] = useState<number[]>([]);

  const togglePin = (imageId: number) => {
    setPinnedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 네비게이션 바 */}
      <Navigation />
      
      <div className="flex">
        {/* 사이드바 */}
        <Sidebar 
          isOpen={isSidebarOpen}
          pinnedImages={pinnedImages}
        />
        
        {/* 메인 콘텐츠 */}
        <div className={`flex-1 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
          {/* 메인 인터랙션 패널 */}
          <MainPanel />
          
          {/* 갤러리 */}
          <Gallery 
            onTogglePin={togglePin}
            pinnedImages={pinnedImages}
          />
        </div>
      </div>
    </div>
  );
}