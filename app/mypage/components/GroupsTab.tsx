"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { GroupCreateModal } from "./GroupCreateModal"
import { createGroup, deleteGroup, listGroups, updateGroup, type Group } from "@/lib/groups"
import { MoreVertical, Pencil, Phone, Plus, Trash2, User, Users } from "lucide-react"
import { toast } from "sonner"

interface GroupsTabProps {
  userId: string
  initialGroups?: Group[]
}

export function GroupsTab({ userId, initialGroups }: GroupsTabProps) {
  const [groups, setGroups] = useState<Group[]>(initialGroups || [])
  const [loading, setLoading] = useState(!initialGroups)
  const [error, setError] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null)

  const fetchGroups = async () => {
    try {
      setLoading(true)
      setError(null)
      setGroups(await listGroups())
    } catch (err: any) {
      console.error("그룹 조회 오류:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialGroups) {
      fetchGroups()
    }
  }, [userId, initialGroups])

  const handleCreateGroup = async (name: string, members: { name: string; phone: string }[]) => {
    try {
      await createGroup(name, members)
      toast.success("그룹이 생성되었습니다.")
      await fetchGroups()
      setIsCreateModalOpen(false)
    } catch (err: any) {
      console.error("그룹 생성 오류:", err)
      toast.error(err.message)
    }
  }

  const handleUpdateGroup = async (name: string, members: { name: string; phone: string }[]) => {
    if (!editingGroup) return

    try {
      await updateGroup(editingGroup.id, name, members)
      toast.success("그룹이 수정되었습니다.")
      await fetchGroups()
      setEditingGroup(null)
    } catch (err: any) {
      console.error("그룹 수정 오류:", err)
      toast.error(err.message)
    }
  }

  const handleDeleteGroup = async () => {
    if (!deletingGroupId) return

    try {
      await deleteGroup(deletingGroupId)
      toast.success("그룹이 삭제되었습니다.")
      await fetchGroups()
      setDeletingGroupId(null)
    } catch (err: any) {
      console.error("그룹 삭제 오류:", err)
      toast.error(err.message)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((item) => (
          <Card key={item}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{groups.length > 0 ? `총 ${groups.length}개의 그룹` : ""}</p>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          그룹 만들기
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">그룹이 없습니다</h3>
            <p className="text-muted-foreground mb-4">자주 만나는 멤버들을 그룹으로 저장해보세요.</p>
            <Button onClick={() => setIsCreateModalOpen(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              첫 그룹 만들기
            </Button>
          </CardContent>
        </Card>
      ) : (
        groups.map((group) => (
          <Card key={group.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">{group.name}</h3>
                    <span className="text-sm text-muted-foreground">({group.members.length}명)</span>
                  </div>

                  <div className="space-y-2">
                    {group.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 text-sm bg-muted/50 rounded-md px-3 py-2"
                      >
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{member.name}</span>
                        {member.phone && (
                          <>
                            <Phone className="h-3 w-3 text-muted-foreground ml-2" />
                            <span className="text-muted-foreground">{member.phone}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingGroup(group)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      수정
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeletingGroupId(group.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <GroupCreateModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} onSave={handleCreateGroup} />

      {editingGroup && (
        <GroupCreateModal
          open={!!editingGroup}
          onOpenChange={(open) => !open && setEditingGroup(null)}
          onSave={handleUpdateGroup}
          initialData={{
            name: editingGroup.name,
            members: editingGroup.members.map((member) => ({ name: member.name, phone: member.phone || "" })),
          }}
          isEdit
        />
      )}

      <AlertDialog open={!!deletingGroupId} onOpenChange={(open) => !open && setDeletingGroupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>그룹을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 그룹과 모든 멤버 정보가 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive text-destructive-foreground">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
