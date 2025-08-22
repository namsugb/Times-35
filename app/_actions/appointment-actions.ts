"use server"

import { createAppointment } from "@/lib/database"

export async function createAppointmentAction(appointmentData: any) {
    try {
        const appointment = await createAppointment(appointmentData)
        return { success: true, data: appointment }
    } catch (error: any) {
        console.error("약속 생성 실패:", error)
        return {
            success: false,
            error: error.message || "약속 생성에 실패했습니다"
        }
    }
}
