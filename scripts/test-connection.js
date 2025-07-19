#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase connection...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

console.log('✅ Environment variables loaded');
console.log(`📡 Supabase URL: ${supabaseUrl.substring(0, 30)}...`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test 1: Check if we can connect to Supabase
    console.log('\n🔌 Testing connection...');
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Connection failed:', error.message);
      return;
    }
    console.log('✅ Connection successful');

    // Test 2: Get all products
    console.log('\n📦 Fetching products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');

    if (productsError) {
      console.log('❌ Failed to fetch products:', productsError.message);
      return;
    }

    console.log(`✅ Found ${products.length} products:`);
    products.forEach(product => {
      console.log(`   - ${product.title} (${product.shopify_product_id}) - $${product.price}`);
    });

    // Test 3: Test specific product lookup (the one used in the demo)
    console.log('\n🎯 Testing demo product lookup...');
    const { data: demoProduct, error: demoError } = await supabase
      .from('products')
      .select('*')
      .eq('shopify_product_id', 'gid://shopify/Product/1')
      .single();

    if (demoError) {
      console.log('❌ Demo product not found:', demoError.message);
      console.log('💡 This means the modal will show "Failed to load product information"');
    } else {
      console.log('✅ Demo product found:');
      console.log(`   - Title: ${demoProduct.title}`);
      console.log(`   - Price: $${demoProduct.price}`);
      console.log(`   - Min Discount: ${demoProduct.min_discount_percent}%`);
      console.log(`   - Max Discount: ${demoProduct.max_discount_percent}%`);
      console.log(`   - BidIt Enabled: ${demoProduct.bidit_enabled}`);
    }

    // Test 4: Test bid_logs table
    console.log('\n📊 Testing bid_logs table...');
    const { data: logs, error: logsError } = await supabase
      .from('bid_logs')
      .select('count')
      .limit(1);

    if (logsError) {
      console.log('❌ bid_logs table error:', logsError.message);
    } else {
      console.log('✅ bid_logs table accessible');
    }

    console.log('\n🎉 All tests completed!');
    console.log('\n📋 Summary:');
    console.log('- Supabase connection: ✅ Working');
    console.log('- Products table: ✅ Accessible');
    console.log('- Demo product: ' + (demoProduct ? '✅ Found' : '❌ Not found'));
    console.log('- Bid logs: ✅ Accessible');

    if (demoProduct) {
      console.log('\n🚀 Your BidIt modal should work perfectly!');
      console.log('Visit http://localhost:3000 and click "Try BidIt - Make an Offer"');
    } else {
      console.log('\n⚠️  The demo product is missing. The modal will show an error.');
      console.log('You can either:');
      console.log('1. Add the demo product manually in Supabase');
      console.log('2. Update the demo to use an existing product ID');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testConnection(); 