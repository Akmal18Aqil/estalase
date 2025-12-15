'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { createProduct, updateProduct, getCategories, Category, Product } from '@/lib/supabase'

interface ProductFormProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    initialData?: Product | null
}

export default function ProductForm({
    isOpen,
    onClose,
    onSuccess,
    initialData
}: ProductFormProps) {
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])

    // Form stats
    const [name, setName] = useState('')
    const [categoryId, setCategoryId] = useState<string>('uncategorized')
    const [sku, setSku] = useState('')
    const [barcode, setBarcode] = useState('')
    const [buyPrice, setBuyPrice] = useState('')
    const [sellPrice, setSellPrice] = useState('')
    const [stock, setStock] = useState('')
    const [minStock, setMinStock] = useState('5')
    const [description, setDescription] = useState('')
    const [isActive, setIsActive] = useState(true)

    useEffect(() => {
        loadCategories()
    }, [])

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name)
                setCategoryId(initialData.category_id || 'uncategorized')
                setSku(initialData.sku || '')
                setBarcode(initialData.barcode || '')
                setBuyPrice(initialData.buy_price.toString())
                setSellPrice(initialData.sell_price.toString())
                setStock(initialData.stock.toString())
                setMinStock(initialData.min_stock.toString())
                setDescription(initialData.description || '')
                setIsActive(initialData.is_active)
            } else {
                resetForm()
            }
        }
    }, [isOpen, initialData])

    const loadCategories = async () => {
        const data = await getCategories()
        setCategories(data)
    }

    const resetForm = () => {
        setName('')
        setCategoryId('uncategorized')
        setSku('')
        setBarcode('')
        setBuyPrice('')
        setSellPrice('')
        setStock('')
        setMinStock('5')
        setDescription('')
        setIsActive(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const productData = {
                name,
                category_id: categoryId === 'uncategorized' ? undefined : categoryId,
                sku: sku || null,
                barcode: barcode || null,
                buy_price: parseFloat(buyPrice) || 0,
                sell_price: parseFloat(sellPrice) || 0,
                stock: parseInt(stock) || 0,
                min_stock: parseInt(minStock) || 0,
                description: description || null,
                is_active: isActive
            }

            if (initialData) {
                await updateProduct(initialData.id, productData as any)
            } else {
                await createProduct(productData as any)
            }

            onSuccess()
            onClose()
        } catch (error) {
            console.error('Error saving product:', error)
            alert('Gagal menyimpan produk')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
                    <DialogDescription>
                        Isi detail produk di bawah ini. Klik simpan setelah selesai.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Produk *</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="Contoh: Kopi Bubuk"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Kategori</Label>
                                <Select value={categoryId} onValueChange={setCategoryId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="uncategorized">Tanpa Kategori</SelectItem>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Deskripsi</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Keterangan tambahan produk..."
                            />
                        </div>
                    </div>

                    {/* Pricing & Stock */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="buyPrice">Harga Beli (Rp)</Label>
                            <Input
                                id="buyPrice"
                                type="number"
                                min="0"
                                value={buyPrice}
                                onChange={(e) => setBuyPrice(e.target.value)}
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sellPrice">Harga Jual (Rp) *</Label>
                            <Input
                                id="sellPrice"
                                type="number"
                                min="0"
                                value={sellPrice}
                                onChange={(e) => setSellPrice(e.target.value)}
                                required
                                placeholder="0"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="stock">Stok Awal</Label>
                            <Input
                                id="stock"
                                type="number"
                                min="0"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                required
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="minStock">Stok Minimal</Label>
                            <Input
                                id="minStock"
                                type="number"
                                min="0"
                                value={minStock}
                                onChange={(e) => setMinStock(e.target.value)}
                                placeholder="5"
                            />
                        </div>
                    </div>

                    {/* Codes & Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="sku">SKU (Kode Stok)</Label>
                            <Input
                                id="sku"
                                value={sku}
                                onChange={(e) => setSku(e.target.value)}
                                placeholder="Optional"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="barcode">Barcode</Label>
                            <Input
                                id="barcode"
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value)}
                                placeholder="Optional"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="active"
                            checked={isActive}
                            onCheckedChange={setIsActive}
                        />
                        <Label htmlFor="active">Produk Aktif (Dijual)</Label>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Menyimpan...' : (initialData ? 'Simpan Perubahan' : 'Tambah Produk')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
