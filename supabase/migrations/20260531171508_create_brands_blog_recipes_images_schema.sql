/*
  # Full Brands, Blog, Recipes, Tags, Badges, RBAC, Product Images Schema

  ## New Tables
  1. `brands` — Enhanced brand table with logo, banner, SEO fields, centralhub sync
  2. `product_images` — Separate image management per product with ordering & primary flag
  3. `product_tags` — Tag assignments per product
  4. `product_badges` — Badge assignments per product (New Arrival, Deal, Best Seller, etc.)
  5. `blog_categories` — Blog category taxonomy
  6. `blog_posts` — Blog articles with draft/published workflow
  7. `recipes` — Recipe content
  8. `recipe_ingredients` — Ingredient lines for recipes
  9. `recipe_products` — Product links per recipe
  10. `customer_notes` — Admin notes on customer profiles

  ## Modified Tables
  - `user_profiles` — add role enum super_admin, content_manager

  ## Security
  - RLS enabled on all new tables
  - Admins have full write access
  - Public has SELECT on published content
*/

-- ─────────────────────────────────────────────────────────────────────────────
-- Brands (enhanced — may already exist with basic columns)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brands (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  slug            text UNIQUE NOT NULL,
  description     text DEFAULT '',
  logo_url        text DEFAULT '',
  banner_url      text DEFAULT '',
  seo_title       text DEFAULT '',
  seo_description text DEFAULT '',
  seo_keywords    text DEFAULT '',
  is_active       boolean NOT NULL DEFAULT true,
  featured        boolean NOT NULL DEFAULT false,
  -- CentralHub sync metadata
  centralhub_id   text,
  synced_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='banner_url') THEN
    ALTER TABLE brands ADD COLUMN banner_url text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='seo_title') THEN
    ALTER TABLE brands ADD COLUMN seo_title text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='seo_description') THEN
    ALTER TABLE brands ADD COLUMN seo_description text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='seo_keywords') THEN
    ALTER TABLE brands ADD COLUMN seo_keywords text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='featured') THEN
    ALTER TABLE brands ADD COLUMN featured boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='centralhub_id') THEN
    ALTER TABLE brands ADD COLUMN centralhub_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='synced_at') THEN
    ALTER TABLE brands ADD COLUMN synced_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='updated_at') THEN
    ALTER TABLE brands ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='brands' AND policyname='Public can view active brands') THEN
    CREATE POLICY "Public can view active brands" ON brands FOR SELECT USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='brands' AND policyname='Admins can manage brands') THEN
    CREATE POLICY "Admins can manage brands" ON brands FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role IN ('admin','super_admin','content_manager')))
      WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role IN ('admin','super_admin','content_manager')));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Product Images (separate table for multi-image management)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_images (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url          text NOT NULL,
  alt_text     text DEFAULT '',
  sort_order   int NOT NULL DEFAULT 0,
  is_primary   boolean NOT NULL DEFAULT false,
  storage_path text DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='product_images' AND policyname='Public can view product images') THEN
    CREATE POLICY "Public can view product images" ON product_images FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='product_images' AND policyname='Admins can manage product images') THEN
    CREATE POLICY "Admins can manage product images" ON product_images FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role IN ('admin','super_admin','content_manager')))
      WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role IN ('admin','super_admin','content_manager')));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Product Tags
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag        text NOT NULL,
  UNIQUE(product_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_product_tags_product_id ON product_tags(product_id);

ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='product_tags' AND policyname='Public can view product tags') THEN
    CREATE POLICY "Public can view product tags" ON product_tags FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='product_tags' AND policyname='Admins can manage product tags') THEN
    CREATE POLICY "Admins can manage product tags" ON product_tags FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role IN ('admin','super_admin','content_manager')))
      WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role IN ('admin','super_admin','content_manager')));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Product Badges
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_badges (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  badge      text NOT NULL CHECK (badge IN ('new_arrival','deal','best_seller','featured')),
  UNIQUE(product_id, badge)
);

CREATE INDEX IF NOT EXISTS idx_product_badges_product_id ON product_badges(product_id);

