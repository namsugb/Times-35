-- 14단계: 그룹 관련 테이블 생성 및 사용자 테이블 업데이트
-- 사용자가 자주 모이는 멤버들을 그룹으로 저장할 수 있는 기능

-- 0. users 테이블에 auth_id unique 제약조건 추가 (없으면 추가)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_auth_id_key'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_auth_id_key UNIQUE (auth_id);
    END IF;
END $$;

-- 1. groups 테이블: 사용자가 만든 그룹
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. group_members 테이블: 그룹에 속한 멤버들
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_groups_user_id ON groups(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);

-- 4. RLS 정책 활성화
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- 5. groups 테이블 RLS 정책
-- 사용자는 자신의 그룹만 조회 가능
CREATE POLICY "Users can view own groups" ON groups
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 그룹만 생성 가능
CREATE POLICY "Users can create own groups" ON groups
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 그룹만 수정 가능
CREATE POLICY "Users can update own groups" ON groups
    FOR UPDATE USING (auth.uid() = user_id);

-- 사용자는 자신의 그룹만 삭제 가능
CREATE POLICY "Users can delete own groups" ON groups
    FOR DELETE USING (auth.uid() = user_id);

-- 6. group_members 테이블 RLS 정책
-- 그룹 소유자만 멤버 조회 가능
CREATE POLICY "Users can view members of own groups" ON group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_members.group_id 
            AND groups.user_id = auth.uid()
        )
    );

-- 그룹 소유자만 멤버 추가 가능
CREATE POLICY "Users can add members to own groups" ON group_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_members.group_id 
            AND groups.user_id = auth.uid()
        )
    );

-- 그룹 소유자만 멤버 수정 가능
CREATE POLICY "Users can update members of own groups" ON group_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_members.group_id 
            AND groups.user_id = auth.uid()
        )
    );

-- 그룹 소유자만 멤버 삭제 가능
CREATE POLICY "Users can delete members of own groups" ON group_members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_members.group_id 
            AND groups.user_id = auth.uid()
        )
    );

-- 7. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_groups_updated_at();

