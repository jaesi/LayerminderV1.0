'use client';

import { useState } from 'react';
import Navigation from '@/components/dashboard/Navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import Gallery from '@/components/dashboard/Gallery';
import MainPanel from '@/components/dashboard/MainPanel';
import TopPanel from '@/components/dashboard/TopPanel';
import { boardsData } from '@/data/dummyData';
import { DroppedFile, GeneratedRow } from '@/types';
import { uploadImageWithMetadata, generateImages } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
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
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null);
  const [generatedRows, setGeneratedRows] = useState<GeneratedRow[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const [boardNames, setBoardNames] = useState([
    'Sofa', 'Lounge Chair', 'Coffee Table', 'Stool', 'Bench', 'Daybed',
    'Console', 'Dining Table', 'Armless Chair', 'Arm Chair', 'Bar Chair',
    'Desk', 'Storage', 'Cabinet', 'Bed Headboard', 'Mirror', 'Lighting', 'Artwork'
  ]);

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

const handleGenerate = async (files: DroppedFile[], keywords: string[]) => {
  setIsGenerating(true);
  
  try {
    console.log('🚀 Starting generation with DIRECT upload method...');
    const userId = user?.id || 'guest-user';

    // ✅ 프론트엔드에서 직접 Supabase에 업로드 + 메타데이터 저장
    console.log('📤 Using DIRECT Supabase upload with metadata...');
    
    const uploadPromises = files.map(async (item) => {
      // 1. 직접 Supabase Storage에 업로드 + 메타데이터 저장
      const uploadResult = await uploadImageWithMetadata(
        item.file,
        'input',
        {
          originalName: item.file.name,
          size: item.file.size,  
          type: item.file.type,
          uploadedBy: user?.email || 'guest'
        }
      );
      
      if (!uploadResult) {
        throw new Error(`업로드 실패: ${item.file.name}`);
      }
      
      return uploadResult;
    });

    const uploadResults = await Promise.all(uploadPromises);
    console.log('✅ All files uploaded with metadata:', uploadResults.length);

    // 2. Generate API 호출 (Mock 데이터 사용)
    console.log('🎨 Calling generate API...');
    const keyword = keywords.length > 0 ? keywords[0] : 
                  (selectedBoardId ? getBoardKeyword(selectedBoardId) : undefined);

    const generateResult = await generateImages(
      userId,
      uploadResults.map(r => r.fileKey),
      keyword
    );

    if (!generateResult || !generateResult.success) {
      throw new Error('이미지 생성에 실패했습니다.');
    }

    console.log('✅ Images generated:', generateResult.generated_images.length);

    // 3. UI 업데이트
    const newGeneratedImages = generateResult.generated_images.map(img => img.url);
    setGeneratedImages(newGeneratedImages);
    setTopPanelMode('generate');

    const newGeneratedRow: GeneratedRow = {
      id: `generated_${Date.now()}`,
      images: [
        ...generateResult.generated_images.map((img, index) => ({
          id: Date.now() + index + 1,
          src: img.url,
          isPinned: false,
          type: 'output' as const,
          imageId: img.image_id,
          fileKey: undefined
        })),
        {
          id: Date.now() + 1000,
          src: uploadResults[0].publicUrl,
          isPinned: false,
          type: 'reference' as const,
          imageId: uploadResults[0].imageId,
          fileKey: uploadResults[0].fileKey
        }
      ],
      keyword: keyword || 'Generated',
      boardId: selectedBoardId || undefined,
      createdAt: new Date(),
      metadata: {
        inputImages: uploadResults.map(r => r.fileKey),
        generationTime: Date.now(),
        generatedBy: user?.id || 'guest',
      }
    };

    setGeneratedRows(prev => [newGeneratedRow, ...prev]);
    
    console.log('✅ Generation complete with metadata upload!', { 
      boardId: selectedBoardId, 
      keyword: keyword,
      generatedCount: generateResult.generated_images.length,
      uploadMethod: 'direct_supabase_with_metadata',
      userId: userId
    });

  } catch (error) {
    console.error('❌ Generation failed:', error);
    throw error;
  } finally {
    setIsGenerating(false);
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
    setGeneratedImages([]);
  };

  const handleBoardSelect = (boardId: number | null) => {
    setSelectedBoardId(boardId);
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
            <MainPanel 
              onGenerate={handleGenerate} 
              isGenerating={isGenerating}
            />
          </div>
          
          {/* Gallery Area with TopPanel */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Top Panel */}
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
      
      {/* 사용자 정보 디버그 (개발용) */}
      {process.env.NODE_ENV === 'development' && user && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white p-2 text-xs rounded max-w-xs">
          <div>User ID: {user.id}</div>
          <div>Email: {user.email}</div>
          {profile && <div>Backend Profile: ✅</div>}
          <div className="text-green-400">Upload: Direct Supabase SDK ✅</div>
        </div>
      )}
    </div>
  );
}