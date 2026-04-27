-- 유용한 함수들 생성

-- 1. 약속 결과 계산 함수 (최대 다수 가능)
CREATE OR REPLACE FUNCTION get_max_available_dates(appointment_uuid UUID)
RETURNS TABLE(
    vote_date DATE,
    vote_count BIGINT,
    participation_rate NUMERIC,
    voter_names TEXT[]
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dv.vote_date,
        COUNT(*) as vote_count,
        ROUND(COUNT(*) * 100.0 / (
            SELECT COUNT(*) FROM voters WHERE appointment_id = appointment_uuid
        ), 1) as participation_rate,
        ARRAY_AGG(v.name ORDER BY v.name) as voter_names
    FROM date_votes dv
    JOIN voters v ON dv.voter_id = v.id
    WHERE dv.appointment_id = appointment_uuid
    GROUP BY dv.vote_date
    ORDER BY COUNT(*) DESC, dv.vote_date;
END;
$$;

-- 2. 시간별 최적 슬롯 찾기 함수
CREATE OR REPLACE FUNCTION get_optimal_time_slots(appointment_uuid UUID, slot_limit INTEGER DEFAULT 10)
RETURNS TABLE(
    vote_date DATE,
    vote_hour INTEGER,
    vote_count BIGINT,
    voter_names TEXT[]
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tv.vote_date,
        tv.vote_hour,
        COUNT(*) as vote_count,
        ARRAY_AGG(v.name ORDER BY v.name) as voter_names
    FROM time_votes tv
    JOIN voters v ON tv.voter_id = v.id
    WHERE tv.appointment_id = appointment_uuid
    GROUP BY tv.vote_date, tv.vote_hour
    ORDER BY COUNT(*) DESC, tv.vote_date, tv.vote_hour
    LIMIT slot_limit;
END;
$$;

-- 3. 요일별 투표 현황 함수
CREATE OR REPLACE FUNCTION get_weekday_availability(appointment_uuid UUID)
RETURNS TABLE(
    weekday INTEGER,
    weekday_name TEXT,
    vote_count BIGINT,
    participation_rate NUMERIC,
    voter_names TEXT[]
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wv.weekday,
        CASE wv.weekday 
            WHEN 0 THEN '일요일'
            WHEN 1 THEN '월요일'
            WHEN 2 THEN '화요일'
            WHEN 3 THEN '수요일'
            WHEN 4 THEN '목요일'
            WHEN 5 THEN '금요일'
            WHEN 6 THEN '토요일'
        END as weekday_name,
        COUNT(*) as vote_count,
        ROUND(COUNT(*) * 100.0 / (
            SELECT COUNT(*) FROM voters WHERE appointment_id = appointment_uuid
        ), 1) as participation_rate,
        ARRAY_AGG(v.name ORDER BY v.name) as voter_names
    FROM weekday_votes wv
    JOIN voters v ON wv.voter_id = v.id
    WHERE wv.appointment_id = appointment_uuid
    GROUP BY wv.weekday
    ORDER BY COUNT(*) DESC, wv.weekday;
END;
$$;

-- 4. 약속 통계 함수
CREATE OR REPLACE FUNCTION get_appointment_statistics(appointment_uuid UUID)
RETURNS TABLE(
    total_voters BIGINT,
    total_votes BIGINT,
    avg_votes_per_voter NUMERIC,
    most_popular_option TEXT,
    completion_rate NUMERIC
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    method_type VARCHAR(50);
    voter_count BIGINT;
BEGIN
    -- 약속 방식 확인
    SELECT method INTO method_type FROM appointments WHERE id = appointment_uuid;
    SELECT COUNT(*) INTO voter_count FROM voters WHERE appointment_id = appointment_uuid;
    
    IF method_type = 'recurring' THEN
        RETURN QUERY
        SELECT 
            voter_count as total_voters,
            COUNT(wv.id) as total_votes,
            CASE WHEN voter_count > 0 THEN ROUND(COUNT(wv.id)::NUMERIC / voter_count, 2) ELSE 0 END as avg_votes_per_voter,
            (SELECT CASE weekday 
                WHEN 0 THEN '일요일' WHEN 1 THEN '월요일' WHEN 2 THEN '화요일'
                WHEN 3 THEN '수요일' WHEN 4 THEN '목요일' WHEN 5 THEN '금요일'
                WHEN 6 THEN '토요일' END
             FROM weekday_votes 
             WHERE appointment_id = appointment_uuid 
             GROUP BY weekday 
             ORDER BY COUNT(*) DESC 
             LIMIT 1) as most_popular_option,
            CASE WHEN voter_count > 0 THEN ROUND(COUNT(DISTINCT wv.voter_id) * 100.0 / voter_count, 1) ELSE 0 END as completion_rate
        FROM weekday_votes wv
        WHERE wv.appointment_id = appointment_uuid;
    ELSIF method_type = 'time-scheduling' THEN
        RETURN QUERY
        SELECT 
            voter_count as total_voters,
            COUNT(tv.id) as total_votes,
            CASE WHEN voter_count > 0 THEN ROUND(COUNT(tv.id)::NUMERIC / voter_count, 2) ELSE 0 END as avg_votes_per_voter,
            (SELECT tv.vote_date::TEXT || ' ' || tv.vote_hour::TEXT || '시'
             FROM time_votes tv
             WHERE appointment_id = appointment_uuid 
             GROUP BY tv.vote_date, tv.vote_hour
             ORDER BY COUNT(*) DESC 
             LIMIT 1) as most_popular_option,
            CASE WHEN voter_count > 0 THEN ROUND(COUNT(DISTINCT tv.voter_id) * 100.0 / voter_count, 1) ELSE 0 END as completion_rate
        FROM time_votes tv
        WHERE tv.appointment_id = appointment_uuid;
    ELSE
        RETURN QUERY
        SELECT 
            voter_count as total_voters,
            COUNT(dv.id) as total_votes,
            CASE WHEN voter_count > 0 THEN ROUND(COUNT(dv.id)::NUMERIC / voter_count, 2) ELSE 0 END as avg_votes_per_voter,
            (SELECT dv.vote_date::TEXT
             FROM date_votes dv
             WHERE appointment_id = appointment_uuid 
             GROUP BY dv.vote_date
             ORDER BY COUNT(*) DESC 
             LIMIT 1) as most_popular_option,
            CASE WHEN voter_count > 0 THEN ROUND(COUNT(DISTINCT dv.voter_id) * 100.0 / voter_count, 1) ELSE 0 END as completion_rate
        FROM date_votes dv
        WHERE dv.appointment_id = appointment_uuid;
    END IF;
END;
$$;
