import { Menu, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface NavigationProps {
  onToggleSidebar: () => void;
}

export default function Navigation({ onToggleSidebar }: NavigationProps) {
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      await signOut();
    }
  };

  // 사용자 정보 우선순위: 백엔드 프로필 > Supabase user
  const displayName = profile?.user_metadata?.name || user?.user_metadata?.name || user?.email || '사용자';
  const avatarUrl = profile?.user_metadata?.avatar_url || user?.user_metadata?.avatar_url;

  return (
    <nav style={{ backgroundColor: '#edeae3' }} className="fixed top-0 left-0 right-0 z-50">
      <div className="px-4 h-16 flex items-center justify-between">
        {/* 로고 영역 */}
        <div className="flex items-center gap-3">
          <img src="/images/logo.png" alt="Logo" className="h-4" />
        </div>
        
        {/* 우측 메뉴 */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3">
              {/* 사용자 아바타 및 정보 */}
              <div className="flex items-center gap-2">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <UserIcon size={16} className="text-gray-600" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-sm text-gray-700 font-medium">
                    {displayName}
                  </span>
                  {profile && (
                    <span className="text-xs text-gray-500">
                      {profile.email}
                    </span>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleSignOut}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="로그아웃"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
          
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