"use client"

import { useState } from "react"
import { Mailbox, Send } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { submitFeedback } from "@/lib/feedback"

export default function FeedbackPage() {
  const t = useTranslations("feedbackPage")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [category, setCategory] = useState("")
  const [content, setContent] = useState("")

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await submitFeedback(name, email, category, content)
      if (response.success) {
        setName("")
        setEmail("")
        setCategory("")
        setContent("")
        toast.success(t("successTitle"), {
          description: t("successDescription"),
        })
      } else {
        toast.error(t("failedTitle"), {
          description: t("failedDescription"),
        })
      }
    } catch {
      toast.error(t("failedTitle"), {
        description: t("failedDescription"),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-2 p-6">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <Mailbox className="h-8 w-8 text-blue-500" />
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("formTitle")}</CardTitle>
            <CardDescription>{t("formDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("name")}</Label>
                  <Input
                    id="name"
                    placeholder={t("namePlaceholder")}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input
                    id="email"
                    placeholder={t("emailPlaceholder")}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">{t("category")}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("categoryPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">{t("categories.bug")}</SelectItem>
                    <SelectItem value="feature">{t("categories.feature")}</SelectItem>
                    <SelectItem value="improvement">{t("categories.improvement")}</SelectItem>
                    <SelectItem value="ui">{t("categories.ui")}</SelectItem>
                    <SelectItem value="other">{t("categories.other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">{t("message")}</Label>
                <Textarea
                  id="message"
                  placeholder={t("messagePlaceholder")}
                  rows={6}
                  required
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                    {t("submitting")}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {t("submit")}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("guideTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">{t("guide.bugTitle")}</h4>
              <p className="text-sm text-muted-foreground">{t("guide.bugBody")}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600">{t("guide.featureTitle")}</h4>
              <p className="text-sm text-muted-foreground">{t("guide.featureBody")}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-purple-600">{t("guide.improvementTitle")}</h4>
              <p className="text-sm text-muted-foreground">{t("guide.improvementBody")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
