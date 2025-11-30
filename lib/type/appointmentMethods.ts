import { CalendarIcon, UsersIcon, ClockIcon } from "lucide-react"


export const methods = [
  {
    id: "all-available",
    title: "모두",
    description: "모두가 가능한 날짜를 찾습니다.",
    icon: CalendarIcon,
    category: "기본",
    comingSoon: false,
  },
  {
    id: "max-available",
    title: "최대",
    description: "가장 많은 사람이 가능한 날짜를 제안합니다.",
    icon: UsersIcon,
    category: "기본",
    comingSoon: false,
  },
  {
    id: "minimum-required",
    title: "기준",
    description: "입력한 인원 이상이 가능한 날짜를 찾습니다.",
    icon: ClockIcon,
    category: "기본",
    comingSoon: false,
  },
  // {
  //   id: "time-scheduling",
  //   title: "약속 시간정하기",
  //   description: "날짜와 시간을 함께 선택하여 약속을 정합니다.",
  //   icon: TimerIcon,
  //   category: "기본",
  //   comingSoon: false,
  // },
]