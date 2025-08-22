"use client"

import { ReactNode } from "react"
import { Lock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Method {
    id: string
    title: string
    description: string
    icon: ReactNode
    category: string
    comingSoon?: boolean
    isNew?: boolean
}

interface AppointmentMethodSelectorProps {
    title: string
    methods: Method[]
    onMethodSelect: (methodId: string) => void
    icon: ReactNode
    showNewBadge?: boolean
}

export function AppointmentMethodSelector({
    title,
    methods,
    onMethodSelect,
    icon,
    showNewBadge = false
}: AppointmentMethodSelectorProps) {
    return (
        <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                {icon}
                {title}
                {showNewBadge && (
                    <span className="text-sm bg-gradient-to-r from-green-500 to-blue-500 text-white px-2 py-1 rounded-full">
                        NEW
                    </span>
                )}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {methods.map((method) => (
                    <Card
                        key={method.id}
                        className={`transition-all duration-300 hover:shadow-lg hover:border-primary cursor-pointer relative overflow-hidden ${method.comingSoon ? "opacity-60" : ""
                            }`}
                        onClick={() => onMethodSelect(method.id)}
                    >
                        {method.comingSoon && (
                            <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center z-10">
                                <div className="bg-white/90 rounded-full p-3 shadow-lg">
                                    <Lock className="h-6 w-6 text-gray-600" />
                                </div>
                            </div>
                        )}
                        {method.isNew && !method.comingSoon && (
                            <div className="absolute top-2 right-2 bg-gradient-to-r from-green-500 to-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                NEW
                            </div>
                        )}
                        <CardHeader className="text-center pb-2">
                            <div className="flex justify-center">{method.icon}</div>
                            <CardTitle className="text-xl">{method.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-center text-sm">
                                {method.description}
                            </CardDescription>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
