'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StoreSettingsForm } from '@/components/settings/StoreSettingsForm'
import { useAuth } from '@/contexts/AuthContext'

export default function SettingsPage() {
    const router = useRouter()
    const { isOwner } = useAuth()

    if (!isOwner) {
        return (
            <div className="container mx-auto py-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
                </div>
                <div className="p-8 text-center text-muted-foreground bg-gray-50 rounded-lg border border-dashed">
                    Anda tidak memiliki akses untuk mengubah pengaturan toko.
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
                <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
            </div>

            <div className="grid gap-6">
                <StoreSettingsForm />

                <div className="flex justify-end">
                    <Button variant="outline" onClick={() => router.push('/settings/staff')}>
                        Kelola Staff
                    </Button>
                </div>
            </div>
        </div>
    )
}
