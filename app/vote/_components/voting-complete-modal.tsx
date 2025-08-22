"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface VotingCompleteModalProps {
    isOpen: boolean
    onClose: () => void
    onViewResults: () => void
}

export function VotingCompleteModal({ isOpen, onClose, onViewResults }: VotingCompleteModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[90vw] max-w-[400px] mx-auto">
                <DialogHeader>
                    <DialogTitle className="text-center">투표가 완료된 약속입니다!</DialogTitle>
                    <DialogDescription className="text-center">
                        모든 인원이 투표에 참여하여 투표가 종료되었습니다.
                        <br />
                        <span className="text-sm text-muted-foreground">
                            기존 투표자 이름으로 재투표시 투표가 수정됩니다.
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 text-center">
                    <div className="flex gap-2 justify-center">
                        <Button onClick={onViewResults} className="flex-1">
                            결과 보기
                        </Button>
                        <Button variant="outline" onClick={onClose} className="flex-1">
                            닫기
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
