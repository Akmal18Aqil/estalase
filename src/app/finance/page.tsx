'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Plus,
    Calendar,
    Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getFinances, createFinance, Finance } from '@/lib/supabase'

export default function FinancePage() {
    const router = useRouter()
    const [finances, setFinances] = useState<Finance[]>([])
    const [loading, setLoading] = useState(true)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        type: 'expense' as 'income' | 'expense',
        amount: '',
        category: '',
        description: ''
    })

    useEffect(() => {
        loadFinances()
    }, [])

    const loadFinances = async () => {
        setLoading(true)
        try {
            const data = await getFinances()
            setFinances(data)
        } catch (error) {
            console.error('Error loading finances:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!formData.amount || !formData.description) {
            alert('Mohon lengkapi data')
            return
        }

        setSubmitting(true)
        try {
            const result = await createFinance({
                type: formData.type,
                amount: parseFloat(formData.amount),
                category: formData.category || 'Umum',
                description: formData.description
            })

            if (result) {
                setIsFormOpen(false)
                setFormData({
                    type: 'expense',
                    amount: '',
                    category: '',
                    description: ''
                })
                loadFinances()
            } else {
                alert('Gagal menyimpan data')
            }
        } catch (error) {
            console.error('Error saving finance:', error)
            alert('Terjadi kesalahan')
        } finally {
            setSubmitting(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    // Calculations for this month
    const totalIncome = finances
        .filter(f => f.type === 'income')
        .reduce((sum, f) => sum + f.amount, 0)

    const totalExpense = finances
        .filter(f => f.type === 'expense')
        .reduce((sum, f) => sum + f.amount, 0)

    const balance = totalIncome - totalExpense

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Laporan Keuangan</h1>
                        <p className="text-sm text-gray-500">Pantau arus kas masuk dan keluar</p>
                    </div>
                </div>

                <Button onClick={() => setIsFormOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Catat Transaksi
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Pemasukan</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
                        <p className="text-xs text-gray-500">Semua waktu</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Pengeluaran</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</div>
                        <p className="text-xs text-gray-500">Semua waktu</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Saldo Bersih</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                            {formatCurrency(balance)}
                        </div>
                        <p className="text-xs text-gray-500">Cash Flow</p>
                    </CardContent>
                </Card>
            </div>

            {/* Transaction List */}
            <Card>
                <CardHeader>
                    <CardTitle>Riwayat Transaksi</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 border-b">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Tanggal</th>
                                    <th className="px-4 py-3 font-medium">Keterangan</th>
                                    <th className="px-4 py-3 font-medium">Kategori</th>
                                    <th className="px-4 py-3 font-medium text-center">Tipe</th>
                                    <th className="px-4 py-3 font-medium text-right">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                            Memuat data...
                                        </td>
                                    </tr>
                                ) : finances.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                            Belum ada data transaksi.
                                        </td>
                                    </tr>
                                ) : (
                                    finances.map((f) => (
                                        <tr key={f.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Calendar className="h-3 w-3 mr-2 text-gray-400" />
                                                    {formatDate(f.created_at)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-900">
                                                {f.description}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                <Badge variant="outline" className="font-normal text-gray-600">
                                                    {f.category || '-'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge
                                                    variant="secondary"
                                                    className={f.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                                                >
                                                    {f.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                                                </Badge>
                                            </td>
                                            <td className={`px-4 py-3 text-right font-bold ${f.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                {f.type === 'income' ? '+' : '-'} {formatCurrency(f.amount)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Add Transaction Modal */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Catat Transaksi Baru</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                type="button"
                                variant={formData.type === 'income' ? 'default' : 'outline'}
                                className={`w-full ${formData.type === 'income' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                onClick={() => setFormData({ ...formData, type: 'income' })}
                            >
                                <TrendingUp className="mr-2 h-4 w-4" />
                                Pemasukan
                            </Button>
                            <Button
                                type="button"
                                variant={formData.type === 'expense' ? 'default' : 'outline'}
                                className={`w-full ${formData.type === 'expense' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                                onClick={() => setFormData({ ...formData, type: 'expense' })}
                            >
                                <TrendingDown className="mr-2 h-4 w-4" />
                                Pengeluaran
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Jumlah (Rp)</label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Kategori</label>
                            <Select
                                value={formData.category}
                                onValueChange={(val) => setFormData({ ...formData, category: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    {formData.type === 'income' ? (
                                        <>
                                            <SelectItem value="Penjualan">Penjualan</SelectItem>
                                            <SelectItem value="Modal">Modal Tambahan</SelectItem>
                                            <SelectItem value="Lainnya">Lainnya</SelectItem>
                                        </>
                                    ) : (
                                        <>
                                            <SelectItem value="Operasional">Operasional</SelectItem>
                                            <SelectItem value="Gaji">Gaji Karyawan</SelectItem>
                                            <SelectItem value="Listrik/Air">Listrik & Air</SelectItem>
                                            <SelectItem value="Sewa">Sewa Tempat</SelectItem>
                                            <SelectItem value="Stok">Belanja Stok</SelectItem>
                                            <SelectItem value="Lainnya">Lainnya</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Keterangan</label>
                            <Textarea
                                placeholder="Contoh: Bayar tagihan listrik bulan Juni"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFormOpen(false)}>Batal</Button>
                        <Button onClick={handleSubmit} disabled={submitting}>Simpan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
