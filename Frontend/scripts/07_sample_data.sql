-- 샘플 데이터 삽입 (테스트용)

-- 1. 샘플 약속 생성
INSERT INTO appointments (
    title, 
    description, 
    method, 
    required_participants, 
    start_date, 
    end_date,
    share_token
) VALUES 
(
    '팀 프로젝트 미팅',
    '월말 프로젝트 진행 상황 점검 및 다음 단계 논의',
    'max-available',
    4,
    '2024-07-01',
    '2024-07-31',
    'team-meeting-2024-07'
),
(
    '알고리즘 스터디',
    '코딩 테스트 대비 알고리즘 스터디 모임',
    'time-scheduling',
    3,
    '2024-07-15',
    '2024-07-25',
    'algo-study-july-2024'
),
(
    '주간 팀 회의',
    '매주 진행되는 정기 팀 회의',
    'recurring',
    5,
    NULL,
    NULL,
    'weekly-team-meeting'
);

-- 2. 샘플 투표자 생성 (첫 번째 약속용)
DO $$
DECLARE
    appointment_uuid UUID;
    voter_names TEXT[] := ARRAY['김민준', '이서연', '박지훈', '최예은', '정도윤', '한지우', '윤서아'];
    voter_name TEXT;
    voter_uuid UUID;
    sample_dates DATE[] := ARRAY['2024-07-20', '2024-07-21', '2024-07-22', '2024-07-23', '2024-07-24'];
    sample_date DATE;
BEGIN
    -- 첫 번째 약속 ID 가져오기
    SELECT id INTO appointment_uuid FROM appointments WHERE share_token = 'team-meeting-2024-07';
    
    -- 각 투표자에 대해
    FOREACH voter_name IN ARRAY voter_names
    LOOP
        -- 투표자 생성
        INSERT INTO voters (appointment_id, name, session_id)
        VALUES (appointment_uuid, voter_name, 'session_' || voter_name)
        RETURNING id INTO voter_uuid;
        
        -- 랜덤하게 2-4개 날짜 선택
        FOR i IN 1..(2 + floor(random() * 3)::int)
        LOOP
            sample_date := sample_dates[1 + floor(random() * array_length(sample_dates, 1))::int];
            
            -- 중복 방지하여 날짜 투표 삽입
            INSERT INTO date_votes (voter_id, appointment_id, vote_date)
            VALUES (voter_uuid, appointment_uuid, sample_date)
            ON CONFLICT (voter_id, vote_date) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- 3. 시간 투표 샘플 데이터 (두 번째 약속용)
DO $$
DECLARE
    appointment_uuid UUID;
    voter_names TEXT[] := ARRAY['김민준', '이서연', '박지훈'];
    voter_name TEXT;
    voter_uuid UUID;
    sample_date DATE;
    sample_hour INTEGER;
BEGIN
    -- 두 번째 약속 ID 가져오기
    SELECT id INTO appointment_uuid FROM appointments WHERE share_token = 'algo-study-july-2024';
    
    -- 각 투표자에 대해
    FOREACH voter_name IN ARRAY voter_names
    LOOP
        -- 투표자 생성
        INSERT INTO voters (appointment_id, name, session_id)
        VALUES (appointment_uuid, voter_name, 'session_' || voter_name)
        RETURNING id INTO voter_uuid;
        
        -- 2024-07-20, 2024-07-21에 대해 시간 투표
        FOR date_offset IN 0..1
        LOOP
            sample_date := '2024-07-20'::date + date_offset;
            
            -- 각 날짜에 대해 2-5개 시간 선택
            FOR i IN 1..(2 + floor(random() * 4)::int)
            LOOP
                sample_hour := 9 + floor(random() * 10)::int; -- 9시-18시 중 선택
                
                -- 중복 방지하여 시간 투표 삽입
                INSERT INTO time_votes (voter_id, appointment_id, vote_date, vote_hour)
                VALUES (voter_uuid, appointment_uuid, sample_date, sample_hour)
                ON CONFLICT (voter_id, vote_date, vote_hour) DO NOTHING;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;
