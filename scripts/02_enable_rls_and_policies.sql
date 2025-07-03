-- 2단계: RLS 활성화 및 정책 설정 (테이블 생성 후 실행)

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekday_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE final_appointments ENABLE ROW LEVEL SECURITY;

-- 약속 테이블 정책
CREATE POLICY "Anyone can view public appointments" ON appointments
    FOR SELECT USING (is_public = true);

CREATE POLICY "Anyone can create appointments" ON appointments
    FOR INSERT WITH CHECK (true);

-- 투표자 테이블 정책
CREATE POLICY "Anyone can view voters for public appointments" ON voters
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM appointments 
            WHERE id = voters.appointment_id AND is_public = true
        )
    );

CREATE POLICY "Anyone can vote" ON voters
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM appointments 
            WHERE id = appointment_id AND is_public = true AND status = 'active'
        )
    );

-- 날짜 투표 정책
CREATE POLICY "Anyone can view date votes" ON date_votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM appointments 
            WHERE id = date_votes.appointment_id AND is_public = true
        )
    );

CREATE POLICY "Voters can insert date votes" ON date_votes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM voters v
            JOIN appointments a ON v.appointment_id = a.id
            WHERE v.id = voter_id 
            AND a.is_public = true 
            AND a.status = 'active'
        )
    );

-- 시간 투표 정책
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
            AND a.is_public = true 
            AND a.status = 'active'
        )
    );

-- 요일 투표 정책
CREATE POLICY "Anyone can view weekday votes" ON weekday_votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM appointments 
            WHERE id = weekday_votes.appointment_id AND is_public = true
        )
    );

CREATE POLICY "Voters can insert weekday votes" ON weekday_votes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM voters v
            JOIN appointments a ON v.appointment_id = a.id
            WHERE v.id = voter_id 
            AND a.is_public = true 
            AND a.status = 'active'
        )
    );
