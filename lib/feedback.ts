export const submitFeedback = async (name: string, email: string, category: string, content: string) => {
  try {
    const { supabase } = await import("./supabase")
    const type = mapCategoryToFeedbackType(category)
    const title = content.trim().slice(0, 80) || "Feedback"

    const { error } = await supabase.from("feedback").insert({
      type,
      title,
      content,
      name: name || null,
      email: email || null,
    })

    if (error) {
      throw error
    }

    return { success: true, message: "Feedback submitted successfully" }
  } catch (error) {
    console.error("Feedback submission failed:", error)
    return { success: false, error: "Failed to submit feedback" }
  }
}

function mapCategoryToFeedbackType(category: string) {
  switch (category) {
    case "bug":
      return "bug"
    case "feature":
    case "improvement":
      return "suggestion"
    default:
      return "general"
  }
}
