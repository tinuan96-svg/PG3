/*
  # Replace Category Structure with Streamlined Mobile-Friendly Set

  ## Summary
  Removes all existing categories and replaces them with 17 clean, short, mobile-friendly
  top-level categories targeting UK customers searching for Kerala and Indian groceries.

  ## Changes Made

  ### Deleted
  - All existing category rows (via DELETE)

  ### New Categories (in order)
  1. Rice           — slug: rice
  2. Dals           — slug: dals
  3. Flours         — slug: flours
  4. Spices         — slug: spices
  5. Masalas        — slug: masalas
  6. Oils           — slug: oils
  7. Pickles        — slug: pickles
  8. Essentials     — slug: essentials
  9. Snacks         — slug: snacks
  10. Sweets        — slug: sweets
  11. Tea & Coffee  — slug: tea-coffee
  12. Fryums        — slug: fryums
  13. Instant Foods — slug: instant-foods
  14. Vegetables    — slug: vegetables
  15. Fruits        — slug: fruits
  16. Household     — slug: household
  17. Personal Care — slug: personal-care

  ### SEO Fields
  - description: plain-English category description targeting UK/Kerala grocery searches
  - meta_title: page title for SEO
  - meta_description: meta description for SEO
  - All categories set is_active = true
  - sort_order matches the required display order exactly

  ### Schema Notes
  - Uses IF EXISTS guards where possible
  - Adds meta_title and meta_description columns if not already present
  - Adds image_placeholder column for future image support
*/

-- Add SEO columns if they don't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'meta_title'
  ) THEN
    ALTER TABLE categories ADD COLUMN meta_title text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'meta_description'
  ) THEN
    ALTER TABLE categories ADD COLUMN meta_description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'image_placeholder'
  ) THEN
    ALTER TABLE categories ADD COLUMN image_placeholder text;
  END IF;
END $$;

-- Clear existing categories
DELETE FROM categories;

