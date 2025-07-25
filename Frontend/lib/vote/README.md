# 투표 완료 체크 기능

이 모듈은 다양한 투표 방식에 따른 투표 완료 상태를 체크하는 기능을 제공합니다.

## 기능 개요

주석에 명시된 기능을 구현한 코드로, 다음과 같은 투표 방식별 완료 조건을 체크합니다:

- **all-available, max-available, recurring**: 참여인원 = 투표인원 시 완료
- **minimum-required**: 기준인원 이상 투표받은 날이 생길시 완료
- **time-scheduling**: 참여인원 = 투표인원 시 완료

## 주요 함수

### `checkVotingCompletion(appointmentId: string)`

투표 완료 상태를 체크하는 메인 함수입니다.

**매개변수:**
- `appointmentId`: 체크할 약속의 ID

**반환값:**
```typescript
interface VotingCompletionResult {
  isComplete: boolean        // 투표 완료 여부
  reason?: string           // 완료/미완료 이유
  completedDate?: string    // 완료된 날짜 (minimum-required 방식에서만)
  completedTime?: number    // 완료된 시간 (향후 확장용)
  completedWeekday?: number // 완료된 요일 (향후 확장용)
  participantCount?: number // 현재 참여자 수
}
```

### `checkAndUpdateVotingCompletion(appointmentId: string)`

투표 완료 체크와 함께 약속 상태를 업데이트하는 함수입니다.

**매개변수:**
- `appointmentId`: 체크할 약속의 ID

**반환값:**
- `VotingCompletionResult` 객체

## 사용 예시

### 1. 직접 함수 호출

```typescript
import { checkVotingCompletion, checkAndUpdateVotingCompletion } from "@/lib/vote/checkcomplete"

// 투표 완료 체크만 수행
const result = await checkVotingCompletion("appointment-id")
console.log(result.isComplete) // true/false

// 투표 완료 체크 및 상태 업데이트
const resultWithUpdate = await checkAndUpdateVotingCompletion("appointment-id")
if (resultWithUpdate.isComplete) {
  console.log("투표가 완료되었습니다!")
  console.log("완료 이유:", resultWithUpdate.reason)
}
```

### 2. API 호출

```typescript
// POST 요청 - 투표 완료 체크 및 상태 업데이트
const postResponse = await fetch(`/api/check-completion/${appointmentId}`, {
  method: "POST",
})
const result = await postResponse.json()

// GET 요청 - 투표 완료 체크만 (상태 업데이트 없음)
const getResponse = await fetch(`/api/check-completion/${appointmentId}`, {
  method: "GET",
})
const result = await getResponse.json()
```

## 투표 방식별 완료 조건

| 투표 방식 | 완료 조건 | 설명 |
|-----------|-----------|------|
| all-available | 참여인원 = 투표인원 | 모든 참여자가 투표하면 완료 |
| max-available | 참여인원 = 투표인원 | 모든 참여자가 투표하면 완료 |
| minimum-required | 기준인원 이상 투표받은 날이 생길시 | 어느 날짜든 기준인원 이상이 투표하면 완료 |
| time-scheduling | 참여인원 = 투표인원 | 모든 참여자가 투표하면 완료 |
| recurring | 참여인원 = 투표인원 | 모든 참여자가 투표하면 완료 |

## API 엔드포인트

### POST `/api/check-completion/[appointmentId]`

투표 완료 체크 및 약속 상태 업데이트를 수행합니다.

**응답 예시:**
```json
{
  "isComplete": true,
  "reason": "모든 참여자(5명)가 투표를 완료했습니다.",
  "participantCount": 5
}
```

### GET `/api/check-completion/[appointmentId]`

투표 완료 체크만 수행합니다 (상태 업데이트 없음).

**응답 예시:**
```json
{
  "isComplete": false,
  "reason": "아직 2명이 더 투표해야 합니다.",
  "participantCount": 3
}
```

## 에러 처리

모든 함수는 에러가 발생할 경우 적절한 에러 메시지와 함께 예외를 발생시킵니다:

- 약속을 찾을 수 없는 경우
- 투표자 정보 조회 실패
- 지원하지 않는 투표 방식
- 데이터베이스 연결 오류

## 파일 구조

```
lib/vote/
├── checkcomplete.ts      # 메인 기능 구현
├── checkcomplete.test.ts # 사용 예시 및 테스트
└── README.md            # 이 문서
```

## 의존성

- `@/lib/supabase`: Supabase 클라이언트
- `@/lib/supabase` 타입 정의: 데이터베이스 스키마 타입 