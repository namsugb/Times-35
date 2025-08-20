import axios from "axios"


export const submitFeedback = async (name: string, email: string, category: string, content: string) => {
    try {
        const response = await axios.post("api/feedback", {
            name,
            email,
            category,
            content
        })
        return response.data
    } catch (error) {
        console.error("Feedback submission failed:", error)
        return { success: false, error: "Failed to submit feedback" }
    }
}
