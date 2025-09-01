'use client';

import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { LayerRoom } from '@/types';

interface SaveToRoomModalProps {
  isOpen: boolean;
  historyId: string;
  rooms: LayerRoom[];
  onClose: () => void;
  onSaveToRoom: (roomId: string, historyId: string) => Promise<void>;
  onCreateNewRoom: () => void;
  loading?: boolean;
}

export default function SaveToRoomModal({
  isOpen,
  historyId,
  rooms,
  onClose,
  onSaveToRoom,
  onCreateNewRoom,
  loading = false
}: SaveToRoomModalProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedRoomId('');
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) return;
    
    try {
      await onSaveToRoom(selectedRoomId, historyId);
      onClose();
    } catch (error) {
      console.error('Save to room failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">룸에 저장</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              저장할 룸 선택
            </label>
            
            {/* 검색 입력 */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              placeholder="룸 이름 검색..."
              disabled={loading}
            />

            {/* 새 룸 만들기 버튼 */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onCreateNewRoom();
              }}
              className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-400 hover:bg-blue-50 transition-colors mb-3"
              disabled={loading}
            >
              <Plus size={16} />
              <span className="text-sm font-medium">새 룸 만들기</span>
            </button>

            {/* 룸 목록 */}
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
              {filteredRooms.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {searchTerm ? '검색 결과가 없습니다.' : '저장된 룸이 없습니다.'}
                </div>
              ) : (
                filteredRooms.map((room) => (
                  <label
                    key={room.id}
                    className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                      selectedRoomId === room.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="room"
                      value={room.id}
                      checked={selectedRoomId === room.id}
                      onChange={(e) => setSelectedRoomId(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                      disabled={loading}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{room.name}</span>
                        {room.is_public ? '🌐' : '🔒'}
                      </div>
                      {room.description && (
                        <p className="text-xs text-gray-500 mt-1">{room.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        이미지 {room.pin_count}개
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !selectedRoomId}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  저장중...
                </div>
              ) : (
                '저장'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}