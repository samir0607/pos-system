# POS System

A modern point of sale system built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Features

- Product Management
- Billing System with Invoice Generation
- Analytics Dashboard with Metabase Integration
- Modern UI with Tailwind CSS
- TypeScript for Type Safety
- Supabase for Database and Authentication

## Prerequisites

- Node.js 18+ and npm
- Supabase account
- Metabase instance (for analytics dashboard)

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd pos-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new project in Supabase
   - Create the following tables in your Supabase database:

```sql
-- ============================
-- 1. Categories Table
-- ============================
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- ============================
-- 2. Suppliers Table
-- ============================
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT
);

-- ============================
-- 3. Products Table
-- ============================
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  cost_price NUMERIC(10, 2),
  sell_price NUMERIC(10, 2),
  quantity INTEGER DEFAULT 0,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL
);

-- ============================
-- 4. Sales Table (One per bill)
-- ============================
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  customer_name TEXT,
  customer_phone TEXT,
  total_amount NUMERIC(10, 2),
  sale_date TIMESTAMP DEFAULT NOW()
);

-- ============================
-- 5. Sale Items Table (Products in a bill)
-- ============================
CREATE TABLE IF NOT EXISTS sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  quantity_sold INTEGER NOT NULL,
  sell_price NUMERIC(10, 2),     -- unit price at time of sale
  total_price NUMERIC(10, 2)     -- quantity × sell_price
);

-- Function to decrement product quantity
create or replace function decrement_product_quantity(product_id uuid, amount integer)
returns void as $$
begin
  update products
  set quantity = quantity - amount
  where id = product_id;
end;
$$ language plpgsql;
```

4. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:
```
NEXT_PUBLIC_SUPABASE_URL="your-supabase-project-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Metabase Integration

1. Install and set up Metabase following their [official documentation](https://www.metabase.com/docs/latest/installation-and-operation/installation-guide).
2. Create a new dashboard in Metabase with your sales data.
3. Get the embed URL from Metabase and replace `YOUR_METABASE_URL` in `src/app/dashboard/page.tsx`.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── products/
│   │   └── sales/
│   ├── products/
│   ├── billing/
│   ├── dashboard/
│   └── layout.tsx
├── components/
└── lib/
    └── supabase.ts
```

## API Routes

- `GET /api/products` - Get all products
- `POST /api/products` - Create a new product
- `GET /api/sales` - Get all sales
- `POST /api/sales` - Create a new sale

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. 
