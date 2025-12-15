'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Store, Loader2, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { updateTenant } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

const formSchema = z.object({
    name: z.string().min(1, 'Nama toko harus diisi'),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Email tidak valid').optional().or(z.literal('')),
})

export function StoreSettingsForm() {
    const router = useRouter()
    const { tenant, refreshUser } = useAuth()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: tenant?.name || '',
            address: tenant?.address || '',
            phone: tenant?.phone || '',
            email: tenant?.email || '',
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!tenant) return

        setLoading(true)
        try {
            const updated = await updateTenant(tenant.id, values)

            if (updated) {
                toast({
                    title: "Berhasil disimpan",
                    description: "Pengaturan toko berhasil diperbarui.",
                })
                await refreshUser() // Update context
                router.refresh()
            } else {
                toast({
                    variant: "destructive",
                    title: "Gagal menyimpan",
                    description: "Terjadi kesalahan saat menyimpan pengaturan.",
                })
            }
        } catch (error) {
            console.error(error)
            toast({
                variant: "destructive",
                title: "Terjadi kesalahan",
                description: "Silakan coba beberapa saat lagi.",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Pengaturan Toko
                </CardTitle>
                <CardDescription>
                    Ubah informasi dasar toko Anda seperti nama, alamat, dan kontak.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Toko</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nama Toko Anda" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Alamat</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Alamat lengkap toko..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nomor Telepon</FormLabel>
                                        <FormControl>
                                            <Input placeholder="08..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Toko</FormLabel>
                                        <FormControl>
                                            <Input placeholder="toko@email.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {!loading && <Save className="mr-2 h-4 w-4" />}
                                Simpan Perubahan
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
