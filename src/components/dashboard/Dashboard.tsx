'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  ShoppingCart,
  Package,
  DollarSign,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { getDashboardStats } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface DashboardStats {
  totalProducts: number
  todaySales: number
  todaySalesCount: number
  monthlyIncome: number
  monthlyExpense: number
  monthlyBalance: number
}

export default function Dashboard() {
  const { user, tenant, signOut, isOwner } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const dashboardStats = await getDashboardStats()
        setStats(dashboardStats)
      } catch (error) {
        console.error('Error loading dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const StatCard = ({
    title,
    value,
    description,
    icon: Icon,
    trend,
    trendValue
  }: {
    title: string
    value: string | number
    description: string
    icon: any
    trend?: 'up' | 'down'
    trendValue?: string
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span>{description}</span>
          {trend && trendValue && (
            <div className={`flex items-center ${trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
              {trend === 'up' ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Selamat datang kembali, {user?.name}!
            </p>
          </div>
          <Button variant="ghost" onClick={() => signOut()} className="text-red-500 hover:text-red-600 hover:bg-red-50">
            Keluar
          </Button>
        </div>
        {tenant && (
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant="secondary">{tenant.name}</Badge>
            <Badge variant="outline" className="text-green-600 border-green-600">
              Aktif
            </Badge>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Produk"
          value={stats?.totalProducts || 0}
          description="produk aktif"
          icon={Package}
        />
        <StatCard
          title="Penjualan Hari Ini"
          value={formatCurrency(stats?.todaySales || 0)}
          description={`${stats?.todaySalesCount || 0} transaksi`}
          icon={ShoppingCart}
          trend="up"
          trendValue="+12.5%"
        />
        <StatCard
          title="Pemasukan Bulan Ini"
          value={formatCurrency(stats?.monthlyIncome || 0)}
          description="total pemasukan"
          icon={TrendingUp}
          trend="up"
          trendValue="+8.2%"
        />
        <StatCard
          title="Saldo Bersih"
          value={formatCurrency(stats?.monthlyBalance || 0)}
          description="pemasukan - pengeluaran"
          icon={DollarSign}
          trend={stats?.monthlyBalance && stats.monthlyBalance >= 0 ? 'up' : 'down'}
          trendValue={stats?.monthlyBalance && stats.monthlyBalance >= 0 ? '+5.1%' : '-2.3%'}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card onClick={() => router.push('/pos')} className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <span>Transaksi Baru</span>
            </CardTitle>
            <CardDescription>
              Buat transaksi penjualan baru
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              Mulai Transaksi
            </Button>
          </CardContent>
        </Card>

        <Card onClick={() => router.push('/products')} className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Kelola Produk</span>
            </CardTitle>
            <CardDescription>
              Tambah atau edit produk
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Kelola Produk
            </Button>
          </CardContent>
        </Card>

        <Card onClick={() => router.push('/finance')} className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Keuangan</span>
            </CardTitle>
            <CardDescription>
              Pantau pemasukan dan pengeluaran
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Lihat Laporan
            </Button>
          </CardContent>
        </Card>

        {isOwner && (
          <Card onClick={() => router.push('/settings')} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Pengaturan</span>
              </CardTitle>
              <CardDescription>
                Ubah identitas toko
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Buka Pengaturan
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Terkini</CardTitle>
          <CardDescription>
            Transaksi dan aktivitas terbaru di toko Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                  <ShoppingCart className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  Transaksi baru #INV-20241201-123456
                </p>
                <p className="text-sm text-gray-500">
                  Pembelian 3 item - Rp 150.000
                </p>
              </div>
              <div className="flex-shrink-0 text-sm text-gray-500">
                2 menit lalu
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  Produk baru ditambahkan
                </p>
                <p className="text-sm text-gray-500">
                  "Kopi Arabica Premium" - 50 stok
                </p>
              </div>
              <div className="flex-shrink-0 text-sm text-gray-500">
                1 jam lalu
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full">
                  <DollarSign className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  Catatan keuangan
                </p>
                <p className="text-sm text-gray-500">
                  Pengeluaran: Biaya listrik - Rp 500.000
                </p>
              </div>
              <div className="flex-shrink-0 text-sm text-gray-500">
                3 jam lalu
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}