import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function NotFound() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-md">
            <Card className="border-destructive">
                <CardContent className="p-6 text-center">
                    <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">약속을 찾을 수 없습니다</h2>
                    <p className="text-muted-foreground mb-4">
                        유효하지 않은 링크이거나 삭제된 약속입니다.
                    </p>
                    <Button asChild variant="outline">
                        <Link href="/">홈으로 돌아가기</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
