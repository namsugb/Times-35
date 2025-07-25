-- 3단계: 인덱스 생성 (성능 최적화)

-- 약속 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_appointments_share_token ON appointments(share_token);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_method ON appointments(method);

-- 투표자 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_voters_appointment ON voters(appointment_id);
CREATE INDEX IF NOT EXISTS idx_voters_session ON voters(session_id);

-- 날짜 투표 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_date_votes_appointment ON date_votes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_date_votes_date ON date_votes(vote_date);

-- 시간 투표 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_time_votes_appointment ON time_votes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_time_votes_date_hour ON time_votes(vote_date, vote_hour);

-- 요일 투표 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_weekday_votes_appointment ON weekday_votes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_weekday_votes_weekday ON weekday_votes(weekday);
