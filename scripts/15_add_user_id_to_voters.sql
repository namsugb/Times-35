-- 15단계: voters 테이블에 user_id 필드 추가
-- 로그인한 사용자가 투표할 때 users 테이블과 연결

-- 1. voters 테이블에 user_id 컬럼 추가
ALTER TABLE voters 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_voters_user_id ON voters(user_id);

-- 3. 기존 voters와 users 매칭 (이름 기반으로 기존 데이터 연결 - 선택사항)
-- UPDATE voters v
-- SET user_id = u.id
-- FROM users u
-- WHERE v.name = u.name AND v.user_id IS NULL;

