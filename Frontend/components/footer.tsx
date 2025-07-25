import { Mail, Phone, User, Building } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t mt-auto">
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 회사 정보 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-gray-900">만날래말래</h3>
            <p className="text-xs text-gray-600">여러 사람과 만나기 좋은 날짜를 간편하게 정해보세요.</p>
          </div>

          {/* 연락처 정보 */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 text-sm">연락처</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Mail className="h-3 w-3" />
                <a href="mailto:mannallemalle@gmail.com" className="hover:text-blue-600 transition-colors">
                  mannallemalle@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Phone className="h-3 w-3" />
                <a href="tel:010-3941-2259" className="hover:text-blue-600 transition-colors">
                  010-3941-2259
                </a>
              </div>
            </div>
          </div>

          {/* 담당자 정보 */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 text-sm">담당자</h4>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <User className="h-3 w-3" />
              <span>남승수</span>
            </div>
          </div>

          {/* 사업자 정보 */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 text-sm">사업자 정보</h4>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Building className="h-3 w-3" />
              <span>사업자등록번호: 757-33-01796</span>
            </div>
          </div>
        </div>

        {/* 하단 구분선 및 저작권 */}
        <div className="border-t mt-4 pt-3">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2">
            <p className="text-xs text-gray-500">© 2024 만날래말래. All rights reserved.</p>
            <div className="flex gap-4 text-xs">
              <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                이용약관
              </a>
              <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                개인정보처리방침
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
