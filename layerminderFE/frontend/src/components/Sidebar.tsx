'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  pinnedImages: number[];
}

export default function Sidebar({ isOpen, pinnedImages }: SidebarProps) {
  const [boards, setBoards] = useState([
    { id: 1, name: 'Sofa', isOpen: true },
    { id: 2, name: 'Lounge Chair', isOpen: false },
    { id: 3, name: 'Coffee Table', isOpen: false },
  ]);

  const toggleBoard = (boardId: number) => {
    setBoards(prev =>
      prev.map(board =>
        board.id === boardId ? { ...board, isOpen: !board.isOpen } : board
      )
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed left-0 top-16 w-64 h-full bg-white p-4">
      {/* 현재 폴더 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Archive</h2>
        <div className="text-sm text-gray-500">
          핀된 이미지: {pinnedImages.length}개
        </div>
      </div>

      {/* 보드 목록 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600">보드</h3>
          <button className="p-1 hover:bg-gray-100 rounded">
            <Plus size={16} />
          </button>
        </div>
        
        {boards.map(board => (
          <div key={board.id}>
            <button
              onClick={() => toggleBoard(board.id)}
              className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded"
            >
              {board.isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span className="text-sm">{board.name}</span>
            </button>
            
            {board.isOpen && (
              <div className="ml-6 mt-1 space-y-1">
                <div className="p-2 text-sm text-gray-500">
                  핀된 이미지가 여기에 표시됩니다
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}