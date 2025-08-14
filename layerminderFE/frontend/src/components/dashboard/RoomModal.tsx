'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { LayerRoom, CreateRoomRequest, UpdateRoomRequest } from '@/types';

interface RoomModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  room?: LayerRoom;
  onClose: () => void;
  onSubmit: (data: CreateRoomRequest | UpdateRoomRequest) => Promise<void>;
  loading?: boolean;
}

export default function RoomModal({
  isOpen,
  mode,
  room,
  onClose,
  onSubmit,
  loading = false
}: RoomModalProps) {
  const [formData, setFormData] = useState({
    name: room?.name || '',
    description: room?.description || '',
    is_public: room?.is_public || false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '룸 이름을 입력해주세요.';
    } else if (formData.name.length > 50) {
      newErrors.name = '룸 이름은 50자 이하로 입력해주세요.';
    }
    
    if (formData.description.length > 200) {
      newErrors.description = '설명은 200자 이하로 입력해주세요.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await onSubmit(formData);
      onClose();
      setFormData({ name: '', description: '', is_public: false });
      setErrors({});
    } catch (error) {
      console.error('Room operation failed:', error);
    }
  };

  const handleClose = () => {
    onClose();
    setFormData({ name: '', description: '', is_public: false });
    setErrors({});
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {mode === 'create' ? '새 룸 만들기' : '룸 수정'}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              룸 이름 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="룸 이름을 입력하세요"
              disabled={loading}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="룸에 대한 설명을 입력하세요 (선택사항)"
              rows={3}
              disabled={loading}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={loading}
              />
              <span className="text-sm text-gray-700">공개 룸으로 설정</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              공개 룸은 다른 사용자들이 볼 수 있습니다.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  처리중...
                </div>
              ) : (
                mode === 'create' ? '만들기' : '수정'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}