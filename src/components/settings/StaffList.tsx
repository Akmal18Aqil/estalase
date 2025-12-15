'use client'

import { useEffect, useState } from 'react'
import { Users, Trash2, Clock } from 'lucide-react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'

interface StaffMember {
    id: string
    name: string
    email: string
    role: string
    created_at: string
}

interface Invitation {
    email: string
    created_at: string
}

export function StaffList() {
    const { tenant } = useAuth()
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [loading, setLoading] = useState(true)

    const loadData = async () => {
        if (!tenant || !supabase) return

        try {
            // Load Staff
            const { data: staffData } = await supabase
                .from('users')
                .select('*')
                .eq('tenant_id', tenant.id)
                .order('created_at', { ascending: false })

            if (staffData) setStaff(staffData as StaffMember[])

            // Load Invitations
            const { data: inviteData } = await supabase
                .from('invitations')
                .select('*')
                .eq('tenant_id', tenant.id)
                .order('created_at', { ascending: false })

            if (inviteData) setInvitations(inviteData as Invitation[])

        } catch (error) {
            console.error('Error loading staff:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [tenant])

    const handleDeleteInvitation = async (email: string) => {
        if (!supabase) return
        const { error } = await supabase.from('invitations').delete().eq('email', email)

        if (error) {
            toast({
                variant: "destructive",
                title: "Gagal Menghapus",
                description: "Gagal membatalkan undangan."
            })
        } else {
            toast({ title: "Undangan Dibatalkan" })
            loadData()
        }
    }

    if (loading) return <div>Loading...</div>

    return (
        <div className="space-y-6">
            {/* Active Staff */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Daftar Staff
                    </CardTitle>
                    <CardDescription>
                        Pengguna yang memiliki akses ke toko ini.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {staff.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">{member.name}</TableCell>
                                    <TableCell>{member.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                                            {member.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {member.role !== 'owner' && (
                                            <Button variant="ghost" size="icon" className="text-red-500">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pending Invitations */}
            {invitations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Undangan Pending
                        </CardTitle>
                        <CardDescription>
                            Undangan yang belum diterima (User belum register).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Dikirim Pada</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invitations.map((invite) => (
                                    <TableRow key={invite.email}>
                                        <TableCell>{invite.email}</TableCell>
                                        <TableCell>
                                            {new Date(invite.created_at).toLocaleDateString("id-ID")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500"
                                                onClick={() => handleDeleteInvitation(invite.email)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
