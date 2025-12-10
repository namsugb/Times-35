"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { signInWithKakao, signInWithEmail, getCurrentUser, supabaseAuth } from "@/lib/auth"
import { MessageCircle, AlertCircle, Loader2, Mail, Lock } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(false)
    const [checkingAuth, setCheckingAuth] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // 이메일 로그인 필드
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [emailError, setEmailError] = useState("")
    const [passwordError, setPasswordError] = useState("")

    // URL 파라미터에서 에러 확인
    useEffect(() => {
        const errorParam = searchParams.get("error")
        if (errorParam === "auth_failed") {
            setError("로그인에 실패했습니다. 다시 시도해주세요.")
        } else if (errorParam === "no_code") {
            setError("인증 코드를 받지 못했습니다. 다시 시도해주세요.")
        }
    }, [searchParams])

    // 이미 로그인되어 있는지 확인
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const user = await getCurrentUser()
                if (user) {
                    router.push("/mypage")
                }
            } catch (err) {
                console.error("인증 확인 오류:", err)
            } finally {
                setCheckingAuth(false)
            }
        }
        checkAuth()
    }, [router])

    const handleKakaoLogin = async () => {
        try {
            setLoading(true)
            setError(null)
            await signInWithKakao()
        } catch (err: any) {
            console.error("로그인 오류:", err)
            setError(err.message || "로그인 중 오류가 발생했습니다.")
            setLoading(false)
        }
    }

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault()

        // 유효성 검사
        let hasError = false
        setEmailError("")
        setPasswordError("")

        if (!email.trim()) {
            setEmailError("이메일을 입력해주세요.")
            hasError = true
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setEmailError("올바른 이메일 형식이 아닙니다.")
            hasError = true
        }

        if (!password) {
            setPasswordError("비밀번호를 입력해주세요.")
            hasError = true
        }

        if (hasError) {
            return
        }

        try {
            setLoading(true)
            setError(null)

            await signInWithEmail(email.trim(), password)

            // 로그인 성공 후 회원가입 정보 확인
            const user = await getCurrentUser()
            if (user) {
                const { data: userProfile } = await supabaseAuth
                    .from("users")
                    .select("name, phone")
                    .eq("auth_id", user.id)
                    .single()

                if (!userProfile || !userProfile.name || !userProfile.phone) {
                    // 회원가입 정보가 없으면 회원가입 페이지로
                    router.push("/signup")
                } else {
                    // 있으면 마이페이지로
                    router.push("/mypage")
                }
            }
        } catch (err: any) {
            console.error("로그인 오류:", err)
            if (err.message?.includes("Invalid login credentials")) {
                setError("이메일 또는 비밀번호가 올바르지 않습니다.")
            } else {
                setError(err.message || "로그인 중 오류가 발생했습니다.")
            }
            toast.error("로그인에 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    if (checkingAuth) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-md">
            <Card className="shadow-lg">
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-2xl font-bold">로그인</CardTitle>
                    <CardDescription>
                        카카오 계정으로 간편하게 로그인하세요
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Tabs defaultValue="kakao" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="kakao">
                                <MessageCircle className="h-4 w-4 mr-2" />
                                카카오
                            </TabsTrigger>
                            <TabsTrigger value="email">
                                <Mail className="h-4 w-4 mr-2" />
                                이메일
                            </TabsTrigger>
                        </TabsList>

                        {/* 카카오 로그인 */}
                        <TabsContent value="kakao" className="space-y-4 mt-4">
                            <Button
                                onClick={handleKakaoLogin}
                                disabled={loading}
                                className="w-full h-12 text-base font-medium"
                                style={{
                                    backgroundColor: "#FEE500",
                                    color: "#000000",
                                }}
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                ) : (
                                    <MessageCircle className="h-5 w-5 mr-2" />
                                )}
                                카카오로 시작하기
                            </Button>
                        </TabsContent>

                        {/* 이메일 로그인 */}
                        <TabsContent value="email" className="space-y-4 mt-4">
                            <form onSubmit={handleEmailLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">이메일</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value)
                                            setEmailError("")
                                        }}
                                        placeholder="example@email.com"
                                        className={emailError ? "border-destructive" : ""}
                                    />
                                    {emailError && (
                                        <p className="text-sm text-destructive">{emailError}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">비밀번호</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value)
                                            setPasswordError("")
                                        }}
                                        placeholder="비밀번호를 입력해주세요"
                                        className={passwordError ? "border-destructive" : ""}
                                    />
                                    {passwordError && (
                                        <p className="text-sm text-destructive">{passwordError}</p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 text-base font-medium"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                            로그인 중...
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="h-5 w-5 mr-2" />
                                            로그인
                                        </>
                                    )}
                                </Button>
                            </form>

                            <div className="text-center">
                                <Link
                                    href="/signup"
                                    className="text-sm text-primary hover:underline"
                                >
                                    계정이 없으신가요? 회원가입
                                </Link>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="text-center text-sm text-muted-foreground">
                        <p>로그인하면 참여중인 약속을 확인하고</p>
                        <p>자주 만나는 그룹을 관리할 수 있어요</p>
                    </div>

                    <div className="border-t pt-4">
                        <p className="text-xs text-muted-foreground text-center">
                            로그인 시{" "}
                            <a href="/terms" className="underline hover:text-foreground">
                                이용약관
                            </a>
                            {" "}및{" "}
                            <a href="/privacy" className="underline hover:text-foreground">
                                개인정보처리방침
                            </a>
                            에 동의하게 됩니다.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

