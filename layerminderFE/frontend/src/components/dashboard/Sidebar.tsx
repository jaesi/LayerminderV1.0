'use client';

import { useState } from 'react';
import { Plus, MoreVertical, Trash2, Edit3, Globe, Lock, History } from 'lucide-react';
import { LayerRoom } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  rooms: LayerRoom[];
  roomsLoading: boolean;
  selectedRoomId: string | null;
  isHistoryView: boolean; 
  onHistoryToggle: () => void; 
  onRoomSelect: (roomId: string | null) => void;
  onRoomDelete: (roomId: string) => Promise<void>;
  onRoomsRefresh: () => Promise<void>;
  onCreateRoom: () => void;
  onEditRoom: (room: LayerRoom) => void;
  onToggleRoomVisibility: (room: LayerRoom) => Promise<void>;
}

export default function Sidebar({ 
  isOpen,
  rooms,
  roomsLoading,
  selectedRoomId,
  isHistoryView,
  onHistoryToggle,
  onRoomSelect,
  onRoomDelete,
  onCreateRoom,
  onEditRoom,
  onToggleRoomVisibility
}: SidebarProps) {
  const [roomDropdownOpen, setRoomDropdownOpen] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRoomClick = (roomId: string) => {
    if (selectedRoomId === roomId) {
      onRoomSelect(null);
    } else {
      onRoomSelect(roomId);
    }
  };

  const handleRoomDelete = async (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    const message = room 
      ? `"${room.name}" 룸을 삭제하시겠습니까? (포함된 이미지: ${room.pin_count}개)`
      : '이 룸을 삭제하시겠습니까?';
    
    if (confirm(message)) {
      await onRoomDelete(roomId);
    }
    setRoomDropdownOpen(null);
  };

  return (
    <div className="fixed left-0 top-16 w-64 h-full p-4 overflow-y-auto" style={{ backgroundColor: '#edeae3' }}>
      
      {/* History 섹션 - 단일 토글 버튼 */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-600 mb-3">History</h3>
        
        <div className="space-y-1">
          <button
            onClick={onHistoryToggle}
            className={`w-full flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded text-left ${
              isHistoryView ? 'font-bold bg-gray-100' : ''
            }`}
          >
            <History size={16} className="flex-shrink-0" />
            <span className="text-sm text-gray-700">My History</span>
          </button>
        </div>
      </div>

      {/* My Rooms 섹션 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-600">My Rooms</h3>
          <button 
            onClick={onCreateRoom}
            className="p-1 hover:bg-gray-100 rounded"
            title="새 룸 만들기"
          >
            <Plus size={16} />
          </button>
        </div>
        
        {roomsLoading ? (
          <div className="text-xs text-gray-400 italic">Loading rooms...</div>
        ) : rooms.length === 0 ? (
          <div className="text-xs text-gray-400 italic">No rooms created</div>
        ) : (
          <div className="space-y-1">
            {rooms.map((room) => (
              <div key={room.id} className="relative">
                <div className="flex items-center justify-between group">
                  <button
                    onClick={() => handleRoomClick(room.id)}
                    className={`flex-1 flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded text-left ${
                      selectedRoomId === room.id ? 'font-bold bg-gray-100' : ''
                    }`}
                  >
                    <span className="flex-shrink-0">
                      {room.is_public ? '🌐' : '🔒'}
                    </span>
                    <span className="text-sm text-gray-700 truncate">
                      {room.name}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {room.pin_count}
                    </span>
                  </button>
                  
                  <button
                    onClick={() => setRoomDropdownOpen(
                      roomDropdownOpen === room.id ? null : room.id
                    )}
                    className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical size={12} />
                  </button>
                </div>

                {/* Room 드롭다운 메뉴 */}
                {roomDropdownOpen === room.id && (
                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded shadow-lg z-10 py-1 w-40">
                    <button
                      onClick={() => {
                        onEditRoom(room);
                        setRoomDropdownOpen(null);
                      }}
                      className="w-full text-left px-3 py-1 text-xs hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Edit3 size={12} />
                      Rename
                    </button>
                    <button
                      onClick={() => {
                        onToggleRoomVisibility(room);
                        setRoomDropdownOpen(null);
                      }}
                      className="w-full text-left px-3 py-1 text-xs hover:bg-gray-100 flex items-center gap-2"
                    >
                      {room.is_public ? <Lock size={12} /> : <Globe size={12} />}
                      {room.is_public ? 'Make Private' : 'Make Public'}
                    </button>
                    <button
                      onClick={() => handleRoomDelete(room.id)}
                      className="w-full text-left px-3 py-1 text-xs hover:bg-red-50 text-red-600 flex items-center gap-2"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}