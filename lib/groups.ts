"use client"

import { supabase } from "./supabase"

export interface GroupMember {
  id: string
  name: string
  phone: string | null
}

export interface Group {
  id: string
  name: string
  created_at: string
  members: GroupMember[]
}

export interface GroupMemberInput {
  name: string
  phone: string
}

function formatGroup(group: any): Group {
  return {
    id: group.id,
    name: group.name,
    created_at: group.created_at,
    members: group.group_members || [],
  }
}

async function getCurrentAuthUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("로그인이 필요합니다.")
  }

  return user.id
}

function buildMembers(groupId: string, members: GroupMemberInput[]) {
  return members
    .filter((member) => member.name && member.name.trim())
    .map((member) => ({
      group_id: groupId,
      name: member.name.trim(),
      phone: member.phone?.trim() || null,
    }))
}

export async function listGroups() {
  const { data, error } = await supabase
    .from("groups")
    .select(`
      id,
      name,
      created_at,
      group_members (
        id,
        name,
        phone
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error("그룹 목록을 불러오는 데 실패했습니다.")
  }

  return (data || []).map(formatGroup)
}

export async function createGroup(name: string, members: GroupMemberInput[]) {
  const userId = await getCurrentAuthUserId()

  if (!name.trim()) {
    throw new Error("그룹 이름을 입력해주세요.")
  }

  if (!members.length) {
    throw new Error("최소 1명의 멤버가 필요합니다.")
  }

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      user_id: userId,
      name: name.trim(),
    })
    .select()
    .single()

  if (groupError || !group) {
    throw new Error("그룹 생성에 실패했습니다.")
  }

  const membersToInsert = buildMembers(group.id, members)

  if (membersToInsert.length > 0) {
    const { error: membersError } = await supabase.from("group_members").insert(membersToInsert)

    if (membersError) {
      throw new Error("그룹 멤버 추가에 실패했습니다.")
    }
  }

  return { id: group.id, name: group.name }
}

export async function updateGroup(groupId: string, name: string, members: GroupMemberInput[]) {
  if (!name.trim()) {
    throw new Error("그룹 이름을 입력해주세요.")
  }

  const { error: updateError } = await supabase
    .from("groups")
    .update({ name: name.trim(), updated_at: new Date().toISOString() })
    .eq("id", groupId)

  if (updateError) {
    throw new Error("그룹 수정에 실패했습니다.")
  }

  const { error: deleteError } = await supabase.from("group_members").delete().eq("group_id", groupId)

  if (deleteError) {
    throw new Error("기존 그룹 멤버 삭제에 실패했습니다.")
  }

  const membersToInsert = buildMembers(groupId, members)

  if (membersToInsert.length > 0) {
    const { error: insertError } = await supabase.from("group_members").insert(membersToInsert)

    if (insertError) {
      throw new Error("그룹 멤버 저장에 실패했습니다.")
    }
  }
}

export async function deleteGroup(groupId: string) {
  const { error } = await supabase.from("groups").delete().eq("id", groupId)

  if (error) {
    throw new Error("그룹 삭제에 실패했습니다.")
  }
}
