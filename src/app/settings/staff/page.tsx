'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InviteStaffForm } from '@/components/settings/InviteStaffForm'
import { StaffList } from '@/components/settings/StaffList'
import { useAuth } from '@/contexts/AuthContext'

export default function StaffPage() {
    const router = useRouter()
    const { isOwner } = useAuth()

    if (!isOwner) {
        return (
            <div className="container mx-auto py-6 space-y-6">
                <div className="p-8 text-center text-muted-foreground bg-gray-50 rounded-lg border border-dashed">
                    Hanya Owner yang dapat mengelola staff.
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Kelola Staff</h1>
            </div>

            <div className="grid gap-6">
                <InviteStaffForm />
                <StaffList />
            </div>
        </div>
    )
}
