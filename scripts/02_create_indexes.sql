-- 성능 최적화를 위한 인덱스 생성

-- 약속 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_appointments_share_token ON appointments(share_token);
CREATE INDEX IF NOT EXISTS idx_appointments_creator_auth_id ON appointments(creator_auth_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_method ON appointments(method);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at DESC);

-- 투표자 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_voters_appointment ON voters(appointment_id);
CREATE INDEX IF NOT EXISTS idx_voters_name ON voters(appointment_id, name);
CREATE INDEX IF NOT EXISTS idx_voters_session ON voters(session_id);

-- 날짜 투표 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_date_votes_appointment ON date_votes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_date_votes_date ON date_votes(vote_date);
CREATE INDEX IF NOT EXISTS idx_date_votes_appointment_date ON date_votes(appointment_id, vote_date);

-- 시간 투표 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_time_votes_appointment ON time_votes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_time_votes_date_hour ON time_votes(vote_date, vote_hour);
CREATE INDEX IF NOT EXISTS idx_time_votes_appointment_date ON time_votes(appointment_id, vote_date);

-- 요일 투표 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_weekday_votes_appointment ON weekday_votes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_weekday_votes_weekday ON weekday_votes(weekday);
CREATE INDEX IF NOT EXISTS idx_weekday_votes_appointment_weekday ON weekday_votes(appointment_id, weekday);

-- 최종 약속 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_final_appointments_appointment ON final_appointments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_final_appointments_date ON final_appointments(final_date);
