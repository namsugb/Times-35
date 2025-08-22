"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, Users, Repeat, Timer, TrendingUp, Sunrise, DollarSign, Lock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AppointmentMethodSelector } from "./appointment-method-selector"
import { AppointmentCreationModal } from "./appointment-creation-modal"
import { ComingSoonModal } from "./coming-soon-modal"

export function AppointmentScheduler() {
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false)
    const [isClient, setIsClient] = useState(false)

    // 클라이언트 사이드에서만 렌더링
    useEffect(() => {
        setIsClient(true)
    }, [])

    // 준비중인 기능들
    const comingSoonMethods = ["time-scheduling", "priority-voting", "time-period", "budget-consideration"]

    const methods = [
        {
            id: "all-available",
            title: "모두",
            description: "모두가 가능한 날짜를 찾습니다.",
            icon: <Calendar className="h-8 w-8 mb-2 text-primary" />,
            category: "기본",
        },
        {
            id: "max-available",
            title: "최대",
            description: "가장 많은 사람이 가능한 날짜를 제안합니다.",
            icon: <Users className="h-8 w-8 mb-2 text-primary" />,
            category: "기본",
        },
        {
            id: "minimum-required",
            title: "기준",
            description: "입력한 인원 이상이 가능한 날짜를 찾습니다.",
            icon: <Clock className="h-8 w-8 mb-2 text-primary" />,
            category: "기본",
        },
        {
            id: "recurring",
            title: "반복 요일",
            description: "매주 반복해서 만날 요일을 정합니다.",
            icon: <Repeat className="h-8 w-8 mb-2 text-primary" />,
            category: "기본",
        },
        {
            id: "time-scheduling",
            title: "약속 시간정하기",
            description: "날짜와 시간을 함께 선택하여 약속을 정합니다.",
            icon: <Timer className="h-8 w-8 mb-2 text-primary" />,
            category: "기본",
            comingSoon: true,
        },
        {
            id: "priority-voting",
            title: "우선순위 투표",
            description: "1순위, 2순위, 3순위로 선호도를 투표합니다.",
            icon: <TrendingUp className="h-8 w-8 mb-2 text-green-600" />,
            category: "고급",
            isNew: true,
            comingSoon: true,
        },
        {
            id: "time-period",
            title: "시간대별 투표",
            description: "오전/오후/저녁 등 시간대로 투표합니다.",
            icon: <Sunrise className="h-8 w-8 mb-2 text-orange-600" />,
            category: "고급",
            isNew: true,
            comingSoon: true,
        },
        {
            id: "budget-consideration",
            title: "예산 고려 투표",
            description: "날짜와 예산 범위를 함께 고려합니다.",
            icon: <DollarSign className="h-8 w-8 mb-2 text-purple-600" />,
            category: "고급",
            isNew: true,
            comingSoon: true,
        },
    ]

    // 메서드 선택 핸들러
    const handleMethodSelect = (methodId: string) => {
        // 준비중 모달 열기
        if (comingSoonMethods.includes(methodId)) {
            setIsComingSoonModalOpen(true)
            return
        }

        // 약속 생성 모달 열기
        setSelectedMethod(methodId)
        setIsModalOpen(true)
    }

    // 카테고리별로 그룹화
    const basicMethods = methods.filter((m) => m.category === "기본")
    const advancedMethods = methods.filter((m) => m.category === "고급")

    // 클라이언트 사이드에서만 렌더링
    if (!isClient) {
        return (
            <div className="flex justify-center">
                <div className="animate-pulse">로딩 중...</div>
            </div>
        )
    }

    return (
        <>
            {/* 기본 방식들 */}
            <AppointmentMethodSelector
                title="기본 방식"
                methods={basicMethods}
                onMethodSelect={handleMethodSelect}
                icon={<Calendar className="h-5 w-5" />}
            />

            {/* 고급 방식들 */}
            <AppointmentMethodSelector
                title="고급 방식"
                methods={advancedMethods}
                onMethodSelect={handleMethodSelect}
                icon={<TrendingUp className="h-5 w-5" />}
                showNewBadge
            />

            {/* 준비중 모달 */}
            <ComingSoonModal
                isOpen={isComingSoonModalOpen}
                onClose={() => setIsComingSoonModalOpen(false)}
            />

            {/* 약속 생성 모달 */}
            <AppointmentCreationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedMethod={selectedMethod}
                methods={methods}
            />
        </>
    )
}
