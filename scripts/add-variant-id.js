#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addVariantIdColumn() {
  console.log('🔧 Adding variant_id column to bids table...\n');

  try {
    // Add variant_id column to bids table
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.bids 
        ADD COLUMN IF NOT EXISTS shopify_variant_id BIGINT;
      `
    });

    if (error) {
      console.log('⚠️  Error adding variant_id column:', error.message);
      console.log('You may need to run this manually in Supabase SQL Editor:');
      console.log('ALTER TABLE public.bids ADD COLUMN shopify_variant_id BIGINT;');
    } else {
      console.log('✅ variant_id column added to bids table');
    }

    // Add variant_id column to bid_logs table for tracking
    const { error: logsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.bid_logs 
        ADD COLUMN IF NOT EXISTS shopify_variant_id BIGINT;
      `
    });

    if (logsError) {
      console.log('⚠️  Error adding variant_id to bid_logs:', logsError.message);
    } else {
      console.log('✅ variant_id column added to bid_logs table');
    }

    // Add bid_session_id column to bid_logs table
    const { error: sessionError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.bid_logs 
        ADD COLUMN IF NOT EXISTS bid_session_id INTEGER;
      `
    });

    if (sessionError) {
      console.log('⚠️  Error adding bid_session_id to bid_logs:', sessionError.message);
    } else {
      console.log('✅ bid_session_id column added to bid_logs table');
    }

    console.log('\n🎉 Migration complete!');
    console.log('\n📋 Updated schema:');
    console.log('- bids.shopify_variant_id (BIGINT)');
    console.log('- bid_logs.shopify_variant_id (BIGINT)');
    console.log('- bid_logs.bid_session_id (INTEGER)');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

addVariantIdColumn(); 