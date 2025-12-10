-- 16단계: users 테이블에 프로필 필드 추가
-- 성별, 연령대, 생일, 출생연도 추가

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
ADD COLUMN IF NOT EXISTS age_range VARCHAR(20),
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS birth_year INTEGER;

-- 인덱스 생성 (선택사항)
CREATE INDEX IF NOT EXISTS idx_users_age_range ON users(age_range);
CREATE INDEX IF NOT EXISTS idx_users_birth_year ON users(birth_year);

