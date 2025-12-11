"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { CalendarIcon, Loader2, UserPlus, Mail, Lock } from "lucide-react"
import { getCurrentUser, supabaseAuth, signUpWithEmail } from "@/lib/auth"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function SignupPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [mode, setMode] = useState<"kakao" | "email">("kakao") // 카카오 로그인 후 추가 정보 / 이메일 회원가입

    // 이메일 회원가입 필드
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    // 공통 필수 입력
    const [name, setName] = useState("")
    const [phone, setPhone] = useState("")

    // 공통 선택 입력
    const [gender, setGender] = useState<string>("")
    const [ageRange, setAgeRange] = useState<string>("")
    const [birthDate, setBirthDate] = useState<Date | undefined>(undefined)
    const [birthYear, setBirthYear] = useState<string>("")

    // 에러 상태
    const [emailError, setEmailError] = useState("")
    const [passwordError, setPasswordError] = useState("")
    const [confirmPasswordError, setConfirmPasswordError] = useState("")
    const [nameError, setNameError] = useState("")
    const [phoneError, setPhoneError] = useState("")

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const user = await getCurrentUser()

                if (user) {
                    // 카카오 로그인 후 추가 정보 입력 모드
                    setMode("kakao")

                    // 이미 회원가입 정보가 있는지 확인
                    const { data: userProfile } = await supabaseAuth
                        .from("users")
                        .select("name, phone")
                        .eq("auth_id", user.id)
                        .single()

                    if (userProfile && userProfile.name && userProfile.phone) {
                        // 이미 회원가입 완료된 경우 저장된 리다이렉트 URL 확인
                        const redirectUrl = sessionStorage.getItem("redirectAfterLogin")
                        if (redirectUrl) {
                            sessionStorage.removeItem("redirectAfterLogin")
                            router.push(redirectUrl)
                        } else {
                            router.push("/")
                        }
                        return
                    }

                    // 카카오에서 가져온 정보로 초기값 설정
                    const kakaoPhone = user.user_metadata?.phone_number ||
                        user.user_metadata?.phone ||
                        user.phone ||
                        ""
                    const kakaoName = user.user_metadata?.name ||
                        user.user_metadata?.full_name ||
                        user.user_metadata?.preferred_username ||
                        user.email?.split("@")[0] ||
                        ""

                    setName(kakaoName)
                    setPhone(kakaoPhone)
                } else {
                    // 로그인하지 않은 경우 이메일 회원가입 모드
                    setMode("email")
                }

                setLoading(false)
            } catch (err) {
                console.error("인증 확인 오류:", err)
                setMode("email")
                setLoading(false)
            }
        }

        checkAuth()
    }, [router])

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    const validatePhone = (phoneNumber: string): boolean => {
        const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/
        return phoneRegex.test(phoneNumber.replace(/\s/g, ""))
    }

    const validatePassword = (password: string): boolean => {
        // 최소 6자 이상
        return password.length >= 6
    }

    const handlePhoneChange = (value: string) => {
        const cleaned = value.replace(/[^\d-]/g, "")
        setPhone(cleaned)
        setPhoneError("")
    }

    const handleEmailSignup = async (e: React.FormEvent) => {
        e.preventDefault()

        // 유효성 검사
        let hasError = false

        if (!email.trim()) {
            setEmailError("이메일을 입력해주세요.")
            hasError = true
        } else if (!validateEmail(email)) {
            setEmailError("올바른 이메일 형식이 아닙니다.")
            hasError = true
        } else {
            setEmailError("")
        }

        if (!password) {
            setPasswordError("비밀번호를 입력해주세요.")
            hasError = true
        } else if (!validatePassword(password)) {
            setPasswordError("비밀번호는 최소 6자 이상이어야 합니다.")
            hasError = true
        } else {
            setPasswordError("")
        }

        if (!confirmPassword) {
            setConfirmPasswordError("비밀번호 확인을 입력해주세요.")
            hasError = true
        } else if (password !== confirmPassword) {
            setConfirmPasswordError("비밀번호가 일치하지 않습니다.")
            hasError = true
        } else {
            setConfirmPasswordError("")
        }

        if (!name.trim()) {
            setNameError("이름을 입력해주세요.")
            hasError = true
        } else {
            setNameError("")
        }

        if (!phone.trim()) {
            setPhoneError("전화번호를 입력해주세요.")
            hasError = true
        } else if (!validatePhone(phone)) {
            setPhoneError("올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)")
            hasError = true
        } else {
            setPhoneError("")
        }

        if (hasError) {
            return
        }

        try {
            setSubmitting(true)

            // 이메일 회원가입
            const authData = await signUpWithEmail(email.trim(), password)

            if (!authData.user) {
                throw new Error("회원가입에 실패했습니다.")
            }

            // 전화번호 정리
            const cleanedPhone = phone.replace(/-/g, "")

            // 생일 처리
            let formattedBirthDate: string | null = null
            if (birthDate) {
                formattedBirthDate = format(birthDate, "yyyy-MM-dd")
            }

            // 출생연도 처리
            let birthYearNum: number | null = null
            if (birthYear) {
                const year = parseInt(birthYear)
                if (!isNaN(year) && year >= 1900 && year <= new Date().getFullYear()) {
                    birthYearNum = year
                }
            }

            // public.users 테이블에 정보 저장 (트리거가 이미 생성했을 수 있으므로 upsert 사용)
            const { error: profileError } = await supabaseAuth
                .from("users")
                .upsert({
                    auth_id: authData.user.id,
                    name: name.trim(),
                    email: email.trim(),
                    phone: cleanedPhone,
                    gender: gender || null,
                    age_range: ageRange || null,
                    birth_date: formattedBirthDate,
                    birth_year: birthYearNum,
                }, {
                    onConflict: "auth_id",
                })

            if (profileError) {
                console.error("프로필 저장 오류:", profileError)
                throw new Error("프로필 정보 저장에 실패했습니다. 다시 시도해주세요.")
            }

            toast.success("회원가입이 완료되었습니다!")

            // 저장된 리다이렉트 URL 확인
            const redirectUrl = sessionStorage.getItem("redirectAfterLogin")
            if (redirectUrl) {
                sessionStorage.removeItem("redirectAfterLogin")
                router.push(redirectUrl)
            } else {
                router.push("/")
            }
        } catch (err: any) {
            console.error("회원가입 오류:", err)
            toast.error(err.message || "회원가입에 실패했습니다.")
        } finally {
            setSubmitting(false)
        }
    }

    const handleKakaoProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault()

        // 유효성 검사
        let hasError = false

        if (!name.trim()) {
            setNameError("이름을 입력해주세요.")
            hasError = true
        } else {
            setNameError("")
        }

        if (!phone.trim()) {
            setPhoneError("전화번호를 입력해주세요.")
            hasError = true
        } else if (!validatePhone(phone)) {
            setPhoneError("올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)")
            hasError = true
        } else {
            setPhoneError("")
        }

        if (hasError) {
            return
        }

        try {
            setSubmitting(true)

            const user = await getCurrentUser()
            if (!user) {
                toast.error("로그인이 필요합니다.")
                router.push("/login")
                return
            }

            // 전화번호 정리
            const cleanedPhone = phone.replace(/-/g, "")

            // 생일 처리
            let formattedBirthDate: string | null = null
            if (birthDate) {
                formattedBirthDate = format(birthDate, "yyyy-MM-dd")
            }

            // 출생연도 처리
            let birthYearNum: number | null = null
            if (birthYear) {
                const year = parseInt(birthYear)
                if (!isNaN(year) && year >= 1900 && year <= new Date().getFullYear()) {
                    birthYearNum = year
                }
            }

            // public.users 테이블 업데이트 (트리거가 이미 생성했을 수 있으므로 upsert 사용)
            const { error: updateError } = await supabaseAuth
                .from("users")
                .upsert({
                    auth_id: user.id,
                    name: name.trim(),
                    phone: cleanedPhone,
                    gender: gender || null,
                    age_range: ageRange || null,
                    birth_date: formattedBirthDate,
                    birth_year: birthYearNum,
                }, {
                    onConflict: "auth_id",
                })

            if (updateError) {
                console.error("회원가입 오류:", updateError)
                throw new Error("프로필 정보 저장에 실패했습니다. 다시 시도해주세요.")
            }

            toast.success("회원가입이 완료되었습니다!")

            // 저장된 리다이렉트 URL 확인
            const redirectUrl = sessionStorage.getItem("redirectAfterLogin")
            if (redirectUrl) {
                sessionStorage.removeItem("redirectAfterLogin")
                router.push(redirectUrl)
            } else {
                router.push("/")
            }
        } catch (err: any) {
            console.error("회원가입 오류:", err)
            toast.error(err.message || "회원가입에 실패했습니다.")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">로딩 중...</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        회원가입
                    </CardTitle>
                    <CardDescription>
                        {mode === "kakao"
                            ? "추가 정보를 입력해주세요. 필수 항목은 반드시 입력해주세요."
                            : "이메일과 비밀번호로 회원가입하세요."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={mode} onValueChange={(v) => setMode(v as "kakao" | "email")} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="email" disabled={mode === "kakao"}>
                                <Mail className="h-4 w-4 mr-2" />
                                이메일 회원가입
                            </TabsTrigger>
                            <TabsTrigger value="kakao" disabled={mode === "email"}>
                                카카오 추가 정보
                            </TabsTrigger>
                        </TabsList>

                        {/* 이메일 회원가입 */}
                        <TabsContent value="email">
                            <form onSubmit={handleEmailSignup} className="space-y-6 mt-4">
                                {/* 이메일/비밀번호 */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-foreground">계정 정보</h3>

                                    {/* 이메일 */}
                                    <div className="space-y-2">
                                        <Label htmlFor="email">
                                            이메일 <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value)
                                                setEmailError("")
                                            }}
                                            placeholder="example@email.com"
                                            className={cn(emailError && "border-destructive")}
                                        />
                                        {emailError && (
                                            <p className="text-sm text-destructive">{emailError}</p>
                                        )}
                                    </div>

                                    {/* 비밀번호 */}
                                    <div className="space-y-2">
                                        <Label htmlFor="password">
                                            비밀번호 <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value)
                                                setPasswordError("")
                                            }}
                                            placeholder="최소 6자 이상"
                                            className={cn(passwordError && "border-destructive")}
                                        />
                                        {passwordError && (
                                            <p className="text-sm text-destructive">{passwordError}</p>
                                        )}
                                    </div>

                                    {/* 비밀번호 확인 */}
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">
                                            비밀번호 확인 <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => {
                                                setConfirmPassword(e.target.value)
                                                setConfirmPasswordError("")
                                            }}
                                            placeholder="비밀번호를 다시 입력해주세요"
                                            className={cn(confirmPasswordError && "border-destructive")}
                                        />
                                        {confirmPasswordError && (
                                            <p className="text-sm text-destructive">{confirmPasswordError}</p>
                                        )}
                                    </div>
                                </div>

                                {/* 필수 입력 */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-foreground">필수 입력</h3>

                                    {/* 이름 */}
                                    <div className="space-y-2">
                                        <Label htmlFor="name-email">
                                            이름 <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="name-email"
                                            value={name}
                                            onChange={(e) => {
                                                setName(e.target.value)
                                                setNameError("")
                                            }}
                                            placeholder="이름을 입력해주세요"
                                            className={cn(nameError && "border-destructive")}
                                        />
                                        {nameError && (
                                            <p className="text-sm text-destructive">{nameError}</p>
                                        )}
                                    </div>

                                    {/* 전화번호 */}
                                    <div className="space-y-2">
                                        <Label htmlFor="phone-email">
                                            전화번호 <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="phone-email"
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => handlePhoneChange(e.target.value)}
                                            placeholder="010-1234-5678"
                                            className={cn(phoneError && "border-destructive")}
                                        />
                                        {phoneError && (
                                            <p className="text-sm text-destructive">{phoneError}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            예: 010-1234-5678
                                        </p>
                                    </div>
                                </div>

                                {/* 선택 입력 */}
                                <ProfileFields
                                    gender={gender}
                                    setGender={setGender}
                                    ageRange={ageRange}
                                    setAgeRange={setAgeRange}
                                    birthDate={birthDate}
                                    setBirthDate={setBirthDate}
                                    birthYear={birthYear}
                                    setBirthYear={setBirthYear}
                                />

                                {/* 제출 버튼 */}
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.push("/login")}
                                        disabled={submitting}
                                        className="flex-1"
                                    >
                                        취소
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                처리 중...
                                            </>
                                        ) : (
                                            "회원가입 완료"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>

                        {/* 카카오 추가 정보 */}
                        <TabsContent value="kakao">
                            <form onSubmit={handleKakaoProfileUpdate} className="space-y-6 mt-4">
                                {/* 필수 입력 */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-foreground">필수 입력</h3>

                                    {/* 이름 */}
                                    <div className="space-y-2">
                                        <Label htmlFor="name-kakao">
                                            이름 <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="name-kakao"
                                            value={name}
                                            onChange={(e) => {
                                                setName(e.target.value)
                                                setNameError("")
                                            }}
                                            placeholder="이름을 입력해주세요"
                                            className={cn(nameError && "border-destructive")}
                                        />
                                        {nameError && (
                                            <p className="text-sm text-destructive">{nameError}</p>
                                        )}
                                    </div>

                                    {/* 전화번호 */}
                                    <div className="space-y-2">
                                        <Label htmlFor="phone-kakao">
                                            전화번호 <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="phone-kakao"
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => handlePhoneChange(e.target.value)}
                                            placeholder="010-1234-5678"
                                            className={cn(phoneError && "border-destructive")}
                                        />
                                        {phoneError && (
                                            <p className="text-sm text-destructive">{phoneError}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            예: 010-1234-5678
                                        </p>
                                    </div>
                                </div>

                                {/* 선택 입력 */}
                                <ProfileFields
                                    gender={gender}
                                    setGender={setGender}
                                    ageRange={ageRange}
                                    setAgeRange={setAgeRange}
                                    birthDate={birthDate}
                                    setBirthDate={setBirthDate}
                                    birthYear={birthYear}
                                    setBirthYear={setBirthYear}
                                />

                                {/* 제출 버튼 */}
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.push("/")}
                                        disabled={submitting}
                                        className="flex-1"
                                    >
                                        나중에
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                처리 중...
                                            </>
                                        ) : (
                                            "회원가입 완료"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}

// 선택 입력 필드 컴포넌트
function ProfileFields({
    gender,
    setGender,
    ageRange,
    setAgeRange,
    birthDate,
    setBirthDate,
    birthYear,
    setBirthYear,
}: {
    gender: string
    setGender: (value: string) => void
    ageRange: string
    setAgeRange: (value: string) => void
    birthDate: Date | undefined
    setBirthDate: (value: Date | undefined) => void
    birthYear: string
    setBirthYear: (value: string) => void
}) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">선택 입력</h3>

            {/* 성별 */}
            <div className="space-y-2">
                <Label htmlFor="gender">성별</Label>
                <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger id="gender">
                        <SelectValue placeholder="선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="male">남성</SelectItem>
                        <SelectItem value="female">여성</SelectItem>
                        <SelectItem value="other">기타</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* 연령대 */}
            <div className="space-y-2">
                <Label htmlFor="ageRange">연령대</Label>
                <Select value={ageRange} onValueChange={setAgeRange}>
                    <SelectTrigger id="ageRange">
                        <SelectValue placeholder="선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="10s">10대</SelectItem>
                        <SelectItem value="20s">20대</SelectItem>
                        <SelectItem value="30s">30대</SelectItem>
                        <SelectItem value="40s">40대</SelectItem>
                        <SelectItem value="50s">50대</SelectItem>
                        <SelectItem value="60s">60대 이상</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* 출생연도 */}
            <div className="space-y-2">
                <Label htmlFor="birthYear">출생연도</Label>
                <Input
                    id="birthYear"
                    type="text"
                    value={birthYear}
                    onChange={(e) => {
                        const value = e.target.value
                        if (value === "" || (parseInt(value) >= 1900 && parseInt(value) <= new Date().getFullYear())) {
                            setBirthYear(value)
                        }
                    }}
                    placeholder="예: 1990"
                    min="1900"
                    max={new Date().getFullYear()}
                />
                <p className="text-xs text-muted-foreground">
                    생일과 출생연도 중 하나만 입력해도 됩니다.
                </p>
            </div>
        </div>
    )
}
