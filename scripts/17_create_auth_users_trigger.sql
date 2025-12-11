-- 17단계: auth.users 생성 시 public.users 자동 생성 트리거
-- auth.users에 사용자가 생성될 때 자동으로 public.users에도 레코드 생성

-- 1. 트리거 함수 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_name VARCHAR(100);
BEGIN
    -- 기본 이름 생성 (email의 @ 앞부분 또는 "사용자")
    IF NEW.email IS NOT NULL THEN
        default_name := SPLIT_PART(NEW.email, '@', 1);
    ELSE
        default_name := '사용자';
    END IF;
    
    -- public.users에 사용자 레코드 자동 생성
    INSERT INTO public.users (auth_id, email, name)
    VALUES (NEW.id, NEW.email, default_name)
    ON CONFLICT (auth_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 트리거 생성 (auth.users에 INSERT 시 실행)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 3. 기존 auth.users 사용자들을 public.users에 마이그레이션 (한 번만 실행)
-- 이미 public.users에 있는 사용자는 제외하고 추가
INSERT INTO public.users (auth_id, email, name)
SELECT 
    au.id,
    au.email,
    COALESCE(
        SPLIT_PART(au.email, '@', 1),
        '사용자'
    ) as name
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users pu 
    WHERE pu.auth_id = au.id
)
ON CONFLICT (auth_id) DO NOTHING;

