#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 BidIt Modal Setup\n');

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  try {
    // Check if .env.local already exists
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const overwrite = await question('.env.local already exists. Overwrite? (y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('Setup cancelled.');
        process.exit(0);
      }
    }

    // Get Supabase configuration
    console.log('\n📋 Supabase Configuration');
    const supabaseUrl = await question('Enter your Supabase project URL: ');
    const supabaseKey = await question('Enter your Supabase anon key: ');

    // Validate inputs
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Supabase URL and key are required.');
      process.exit(1);
    }

    // Create .env.local file
    const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey}

# Optional: For production deployment
# NEXT_PUBLIC_VERCEL_URL=your_vercel_deployment_url
`;

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env.local file');

    // Create sample product data
    const sampleData = {
      products: [
        {
          shopify_product_id: 'gid://shopify/Product/123456789',
          title: 'Premium Wireless Headphones',
          price: 299.99,
          bidit_enabled: true,
          min_discount_percent: 10,
          max_discount_percent: 25
        }
      ]
    };

    const sampleDataPath = path.join(process.cwd(), 'sample-data.json');
    fs.writeFileSync(sampleDataPath, JSON.stringify(sampleData, null, 2));
    console.log('✅ Created sample-data.json');

    // Create setup instructions
    const instructions = `# BidIt Modal Setup Complete! 🎉

## Next Steps:

1. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Start development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

3. **Set up Supabase database:**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the schema from README.md

4. **Add sample product data:**
   - Use the sample-data.json file as reference
   - Insert products into your Supabase products table

5. **Test the modal:**
   - Open http://localhost:3000
   - Click "Try BidIt - Make an Offer"

## Shopify Integration:

1. Deploy to Vercel:
   \`\`\`bash
   npm run build
   # Deploy to Vercel
   \`\`\`

2. Add to your Shopify theme:
   \`\`\`html
   <script>
     window.BidItConfig = {
       modalUrl: 'https://your-vercel-app.vercel.app',
       productId: '{{ product.id }}',
       productTitle: '{{ product.title }}',
       productPrice: {{ product.price | divided_by: 100.0 }},
       userId: '{{ customer.id | default: "" }}'
     };
   </script>
   <script src="https://your-vercel-app.vercel.app/bidit-script.js"></script>
   \`\`\`

## Support:
- Check README.md for detailed documentation
- Create issues on GitHub for bugs or questions
`;

    const instructionsPath = path.join(process.cwd(), 'SETUP_COMPLETE.md');
    fs.writeFileSync(instructionsPath, instructions);
    console.log('✅ Created SETUP_COMPLETE.md');

    console.log('\n🎉 Setup complete! Check SETUP_COMPLETE.md for next steps.');
    console.log('\n📚 Documentation: README.md');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

setup(); 