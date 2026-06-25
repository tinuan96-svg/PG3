/*
  # PocketGrocery E-commerce Platform Schema

  ## Overview
  Complete database schema for PocketGrocery.com - Kerala groceries e-commerce platform with viral coin wallet system.

  ## 1. New Tables

  ### Users Table
  - `id` (uuid, primary key) - User identifier
  - `email` (text, unique) - User email address
  - `name` (text) - User full name
  - `password_hash` (text) - Bcrypt hashed password
  - `role` (enum) - User role: customer or admin
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### Categories Table
  - `id` (uuid, primary key) - Category identifier
  - `name` (text) - Category name
  - `slug` (text, unique) - URL-friendly slug
  - `description` (text) - Category description
  - `seo_title` (text) - SEO optimized title
  - `seo_description` (text) - SEO meta description
  - `image_url` (text) - Category image URL
  - `created_at` (timestamptz) - Creation timestamp

  ### Brands Table
  - `id` (uuid, primary key) - Brand identifier
  - `name` (text) - Brand name
  - `slug` (text, unique) - URL-friendly slug
  - `description` (text) - Brand description
  - `logo_url` (text) - Brand logo URL
  - `created_at` (timestamptz) - Creation timestamp

  ### Products Table
  - `id` (uuid, primary key) - Product identifier
  - `name` (text) - Product name
  - `slug` (text, unique) - URL-friendly slug
  - `short_description` (text) - Brief product description
  - `description` (text) - Full product description
  - `category_id` (uuid) - Foreign key to categories
  - `brand_id` (uuid) - Foreign key to brands
  - `price` (numeric) - Product price in GBP
  - `offer_price` (numeric) - Discounted price
  - `weight` (text) - Product weight/size
  - `stock_quantity` (integer) - Available stock count
  - `stock_status` (enum) - in_stock, out_of_stock, or backorder
  - `profit_margin` (numeric) - Profit margin percentage
  - `coin_reward` (integer) - Pocket Coins awarded per purchase
  - `images` (jsonb) - Array of product image URLs
  - `tags` (jsonb) - Array of product tags
  - `seo_title` (text) - SEO optimized title
  - `seo_description` (text) - SEO meta description
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### Orders Table
  - `id` (uuid, primary key) - Order identifier
  - `user_id` (uuid) - Foreign key to users
  - `order_number` (text, unique) - Human-readable order number
  - `status` (enum) - pending, paid, processing, shipped, delivered, cancelled
  - `subtotal` (numeric) - Order subtotal before delivery
  - `delivery_charge` (numeric) - Delivery fee
  - `coins_discount` (numeric) - Discount from coins in GBP
  - `coins_used` (integer) - Number of Pocket Coins used
  - `coins_earned` (integer) - Pocket Coins earned from order
  - `total` (numeric) - Final order total
  - `payment_status` (enum) - pending, completed, failed
  - `payment_intent_id` (text) - Stripe payment intent ID
  - `shipping_name` (text) - Delivery recipient name
  - `shipping_email` (text) - Contact email
  - `shipping_phone` (text) - Contact phone
  - `shipping_address` (text) - Street address
  - `shipping_city` (text) - City
  - `shipping_postcode` (text) - Postcode
  - `created_at` (timestamptz) - Order creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### Order Items Table
  - `id` (uuid, primary key) - Order item identifier
  - `order_id` (uuid) - Foreign key to orders
  - `product_id` (uuid) - Foreign key to products
  - `product_name` (text) - Product name snapshot
  - `product_price` (numeric) - Price at time of purchase
  - `quantity` (integer) - Quantity ordered
  - `coins_earned` (integer) - Coins earned for this item
  - `created_at` (timestamptz) - Creation timestamp

  ### Wallet Transactions Table
  - `id` (uuid, primary key) - Transaction identifier
  - `user_id` (uuid) - Foreign key to users
  - `type` (enum) - earned, used, expired, referral, bonus
  - `amount` (integer) - Coin amount (positive or negative)
  - `order_id` (uuid) - Related order if applicable
  - `description` (text) - Transaction description
  - `created_at` (timestamptz) - Transaction timestamp

  ### User Wallets Table
  - `id` (uuid, primary key) - Wallet identifier
  - `user_id` (uuid, unique) - Foreign key to users
  - `total_coins` (integer) - Current coin balance
  - `coins_earned` (integer) - Lifetime coins earned
  - `coins_used` (integer) - Lifetime coins used
  - `updated_at` (timestamptz) - Last update timestamp

  ### Referrals Table
  - `id` (uuid, primary key) - Referral identifier
  - `referrer_id` (uuid) - User who shared referral
  - `referee_id` (uuid) - User who used referral code
  - `referral_code` (text, unique) - Unique referral code
  - `status` (enum) - pending or completed
  - `coins_awarded` (boolean) - Whether coins were given
  - `created_at` (timestamptz) - Creation timestamp

  ### Reviews Table
  - `id` (uuid, primary key) - Review identifier
  - `product_id` (uuid) - Foreign key to products
  - `user_id` (uuid) - Foreign key to users
  - `rating` (integer) - 1-5 star rating
  - `review` (text) - Review text
  - `images` (jsonb) - Array of review image URLs
  - `verified_purchase` (boolean) - Whether user bought product
  - `created_at` (timestamptz) - Review timestamp

  ### Blog Posts Table
  - `id` (uuid, primary key) - Post identifier
  - `title` (text) - Post title
  - `slug` (text, unique) - URL-friendly slug
  - `excerpt` (text) - Short excerpt
  - `content` (text) - Full post content
  - `featured_image` (text) - Featured image URL
  - `tags` (jsonb) - Array of tags
  - `seo_title` (text) - SEO optimized title
  - `seo_description` (text) - SEO meta description
  - `published` (boolean) - Publication status
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### Settings Table
  - `id` (uuid, primary key) - Setting identifier
  - `key` (text, unique) - Setting key name
  - `value` (text) - Setting value (JSON stringified)
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security

  - Enable Row Level Security (RLS) on all tables
  - Customers can only view/edit their own data
  - Admins have full access to all tables
  - Products, categories, brands, and blog posts are publicly readable
  - Orders require authentication
  - Wallet transactions are user-specific

  ## 3. Indexes

  - Create indexes on frequently queried columns
  - Optimize for product search, filtering, and ordering
  - Index foreign keys for join performance

  ## 4. Important Notes

  - Coin system: 1 coin = £0.01 discount
  - Coins awarded after order is delivered (status = 'delivered')
  - Free delivery above £40, otherwise £4.99
  - Next day delivery if ordered before 4 PM
  - All prices in GBP (pounds sterling)
  - Product images stored as JSON arrays
  - SEO fields on all public-facing entities
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  seo_title text,
  seo_description text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Brands table
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  logo_url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  short_description text,
  description text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  brand_id uuid REFERENCES brands(id) ON DELETE SET NULL,
  price numeric(10, 2) NOT NULL,
  offer_price numeric(10, 2),
  weight text,
  stock_quantity integer DEFAULT 0,
  stock_status text DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'out_of_stock', 'backorder')),
  profit_margin numeric(5, 2) DEFAULT 0,
  coin_reward integer DEFAULT 0,
  images jsonb DEFAULT '[]'::jsonb,
  tags jsonb DEFAULT '[]'::jsonb,
  seo_title text,
  seo_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON products(stock_status);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  order_number text UNIQUE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal numeric(10, 2) NOT NULL,
  delivery_charge numeric(10, 2) DEFAULT 0,
  coins_discount numeric(10, 2) DEFAULT 0,
  coins_used integer DEFAULT 0,
  coins_earned integer DEFAULT 0,
  total numeric(10, 2) NOT NULL,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  payment_intent_id text,
  shipping_name text NOT NULL,
  shipping_email text NOT NULL,
  shipping_phone text NOT NULL,
  shipping_address text NOT NULL,
  shipping_city text NOT NULL,
  shipping_postcode text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_price numeric(10, 2) NOT NULL,
  quantity integer NOT NULL,
  coins_earned integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Wallet transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('earned', 'used', 'expired', 'referral', 'bonus')),
  amount integer NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);

-- User wallets table
CREATE TABLE IF NOT EXISTS user_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_coins integer DEFAULT 0,
  coins_earned integer DEFAULT 0,
  coins_used integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_wallets_user ON user_wallets(user_id);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  referee_id uuid REFERENCES users(id) ON DELETE SET NULL,
  referral_code text UNIQUE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  coins_awarded boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review text,
  images jsonb DEFAULT '[]'::jsonb,
  verified_purchase boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text,
  content text NOT NULL,
  featured_image text,
  tags jsonb DEFAULT '[]'::jsonb,
  seo_title text,
  seo_description text,
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Categories policies (public read)
CREATE POLICY "Categories are publicly readable"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Brands policies (public read)
CREATE POLICY "Brands are publicly readable"
  ON brands FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage brands"
  ON brands FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Products policies (public read)
CREATE POLICY "Products are publicly readable"
  ON products FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Orders policies
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Order items policies
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Wallet transactions policies
CREATE POLICY "Users can view own wallet transactions"
  ON wallet_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create wallet transactions"
  ON wallet_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- User wallets policies
CREATE POLICY "Users can view own wallet"
  ON user_wallets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet"
  ON user_wallets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can create wallets"
  ON user_wallets FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Referrals policies
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can create referrals"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "System can update referrals"
  ON referrals FOR UPDATE
  TO authenticated
  USING (true);

-- Reviews policies
CREATE POLICY "Reviews are publicly readable"
  ON reviews FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Blog posts policies (public read)
CREATE POLICY "Published blog posts are publicly readable"
  ON blog_posts FOR SELECT
  TO anon, authenticated
  USING (published = true);

CREATE POLICY "Admins can view all blog posts"
  ON blog_posts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage blog posts"
  ON blog_posts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Settings policies
CREATE POLICY "Settings are publicly readable"
  ON settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage settings"
  ON settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Insert default settings
INSERT INTO settings (key, value) VALUES
  ('max_coins_per_order', '500'),
  ('coin_value_gbp', '0.01'),
  ('free_delivery_threshold', '40'),
  ('delivery_charge', '4.99'),
  ('cutoff_time_hours', '16'),
  ('referrer_coins', '100'),
  ('referee_coins', '50'),
  ('daily_login_coins', '5')
ON CONFLICT (key) DO NOTHING;

-- Insert default categories
INSERT INTO categories (name, slug, description, seo_title, seo_description) VALUES
  ('Kerala Spices', 'kerala-spices', 'Authentic Kerala spices including cardamom, pepper, turmeric and more', 'Kerala Spices UK | Buy Authentic Indian Spices Online', 'Shop authentic Kerala spices online in UK. Fast next day delivery. Premium quality cardamom, pepper, turmeric and traditional spice blends.'),
  ('Rice', 'rice', 'Premium quality rice varieties from Kerala and India', 'Buy Kerala Rice Online UK | Indian Rice Next Day Delivery', 'Order premium Kerala rice online with next day delivery across UK. Basmati, sona masoori, and traditional Kerala rice varieties.'),
  ('Flours', 'flours', 'Traditional Kerala flours for authentic cooking', 'Kerala Flours UK | Rice Flour, Wheat Flour, Atta Online', 'Buy Kerala flours online in UK. Rice flour, wheat flour, puttu podi and more. Fast delivery across UK.'),
  ('Pickles', 'pickles', 'Homestyle Kerala pickles and condiments', 'Kerala Pickles UK | Mango Pickle, Lime Pickle Online', 'Authentic Kerala pickles delivered to your door. Mango, lime, ginger pickles and traditional achars. Order online today.'),
  ('Snacks', 'snacks', 'Traditional Kerala snacks and namkeens', 'Kerala Snacks UK | Buy Indian Snacks Online', 'Delicious Kerala snacks and savories. Banana chips, mixtures, and traditional namkeens delivered across UK.'),
  ('Frozen Foods', 'frozen-foods', 'Frozen Kerala specialties and ready to cook items', 'Frozen Kerala Foods UK | Indian Frozen Foods Online', 'Buy frozen Kerala foods online. Parathas, dosas, and ready to cook items with fast UK delivery.'),
  ('Ready to Eat', 'ready-to-eat', 'Ready to eat Kerala meals and curries', 'Ready to Eat Kerala Meals UK | Instant Indian Curries', 'Convenient ready to eat Kerala meals. Instant curries, rice dishes and traditional foods delivered fresh.'),
  ('Ayurvedic Products', 'ayurvedic-products', 'Authentic Ayurvedic products from Kerala', 'Ayurvedic Products UK | Kerala Ayurveda Online', 'Shop authentic Kerala Ayurvedic products online. Health supplements, oils and traditional remedies.'),
  ('Coconut Products', 'coconut-products', 'Pure coconut oil, milk and coconut-based products', 'Coconut Products UK | Kerala Coconut Oil Online', 'Premium Kerala coconut products. Pure coconut oil, milk, powder and traditional coconut-based items.'),
  ('Beverages', 'beverages', 'Traditional Kerala beverages and drinks', 'Kerala Beverages UK | Indian Drinks Online', 'Authentic Kerala beverages and traditional drinks. Tea, coffee, health drinks delivered across UK.')
ON CONFLICT (slug) DO NOTHING;

-- Insert default brands
INSERT INTO brands (name, slug, description) VALUES
  ('Eastern', 'eastern', 'Eastern Condiments - Premium spices and masalas'),
  ('Nirapara', 'nirapara', 'Nirapara - Traditional Kerala food products'),
  ('Double Horse', 'double-horse', 'Double Horse - Trusted Kerala brand'),
  ('Brahmins', 'brahmins', 'Brahmins - Authentic South Indian products'),
  ('Kitchen Treasures', 'kitchen-treasures', 'Kitchen Treasures - Quality spices and ready mixes')
ON CONFLICT (slug) DO NOTHING;