ALTER TABLE product_badges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='product_badges' AND policyname='Public can view product badges') THEN
    CREATE POLICY "Public can view product badges" ON product_badges FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='product_badges' AND policyname='Admins can manage product badges') THEN
    CREATE POLICY "Admins can manage product badges" ON product_badges FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role IN ('admin','super_admin','content_manager')))
      WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role IN ('admin','super_admin','content_manager')));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Blog Categories
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text UNIQUE NOT NULL,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='blog_categories' AND policyname='Public can view blog categories') THEN
    CREATE POLICY "Public can view blog categories" ON blog_categories FOR SELECT USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='blog_categories' AND policyname='Admins can manage blog categories') THEN
    CREATE POLICY "Admins can manage blog categories" ON blog_categories FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role IN ('admin','super_admin','content_manager')))
      WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role IN ('admin','super_admin','content_manager')));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Blog Posts
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  slug            text UNIQUE NOT NULL,
  excerpt         text DEFAULT '',
  content         text DEFAULT '',
  featured_image  text DEFAULT '',
  category_id     uuid REFERENCES blog_categories(id) ON DELETE SET NULL,
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  seo_title       text DEFAULT '',
  seo_description text DEFAULT '',
  seo_keywords    text DEFAULT '',
  author_id       uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  published_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category_id);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='blog_posts' AND policyname='Public can view published posts') THEN
    CREATE POLICY "Public can view published posts" ON blog_posts FOR SELECT USING (status = 'published');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='blog_posts' AND policyname='Admins can manage blog posts') THEN
    CREATE POLICY "Admins can manage blog posts" ON blog_posts FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role IN ('admin','super_admin','content_manager')))
      WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role IN ('admin','super_admin','content_manager')));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Recipes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  slug            text UNIQUE NOT NULL,
  excerpt         text DEFAULT '',
  featured_image  text DEFAULT '',
  prep_time_mins  int DEFAULT 0,
  cook_time_mins  int DEFAULT 0,
  servings        int DEFAULT 4,
  difficulty      text DEFAULT 'easy' CHECK (difficulty IN ('easy','medium','hard')),
  instructions    text DEFAULT '',
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  seo_title       text DEFAULT '',
  seo_description text DEFAULT '',
  seo_keywords    text DEFAULT '',
  published_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recipes_status ON recipes(status);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='recipes' AND policyname='Public can view published recipes') THEN
    CREATE POLICY "Public can view published recipes" ON recipes FOR SELECT USING (status = 'published');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='recipes' AND policyname='Admins can manage recipes') THEN
    CREATE POLICY "Admins can manage recipes" ON recipes FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role IN ('admin','super_admin','content_manager')))
      WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role IN ('admin','super_admin','content_manager')));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Recipe Ingredients
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id  uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name       text NOT NULL,
  quantity   text NOT NULL DEFAULT '',
  unit       text DEFAULT '',
  sort_order int NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='recipe_ingredients' AND policyname='Public can view recipe ingredients') THEN
    CREATE POLICY "Public can view recipe ingredients" ON recipe_ingredients FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='recipe_ingredients' AND policyname='Admins can manage recipe ingredients') THEN
    CREATE POLICY "Admins can manage recipe ingredients" ON recipe_ingredients FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role IN ('admin','super_admin','content_manager')))
      WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role IN ('admin','super_admin','content_manager')));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Recipe Products (links to product catalog)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipe_products (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id  uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  UNIQUE(recipe_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_recipe_products_recipe ON recipe_products(recipe_id);
ALTER TABLE recipe_products ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='recipe_products' AND policyname='Public can view recipe products') THEN
    CREATE POLICY "Public can view recipe products" ON recipe_products FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='recipe_products' AND policyname='Admins can manage recipe products') THEN
    CREATE POLICY "Admins can manage recipe products" ON recipe_products FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role IN ('admin','super_admin','content_manager')))
      WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role IN ('admin','super_admin','content_manager')));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Customer Notes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  note        text NOT NULL,
  author_id   uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_notes_customer ON customer_notes(customer_id);
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='customer_notes' AND policyname='Admins can manage customer notes') THEN
    CREATE POLICY "Admins can manage customer notes" ON customer_notes FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role IN ('admin','super_admin')))
      WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND role IN ('admin','super_admin')));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Triggers for updated_at
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_brands') THEN
    CREATE TRIGGER set_updated_at_brands BEFORE UPDATE ON brands
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_blog_posts') THEN
    CREATE TRIGGER set_updated_at_blog_posts BEFORE UPDATE ON blog_posts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_recipes') THEN
    CREATE TRIGGER set_updated_at_recipes BEFORE UPDATE ON recipes
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
