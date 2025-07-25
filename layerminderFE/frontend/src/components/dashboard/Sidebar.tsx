'use client';

import { Plus } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onBoardSelect: (boardId: number | null) => void;
  selectedBoardId: number | null;
}

export default function Sidebar({ 
  isOpen, 
  onBoardSelect, 
  selectedBoardId 
}: SidebarProps) {
  const boards = [
    { id: 1, name: 'Sofa' },
    { id: 2, name: 'Lounge Chair' },
    { id: 3, name: 'Coffee Table' },
    { id: 4, name: 'Stool' },
    { id: 5, name: 'Bench' },
    { id: 6, name: 'Daybed' },
    { id: 7, name: 'Console' },
    { id: 8, name: 'Dining Table' },
    { id: 9, name: 'Armless Chair' },
    { id: 10, name: 'Arm Chair' },
    { id: 11, name: 'Bar Chair' },
    { id: 12, name: 'Desk' },
    { id: 13, name: 'Storage' },
    { id: 14, name: 'Cabinet' },
    { id: 15, name: 'Bed Headboard' },
    { id: 16, name: 'Mirror' },
    { id: 17, name: 'Lighting' },
    { id: 18, name: 'Artwork' },
  ];

  const handleBoardClick = (boardId: number) => {
    // 같은 보드를 다시 클릭하면 선택 해제
    if (selectedBoardId === boardId) {
      onBoardSelect(null);
    } else {
      onBoardSelect(boardId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed left-0 top-16 w-64 h-full p-4 overflow-y-auto" style={{ backgroundColor: '#edeae3' }}>
      {/* 현재 폴더 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Archive</h2>
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
              onClick={() => handleBoardClick(board.id)}
              className={`w-full flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded text-left ${
                selectedBoardId === board.id ? 'font-bold' : ''
              }`}
            >
              <span className="text-sm text-gray-700">{board.name}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}