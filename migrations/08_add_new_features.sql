-- 새로운 약속 방식을 위한 테이블 수정

-- 1. appointments 테이블에 마감시간 필드 추가
ALTER TABLE appointments 
ADD COLUMN deadline TIMESTAMP WITH TIME ZONE;

-- 2. method enum에 새로운 방식들 추가 (기존 제약조건 수정)
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_method_check;

ALTER TABLE appointments 
ADD CONSTRAINT appointments_method_check 
CHECK (method IN (
  'all-available', 
  'max-available', 
  'minimum-required', 
  'time-scheduling', 
  'recurring',
  'priority-voting',
  'time-period', 
  'budget-consideration'
));

-- 3. 우선순위 투표를 위한 테이블
CREATE TABLE IF NOT EXISTS priority_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voter_id UUID NOT NULL REFERENCES voters(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    vote_date DATE NOT NULL,
    priority INTEGER NOT NULL CHECK (priority >= 1 AND priority <= 3),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(voter_id, vote_date, priority)
);

-- 4. 시간대별 투표를 위한 테이블
CREATE TABLE IF NOT EXISTS time_period_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voter_id UUID NOT NULL REFERENCES voters(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    vote_date DATE NOT NULL,
    time_period VARCHAR(20) NOT NULL CHECK (time_period IN ('morning', 'afternoon', 'evening')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(voter_id, vote_date, time_period)
);

-- 5. 예산 고려 투표를 위한 테이블
CREATE TABLE IF NOT EXISTS budget_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voter_id UUID NOT NULL REFERENCES voters(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    vote_date DATE NOT NULL,
    budget_range VARCHAR(20) NOT NULL CHECK (budget_range IN ('under-10k', '10k-20k', '20k-30k', '30k-50k', 'over-50k')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(voter_id, vote_date, budget_range)
);

-- 6. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_priority_votes_appointment ON priority_votes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_time_period_votes_appointment ON time_period_votes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_budget_votes_appointment ON budget_votes(appointment_id);

-- 7. RLS 정책 추가
ALTER TABLE priority_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_period_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_votes ENABLE ROW LEVEL SECURITY;

-- 우선순위 투표 정책
CREATE POLICY "Anyone can view priority votes" ON priority_votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM appointments 
            WHERE id = priority_votes.appointment_id AND is_public = true
        )
    );

CREATE POLICY "Voters can insert priority votes" ON priority_votes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM voters v
            JOIN appointments a ON v.appointment_id = a.id
            WHERE v.id = voter_id 
            AND a.is_public = true 
            AND a.status = 'active'
        )
    );

-- 시간대별 투표 정책
CREATE POLICY "Anyone can view time period votes" ON time_period_votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM appointments 
            WHERE id = time_period_votes.appointment_id AND is_public = true
        )
    );

CREATE POLICY "Voters can insert time period votes" ON time_period_votes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM voters v
            JOIN appointments a ON v.appointment_id = a.id
            WHERE v.id = voter_id 
            AND a.is_public = true 
            AND a.status = 'active'
        )
    );

-- 예산 투표 정책
CREATE POLICY "Anyone can view budget votes" ON budget_votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM appointments 
            WHERE id = budget_votes.appointment_id AND is_public = true
        )
    );

CREATE POLICY "Voters can insert budget votes" ON budget_votes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM voters v
            JOIN appointments a ON v.appointment_id = a.id
            WHERE v.id = voter_id 
            AND a.is_public = true 
            AND a.status = 'active'
        )
    );
