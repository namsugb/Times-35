-- 약속 테이블에 생성자 연락처 필드 추가
ALTER TABLE appointments 
ADD COLUMN creator_phone VARCHAR(20),
ADD COLUMN notification_sent BOOLEAN DEFAULT FALSE;

-- 인덱스 추가
CREATE INDEX idx_appointments_creator_phone ON appointments(creator_phone);
CREATE INDEX idx_appointments_notification_sent ON appointments(notification_sent);

-- 투표 완료 체크 함수 생성
CREATE OR REPLACE FUNCTION check_voting_completion()
RETURNS TRIGGER AS $$
DECLARE
    appointment_record RECORD;
    total_voters INTEGER;
    required_participants INTEGER;
BEGIN
    -- 약속 정보 조회
    SELECT * INTO appointment_record 
    FROM appointments 
    WHERE id = NEW.appointment_id;
    
    -- 현재 투표자 수 조회
    SELECT COUNT(DISTINCT id) INTO total_voters
    FROM voters 
    WHERE appointment_id = NEW.appointment_id;
    
    -- 필요한 참여자 수
    required_participants := appointment_record.required_participants;
    
    -- 모든 인원이 투표했고 아직 알림을 보내지 않았다면
    IF total_voters >= required_participants AND NOT appointment_record.notification_sent THEN
        -- 알림 발송 플래그 업데이트
        UPDATE appointments 
        SET notification_sent = TRUE 
        WHERE id = NEW.appointment_id;
        
        -- 여기서 실제로는 외부 API 호출을 위한 큐에 작업을 추가하거나
        -- 별도의 알림 테이블에 레코드를 삽입할 수 있습니다
        INSERT INTO notification_queue (appointment_id, phone_number, message_type, created_at)
        VALUES (NEW.appointment_id, appointment_record.creator_phone, 'voting_complete', NOW());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 알림 큐 테이블 생성
CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_check_voting_completion ON voters;
CREATE TRIGGER trigger_check_voting_completion
    AFTER INSERT ON voters
    FOR EACH ROW
    EXECUTE FUNCTION check_voting_completion();
