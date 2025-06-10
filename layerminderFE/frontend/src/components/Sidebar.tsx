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
    { id: 4, name: 'Stool', isOpen: false },
    { id: 5, name: 'Bench', isOpen: false },
    { id: 6, name: 'Daybed', isOpen: false },
    { id: 7, name: 'Console', isOpen: false },
    { id: 8, name: 'Dining Table', isOpen: false },
    { id: 9, name: 'Armless Chair', isOpen: false },
    { id: 10, name: 'Arm Chair', isOpen: false },
    { id: 11, name: 'Bar Chair', isOpen: false },
    { id: 12, name: 'Desk', isOpen: false },
    { id: 13, name: 'Storage', isOpen: false },
    { id: 14, name: 'Cabinet', isOpen: false },
    { id: 15, name: 'Bed Headboard', isOpen: false },
    { id: 16, name: 'Mirror', isOpen: false },
    { id: 17, name: 'Lighting', isOpen: false },
    { id: 18, name: 'Artwork', isOpen: false },
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
    <div className="fixed left-0 top-16 w-64 h-full p-4 overflow-y-auto" style={{ backgroundColor: '#edeae3' }}>
      {/* 현재 폴더 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Archive</h2>
        {/* <div className="text-sm text-gray-500">
          핀된 이미지: {pinnedImages.length}개
        </div> */}
      </div>

      {/* 보드 목록 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-600">보드</h3>
          <button className="p-1 hover:bg-gray-100 rounded">
            <Plus size={16} />
          </button>
        </div>
        
        {boards.map(board => (
          <div key={board.id}>
            <button
              onClick={() => toggleBoard(board.id)}
              className="w-full flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded text-left"
            >
              {board.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span className="text-sm text-gray-700">{board.name}</span>
            </button>
            
            {board.isOpen && (
              <div className="ml-5 mt-1 mb-2">
                <div className="p-2 text-xs text-gray-500 bg-gray-50 rounded">
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