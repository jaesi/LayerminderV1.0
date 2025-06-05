import { Menu } from 'lucide-react';

interface NavigationProps {
  onToggleSidebar: () => void;
}

export default function Navigation({ onToggleSidebar }: NavigationProps) {
  return (
    <nav style={{ backgroundColor: '#edeae3' }} className="shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="px-4 h-16 flex items-center justify-between">
        {/* 로고 영역 */}
        <div className="flex items-center gap-3">
          <img src="/images/logo.png" alt="Logo" className="h-8" />
          {/* <div className="text-xl font-bold text-gray-800">LAYER MINDER</div> */}
        </div>
        
        {/* 우측 메뉴 */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">@IG</div>
          <button 
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>
    </nav>
  );
}