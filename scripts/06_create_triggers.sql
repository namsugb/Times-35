-- 트리거 함수 및 트리거 생성

-- 1. updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. updated_at 트리거 적용
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. 중복 투표 방지 함수
CREATE OR REPLACE FUNCTION prevent_duplicate_voter()
RETURNS TRIGGER AS $$
BEGIN
    -- 같은 약속에서 같은 이름으로 이미 투표했는지 확인
    IF EXISTS (
        SELECT 1 FROM voters 
        WHERE appointment_id = NEW.appointment_id 
        AND LOWER(TRIM(name)) = LOWER(TRIM(NEW.name))
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
    ) THEN
        RAISE EXCEPTION '이미 해당 이름으로 투표가 완료되었습니다: %', NEW.name;
    END IF;
    
    -- 이름 정규화
    NEW.name = TRIM(NEW.name);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 중복 투표 방지 트리거 적용
CREATE TRIGGER prevent_duplicate_voter_trigger
    BEFORE INSERT OR UPDATE ON voters
    FOR EACH ROW EXECUTE FUNCTION prevent_duplicate_voter();

-- 5. 약속 상태 자동 업데이트 함수
CREATE OR REPLACE FUNCTION auto_update_appointment_status()
RETURNS TRIGGER AS $$
BEGIN
    -- 최종 약속이 결정되면 상태를 'completed'로 변경
    UPDATE appointments 
    SET status = 'completed', updated_at = NOW()
    WHERE id = NEW.appointment_id AND status = 'active';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 최종 약속 결정 시 상태 업데이트 트리거
CREATE TRIGGER auto_update_status_on_final_appointment
    AFTER INSERT ON final_appointments
    FOR EACH ROW EXECUTE FUNCTION auto_update_appointment_status();
