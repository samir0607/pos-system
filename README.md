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
-- Products table
create table products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  cost decimal(10,2) not null,
  quantity integer not null,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sales table
create table sales (
  id uuid default uuid_generate_v4() primary key,
  total decimal(10,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sale items table
create table sale_items (
  id uuid default uuid_generate_v4() primary key,
  sale_id uuid references sales(id) not null,
  product_id uuid references products(id) not null,
  quantity integer not null,
  price decimal(10,2) not null
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