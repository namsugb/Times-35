-- 건의함 테이블 생성
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('suggestion', 'bug', 'general')),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    name VARCHAR(100),
    email VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
    admin_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE
);

-- 인덱스 추가
CREATE INDEX idx_feedback_type ON feedback(type);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);
CREATE INDEX idx_feedback_email ON feedback(email);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- 관리자 응답이 추가되었을 때 responded_at 업데이트
    IF OLD.admin_response IS DISTINCT FROM NEW.admin_response AND NEW.admin_response IS NOT NULL THEN
        NEW.responded_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_update_feedback_updated_at
    BEFORE UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_feedback_updated_at();

-- RLS (Row Level Security) 설정
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 피드백을 생성할 수 있도록 허용
CREATE POLICY "Anyone can create feedback" ON feedback
    FOR INSERT WITH CHECK (true);

-- 이메일이 있는 경우 본인의 피드백만 조회 가능 (선택적)
CREATE POLICY "Users can view own feedback" ON feedback
    FOR SELECT USING (
        email IS NULL OR 
        email = current_setting('request.jwt.claims', true)::json->>'email'
    );

-- 관리자만 모든 피드백 조회 및 수정 가능 (추후 관리자 시스템 구축 시)
-- CREATE POLICY "Admins can manage all feedback" ON feedback
--     FOR ALL USING (
--         current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
--     );

-- 코멘트 추가
COMMENT ON TABLE feedback IS '사용자 건의사항 및 피드백을 저장하는 테이블';
COMMENT ON COLUMN feedback.id IS '고유 식별자';
COMMENT ON COLUMN feedback.type IS '피드백 유형: suggestion(기능제안), bug(버그신고), general(일반의견)';
COMMENT ON COLUMN feedback.title IS '피드백 제목';
COMMENT ON COLUMN feedback.content IS '피드백 내용';
COMMENT ON COLUMN feedback.name IS '사용자 이름 (선택사항)';
COMMENT ON COLUMN feedback.email IS '사용자 이메일 (선택사항, 답변 발송용)';
COMMENT ON COLUMN feedback.status IS '처리 상태: pending(대기), in_progress(처리중), completed(완료), rejected(거절)';
COMMENT ON COLUMN feedback.admin_response IS '관리자 응답';
COMMENT ON COLUMN feedback.created_at IS '생성 시간';
COMMENT ON COLUMN feedback.updated_at IS '수정 시간';
COMMENT ON COLUMN feedback.responded_at IS '관리자 응답 시간';

-- 초기 테스트 데이터 (선택사항)
-- INSERT INTO feedback (type, title, content, name, email) VALUES
-- ('suggestion', '시간대 선택 기능 추가 요청', '약속 잡을 때 오전/오후/저녁 등 시간대도 함께 선택할 수 있으면 좋겠습니다.', '김철수', 'test@example.com'),
-- ('bug', '모바일에서 날짜 선택 오류', '아이폰 사파리에서 날짜를 선택할 때 간혹 선택이 안 되는 경우가 있습니다.', '이영희', 'user@test.com'),
-- ('general', '서비스 정말 좋아요!', '친구들과 약속 잡을 때 정말 편리하게 사용하고 있습니다. 감사합니다.', '박민수', NULL);
