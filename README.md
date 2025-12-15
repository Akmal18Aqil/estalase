# SaaS POS UMKM Multi-Tenant dengan Supabase

Aplikasi Point of Sale (POS) untuk UMKM dengan arsitektur Multi-Tenant menggunakan Supabase.

## 🚀 Fitur

- **Multi-Tenant SaaS** - Setiap UMKM memiliki data terisolasi
- **Authentication** - Login/Register dengan Supabase Auth
- **Manajemen Produk** - CRUD produk dengan kategori
- **Transaksi POS** - Sistem penjualan lengkap
- **Keuangan** - Pencatatan pemasukan/pengeluaran
- **Dashboard** - Statistik dan laporan real-time
- **RLS Security** - Row Level Security untuk data isolation

## 🛠 Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL dengan RLS policies

## 📋 Prerequisites

1. Node.js 18+
2. Supabase account
3. Git

## 🔧 Setup Instructions

### 1. Clone Repository
```bash
git clone <repository-url>
cd saas-pos-umkm
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Supabase

1. Buat project baru di [Supabase Dashboard](https://supabase.com/dashboard)
2. Copy **Project URL** dan **Anon Key** dari Settings > API
3. Buat file `.env.local`:
```bash
cp .env.example .env.local
```

### 4. Configure Environment Variables
Edit `.env.local` dan isi dengan credentials Supabase Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Setup Database

1. Buka Supabase SQL Editor
2. Copy dan jalankan SQL dari file `supabase-schema.sql`
3. Verifikasi semua tabel dan RLS policies terbuat

### 6. Run Development Server
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 🏗 Arsitektur Multi-Tenant

### Flow Authentication
1. User register → Supabase Auth creates `auth.users`
2. Trigger otomatis buat `tenants` record
3. Create `users` profile dengan `tenant_id`
4. RLS policies memastikan data isolation

### Database Schema
```
├── Authentication
│   ├── auth.users (Supabase Auth)
│   ├── users (profile)
│   └── tenant_members
├── Core Business
│   ├── tenants (store data)
│   ├── categories
│   ├── products
│   ├── sales & sale_items
│   └── finances
```

### Security Features
- **Row Level Security (RLS)** - Auto filter data per tenant
- **UUID Primary Keys** - Secure ID generation
- **No Data Leakage** - Complete tenant isolation
- **Input Validation** - Client & server side validation

## 📁 Project Structure

```
src/
├── lib/
│   └── supabase.ts              # Supabase client & functions
├── contexts/
│   └── AuthContext.tsx          # Authentication state management
├── components/
│   ├── auth/
│   │   └── AuthForm.tsx         # Login/Register form
│   ├── dashboard/
│   │   └── Dashboard.tsx        # Main dashboard
│   └── ui/                      # shadcn/ui components
└── app/
    └── page.tsx                 # Main page
```

## 🔒 Security Best Practices

### RLS Policies
Semua tabel memiliki RLS policies yang memastikan:
- User hanya bisa akses data tenant-nya
- Tidak ada cross-tenant data access
- Auto-filter berdasarkan `auth.uid()`

### Query Examples
```typescript
// ✅ AMAN - RLS auto-filter
const products = await supabase
  .from('products')
  .select('*')
  // Otomatis filter tenant_id user

// ❌ BERBAHAYA - Jangan gunakan service role di client
const supabaseAdmin = createClient(url, serviceRoleKey)
```

## 🚀 Deployment

### Environment Variables untuk Production
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
```

### Build & Deploy
```bash
npm run build
npm start
```

## 📊 Features Overview

### 1. Authentication & Tenant Management
- User registration dengan automatic tenant creation
- Role-based access (Owner/Staff)
- Secure session management

### 2. Product Management
- CRUD products dengan categories
- Stock management dengan auto-update
- SKU/Barcode support

### 3. POS Transactions
- Real-time sales processing
- Automatic stock reduction
- Multiple payment methods
- Invoice generation

### 4. Financial Management
- Income/expense tracking
- Daily/monthly reports
- Balance calculations

### 5. Dashboard Analytics
- Real-time statistics
- Sales trends
- Product performance
- Financial summaries

## 🔄 Development Workflow

### Adding New Features
1. Update database schema di `supabase-schema.sql`
2. Create RLS policies untuk tabel baru
3. Add TypeScript interfaces di `lib/supabase.ts`
4. Implement UI components
5. Test dengan multiple tenants

### Testing Multi-Tenant
1. Register user berbeda
2. Verifikasi data isolation
3. Test cross-tenant access attempts
4. Validate RLS policies

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Test multi-tenant scenarios
4. Submit pull request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

Untuk issues atau questions:
1. Check Supabase documentation
2. Review RLS policies
3. Verify environment variables
4. Test dengan fresh database

---

**Built with ❤️ using Next.js and Supabase**