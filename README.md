# BidIt Modal - Interactive E-commerce Bidding System

A modern, shadcn-styled React modal that enables customers to make offers on products through an interactive bidding system. Built with Next.js, TypeScript, and Supabase for seamless Shopify integration.

<!-- Dummy comment to trigger fresh deployment -->

## 🚀 Features

- **Step-by-step bidding flow** - Guided user experience from product info to bid submission
- **Real-time bid quality feedback** - Instant feedback on bid likelihood of success
- **Merchant vs Customer bidding** - Customers bid against merchants, not other customers
- **Comprehensive analytics** - Every interaction logged to Supabase for insights
- **Responsive design** - Beautiful UI that works on all devices
- **TypeScript support** - Full type safety throughout the application

## 📋 Prerequisites

- Node.js 18+ 
- Supabase account and project
- Shopify store (for integration)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bidit_v2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase database**
   
   Run the provided schema in your Supabase SQL editor:
   ```sql
   -- Create tables for BidIt system
   CREATE TABLE public.products (
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

   CREATE TABLE public.users (
     id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
     auth_user_id uuid UNIQUE,
     created_at timestamp with time zone DEFAULT now(),
     CONSTRAINT users_pkey PRIMARY KEY (id),
     CONSTRAINT users_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id)
   );

   CREATE TABLE public.bids (
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

   CREATE TABLE public.bid_logs (
     id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
     bid_id integer,
     event_type text NOT NULL,
     event_data jsonb,
     created_at timestamp with time zone DEFAULT now(),
     CONSTRAINT bid_logs_pkey PRIMARY KEY (id),
     CONSTRAINT bid_logs_bid_id_fkey FOREIGN KEY (bid_id) REFERENCES public.bids(id)
   );
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

### Basic Modal Integration

```tsx
import BidItModal from '@/components/BidItModal'

function ProductPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>
        Try BidIt - Make an Offer
      </button>
      
      <BidItModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shopifyProductId="gid://shopify/Product/123456789"
        productTitle="Premium Wireless Headphones"
        productPrice={299.99}
        userId="1"
      />
    </div>
  )
}
```

### Shopify Integration

1. **Deploy to Vercel**
   ```bash
   npm run build
   # Deploy to Vercel
   ```

2. **Add script to Shopify theme**
   ```html
   <!-- In your product template -->
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
   ```

## 🔧 Configuration

### Bid Quality Messages

The modal provides real-time feedback on bid quality. Customize messages in `components/BidItModal.tsx`:

```tsx
const getBidQuality = (amount: number): BidQuality => {
  const discountPercent = ((product.price - amount) / product.price) * 100
  
  if (discountPercent >= product.max_discount_percent) {
    return { message: 'Way too high!', color: 'text-red-500', icon: <TrendingDown /> }
  } else if (discountPercent >= product.min_discount_percent) {
    return { message: 'Hot! Almost there', color: 'text-orange-500', icon: <TrendingUp /> }
  }
  // ... more conditions
}
```

### Database Schema

The system uses four main tables:

- **products**: Store product information and discount thresholds
- **users**: Link to Supabase Auth users
- **bids**: Track individual bids and their status
- **bid_logs**: Log all user interactions for analytics

## 📊 Analytics

Every user interaction is logged to the `bid_logs` table:

- `modal_opened`: When user opens the modal
- `product_fetched`: When product data is loaded
- `bid_submitted`: When user submits a bid
- `bid_evaluated`: When bid is processed

Query analytics data:
```sql
SELECT 
  event_type,
  COUNT(*) as count,
  DATE(created_at) as date
FROM bid_logs 
GROUP BY event_type, DATE(created_at)
ORDER BY date DESC;
```

## 🎨 Customization

### Styling

The modal uses Tailwind CSS with shadcn/ui components. Customize colors and styling in:

- `globals.css` - CSS variables for theming
- `tailwind.config.js` - Tailwind configuration
- Individual component files for specific styling

### Components

- `BidItModal.tsx` - Main modal component
- `components/ui/` - Reusable UI components
- `lib/supabase.ts` - Database client and types

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

The modal can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Check the [documentation](docs/)
- Review the [FAQ](docs/FAQ.md)

## 🔮 Roadmap

- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] A/B testing framework
- [ ] Mobile app integration
- [ ] Advanced bid algorithms
- [ ] Social sharing features 