'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import {
    Search,
    ShoppingCart,
    Trash2,
    Plus,
    Minus,
    CreditCard,
    Banknote,
    Smartphone,
    Printer,
    CheckCircle,
    ArrowLeft,
    Package
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    getProducts,
    getCategories,
    createSale,
    Product,
    Category,
    Sale,
    SaleItem
} from '@/lib/supabase'
import { ReceiptPrinter } from '@/components/pos/ReceiptPrinter'

interface CartItem {
    product: Product
    quantity: number
}

export default function POSPage() {
    const router = useRouter()
    const { user, tenant } = useAuth()
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)

    // Filter state
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')

    // Cart state
    const [cart, setCart] = useState<CartItem[]>([])

    // Checkout state
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
    const [isSuccessOpen, setIsSuccessOpen] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'ewallet' | 'card'>('cash')
    const [receivedAmount, setReceivedAmount] = useState('')
    const [processing, setProcessing] = useState(false)
    const [lastSale, setLastSale] = useState<{ sale: Sale; items: (SaleItem & { products: Product })[] } | null>(null)

    // Printer ref
    const componentRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [productsData, categoriesData] = await Promise.all([
                getProducts(),
                getCategories()
            ])
            setProducts(productsData)
            setCategories(categoriesData)
        } catch (error) {
            console.error('Error loading POS data:', error)
        } finally {
            setLoading(false)
        }
    }

    const addToCart = (product: Product) => {
        if (product.stock < 1) {
            alert('Stok habis!')
            return
        }

        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id)
            if (existing) {
                if (existing.quantity + 1 > product.stock) {
                    alert('Stok tidak mencukupi!')
                    return prev
                }
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            } else {
                return [...prev, { product, quantity: 1 }]
            }
        })
    }

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.product.id !== productId))
    }

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.product.id === productId) {
                    const newQty = item.quantity + delta
                    if (newQty < 1) return item
                    if (newQty > item.product.stock) {
                        alert('Stok limit!')
                        return item
                    }
                    return { ...item, quantity: newQty }
                }
                return item
            })
        })
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.product.sell_price * item.quantity), 0)

    const handleCheckout = async () => {
        if (!cart.length) return
        setProcessing(true)

        try {
            const finalAmount = subtotal
            const saleData = {
                invoice_number: 'PENDING',
                total_amount: subtotal,
                discount_amount: 0,
                final_amount: finalAmount,
                payment_method: paymentMethod,
                payment_status: 'paid' as const,
                created_by: user?.id
            }

            const saleItems = cart.map(item => ({
                product_id: item.product.id,
                quantity: item.quantity,
                unit_price: item.product.sell_price,
                total_price: item.product.sell_price * item.quantity
            }))

            const result = await createSale(saleData, saleItems)

            if (result) {
                // Prepare data for receipt
                const receiptItems = result.items.map(item => {
                    const product = products.find(p => p.id === item.product_id)
                    return { ...item, products: product! }
                })

                setLastSale({
                    sale: result.sale,
                    items: receiptItems
                })

                // Reset and show success
                setCart([])
                setReceivedAmount('')
                setIsCheckoutOpen(false)
                setIsSuccessOpen(true)

                // Refresh products to show updated stock
                loadData()
            } else {
                alert('Gagal memproses transaksi')
            }
        } catch (error) {
            console.error('Checkout error:', error)
            alert('Terjadi kesalahan')
        } finally {
            setProcessing(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory
        return matchesSearch && matchesCategory
    })

    // Calculate change
    const received = parseFloat(receivedAmount) || 0
    const change = received - subtotal

    return (
        <div className="flex h-[calc(100vh-theme(spacing.4))] overflow-hidden bg-gray-50">
            {/* Include Receipt Printer (Hidden screen, Visible Print) */}
            {lastSale && tenant && (
                <div className="print-area hidden">
                    <ReceiptPrinter
                        ref={componentRef}
                        sale={lastSale.sale}
                        items={lastSale.items}
                        tenant={tenant}
                    />
                </div>
            )}

            <style jsx global>{`
        @media print {
          body > *:not(.print-area) {
            display: none !important;
          }
          .print-area {
            display: block !important;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
          }
        }
      `}</style>

            {/* LEFT: Product Grid */}
            <div className="flex-1 flex flex-col min-w-0 border-r print:hidden">
                {/* Header */}
                <div className="bg-white border-b p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="text-xl font-bold text-gray-800">Kasir (POS)</h1>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Cari produk..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-gray-50"
                            />
                        </div>
                    </div>
                </div>

                {/* Categories */}
                <div className="bg-white border-b p-3 flex space-x-2 overflow-x-auto">
                    <Button
                        variant={selectedCategory === 'all' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory('all')}
                        className="rounded-full"
                    >
                        Semua
                    </Button>
                    {categories.map(cat => (
                        <Button
                            key={cat.id}
                            variant={selectedCategory === cat.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(cat.id)}
                            className="rounded-full whitespace-nowrap"
                        >
                            {cat.name}
                        </Button>
                    ))}
                </div>

                {/* Grid */}
                <ScrollArea className="flex-1 p-4 bg-gray-50">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
                        {filteredProducts.map(product => (
                            <div
                                key={product.id}
                                className="bg-white p-3 rounded-lg shadow-sm border cursor-pointer hover:border-blue-500 transition-all flex flex-col h-full group"
                                onClick={() => addToCart(product)}
                            >
                                <div className="h-32 bg-gray-100 rounded-md mb-3 flex items-center justify-center text-gray-300 group-hover:bg-blue-50 transition-colors">
                                    <Package className="h-12 w-12 group-hover:text-blue-300 transition-colors" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-900 line-clamp-2">{product.name}</h3>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-sm text-gray-500">{product.stock} Stok</p>
                                        {product.sku && <Badge variant="outline" className="text-[10px]">{product.sku}</Badge>}
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                                    <span className="font-bold text-blue-600">
                                        {formatCurrency(product.sell_price)}
                                    </span>
                                    <Button size="icon" className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {filteredProducts.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center h-64 text-gray-400">
                                <Search className="h-12 w-12 mb-2" />
                                <p>Produk tidak ditemukan</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* RIGHT: Cart */}
            <div className="w-[400px] flex flex-col bg-white border-l shadow-xl print:hidden">
                <div className="p-4 border-b bg-gray-50">
                    <h2 className="font-bold text-lg flex items-center">
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Keranjang Belanja
                    </h2>
                </div>

                <ScrollArea className="flex-1 p-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                            <ShoppingCart className="h-16 w-16 mb-4" />
                            <p>Belum ada item</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {cart.map(item => (
                                <div key={item.product.id} className="flex gap-3 items-start bg-white p-2 rounded border">
                                    <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                        <Package className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-sm line-clamp-1">{item.product.name}</h4>
                                        <p className="text-blue-600 font-bold text-sm">
                                            {formatCurrency(item.product.sell_price)}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={(e) => { e.stopPropagation(); removeFromCart(item.product.id); }}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                        <div className="flex items-center space-x-2 bg-gray-100 rounded-md p-1">
                                            <button
                                                className="w-5 h-5 flex items-center justify-center hover:bg-white rounded"
                                                onClick={() => updateQuantity(item.product.id, -1)}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </button>
                                            <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                            <button
                                                className="w-5 h-5 flex items-center justify-center hover:bg-white rounded"
                                                onClick={() => updateQuantity(item.product.id, 1)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="p-4 bg-gray-50 border-t space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total Tagihan</span>
                            <span className="text-blue-600">{formatCurrency(subtotal)}</span>
                        </div>
                    </div>
                    <Button
                        className="w-full h-12 text-lg"
                        size="lg"
                        disabled={cart.length === 0}
                        onClick={() => setIsCheckoutOpen(true)}
                    >
                        Bayar Sekarang
                    </Button>
                </div>
            </div>

            {/* Checkout Modal */}
            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Metode Pembayaran</DialogTitle>
                        <DialogDescription>Total Tagihan: {formatCurrency(subtotal)}</DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4 py-4">
                        <Button
                            variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                            className="h-20 flex flex-col gap-2"
                            onClick={() => setPaymentMethod('cash')}
                        >
                            <Banknote className="h-6 w-6" />
                            Tunai
                        </Button>
                        <Button
                            variant={paymentMethod === 'ewallet' ? 'default' : 'outline'}
                            className="h-20 flex flex-col gap-2"
                            onClick={() => setPaymentMethod('ewallet')}
                        >
                            <Smartphone className="h-6 w-6" />
                            QRIS / E-Wallet
                        </Button>
                        <Button
                            variant={paymentMethod === 'transfer' ? 'default' : 'outline'}
                            className="h-20 flex flex-col gap-2"
                            onClick={() => setPaymentMethod('transfer')}
                        >
                            <CreditCard className="h-6 w-6" />
                            Transfer Bank
                        </Button>
                        <Button variant="outline" disabled className="h-20 flex flex-col gap-2">
                            <CreditCard className="h-6 w-6" />
                            Kartu Debit/Kredit
                        </Button>
                    </div>

                    {paymentMethod === 'cash' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Uang Diterima</label>
                            <Input
                                type="number"
                                placeholder="Masukkan jumlah uang..."
                                value={receivedAmount}
                                onChange={(e) => setReceivedAmount(e.target.value)}
                                autoFocus
                            />
                            <div className="flex justify-between text-sm mt-2">
                                <span>Kembalian:</span>
                                <span className={`font-bold ${change < 0 ? 'text-red-500' : 'text-green-600'}`}>
                                    {formatCurrency(change)}
                                </span>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            className="w-full"
                            onClick={handleCheckout}
                            disabled={processing || (paymentMethod === 'cash' && change < 0)}
                        >
                            {processing ? 'Memproses...' : 'Selesaikan Transaksi'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Success Modal */}
            <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
                <DialogContent className="sm:max-w-sm text-center">
                    <div className="mt-4 flex flex-col items-center space-y-4">
                        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="sr-only">Transaksi Berhasil</h2>
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-center">Transaksi Berhasil!</DialogTitle>
                        </DialogHeader>
                        {paymentMethod === 'cash' && (
                            <div className="text-gray-500">
                                Kembalian: <span className="text-black font-bold">{formatCurrency(change)}</span>
                            </div>
                        )}

                        <div className="flex gap-2 w-full mt-4">
                            <Button variant="outline" className="flex-1" onClick={handlePrint}>
                                <Printer className="mr-2 h-4 w-4" />
                                Cetak Struk
                            </Button>
                            <Button className="flex-1" onClick={() => setIsSuccessOpen(false)}>
                                Transaksi Baru
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