-- Insert 17 streamlined categories in exact display order
INSERT INTO categories (name, slug, description, meta_title, meta_description, sort_order, is_active, image_placeholder) VALUES
(
  'Rice',
  'rice',
  'Authentic Kerala and South Indian rice varieties including Matta rice, Ponni rice, Jeerakasala rice and Basmati. Delivered fresh to your door across the UK.',
  'Buy Kerala Rice Online UK | Matta Rice, Ponni Rice Delivery',
  'Shop premium Kerala rice varieties online in the UK. Matta rice, Ponni rice, Jeerakasala and more. Authentic South Indian rice with next day delivery.',
  10,
  true,
  '/category-images/rice.webp'
),
(
  'Dals',
  'dals',
  'High-quality Indian lentils, pulses and dals including toor dal, moong dal, chana dal and masoor dal. Essential pantry staples for South Indian cooking.',
  'Buy Indian Dals & Lentils Online UK | Kerala Pulses Delivery',
  'Order fresh Indian dals and lentils online in the UK. Toor dal, moong dal, chana dal and more. Authentic South Indian pulses with fast UK delivery.',
  20,
  true,
  '/category-images/dals.webp'
),
(
  'Flours',
  'flours',
  'Kerala and South Indian flours for making appam, puttu, idiyappam, dosa and pathiri. Includes rice flour, wheat atta, chickpea flour and specialty batters.',
  'Buy Kerala Flour Online UK | Rice Flour, Puttu Podi, Appam Podi',
  'Shop authentic Kerala flours online in the UK. Rice flour, puttu podi, appam podi, idiyappam podi and wheat atta. Next day delivery across the UK.',
  30,
  true,
  '/category-images/flours.webp'
),
(
  'Spices',
  'spices',
  'Whole and ground spices sourced from Kerala — turmeric, black pepper, cardamom, cinnamon, cloves and more. Essential for authentic South Indian cooking.',
  'Buy Kerala Spices Online UK | Authentic South Indian Spices Delivery',
  'Order authentic Kerala spices online in the UK. Turmeric, cardamom, black pepper, cinnamon and more. Premium South Indian spices with next day delivery.',
  40,
  true,
  '/category-images/spices.webp'
),
(
  'Masalas',
  'masalas',
  'Blended masala powders for fish curry, chicken, biryani, sambar, rasam and more. Trusted Kerala brands like Eastern, Brahmins and Kitchen Treasures.',
  'Buy Kerala Masala Powder Online UK | Fish Curry Masala, Sambar Powder',
  'Shop Kerala masala powders online in the UK. Fish curry masala, chicken masala, biryani masala and sambar powder. Authentic South Indian blends delivered to your door.',
  50,
  true,
  '/category-images/masalas.webp'
),
(
  'Oils',
  'oils',
  'Pure Kerala coconut oil, sesame oil, mustard oil and cooking oils. Cold-pressed and refined options from trusted South Indian brands.',
  'Buy Kerala Coconut Oil Online UK | South Indian Cooking Oils Delivery',
  'Order pure Kerala coconut oil and South Indian cooking oils online in the UK. Cold-pressed coconut oil, sesame oil and mustard oil with next day delivery.',
  60,
  true,
  '/category-images/oils.webp'
),
(
  'Pickles',
  'pickles',
  'Traditional Kerala pickles and preserves including mango pickle, lime pickle, prawn pickle and mixed vegetable pickle. Authentic recipes from Kerala brands.',
  'Buy Kerala Pickles Online UK | Mango Pickle, Lime Pickle Delivery',
  'Shop authentic Kerala pickles online in the UK. Mango pickle, lime pickle, prawn pickle and more. Traditional South Indian preserves delivered across the UK.',
  70,
  true,
  '/category-images/pickles.webp'
),
(
  'Essentials',
  'essentials',
  'Everyday pantry essentials including coconut milk, tamarind, jaggery, vinegar and canned goods. Everything you need for South Indian and Kerala cooking.',
  'Buy Kerala Grocery Essentials Online UK | South Indian Pantry Staples',
  'Order everyday Kerala and South Indian grocery essentials online in the UK. Coconut milk, tamarind, jaggery and pantry staples with fast next day delivery.',
  80,
  true,
  '/category-images/essentials.webp'
),
(
  'Snacks',
  'snacks',
  'Authentic Kerala and South Indian snacks including banana chips, tapioca chips, murukku, mixture and more. Crunchy, flavourful snacks straight from Kerala.',
  'Buy Kerala Snacks Online UK | Banana Chips, Murukku Delivery',
  'Shop authentic Kerala snacks online in the UK. Banana chips, tapioca chips, murukku and more. Traditional South Indian snacks delivered fresh across the UK.',
  90,
  true,
  '/category-images/snacks.webp'
),
(
  'Sweets',
  'sweets',
  'Traditional Kerala sweets and Indian mithai including halwa, barfi, ladoo, payasam mixes and coconut sweets. Perfect for celebrations and gifting.',
  'Buy Kerala Sweets Online UK | Indian Mithai, Halwa Delivery',
  'Order traditional Kerala sweets and Indian mithai online in the UK. Halwa, barfi, ladoo and coconut sweets delivered fresh. Perfect for festivals and gifting.',
  100,
  true,
  '/category-images/sweets.webp'
),
(
  'Tea & Coffee',
  'tea-coffee',
  'Premium Kerala and South Indian teas and coffees including Cardamom tea, Kerala filter coffee powder and masala chai blends. Rich flavours from the spice capital.',
  'Buy Kerala Tea & Coffee Online UK | Cardamom Tea, Filter Coffee Delivery',
  'Shop premium Kerala teas and South Indian filter coffee online in the UK. Cardamom tea, masala chai and filter coffee powder with fast UK delivery.',
  110,
  true,
  '/category-images/tea-coffee.webp'
),
(
  'Fryums',
  'fryums',
  'Unfried fryums, papads, appalam and sundried snacks from Kerala and South India. Ready to fry or microwave for a quick, crispy side dish.',
  'Buy Fryums & Papads Online UK | Kerala Appalam, Papad Delivery',
  'Order fryums, papads and appalam online in the UK. South Indian sundried snacks and papad varieties delivered to your door with fast next day delivery.',
  120,
  true,
  '/category-images/fryums.webp'
),
(
  'Instant Foods',
  'instant-foods',
  'Quick and easy instant mixes for idli, dosa, upma, sambar and more. Ready-to-cook South Indian meals for busy days without compromising on authentic taste.',
  'Buy South Indian Instant Foods Online UK | Idli Mix, Dosa Mix Delivery',
  'Shop South Indian instant food mixes online in the UK. Idli mix, dosa mix, upma mix and ready-to-cook Kerala meals delivered with next day delivery.',
  130,
  true,
  '/category-images/instant-foods.webp'
),
(
  'Vegetables',
  'vegetables',
  'Fresh and dried South Indian vegetables including drumstick, raw banana, yam, raw jackfruit and dried vegetables used in traditional Kerala cooking.',
  'Buy South Indian Vegetables Online UK | Kerala Vegetables Delivery',
  'Order authentic South Indian vegetables online in the UK. Drumstick, raw banana, yam, jackfruit and more Kerala cooking vegetables with next day delivery.',
  140,
  true,
  '/category-images/vegetables.webp'
),
(
  'Fruits',
  'fruits',
  'Tropical and South Asian fruits popular in Indian cooking including raw mango, tamarind, dried kokum and jackfruit. Fresh and processed fruit products.',
  'Buy South Indian Fruits Online UK | Raw Mango, Jackfruit Delivery',
  'Shop South Indian fruits online in the UK. Raw mango, jackfruit, tamarind and tropical fruits used in Kerala and Indian cooking. Fast UK delivery.',
  150,
  true,
  '/category-images/fruits.webp'
),
(
  'Household',
  'household',
  'Indian household cleaning and kitchen products including dishwash liquids, coconut coir, brass cleaners and South Asian home essentials.',
  'Buy Indian Household Products Online UK | South Asian Home Essentials',
  'Order Indian household and home care products online in the UK. Cleaning essentials, kitchen products and South Asian home care items with fast delivery.',
  160,
  true,
  '/category-images/household.webp'
),
(
  'Personal Care',
  'personal-care',
  'Ayurvedic and South Indian personal care products including coconut hair oil, herbal soaps, face packs, and traditional Kerala beauty essentials.',
  'Buy Ayurvedic Personal Care Online UK | Kerala Beauty Products Delivery',
  'Shop Ayurvedic and South Indian personal care products online in the UK. Coconut oil hair care, herbal soaps and traditional Kerala beauty essentials delivered.',
  170,
  true,
  '/category-images/personal-care.webp'
);
