import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
    try {
        const { name, email, category, content } = await request.json()



        const feedback = {
            name: name || null,
            email: email || null,
            category: category || null,
            content
        }

        const { data, error } = await supabase.from("feedback").insert(feedback)

        if (error) {
            console.error("Failed to insert feedback:", error)
            return NextResponse.json({ success: false, error: "Failed to submit feedback" }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: "Feedback submitted successfully" }, { status: 200 })
    } catch (error) {
        console.error("Error submitting feedback:", error)
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
    }
}