"use client"

// 클라이언트 사이드 세션 관리
export class SessionManager {
  private static SESSION_KEY = "appointment_session_id"

  static getSessionId(): string {
    if (typeof window === "undefined") return ""

    let sessionId = localStorage.getItem(this.SESSION_KEY)
    if (!sessionId) {
      sessionId = this.generateSessionId()
      localStorage.setItem(this.SESSION_KEY, sessionId)
    }
    return sessionId
  }

  static generateSessionId(): string {
    return "session_" + Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  static clearSession(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.SESSION_KEY)
    }
  }

  static setVoterInfo(appointmentId: string, voterName: string, voterId: string): void {
    if (typeof window === "undefined") return

    const key = `voter_${appointmentId}`
    const voterInfo = {
      name: voterName,
      voterId: voterId,
      timestamp: Date.now(),
    }
    localStorage.setItem(key, JSON.stringify(voterInfo))
  }

  static getVoterInfo(appointmentId: string): { name: string; voterId: string } | null {
    if (typeof window === "undefined") return null

    const key = `voter_${appointmentId}`
    const stored = localStorage.getItem(key)
    if (!stored) return null

    try {
      const voterInfo = JSON.parse(stored)
      // 24시간 후 만료
      if (Date.now() - voterInfo.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(key)
        return null
      }
      return { name: voterInfo.name, voterId: voterInfo.voterId }
    } catch {
      return null
    }
  }
}
