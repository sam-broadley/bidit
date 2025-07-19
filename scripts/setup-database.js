#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.log('Please create .env.local with:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🚀 Setting up BidIt database...\n');

  try {
    // 1. Create products table
    console.log('📦 Creating products table...');
    const { error: productsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.products (
          id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
          shopify_product_id text NOT NULL,
          title text,
          price numeric NOT NULL,
          bidit_enabled boolean DEFAULT false,
          min_discount_percent numeric,
          max_discount_percent numeric,
          created_at timestamp with time zone DEFAULT now(),
          CONSTRAINT products_pkey PRIMARY KEY (id)
        );
      `
    });

    if (productsError) {
      console.log('⚠️  Products table might already exist or need manual creation');
    } else {
      console.log('✅ Products table created');
    }

    // 2. Create users table
    console.log('👥 Creating users table...');
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.users (
          id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
          auth_user_id uuid UNIQUE,
          created_at timestamp with time zone DEFAULT now(),
          CONSTRAINT users_pkey PRIMARY KEY (id),
          CONSTRAINT users_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id)
        );
      `
    });

    if (usersError) {
      console.log('⚠️  Users table might already exist or need manual creation');
    } else {
      console.log('✅ Users table created');
    }

    // 3. Create bids table
    console.log('💰 Creating bids table...');
    const { error: bidsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.bids (
          id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
          bid_session_id integer NOT NULL,
          user_id integer,
          product_id integer,
          amount numeric NOT NULL,
          status text NOT NULL CHECK (status = ANY (ARRAY['pending'::text, 'rejected'::text, 'accepted'::text, 'countered'::text])),
          counter_offer numeric,
          created_at timestamp with time zone DEFAULT now(),
          responded_at timestamp with time zone,
          CONSTRAINT bids_pkey PRIMARY KEY (id),
          CONSTRAINT bids_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
        );
      `
    });

    if (bidsError) {
      console.log('⚠️  Bids table might already exist or need manual creation');
    } else {
      console.log('✅ Bids table created');
    }

    // 4. Create bid_logs table
    console.log('📊 Creating bid_logs table...');
    const { error: logsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.bid_logs (
          id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
          bid_id integer,
          event_type text NOT NULL,
          event_data jsonb,
          created_at timestamp with time zone DEFAULT now(),
          CONSTRAINT bid_logs_pkey PRIMARY KEY (id),
          CONSTRAINT bid_logs_bid_id_fkey FOREIGN KEY (bid_id) REFERENCES public.bids(id)
        );
      `
    });

    if (logsError) {
      console.log('⚠️  Bid_logs table might already exist or need manual creation');
    } else {
      console.log('✅ Bid_logs table created');
    }

    // 5. Insert sample product data
    console.log('🛍️  Inserting sample product data...');
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('id')
      .eq('shopify_product_id', 'gid://shopify/Product/123456789')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.log('⚠️  Could not check existing product:', checkError.message);
    }

    if (!existingProduct) {
      const { error: insertError } = await supabase
        .from('products')
        .insert({
          shopify_product_id: 'gid://shopify/Product/123456789',
          title: 'Premium Wireless Headphones',
          price: 299.99,
          bidit_enabled: true,
          min_discount_percent: 10,
          max_discount_percent: 25
        });

      if (insertError) {
        console.log('❌ Failed to insert sample product:', insertError.message);
      } else {
        console.log('✅ Sample product inserted');
      }
    } else {
      console.log('✅ Sample product already exists');
    }

    // 6. Verify the setup
    console.log('\n🔍 Verifying database setup...');
    const { data: products, error: verifyError } = await supabase
      .from('products')
      .select('*');

    if (verifyError) {
      console.log('❌ Could not verify products:', verifyError.message);
    } else {
      console.log(`✅ Found ${products.length} products in database`);
      products.forEach(product => {
        console.log(`   - ${product.title} (${product.shopify_product_id})`);
      });
    }

    console.log('\n🎉 Database setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Restart your development server: npm run dev');
    console.log('2. Visit http://localhost:3000');
    console.log('3. Click "Try BidIt - Make an Offer"');
    console.log('4. The modal should now load product data successfully');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n💡 If you see permission errors, you may need to:');
    console.log('1. Run the SQL schema manually in your Supabase SQL Editor');
    console.log('2. Insert the sample product data manually');
    console.log('3. Check your Supabase RLS (Row Level Security) policies');
  }
}

setupDatabase(); 