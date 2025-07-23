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

async function addCounterBidFeature() {
  console.log('🚀 Adding counter-bid feature to database...\n');

  try {
    // 1. Add counter_bid column to products table
    console.log('📦 Adding counter_bid column to products table...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.products 
        ADD COLUMN IF NOT EXISTS counter_bid boolean DEFAULT false;
      `
    });

    if (alterError) {
      console.log('⚠️  Could not add counter_bid column:', alterError.message);
      console.log('You may need to run this manually in Supabase SQL Editor:');
      console.log('ALTER TABLE public.products ADD COLUMN IF NOT EXISTS counter_bid boolean DEFAULT false;');
    } else {
      console.log('✅ counter_bid column added to products table');
    }

    // 2. Update existing products to enable counter_bid for testing
    console.log('🔄 Updating existing products to enable counter_bid...');
    const { error: updateError } = await supabase
      .from('products')
      .update({ counter_bid: true })
      .eq('bidit_enabled', true);

    if (updateError) {
      console.log('⚠️  Could not update existing products:', updateError.message);
    } else {
      console.log('✅ Updated existing products to enable counter_bid');
    }

    // 3. Verify the changes
    console.log('\n🔍 Verifying counter-bid feature...');
    const { data: products, error: verifyError } = await supabase
      .from('products')
      .select('shopify_product_id, title, bidit_enabled, counter_bid');

    if (verifyError) {
      console.log('❌ Could not verify products:', verifyError.message);
    } else {
      console.log(`✅ Found ${products.length} products in database`);
      products.forEach(product => {
        console.log(`   - ${product.title} (BidIt: ${product.bidit_enabled}, Counter: ${product.counter_bid})`);
      });
    }

    console.log('\n🎉 Counter-bid feature added successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update your BidItModal component to handle counter-bids');
    console.log('2. Test the counter-bid flow');
    console.log('3. Deploy your changes');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n💡 If you see permission errors, you may need to:');
    console.log('1. Run the SQL manually in your Supabase SQL Editor:');
    console.log('   ALTER TABLE public.products ADD COLUMN IF NOT EXISTS counter_bid boolean DEFAULT false;');
    console.log('2. Update products manually:');
    console.log('   UPDATE public.products SET counter_bid = true WHERE bidit_enabled = true;');
  }
}

addCounterBidFeature(); 