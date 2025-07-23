// 추가: src/app/dashboard/page.tsx 업데이트 (실제 사용자 ID 사용)
'use client';

import { useState } from 'react';
import Navigation from '@/components/dashboard/Navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import Gallery from '@/components/dashboard/Gallery';
import MainPanel from '@/components/dashboard/MainPanel';
import TopPanel from '@/components/dashboard/TopPanel';
import { boardsData } from '@/data/dummyData';
import { DroppedFile, GeneratedRow, UploadedImage, ImageMetadata } from '@/types';
import { uploadImage } from '@/lib/supabase';
import { saveImageMetadata, generateImages } from '@/lib/api';
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
      console.log('🚀 Starting generation process...', { 
        filesCount: files.length, 
        keywords, 
        selectedBoardId,
        userId: user?.id || 'guest'
      });

      // 사용자 ID 결정 (로그인된 사용자 또는 게스트)
      const userId = user?.id || 'guest-user';

      // 1. 파일들을 Supabase Storage에 업로드
      console.log('📤 Uploading files to Supabase...');
      const uploadPromises = files.map(async (item): Promise<UploadedImage | null> => {
        const uploadResult = await uploadImage(item.file, userId);
        if (!uploadResult) return null;
        
        return {
          imageId: '', // 아직 없음, 메타데이터 저장 후 받음
          fileKey: uploadResult.fileKey,
          publicUrl: uploadResult.publicUrl,
          file: item.file
        };
      });

      const uploadResults = await Promise.all(uploadPromises);
      const successfulUploads = uploadResults.filter((result): result is UploadedImage => result !== null);
      
      if (successfulUploads.length === 0) {
        throw new Error('모든 파일 업로드에 실패했습니다.');
      }

      console.log('✅ Files uploaded:', successfulUploads.length);

      // 2. 각 업로드된 파일의 메타데이터를 백엔드에 저장
      console.log('💾 Saving metadata...');
      const metadataPromises = successfulUploads.map(async (upload) => {
        const metadataResult = await saveImageMetadata(
          userId,
          upload.fileKey,
          'user_upload',
          { 
            originalName: upload.file.name,
            size: upload.file.size,
            type: upload.file.type,
            uploadedAt: new Date().toISOString(),
            uploadedBy: user?.email || 'guest'
          } as ImageMetadata
        );
        
        if (!metadataResult) {
          throw new Error(`메타데이터 저장 실패: ${upload.fileKey}`);
        }

        return {
          ...upload,
          imageId: metadataResult.image_id
        };
      });

      const metadataResults = await Promise.all(metadataPromises);
      console.log('✅ Metadata saved:', metadataResults.length);

      // 3. Generate API 호출
      console.log('🎨 Calling generate API...');
      const keyword = keywords.length > 0 ? keywords[0] : 
                    (selectedBoardId ? getBoardKeyword(selectedBoardId) : undefined);

      const generateResult = await generateImages(
        userId,
        metadataResults.map(r => r.fileKey),
        keyword
      );

      if (!generateResult || !generateResult.success) {
        throw new Error('이미지 생성에 실패했습니다.');
      }

      console.log('✅ Images generated:', generateResult.generated_images.length);

      // 4. UI 업데이트
      const newGeneratedImages = generateResult.generated_images.map(img => img.url);
      setGeneratedImages(newGeneratedImages);
      setTopPanelMode('generate');

      // 5. Gallery에 새로운 생성 행 추가 (보드 정보 포함)
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
          // Reference 이미지는 업로드된 첫 번째 이미지 사용
          {
            id: Date.now() + 1000,
            src: metadataResults[0].publicUrl,
            isPinned: false,
            type: 'reference' as const,
            imageId: metadataResults[0].imageId,
            fileKey: metadataResults[0].fileKey
          }
        ],
        keyword: keyword || 'Generated',
        boardId: selectedBoardId || undefined,
        createdAt: new Date(),
        metadata: {
          inputImages: metadataResults.map(r => r.fileKey),
          generationTime: Date.now(),
          generatedBy: user?.id || 'guest'
        }
      };

      setGeneratedRows(prev => [newGeneratedRow, ...prev]);
      
      console.log('✅ Generation complete!', { 
        boardId: selectedBoardId, 
        keyword: keyword,
        generatedCount: generateResult.generated_images.length,
        userId: userId
      });

    } catch (error) {
      console.error('❌ Generation failed:', error);
      throw error; // MainPanel에서 에러 처리
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
        </div>
      )}
    </div>
  );
}