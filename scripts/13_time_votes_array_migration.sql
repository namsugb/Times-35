-- time_votes 테이블을 날짜별 시간 배열 방식으로 마이그레이션
-- 기존: 각 시간마다 1행 → 변경: 날짜당 1행 (시간은 배열로 저장)

-- 1. 기존 테이블 백업
CREATE TABLE IF NOT EXISTS time_votes_backup_v2 AS 
SELECT * FROM time_votes;

-- 2. 기존 테이블 이름 변경 (롤백 대비)
ALTER TABLE time_votes RENAME TO time_votes_old;

-- 3. 새 테이블 생성 (날짜별 시간 배열)
CREATE TABLE time_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voter_id UUID NOT NULL REFERENCES voters(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    vote_date DATE NOT NULL,
    vote_times TEXT[] NOT NULL DEFAULT '{}',  -- ['09:00', '09:30', '10:00'] 형태
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(voter_id, appointment_id, vote_date)
);

-- 4. 기존 데이터 마이그레이션 (개별 행 → 배열로 집계)
INSERT INTO time_votes (voter_id, appointment_id, vote_date, vote_times, created_at)
SELECT 
    voter_id,
    appointment_id,
    vote_date,
    ARRAY_AGG(vote_time ORDER BY vote_time) as vote_times,
    MIN(created_at) as created_at
FROM time_votes_old
GROUP BY voter_id, appointment_id, vote_date;

-- 5. 인덱스 생성
CREATE INDEX idx_time_votes_appointment ON time_votes(appointment_id);
CREATE INDEX idx_time_votes_voter ON time_votes(voter_id);
CREATE INDEX idx_time_votes_date ON time_votes(vote_date);
CREATE INDEX idx_time_votes_appointment_date ON time_votes(appointment_id, vote_date);

-- 6. GIN 인덱스 (배열 검색 최적화)
CREATE INDEX idx_time_votes_times_gin ON time_votes USING GIN(vote_times);

-- 7. RLS 활성화
ALTER TABLE time_votes ENABLE ROW LEVEL SECURITY;

-- 8. RLS 정책 생성
CREATE POLICY "Anyone can view time votes" ON time_votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM appointments 
            WHERE id = time_votes.appointment_id AND is_public = true
        )
    );

CREATE POLICY "Voters can insert time votes" ON time_votes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM voters v
            JOIN appointments a ON v.appointment_id = a.id
            WHERE v.id = voter_id 
            AND a.id = appointment_id
            AND a.status = 'active'
        )
    );

CREATE POLICY "Voters can update own time votes" ON time_votes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM voters v
            WHERE v.id = voter_id
        )
    );

CREATE POLICY "Voters can delete own time votes" ON time_votes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM voters v
            WHERE v.id = voter_id
        )
    );

-- 9. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_time_votes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_time_votes_updated_at
    BEFORE UPDATE ON time_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_time_votes_updated_at();

-- 완료 후 기존 테이블 삭제 (필요시 주석 해제)
-- DROP TABLE time_votes_old;
-- DROP TABLE time_votes_backup_v2;

-- 마이그레이션 확인 쿼리
-- SELECT 
--     'old' as table_name, COUNT(*) as row_count FROM time_votes_old
-- UNION ALL
-- SELECT 
--     'new' as table_name, COUNT(*) as row_count FROM time_votes;

