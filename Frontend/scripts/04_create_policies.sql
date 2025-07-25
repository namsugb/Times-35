-- RLS 정책 생성

-- ================================
-- USERS 테이블 정책
-- ================================

-- 사용자는 자신의 정보만 조회 가능
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = auth_id);

-- 사용자는 자신의 정보만 수정 가능
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = auth_id);

-- 사용자는 자신의 계정만 삭제 가능
CREATE POLICY "Users can delete own profile" ON users
    FOR DELETE USING (auth.uid() = auth_id);

-- 새 사용자 생성 허용
CREATE POLICY "Enable insert for authenticated users" ON users
    FOR INSERT WITH CHECK (auth.uid() = auth_id);

-- ================================
-- APPOINTMENTS 테이블 정책
-- ================================

-- 모든 사람이 공개 약속 조회 가능 (share_token으로 접근)
CREATE POLICY "Anyone can view public appointments" ON appointments
    FOR SELECT USING (is_public = true);

-- 인증된 사용자는 자신이 만든 약속 조회 가능
CREATE POLICY "Users can view own appointments" ON appointments
    FOR SELECT USING (auth.uid() = creator_auth_id);

-- 인증된 사용자만 약속 생성 가능
CREATE POLICY "Authenticated users can create appointments" ON appointments
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        (creator_auth_id = auth.uid() OR creator_auth_id IS NULL)
    );

-- 약속 생성자만 수정 가능
CREATE POLICY "Creators can update own appointments" ON appointments
    FOR UPDATE USING (
        auth.uid() = creator_auth_id OR 
        (creator_auth_id IS NULL AND auth.uid() IS NOT NULL)
    );

-- 약속 생성자만 삭제 가능
CREATE POLICY "Creators can delete own appointments" ON appointments
    FOR DELETE USING (auth.uid() = creator_auth_id);

-- ================================
-- VOTERS 테이블 정책
-- ================================

-- 모든 사람이 투표자 목록 조회 가능 (약속이 공개인 경우)
CREATE POLICY "Anyone can view voters for public appointments" ON voters
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM appointments 
            WHERE id = voters.appointment_id AND is_public = true
        )
    );

-- 모든 사람이 투표 가능 (익명 투표 허용)
CREATE POLICY "Anyone can vote" ON voters
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM appointments 
            WHERE id = appointment_id AND is_public = true AND status = 'active'
        )
    );

-- 투표자는 자신의 투표만 수정 가능 (세션 기반)
CREATE POLICY "Voters can update own votes" ON voters
    FOR UPDATE USING (
        session_id = current_setting('request.headers')::json->>'x-session-id' OR
        auth.uid() IS NOT NULL
    );

-- 투표자는 자신의 투표만 삭제 가능
CREATE POLICY "Voters can delete own votes" ON voters
    FOR DELETE USING (
        session_id = current_setting('request.headers')::json->>'x-session-id' OR
        auth.uid() IS NOT NULL
    );

-- ================================
-- DATE_VOTES 테이블 정책
-- ================================

-- 모든 사람이 날짜 투표 결과 조회 가능
CREATE POLICY "Anyone can view date votes" ON date_votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM appointments 
            WHERE id = date_votes.appointment_id AND is_public = true
        )
    );

-- 투표자만 날짜 투표 가능
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

-- 투표자는 자신의 날짜 투표만 수정/삭제 가능
CREATE POLICY "Voters can modify own date votes" ON date_votes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM voters v
            WHERE v.id = voter_id 
            AND (
                v.session_id = current_setting('request.headers')::json->>'x-session-id' OR
                auth.uid() IS NOT NULL
            )
        )
    );

-- ================================
-- TIME_VOTES 테이블 정책
-- ================================

-- 모든 사람이 시간 투표 결과 조회 가능
CREATE POLICY "Anyone can view time votes" ON time_votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM appointments 
            WHERE id = time_votes.appointment_id AND is_public = true
        )
    );

-- 투표자만 시간 투표 가능
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

-- 투표자는 자신의 시간 투표만 수정/삭제 가능
CREATE POLICY "Voters can modify own time votes" ON time_votes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM voters v
            WHERE v.id = voter_id 
            AND (
                v.session_id = current_setting('request.headers')::json->>'x-session-id' OR
                auth.uid() IS NOT NULL
            )
        )
    );

-- ================================
-- WEEKDAY_VOTES 테이블 정책
-- ================================

-- 모든 사람이 요일 투표 결과 조회 가능
CREATE POLICY "Anyone can view weekday votes" ON weekday_votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM appointments 
            WHERE id = weekday_votes.appointment_id AND is_public = true
        )
    );

-- 투표자만 요일 투표 가능
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

-- 투표자는 자신의 요일 투표만 수정/삭제 가능
CREATE POLICY "Voters can modify own weekday votes" ON weekday_votes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM voters v
            WHERE v.id = voter_id 
            AND (
                v.session_id = current_setting('request.headers')::json->>'x-session-id' OR
                auth.uid() IS NOT NULL
            )
        )
    );

-- ================================
-- FINAL_APPOINTMENTS 테이블 정책
-- ================================

-- 모든 사람이 최종 결정 조회 가능
CREATE POLICY "Anyone can view final appointments" ON final_appointments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM appointments 
            WHERE id = final_appointments.appointment_id AND is_public = true
        )
    );

-- 약속 생성자만 최종 결정 가능
CREATE POLICY "Creators can decide final appointments" ON final_appointments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM appointments 
            WHERE id = appointment_id 
            AND creator_auth_id = auth.uid()
        )
    );

-- 약속 생성자만 최종 결정 수정 가능
CREATE POLICY "Creators can update final appointments" ON final_appointments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM appointments 
            WHERE id = appointment_id 
            AND creator_auth_id = auth.uid()
        )
    );
