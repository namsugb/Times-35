"use client"

import { useState, useEffect } from "react"
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
import { Plus, Trash2, Users } from "lucide-react"

interface Member {
    name: string
    phone: string
}

interface GroupCreateModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (name: string, members: Member[]) => Promise<void>
    initialData?: {
        name: string
        members: Member[]
    }
    isEdit?: boolean
}

export function GroupCreateModal({
    open,
    onOpenChange,
    onSave,
    initialData,
    isEdit = false,
}: GroupCreateModalProps) {
    const [groupName, setGroupName] = useState("")
    const [members, setMembers] = useState<Member[]>([{ name: "", phone: "" }])
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (initialData) {
            setGroupName(initialData.name)
            setMembers(initialData.members.length > 0 ? initialData.members : [{ name: "", phone: "" }])
        } else {
            setGroupName("")
            setMembers([{ name: "", phone: "" }])
        }
    }, [initialData, open])

    const addMember = () => {
        setMembers([...members, { name: "", phone: "" }])
    }

    const removeMember = (index: number) => {
        if (members.length > 1) {
            setMembers(members.filter((_, i) => i !== index))
        }
    }

    const updateMember = (index: number, field: keyof Member, value: string) => {
        const updated = [...members]
        updated[index] = { ...updated[index], [field]: value }
        setMembers(updated)
    }

    const handleSave = async () => {
        if (!groupName.trim()) {
            return
        }

        // 이름이 있는 멤버만 저장
        const validMembers = members.filter((m) => m.name.trim())
        if (validMembers.length === 0) {
            return
        }

        try {
            setSaving(true)
            await onSave(groupName.trim(), validMembers.map((m) => ({
                name: m.name.trim(),
                phone: m.phone.trim(),
            })))
        } finally {
            setSaving(false)
        }
    }

    const isValid = groupName.trim() && members.some((m) => m.name.trim())

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {isEdit ? "그룹 수정" : "그룹 만들기"}
                    </DialogTitle>
                    <DialogDescription>
                        자주 만나는 멤버들의 이름과 연락처를 저장하세요
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

                    {/* 멤버 목록 */}
                    <div className="space-y-3">
                        <Label>멤버</Label>
                        {members.map((member, index) => (
                            <div key={index} className="flex gap-2">
                                <Input
                                    placeholder="이름"
                                    value={member.name}
                                    onChange={(e) => updateMember(index, "name", e.target.value)}
                                    className="flex-1"
                                />
                                <Input
                                    placeholder="전화번호 (선택)"
                                    value={member.phone}
                                    onChange={(e) => updateMember(index, "phone", e.target.value)}
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeMember(index)}
                                    disabled={members.length === 1}
                                >
                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </div>
                        ))}

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addMember}
                            className="w-full"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            멤버 추가
                        </Button>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        취소
                    </Button>
                    <Button onClick={handleSave} disabled={!isValid || saving}>
                        {saving ? "저장 중..." : isEdit ? "수정" : "저장"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

