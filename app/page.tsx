import { Footer } from "@/components/footer"
import { AppointmentScheduler } from "./_components/appointment-scheduler"

export default function HomePage() {

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 헤더 섹션 */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-2 md:text-4xl">만날래말래</h1>
        <p className="text-muted-foreground text-lg mobile-break">
          여러 사람과 만나기 좋은 날짜를 간편하게 정해보세요.
        </p>
      </div>

      {/* 약속 스케줄러 컴포넌트 */}
      <AppointmentScheduler />

      <Footer />
    </div>
  )
}
