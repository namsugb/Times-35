-- time_votes 테이블을 30분 단위 시간 선택을 위해 수정
-- vote_hour (INTEGER)를 vote_time (VARCHAR)으로 변경

-- 1. 기존 데이터 백업용 임시 테이블 생성
CREATE TABLE IF NOT EXISTS time_votes_backup AS 
SELECT * FROM time_votes;

-- 2. vote_hour 컬럼 삭제
ALTER TABLE time_votes 
DROP COLUMN IF EXISTS vote_hour;

-- 3. vote_time 컬럼 추가 (30분 단위 시간 저장)
ALTER TABLE time_votes 
ADD COLUMN vote_time VARCHAR(5) NOT NULL DEFAULT '00:00';

-- 4. UNIQUE 제약조건 재설정
ALTER TABLE time_votes 
DROP CONSTRAINT IF EXISTS time_votes_voter_id_vote_date_vote_hour_key;

ALTER TABLE time_votes 
ADD CONSTRAINT time_votes_voter_id_vote_date_vote_time_key 
UNIQUE(voter_id, vote_date, vote_time);

-- 5. vote_time 형식 체크 제약조건 추가 (HH:MM 형식)
ALTER TABLE time_votes 
ADD CONSTRAINT vote_time_format_check 
CHECK (vote_time ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$');

-- 6. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_time_votes_date_time 
ON time_votes(appointment_id, vote_date, vote_time);

-- 참고: 기존 데이터 복구가 필요한 경우
-- INSERT INTO time_votes (voter_id, appointment_id, vote_date, vote_time)
-- SELECT voter_id, appointment_id, vote_date, 
--        LPAD(vote_hour::text, 2, '0') || ':00' as vote_time
-- FROM time_votes_backup;

