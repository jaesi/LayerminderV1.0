import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(_req: NextRequest) {
  // 대시보드 접근 시 게스트 모드가 아니면 클라이언트에서 처리하도록 함
  // 실제 인증 확인은 AuthProvider에서 처리
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}