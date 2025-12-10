"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { getCurrentUser, supabaseAuth } from "@/lib/auth"
import { Users, LogIn, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Voter {
    id: string
    name: string
    phone?: string | null
}

interface CreateGroupFromVotersModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    voters: Voter[]
    appointmentTitle: string
}

export function CreateGroupFromVotersModal({
    open,
    onOpenChange,
    voters,
    appointmentTitle,
}: CreateGroupFromVotersModalProps) {
    const router = useRouter()
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
    const [groupName, setGroupName] = useState("")
    const [selectedVoters, setSelectedVoters] = useState<Set<string>>(new Set())
    const [saving, setSaving] = useState(false)

    // 로그인 상태 확인
    useEffect(() => {
        const checkAuth = async () => {
            const user = await getCurrentUser()
            setIsLoggedIn(!!user)
        }
        if (open) {
            checkAuth()
            // 기본 그룹 이름 설정
            setGroupName(`${appointmentTitle} 멤버`)
            // 모든 투표자 선택
            setSelectedVoters(new Set(voters.map((v) => v.id)))
        }
    }, [open, voters, appointmentTitle])

    const toggleVoter = (voterId: string) => {
        const newSelected = new Set(selectedVoters)
        if (newSelected.has(voterId)) {
            newSelected.delete(voterId)
        } else {
            newSelected.add(voterId)
        }
        setSelectedVoters(newSelected)
    }

    const selectAll = () => {
        setSelectedVoters(new Set(voters.map((v) => v.id)))
    }

    const deselectAll = () => {
        setSelectedVoters(new Set())
    }

    const handleSave = async () => {
        if (!groupName.trim()) {
            toast.error("그룹 이름을 입력해주세요.")
            return
        }

        if (selectedVoters.size === 0) {
            toast.error("최소 1명의 멤버를 선택해주세요.")
            return
        }

        try {
            setSaving(true)

            // 세션에서 access_token 가져오기
            const { data: { session } } = await supabaseAuth.auth.getSession()
            if (!session?.access_token) {
                toast.error("로그인이 필요합니다.")
                return
            }

            const members = voters
                .filter((v) => selectedVoters.has(v.id))
                .map((v) => ({
                    name: v.name,
                    phone: v.phone || "",
                }))

            const response = await fetch("/api/groups", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    name: groupName.trim(),
                    members,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "그룹 생성에 실패했습니다.")
            }

            toast.success("그룹이 생성되었습니다!")
            onOpenChange(false)

            // 마이페이지 그룹 탭으로 이동
            router.push("/mypage?tab=groups")
        } catch (err: any) {
            console.error("그룹 생성 오류:", err)
            toast.error(err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleLogin = () => {
        // 현재 URL을 저장하고 로그인 후 돌아올 수 있도록
        sessionStorage.setItem("redirectAfterLogin", window.location.href)
        router.push("/login")
    }

    if (isLoggedIn === null) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="sr-only">로딩 중</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    if (!isLoggedIn) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            그룹 만들기
                        </DialogTitle>
                        <DialogDescription>
                            그룹을 만들려면 로그인이 필요합니다
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6">
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                카카오 계정으로 로그인하면 참여자들을 그룹으로 저장하고 관리할 수 있습니다.
                            </AlertDescription>
                        </Alert>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            취소
                        </Button>
                        <Button onClick={handleLogin}>
                            <LogIn className="h-4 w-4 mr-2" />
                            로그인하기
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        이 인원으로 그룹 만들기
                    </DialogTitle>
                    <DialogDescription>
                        약속 참여자들을 그룹으로 저장하세요
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* 그룹 이름 */}
                    <div className="space-y-2">
                        <Label htmlFor="groupName">그룹 이름</Label>
                        <Input
                            id="groupName"
                            placeholder="예: 대학 동기, 회사 팀"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                    </div>

                    {/* 멤버 선택 */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>멤버 선택 ({selectedVoters.size}/{voters.length}명)</Label>
                            <div className="flex gap-2">

                            </div>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                            {voters.map((voter) => (
                                <div
                                    key={voter.id}
                                    className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md"
                                >
                                    <Checkbox
                                        id={`voter-${voter.id}`}
                                        checked={selectedVoters.has(voter.id)}
                                        onCheckedChange={() => toggleVoter(voter.id)}
                                    />
                                    <label
                                        htmlFor={`voter-${voter.id}`}
                                        className="flex-1 text-sm cursor-pointer"
                                    >
                                        <span className="font-medium">{voter.name}</span>
                                        {voter.phone && (
                                            <span className="text-muted-foreground ml-2 text-xs">
                                                ({voter.phone})
                                            </span>
                                        )}
                                    </label>
                                </div>
                            ))}
                        </div>

                        <p className="text-xs text-muted-foreground">
                            * 로그인한 사용자가 투표한 경우 전화번호가 자동으로 표시됩니다
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        취소
                    </Button>
                    <Button onClick={handleSave} disabled={saving || selectedVoters.size === 0}>
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                저장 중...
                            </>
                        ) : (
                            "그룹 만들기"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
