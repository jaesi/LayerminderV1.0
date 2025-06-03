'use client';

import { useState } from 'react';
import { Pin } from 'lucide-react';
import { dummyImages } from '@/data/dummyData';

interface GalleryProps {
  onTogglePin: (imageId: number) => void;
  pinnedImages: number[];
}

export default function Gallery({ onTogglePin, pinnedImages }: GalleryProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // 이미지를 4개씩 그룹화
  const imageRows = [];
  const allImages = [...dummyImages.outputs, ...dummyImages.references];
  
  for (let i = 0; i < allImages.length; i += 5) {
    imageRows.push(allImages.slice(i, i + 5));
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        {imageRows.map((row, rowIndex) => (
          <div key={rowIndex}>
            {/* 이미지 행 */}
            <div className="grid grid-cols-5 gap-4">
              {row.map((image) => (
                <div
                  key={image.id}
                  className="relative group cursor-pointer"
                  onClick={() => setExpandedRow(expandedRow === rowIndex ? null : rowIndex)}
                >
                  <div className="aspect-square bg-gray-200 overflow-hidden">
                    <img
                      src={image.src}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* 핀 버튼 (호버시 표시) */}
                  <button
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(image.id);
                    }}
                  >
                    <Pin
                      size={16}
                      className={pinnedImages.includes(image.id) ? 'fill-current' : ''}
                    />
                  </button>
                </div>
              ))}
            </div>

            {/* 확장된 상세 정보 */}
            {expandedRow === rowIndex && (
              <div className="mt-4 p-6 bg-gray-100">
                <h3 className="font-semibold mb-2">상세 정보</h3>
                <p className="text-gray-600">
                  이 행의 이미지들에 대한 상세 정보가 여기에 표시됩니다.
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="px-3 py-1 bg-gray-200 rounded-full text-sm">
                    스타일: Modern
                  </span>
                  <span className="px-3 py-1 bg-gray-200 rounded-full text-sm">
                    재질: Wood
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}