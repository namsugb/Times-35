"use client"

import { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { supabaseAuth } from "@/lib/auth"
import { Users, Phone, User, Loader2 } from "lucide-react"

interface GroupMember {
    id: string
    name: string
    phone: string | null
}

interface Group {
    id: string
    name: string
    members: GroupMember[]
}

interface GroupSelectModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (members: { name: string; phone: string }[]) => void
}

export function GroupSelectModal({ open, onOpenChange, onSelect }: GroupSelectModalProps) {
    const [groups, setGroups] = useState<Group[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
    const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (open) {
            fetchGroups()
            setSelectedGroupId(null)
            setSelectedMembers(new Set())
        }
    }, [open])

    const fetchGroups = async () => {
        try {
            setLoading(true)

            const { data: { session } } = await supabaseAuth.auth.getSession()
            if (!session?.access_token) {
                setGroups([])
                return
            }

            const response = await fetch("/api/groups", {
                headers: {
                    "Authorization": `Bearer ${session.access_token}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                setGroups(data.groups || [])
            }
        } catch (err) {
            console.error("그룹 조회 오류:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleGroupSelect = (groupId: string) => {
        setSelectedGroupId(groupId)
        const group = groups.find((g) => g.id === groupId)
        if (group) {
            // 전화번호가 있는 멤버만 자동 선택
            const membersWithPhone = group.members
                .filter((m) => m.phone)
                .map((m) => m.id)
            setSelectedMembers(new Set(membersWithPhone))
        }
    }

    const toggleMember = (memberId: string) => {
        const newSelected = new Set(selectedMembers)
        if (newSelected.has(memberId)) {
            newSelected.delete(memberId)
        } else {
            newSelected.add(memberId)
        }
        setSelectedMembers(newSelected)
    }

    const handleConfirm = () => {
        if (!selectedGroupId) return

        const group = groups.find((g) => g.id === selectedGroupId)
        if (!group) return

        const selectedMembersList = group.members
            .filter((m) => selectedMembers.has(m.id) && m.phone)
            .map((m) => ({
                name: m.name,
                phone: m.phone!,
            }))

        onSelect(selectedMembersList)
        onOpenChange(false)
    }

    const selectedGroup = groups.find((g) => g.id === selectedGroupId)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        그룹 선택
                    </DialogTitle>
                    <DialogDescription>
                        알림톡을 보낼 그룹을 선택하세요
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="space-y-3 py-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : groups.length === 0 ? (
                    <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">저장된 그룹이 없습니다</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            마이페이지에서 그룹을 먼저 만들어주세요
                        </p>
                    </div>
                ) : !selectedGroupId ? (
                    <div className="space-y-2 py-4">
                        {groups.map((group) => (
                            <button
                                key={group.id}
                                onClick={() => handleGroupSelect(group.id)}
                                className="w-full p-4 text-left border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Users className="h-5 w-5 text-primary" />
                                        <span className="font-medium">{group.name}</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        {group.members.length}명
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="py-4">
                        <div className="flex items-center justify-between mb-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedGroupId(null)}
                            >
                                ← 그룹 다시 선택
                            </Button>
                            <span className="text-sm font-medium">{selectedGroup?.name}</span>
                        </div>

                        <div className="space-y-2 border rounded-lg p-3 max-h-60 overflow-y-auto">
                            {selectedGroup?.members.map((member) => (
                                <div
                                    key={member.id}
                                    className={`flex items-center space-x-3 p-2 rounded-md ${!member.phone ? "opacity-50" : "hover:bg-muted/50"
                                        }`}
                                >
                                    <Checkbox
                                        id={`member-${member.id}`}
                                        checked={selectedMembers.has(member.id)}
                                        onCheckedChange={() => toggleMember(member.id)}
                                        disabled={!member.phone}
                                    />
                                    <label
                                        htmlFor={`member-${member.id}`}
                                        className="flex-1 flex items-center gap-2 text-sm cursor-pointer"
                                    >
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{member.name}</span>
                                        {member.phone ? (
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <Phone className="h-3 w-3" />
                                                {member.phone}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">(번호 없음)</span>
                                        )}
                                    </label>
                                </div>
                            ))}
                        </div>

                        <p className="text-xs text-muted-foreground mt-2">
                            * 전화번호가 있는 멤버에게만 알림톡을 보낼 수 있습니다
                        </p>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        취소
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedGroupId || selectedMembers.size === 0}
                    >
                        {selectedMembers.size > 0 ? `${selectedMembers.size}명 선택` : "선택"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

