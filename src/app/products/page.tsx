'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Package,
    Plus,
    Search,
    Pencil,
    Trash2,
    RefreshCw
} from 'lucide-react'
import { getProducts, updateProduct, deleteProduct, Product } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import ProductForm from '@/components/products/ProductForm'

export default function ProductsPage() {
    const router = useRouter()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    // Modal state
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

    useEffect(() => {
        loadProducts()
    }, [])

    const loadProducts = async () => {
        setLoading(true)
        try {
            const data = await getProducts()
            setProducts(data)
        } catch (error) {
            console.error('Error loading products:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = () => {
        setSelectedProduct(null)
        setIsFormOpen(true)
    }

    const handleEdit = (product: Product) => {
        setSelectedProduct(product)
        setIsFormOpen(true)
    }

    const handleDelete = async (product: Product) => {
        if (!confirm(`Apakah Anda yakin ingin MENGHAPUS produk "${product.name}" secara permanen? Data yang sudah dihapus tidak dapat dikembalikan.`)) return

        try {
            await deleteProduct(product.id)
            loadProducts()
        } catch (error) {
            console.error('Error deleting product:', error)
            alert('Gagal menghapus produk')
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount)
    }

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center space-x-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Package className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Produk</h1>
                            <p className="text-sm text-gray-500">Kelola inventaris toko Anda</p>
                        </div>
                    </div>
                </div>

                <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Produk
                </Button>
            </div>

            {/* Tools & Search */}
            <div className="flex items-center space-x-4 bg-white p-4 rounded-lg border shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Cari produk (nama/SKU)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button variant="outline" size="icon" onClick={loadProducts} title="Refresh Data">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                <th className="px-6 py-4 font-medium">Nama Produk</th>
                                <th className="px-6 py-4 font-medium">Kategori</th>
                                <th className="px-6 py-4 font-medium">Stok</th>
                                <th className="px-6 py-4 font-medium text-right">Harga Beli</th>
                                <th className="px-6 py-4 font-medium text-right">Harga Jual</th>
                                <th className="px-6 py-4 font-medium text-center">Status</th>
                                <th className="px-6 py-4 font-medium text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                            <span>Memuat data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        Belum ada data produk.
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{product.name}</div>
                                            {product.sku && (
                                                <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {(product as any).categories?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`font-medium ${product.stock <= product.min_stock ? 'text-red-600' : 'text-gray-900'}`}>
                                                {product.stock} unit
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-600">
                                            {formatCurrency(product.buy_price)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                                            {formatCurrency(product.sell_price)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant={product.is_active ? 'secondary' : 'destructive'}>
                                                {product.is_active ? 'Aktif' : 'Non-Aktif'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(product)}
                                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(product)}
                                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ProductForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSuccess={loadProducts}
                initialData={selectedProduct}
            />
        </div>
    )
}
