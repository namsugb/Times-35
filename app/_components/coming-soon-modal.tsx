"use client"

import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ComingSoonModalProps {
    isOpen: boolean
    onClose: () => void
}

export function ComingSoonModal({ isOpen, onClose }: ComingSoonModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader className="text-center space-y-3">
                    <div className="flex justify-center">
                        <div className="bg-blue-100 rounded-full p-4">
                            <Lock className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                    <DialogTitle className="text-xl font-semibold text-center">준비중입니다</DialogTitle>
                    <DialogDescription className="text-center">
                        해당 기능은 현재 개발 중입니다.
                        <br />곧 만나보실 수 있어요! 🚀
                    </DialogDescription>
                </DialogHeader>
                <div className="pt-4">
                    <Button className="w-full" onClick={onClose}>
                        확인
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
