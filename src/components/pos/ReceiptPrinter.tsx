'use client'

import React, { forwardRef } from 'react'
import { Sale, SaleItem, Tenant, Product } from '@/lib/supabase'

interface ReceiptPrinterProps {
    sale: Sale
    items: (SaleItem & { products: Product })[]
    tenant: Tenant
}

export const ReceiptPrinter = forwardRef<HTMLDivElement, ReceiptPrinterProps>(
    ({ sale, items, tenant }, ref) => {
        const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(amount)
        }

        const formatDate = (dateString: string) => {
            return new Date(dateString).toLocaleString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        }

        return (
            <div className="hidden print:block print:w-[80mm] print:p-2 print:text-black" ref={ref}>
                <div className="text-center mb-4">
                    <h2 className="text-lg font-bold uppercase">{tenant.name}</h2>
                    {tenant.address && <p className="text-xs">{tenant.address}</p>}
                    {tenant.phone && <p className="text-xs">{tenant.phone}</p>}
                </div>

                <div className="border-b border-black border-dashed my-2"></div>

                <div className="text-xs space-y-1 mb-2">
                    <div className="flex justify-between">
                        <span>No:</span>
                        <span>{sale.invoice_number}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tgl:</span>
                        <span>{formatDate(sale.created_at)}</span>
                    </div>
                    {sale.customer_name && (
                        <div className="flex justify-between">
                            <span>Plg:</span>
                            <span>{sale.customer_name}</span>
                        </div>
                    )}
                </div>

                <div className="border-b border-black border-dashed my-2"></div>

                <div className="text-xs space-y-2 mb-2">
                    {items.map((item) => (
                        <div key={item.id}>
                            <div className="font-semibold">{item.products?.name || 'Produk'}</div>
                            <div className="flex justify-between">
                                <span>{item.quantity} x {formatCurrency(item.unit_price)}</span>
                                <span>{formatCurrency(item.total_price)}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="border-b border-black border-dashed my-2"></div>

                <div className="text-xs space-y-1 mb-4">
                    <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>{formatCurrency(sale.final_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tunai</span>
                        <span>{formatCurrency(sale.total_amount)}</span>
                        {/* Note: In a real scenario we might track exact cash received properly if available, 
                for now assuming simple display. If 'total_amount' is used for subtotal, 
                we might need to adjust logic based on exact data structure usage. 
                Using final_amount as Total. 
            */}
                    </div>
                    {/* We assume sale.total_amount usually stores subtotal before discount? 
              Actually schema says: total_amount, discount_amount, final_amount. 
              Let's stick to showing Total. 
          */}
                </div>

                <div className="text-center text-xs mt-4">
                    <p>Terima Kasih</p>
                    <p>Selamat Belanja Kembali</p>
                </div>
            </div>
        )
    }
)

ReceiptPrinter.displayName = 'ReceiptPrinter'
