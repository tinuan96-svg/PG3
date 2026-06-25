# PocketGrocery Growth Engine

Complete growth system for increasing average order value through WooCommerce integration, product bundles, cross-sell, and upsell strategies.

## Features

### 1. WooCommerce Product Sync
- Automatic sync every 30 minutes
- Manual sync button in admin dashboard
- Syncs all product data including:
  - Product name, slug, description
  - Images, categories, brands
  - Price, sale price, stock status
  - Weight, tags, coin rewards
- Prevents duplicate products using WooCommerce product ID
- Detailed sync logs with success/failure tracking

### 2. Smart Product Bundles
- Create curated product bundles to increase order value
- Examples: Kerala Cooking Starter Pack, Onam Essentials Bundle
- Features:
  - Bundle name, description, image
  - Multiple products per bundle
  - Discounted bundle pricing
  - Automatic savings calculation
  - Coin rewards integration
  - Display location control (homepage, product pages, cart)
- Admin can create, edit, enable/disable, and delete bundles

### 3. AI Cross-Sell System
- Automatically suggests related products
- Multiple recommendation types:
  - Frequently bought together
  - You may also like
  - Complete your meal
- Smart algorithms:
  - Category similarity matching
  - Tag-based recommendations
  - Manual admin rules support
- Tracks conversion rates for optimization

### 4. Basket Value Booster
- Visual progress bar showing delivery threshold
- Free delivery above £40
- Real-time updates as cart changes
- Clear messaging: "You are £12 away from FREE delivery"
- Encourages customers to add more items

### 5. Smart Add-On Products
- Context-aware product suggestions
- One-click add to cart
- Example: Buying Idiyappam flour suggests coconut milk, sugar, cardamom
- Appears during checkout flow

### 6. Upsell Popup
- Shows when product added to cart
- Displays 3 recommended items
- Quick add functionality
- Tracks views and conversions
- Can be closed to continue shopping

### 7. Pocket Coin Integration
- Bundles also award Pocket Coins
- Coin calculation follows product values
- Coins update after order delivery
- Displayed prominently on bundle cards

### 8. Growth Analytics Dashboard
- Comprehensive tracking:
  - Bundle sales and revenue
  - Cross-sell conversions
  - Upsell conversions
  - Average order value impact
- Time-based filtering (7, 30, 90 days)
- Revenue breakdown visualization
- Performance insights

## Configuration

### WooCommerce Setup

Add your WooCommerce credentials to `.env`:

```env
NEXT_PUBLIC_WC_STORE_URL=https://your-woocommerce-store.com
WC_CONSUMER_KEY=your_woocommerce_consumer_key
WC_CONSUMER_SECRET=your_woocommerce_consumer_secret
```

To get your WooCommerce API credentials:
1. Go to your WooCommerce dashboard
2. Navigate to WooCommerce > Settings > Advanced > REST API
3. Click "Add key"
4. Set permissions to "Read"
5. Copy the Consumer Key and Consumer Secret

### Automatic Sync

The system automatically syncs products every 30 minutes. To set this up:

1. Create a cron job or scheduled task
2. Make a POST request to: `/api/admin/woocommerce-sync`
3. Example cron job: `*/30 * * * * curl -X POST https://pocketgrocery.com/api/admin/woocommerce-sync`

## Admin Pages

### WooCommerce Sync
**URL:** `/admin/woocommerce-sync`

- View sync history
- Manual sync button
- See products synced, added, updated, failed
- Error logs for troubleshooting

### Bundle Management
**URL:** `/admin/bundles`

- Create new bundles
- Edit existing bundles
- Enable/disable bundles
- Delete bundles
- View bundle performance

### Growth Analytics
**URL:** `/admin/growth-analytics`

- Total revenue from growth engine
- Bundle sales statistics
- Cross-sell performance
- Upsell conversion tracking
- Average order value metrics

## API Endpoints

### Product Sync
```
POST /api/admin/woocommerce-sync
```
Manually trigger product sync from WooCommerce.

### Bundles
```
GET /api/bundles?location=homepage
```
Get active bundles for specific location.

```
GET /api/admin/bundles
POST /api/admin/bundles
PATCH /api/admin/bundles/[id]
DELETE /api/admin/bundles/[id]
```
Admin endpoints for bundle management.

### Cross-Sell
```
GET /api/cross-sell?productId={id}&type=frequently_bought
```
Get cross-sell recommendations for a product.

Types: `frequently_bought`, `you_may_like`, `upsell`

### Analytics
```
POST /api/analytics
```
Track growth engine events.

```
GET /api/analytics?days=30
```
Get analytics summary.

## Database Schema

### woocommerce_products
Stores synced products from WooCommerce with full product details.

### product_bundles
Bundle definitions with pricing and product associations.

### cross_sell_rules
Manual and automatic cross-sell recommendation rules.

### growth_analytics
Event tracking for all growth engine interactions.

### sync_logs
Detailed logs of all WooCommerce sync operations.

## Components

### BundleCard
Displays bundle with savings, pricing, and coin rewards.

### CrossSellSection
Shows related product recommendations on product pages.

### BasketProgressBar
Visual progress toward free delivery threshold.

### UpsellPopup
Modal that appears after adding to cart with recommendations.

## Usage Examples

### Display Bundles on Homepage
```typescript
import { growthEngine } from '@/lib/growth-engine'

const bundles = await growthEngine.getActiveBundles('homepage')
```

### Show Cross-Sell on Product Page
```tsx
<CrossSellSection
  productId={product.id}
  title="Frequently Bought Together"
  type="frequently_bought"
/>
```

### Show Basket Progress in Cart
```tsx
<BasketProgressBar cartTotal={45.99} threshold={40} />
```

### Track Analytics Event
```typescript
import { growthEngine } from '@/lib/growth-engine'

await growthEngine.trackAnalytics({
  event_type: 'bundle_purchase',
  bundle_id: 'bundle-123',
  revenue_impact: 22.00,
})
```

## Performance Optimization

- Server-side rendering for product pages
- Caching of bundle data
- Efficient database queries with indexes
- Lazy loading of recommendation widgets
- Minimal impact on page load times

## Best Practices

### Creating Effective Bundles
1. Choose complementary products
2. Price bundles 15-25% below individual prices
3. Use appealing bundle names (e.g., "Kerala Breakfast Pack")
4. Include high-quality bundle images
5. Display bundles on multiple pages

### Setting Up Cross-Sell Rules
1. Start with category-based recommendations
2. Add manual rules for popular combinations
3. Monitor conversion rates
4. Update rules based on performance
5. Test different recommendation types

### Monitoring Performance
1. Check analytics dashboard weekly
2. Track average order value trends
3. Identify top-performing bundles
4. Optimize low-performing recommendations
5. A/B test different bundle configurations

## Troubleshooting

### Products Not Syncing
- Check WooCommerce credentials in `.env`
- Verify WooCommerce REST API is enabled
- Check sync logs for error messages
- Ensure WooCommerce store is accessible

### Bundles Not Showing
- Verify bundle is marked as active
- Check display location settings
- Ensure products in bundle are in stock
- Clear cache if using caching layer

### Analytics Not Tracking
- Check browser console for errors
- Verify API endpoint is accessible
- Ensure event_type is valid
- Check database RLS policies

## Support

For issues or questions about the Growth Engine, check:
- Sync logs in admin dashboard
- Browser console for frontend errors
- Database logs for backend issues
- Analytics dashboard for performance metrics
