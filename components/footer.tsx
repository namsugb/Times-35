import { Mail, Phone, User, Building } from "lucide-react"

export function Footer() {
    return (
        <footer className="bg-gray-50 border-t mt-16">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* 회사 정보 */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-900">만날래말래</h3>
                        <p className="text-sm text-gray-600">
                            여러 사람과 만나기 좋은 날짜를 간편하게 정해보세요.
                        </p>
                    </div>

                    {/* 연락처 정보 */}
                    <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">연락처</h4>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="h-4 w-4" />
                                <a
                                    href="mailto:mannallemalle@gmail.com"
                                    className="hover:text-primary transition-colors"
                                >
                                    mannallemalle@gmail.com
                                </a>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="h-4 w-4" />
                                <a
                                    href="tel:010-3941-2259"
                                    className="hover:text-primary transition-colors"
                                >
                                    010-3941-2259
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* 담당자 정보 */}
                    <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">담당자</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="h-4 w-4" />
                            <span>남승수</span>
                        </div>
                    </div>

                    {/* 사업자 정보 */}
                    <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">사업자 정보</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building className="h-4 w-4" />
                            <span>757-33-01796</span>
                        </div>
                    </div>
                </div>

                {/* 하단 구분선 및 저작권 */}
                <div className="border-t mt-8 pt-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-500">
                            © 2024 만날래말래. All rights reserved.
                        </p>
                        <div className="flex gap-6 text-sm">
                            <a href="#" className="text-gray-500 hover:text-primary transition-colors">
                                이용약관
                            </a>
                            <a href="#" className="text-gray-500 hover:text-primary transition-colors">
                                개인정보처리방침
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
