# PocketGrocery.com - Kerala Groceries Ecommerce Platform

A production-ready ecommerce platform for selling Kerala groceries online across the UK with fast next day delivery and a unique Pocket Coin rewards system.

## Features

### Core Ecommerce
- Complete product catalog with categories and brands
- Product detail pages with SEO optimization
- Shopping cart and checkout system
- Order management and tracking
- Customer accounts and profiles
- Product reviews and ratings
- Admin dashboard for managing products, orders, and settings

### Unique Pocket Coin System
- Customers earn Pocket Coins on every purchase
- Coins can be redeemed for discounts (1 coin = £0.01)
- Gamified rewards including referrals, daily login bonuses
- Wallet dashboard showing balance and transaction history
- Admin controls for coin values, expiry, and redemption limits

### Business Features
- Fast next day delivery (order before 4 PM)
- Free delivery over £40
- Multiple payment options via Stripe
- CSV product import system
- Referral program (100 coins for referrer, 50 for friend)
- Blog system for SEO and content marketing
- Newsletter capture and email collection

### SEO & Marketing
- SEO-optimized product and category pages
- Dedicated landing pages for Kerala groceries keywords
- XML sitemap and robots.txt
- OpenGraph and Twitter card meta tags
- Structured data/schema markup ready
- Blog system for organic traffic

### Technical Stack
- Next.js 14 with App Router and React Server Components
- TypeScript for type safety
- Tailwind CSS for styling
- Supabase for database and authentication
- Stripe for payment processing
- Image optimization with Next/Image
- Vercel deployment ready

## Database Schema

The platform uses Supabase PostgreSQL with comprehensive tables:
- users (with role-based access)
- products (with coin rewards and profit margins)
- categories & brands
- orders & order_items
- user_wallets & wallet_transactions
- referrals
- reviews
- blog_posts
- settings (for site configuration)

All tables have Row Level Security enabled.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Project Structure

```
/app - Next.js app directory with routes
  /admin - Admin dashboard pages
  /products - Product listing and detail pages
  /account - Customer account pages
  /wallet - Pocket Wallet pages
  /kerala-groceries-uk - SEO landing page

/components - Reusable React components
  Header.tsx, Footer.tsx - Layout components
  Hero.tsx, Features.tsx - Homepage sections
  FeaturedProducts.tsx - Product showcase

/lib - Utility functions and services
  supabase.ts - Supabase client
  auth.ts - Authentication helpers
  wallet.ts - Coin wallet functions
  settings.ts - Site settings management

/public - Static assets
```

## Key Pages

- `/` - Homepage with hero, features, products
- `/products` - Product catalog
- `/products/[slug]` - Product detail pages
- `/wallet` - Pocket Coin wallet information
- `/account` - Customer dashboard
- `/admin` - Admin panel
- `/kerala-groceries-uk` - SEO landing page

## Deployment

The application is ready for deployment on Vercel:

1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy

The build is optimized and production-ready.

## Admin Features

Access the admin dashboard at `/admin` to:
- Manage products, categories, brands
- View and update orders
- Import products via CSV
- Configure Pocket Coin settings
- Manage site settings

## Pocket Coin System

The unique reward system works as follows:
1. Each product has a `coin_reward` value
2. Customers earn coins when orders are delivered
3. Coins can be used for discounts at checkout
4. Additional coins from referrals and bonuses
5. Admin configurable maximum coins per order

## Stripe Integration

To enable payments:
1. Add Stripe keys to environment variables
2. Configure webhooks
3. Test in development mode
4. Deploy to production

## Future Enhancements

The platform is built with scalability in mind:
- Multi-warehouse support
- Mobile app integration
- Subscription grocery boxes
- Advanced analytics
- Inventory forecasting
- Customer segmentation

## Support

For issues or questions, contact the development team.

---

Built with Next.js, Supabase, and Stripe for PocketGrocery.com
