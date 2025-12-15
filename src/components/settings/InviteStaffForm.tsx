'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Mail, Loader2, Send } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

const formSchema = z.object({
    email: z.string().email('Email tidak valid'),
})

export function InviteStaffForm() {
    const router = useRouter()
    const { tenant } = useAuth()
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!tenant || !supabase) return

        setLoading(true)
        try {
            // 1. Insert into Database
            const { error: dbError } = await supabase
                .from('invitations')
                .insert({
                    email: values.email,
                    tenant_id: tenant.id,
                    role: 'staff'
                })

            if (dbError) {
                if (dbError.code === '23505') { // Unique violation
                    toast({
                        variant: "destructive",
                        title: "Gagal Mengundang",
                        description: "Email ini sudah diundang.",
                    })
                } else {
                    console.error('Supabase Error:', dbError)
                    toast({
                        variant: "destructive",
                        title: "Gagal Mengundang",
                        description: dbError.message || "Terjadi kesalahan sistem.",
                    })
                }
                return // Stop here
            }

            // 2. Send Email via Server Action
            // Dynamic import to avoid client-side issues with server actions if not handled correctly by Next.js in all versions, 
            // but standard import work in App Router.
            // verifying import... we need to import it at the top.

            // Let's assume standard import works. I will add the import statement in a separate edit or let auto-import handle it? 
            // Better to replace the whole file or add import. 
            // For now, I'll use the imported function (need to add import first).

            const { sendInviteEmail } = await import('@/actions/email')
            const result = await sendInviteEmail(values.email, tenant.name)

            if (result.success) {
                toast({
                    title: "Undangan Terkirim",
                    description: `Email undangan telah dikirim ke ${values.email}.`,
                })
                form.reset()
                router.refresh()
            } else {
                toast({
                    variant: "destructive",
                    title: "Undangan Disimpan, Gagal Kirim Email",
                    description: "Data tersimpan, tapi gagal mengirim email. Cek API Key Resend.",
                })
                console.error('Email Error:', result.error)
            }

        } catch (error) {
            console.error(error)
            toast({
                variant: "destructive",
                title: "Terjadi Kesalahan",
                description: "Silakan coba lagi nanti.",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Undang Staff
                </CardTitle>
                <CardDescription>
                    Tambahkan staff baru ke toko Anda. Mereka akan otomatis bergabung setelah register dengan email ini.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormLabel>Email Staff</FormLabel>
                                    <FormControl>
                                        <Input placeholder="staff@email.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {!loading && <Send className="mr-2 h-4 w-4" />}
                            Undang
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
