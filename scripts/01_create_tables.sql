-- 1단계: 테이블 생성 (이 스크립트를 먼저 실행)
-- Supabase 약속 스케줄러 데이터베이스 스키마 생성

-- 1. 사용자 테이블 (선택적 - 등록 사용자용)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 약속 테이블 (메인 테이블)
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    creator_auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    method VARCHAR(50) NOT NULL CHECK (method IN ('all-available', 'max-available', 'minimum-required', 'time-scheduling', 'recurring')),
    required_participants INTEGER DEFAULT 1,
    weekly_meetings INTEGER DEFAULT 1,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    share_token VARCHAR(100) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64url'),
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 투표자 테이블
CREATE TABLE IF NOT EXISTS voters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(appointment_id, name)
);

-- 4. 날짜별 투표 테이블
CREATE TABLE IF NOT EXISTS date_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voter_id UUID NOT NULL REFERENCES voters(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    vote_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(voter_id, vote_date)
);

-- 5. 시간별 투표 테이블 (time-scheduling 방식용)
CREATE TABLE IF NOT EXISTS time_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voter_id UUID NOT NULL REFERENCES voters(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    vote_date DATE NOT NULL,
    vote_hour INTEGER NOT NULL CHECK (vote_hour >= 0 AND vote_hour <= 23),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(voter_id, vote_date, vote_hour)
);

-- 6. 요일별 투표 테이블 (recurring 방식용)
CREATE TABLE IF NOT EXISTS weekday_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voter_id UUID NOT NULL REFERENCES voters(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(voter_id, weekday)
);

-- 7. 최종 결정된 약속 테이블
CREATE TABLE IF NOT EXISTS final_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    final_date DATE,
    final_time INTEGER CHECK (final_time >= 0 AND final_time <= 23),
    final_weekday INTEGER CHECK (final_weekday >= 0 AND final_weekday <= 6),
    participant_count INTEGER NOT NULL,
    decided_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    decided_by UUID REFERENCES auth.users(id)
);
