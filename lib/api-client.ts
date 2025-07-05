// API 클라이언트 래퍼
export class ApiClient {
  private static baseUrl =
    process.env.NODE_ENV === "production"
      ? "https://your-actual-domain.vercel.app" // 실제 배포 URL로 변경
      : "http://localhost:3000"

  static async getAppointment(token: string) {
    const response = await fetch(`${this.baseUrl}/api/appointments/${token}`)
    if (!response.ok) {
      throw new Error("약속을 불러올 수 없습니다")
    }
    return response.json()
  }

  static async getResults(token: string) {
    const response = await fetch(`${this.baseUrl}/api/results/${token}`)
    if (!response.ok) {
      throw new Error("결과를 불러올 수 없습니다")
    }
    return response.json()
  }

  static async createVote(data: any) {
    const response = await fetch(`${this.baseUrl}/api/votes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error("투표에 실패했습니다")
    }
    return response.json()
  }
}
