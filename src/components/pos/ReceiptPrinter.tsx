'use client'

import React, { forwardRef } from 'react'
import { Sale, SaleItem, Tenant, Product } from '@/lib/supabase'

interface ReceiptPrinterProps {
    sale: Sale
    items: (SaleItem & { products: Product })[]
    tenant: Tenant
    receivedAmount?: number
    change?: number
}

export const ReceiptPrinter = forwardRef<HTMLDivElement, ReceiptPrinterProps>(
    ({ sale, items, tenant, receivedAmount, change }, ref) => {
        const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(amount).replace('Rp', 'Rp ')
        }

        const formatDate = (dateString: string) => {
            return new Date(dateString).toLocaleString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        }

        return (
            <div ref={ref} className="bg-white text-black font-mono text-[10px] leading-tight w-[58mm] p-2 mx-auto print:mx-0">
                {/* 58mm is standard for smaller thermal printers, 80mm for larger. 58mm is safer for generic styling. p-0 might be better but p-2 adds safe margin */}

                {/* Header */}
                <div className="text-center mb-2">
                    <h1 className="text-sm font-bold uppercase tracking-wider mb-1">{tenant.name}</h1>
                    <p className="whitespace-pre-wrap">{tenant.address}</p>
                    {tenant.phone && <p>{tenant.phone}</p>}
                </div>

                {/* Meta */}
                <div className="border-b border-black border-dashed my-1"></div>
                <div className="flex justify-between">
                    <span>{sale.invoice_number}</span>
                    <span>{formatDate(sale.created_at)}</span>
                </div>
                {sale.customer_name && (
                    <div className="flex justify-between">
                        <span>Pelanggan:</span>
                        <span>{sale.customer_name}</span>
                    </div>
                )}
                <div className="border-b border-black border-dashed my-1"></div>

                {/* Items */}
                <div className="space-y-2 mb-2">
                    {items.map((item) => (
                        <div key={item.id}>
                            <div className="font-bold">{item.products?.name || 'Produk'}</div>
                            <div className="flex justify-between pl-2">
                                <span>{item.quantity} x {formatCurrency(item.unit_price)}</span>
                                <span>{formatCurrency(item.total_price)}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Totals */}
                <div className="border-t border-black border-dashed my-1"></div>
                <div className="space-y-1">
                    <div className="flex justify-between">
                        <span>Total</span>
                        <span className="font-bold text-xs">{formatCurrency(sale.final_amount)}</span>
                    </div>

                    <div className="flex justify-between">
                        <span>Bayar (Tunai)</span>
                        <span>{formatCurrency(receivedAmount !== undefined ? receivedAmount : sale.total_amount)}</span>
                    </div>

                    {change !== undefined && (
                        <div className="flex justify-between">
                            <span>Kembali</span>
                            <span>{formatCurrency(change)}</span>
                        </div>
                    )}
                </div>
                <div className="border-b border-black border-dashed my-1"></div>

                {/* Footer */}
                <div className="text-center mt-4 mb-8">
                    <p className="font-bold">*** TERIMA KASIH ***</p>
                    <p>Barang yang sudah dibeli</p>
                    <p>tidak dapat ditukar kembali</p>
                </div>
            </div>
        )
    }
)

ReceiptPrinter.displayName = 'ReceiptPrinter'
