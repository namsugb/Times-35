"use client"

import { Bell, BookOpen, CalendarDays, Clock, FolderHeart, Timer, UserPlus, Users } from "lucide-react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const methods = [
  { key: "all", icon: CalendarDays, color: "text-blue-500" },
  { key: "max", icon: Users, color: "text-green-500" },
  { key: "required", icon: Clock, color: "text-orange-500" },
  { key: "time", icon: Timer, color: "text-purple-500" },
]

export default function GuidePage() {
  const t = useTranslations("guidePage")

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-2 p-6">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <BookOpen className="h-8 w-8 text-blue-500" />
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {methods.map(({ key, icon: Icon, color }) => (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${color}`} />
                  {t(`methods.${key}.title`)}
                </CardTitle>
                <CardDescription>{t(`methods.${key}.description`)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">{t("completion")}</h4>
                  <p className="text-sm text-muted-foreground">{t(`methods.${key}.completion`)}</p>
                </div>
                {key === "time" && (
                  <div className="space-y-2">
                    <h4 className="font-medium">{t("features")}</h4>
                    <p className="text-sm text-muted-foreground">{t("methods.time.features")}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <h4 className="font-medium">{t("recommended")}</h4>
                  <p className="text-sm text-muted-foreground">{t(`methods.${key}.recommended`)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator />

        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <FolderHeart className="h-5 w-5 text-pink-500" />
            {t("groups.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("groups.description")}{" "}
            <span className="font-medium text-primary">({t("groups.loginRequired")})</span>
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserPlus className="h-4 w-4 text-pink-500" />
                  {t("groups.createTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>{t("groups.createBody")}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="h-4 w-4 text-pink-500" />
                  {t("groups.notifyTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>{t("groups.notifyBody")}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>{t("faq.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Q. {t("faq.anonymousQ")}</h4>
              <p className="text-sm text-muted-foreground">A. {t("faq.anonymousA")}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Q. {t("faq.editQ")}</h4>
              <p className="text-sm text-muted-foreground">A. {t("faq.editA")}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Q. {t("faq.kakaoQ")}</h4>
              <p className="text-sm text-muted-foreground">A. {t("faq.kakaoA")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
