import { Menu } from 'lucide-react';

export default function Navigation() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="px-4 h-16 flex items-center justify-between">
        {/* 로고 영역 */}
        <div className="flex items-center">
          <img src="/images/logo.png" alt="Logo" className="h-8" />
        </div>
        
        {/* 우측 메뉴 */}
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 text-sm hover:bg-gray-100 rounded">
            로그인
          </button>
          <button className="p-2 hover:bg-gray-100 rounded">
            <Menu size={24} />
          </button>
        </div>
      </div>
    </nav>
  );
}