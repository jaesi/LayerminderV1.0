'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import MainPanel from '@/components/MainPanel';
import Gallery from '@/components/Gallery';
import Sidebar from '@/components/Sidebar';

export default function HomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pinnedImages, setPinnedImages] = useState<number[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

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

  const handleImageSelect = (imageSrc: string) => {
    setSelectedImages(prev => {
      if (prev.includes(imageSrc)) {
        return prev.filter(src => src !== imageSrc);
      }
      return [...prev, imageSrc].slice(0, 3); // 최대 3개까지
    });
  };

  const handleKeywordSelect = (keyword: string) => {
    setSelectedKeywords(prev => {
      if (prev.includes(keyword)) {
        return prev.filter(k => k !== keyword);
      }
      return [...prev, keyword];
    });
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
          <div className="w-2/5">
            <MainPanel 
              selectedImages={selectedImages}
              onImageSelect={handleImageSelect}
              selectedKeywords={selectedKeywords}
              onKeywordSelect={handleKeywordSelect}
            />
          </div>
          
          {/* 갤러리 */}
          <div className="w-3/5 flex flex-col">
            {/* 브랜드 설명 */}
            <div className="p-6 flex items-start gap-6" style={{ backgroundColor: '#edeae3' }}>
              {/* 브랜드 이미지 */}
              <div className="flex-shrink-0">
                <img 
                  src="/images/layminder.png" 
                  alt="Layer Minder Brand" 
                  className="w-64 h-auto object-contain"
                />
              </div>
              
              <div className="flex-1">
                <h2 className="text-lg font-light text-gray-600 leading-relaxed">
                  &quot;Redefining Heritage<br />
                  for a Creative Future&quot;
                </h2>
                <div className="mt-4 text-sm text-gray-700 leading-relaxed">
                  <p className="mb-2">
                    <strong>Layer Minder aims to uncover new possibilities for the future by reimagining 
                    heritage industries rooted in local identity.</strong> We believe that tradition and 
                    innovation are not opposing forces but complementary layers in the story of 
                    human creativity.
                  </p>
                  <p className="mb-2">
                    By integrating advanced AI technology with the timeless values of craftsmanship, 
                    we seek to preserve the cultural essence of heritage industries 
                    while propelling them into new directions. Layer Minder is committed to ensuring 
                    that these traditions not only survive but thrive, inspiring contemporary 
                    audiences and shaping a more connected, creative future.
                  </p>
                </div>
              </div>
            </div>
            
            <Gallery 
              onTogglePin={togglePin}
              pinnedImages={pinnedImages}
              onImageSelect={handleImageSelect}
              onKeywordSelect={handleKeywordSelect}
              selectedKeywords={selectedKeywords}
              boardNames={boardNames}
            />
          </div>
        </div>
      </div>
    </div>
  );
}