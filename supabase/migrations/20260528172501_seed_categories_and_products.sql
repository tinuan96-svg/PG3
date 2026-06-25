/*
  # Seed categories and products

  Inserts 12 Kerala grocery categories and 50 products, all approved and visible,
  so the storefront shows real products immediately.
*/

-- ─── Categories ───────────────────────────────────────────────────────────────

INSERT INTO categories (name, slug, is_active, sort_order) VALUES
  ('Rice & Flour',       'rice-flour',       true, 1),
  ('Spices & Masalas',   'spices-masalas',   true, 2),
  ('Snacks & Sweets',    'snacks-sweets',    true, 3),
  ('Pickles & Chutneys', 'pickles-chutneys', true, 4),
  ('Oils & Ghee',        'oils-ghee',        true, 5),
  ('Pulses & Lentils',   'pulses-lentils',   true, 6),
  ('Ready to Eat',       'ready-to-eat',     true, 7),
  ('Tea & Coffee',       'tea-coffee',       true, 8),
  ('Coconut Products',   'coconut-products', true, 9),
  ('Breakfast & Mixes',  'breakfast-mixes',  true, 10),
  ('Frozen Foods',       'frozen-foods',     true, 11),
  ('Papads & Fryums',    'papads-fryums',    true, 12)
ON CONFLICT (slug) DO NOTHING;

-- ─── Products ─────────────────────────────────────────────────────────────────
-- Use a DO block to resolve category UUIDs at runtime.

DO $$
DECLARE
  c_rice       uuid;
  c_spices     uuid;
  c_snacks     uuid;
  c_pickles    uuid;
  c_oils       uuid;
  c_pulses     uuid;
  c_ready      uuid;
  c_tea        uuid;
  c_coconut    uuid;
  c_breakfast  uuid;
  c_frozen     uuid;
  c_papads     uuid;
BEGIN
  SELECT id INTO c_rice       FROM categories WHERE slug = 'rice-flour';
  SELECT id INTO c_spices     FROM categories WHERE slug = 'spices-masalas';
  SELECT id INTO c_snacks     FROM categories WHERE slug = 'snacks-sweets';
  SELECT id INTO c_pickles    FROM categories WHERE slug = 'pickles-chutneys';
  SELECT id INTO c_oils       FROM categories WHERE slug = 'oils-ghee';
  SELECT id INTO c_pulses     FROM categories WHERE slug = 'pulses-lentils';
  SELECT id INTO c_ready      FROM categories WHERE slug = 'ready-to-eat';
  SELECT id INTO c_tea        FROM categories WHERE slug = 'tea-coffee';
  SELECT id INTO c_coconut    FROM categories WHERE slug = 'coconut-products';
  SELECT id INTO c_breakfast  FROM categories WHERE slug = 'breakfast-mixes';
  SELECT id INTO c_frozen     FROM categories WHERE slug = 'frozen-foods';
  SELECT id INTO c_papads     FROM categories WHERE slug = 'papads-fryums';

  INSERT INTO products (name, slug, short_description, description, image, price, compare_price, category_id, featured, approval_status, visibility_status, tags)
  VALUES

  -- Rice & Flour
  ('Nirapara Matta Rice 5kg','nirapara-matta-rice-5kg',
   'Traditional Kerala red rice, rich in fibre',
   'Nirapara Matta Rice is a premium traditional Kerala variety. Rich in fibre and nutrients, a staple in South Indian households.',
   'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=400',
   12.99,14.99,c_rice,true,'approved','visible',ARRAY['rice','kerala','nirapara']),

  ('Double Horse Rice Powder 1kg','double-horse-rice-powder-1kg',
   'Fine rice flour for appam, idiyappam and puttu',
   'Double Horse Rice Powder is finely milled from the best quality rice. Perfect for traditional Kerala dishes.',
   'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=400',
   2.49,NULL,c_rice,false,'approved','visible',ARRAY['rice flour','puttu','appam']),

  ('Eastern Wheat Atta 5kg','eastern-wheat-atta-5kg',
   'Whole wheat flour for soft rotis and chapatis',
   'Eastern Wheat Atta is made from premium whole wheat grains, stone-ground to retain nutrients.',
   'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=400',
   8.99,10.99,c_rice,false,'approved','visible',ARRAY['atta','wheat','flour']),

  ('Nirapara Puttu Podi 1kg','nirapara-puttu-podi-1kg',
   'Ready-mix rice flour for authentic Kerala puttu',
   'Nirapara Puttu Podi is specially processed rice flour for making the famous Kerala breakfast — puttu.',
   'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=400',
   2.99,NULL,c_rice,false,'approved','visible',ARRAY['puttu','kerala breakfast']),

  ('Nirapara Red Rice 5kg','nirapara-red-rice-5kg',
   'Nutritious rosematta red rice from Kerala',
   'Nirapara Red Rice (Rosematta) has a distinctive nutty flavour. Rich in antioxidants and fibre.',
   'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=400',
   11.99,13.99,c_rice,true,'approved','visible',ARRAY['red rice','rosematta','nirapara']),

  -- Spices & Masalas
  ('Eastern Coriander Powder 200g','eastern-coriander-powder-200g',
   'Pure ground coriander with rich aroma',
   'Eastern Coriander Powder is made from carefully selected coriander seeds, slow-roasted and finely ground.',
   'https://images.pexels.com/photos/2802527/pexels-photo-2802527.jpeg?auto=compress&cs=tinysrgb&w=400',
   1.79,2.29,c_spices,true,'approved','visible',ARRAY['spice','coriander','eastern']),

  ('Eastern Chilli Powder 500g','eastern-chilli-powder-500g',
   'Vibrant red chilli powder with bold heat',
   'Eastern Chilli Powder is ground from premium dried red chillies. Vivid colour and balanced heat.',
   'https://images.pexels.com/photos/2802527/pexels-photo-2802527.jpeg?auto=compress&cs=tinysrgb&w=400',
   2.99,NULL,c_spices,false,'approved','visible',ARRAY['chilli','spice','red chilli']),

  ('Nirapara Garam Masala 100g','nirapara-garam-masala-100g',
   'Aromatic blend of whole roasted spices',
   'Nirapara Garam Masala is a fragrant blend of cardamom, cloves, cinnamon and black pepper.',
   'https://images.pexels.com/photos/2802527/pexels-photo-2802527.jpeg?auto=compress&cs=tinysrgb&w=400',
   1.99,2.49,c_spices,false,'approved','visible',ARRAY['garam masala','spice blend']),

  ('Eastern Turmeric Powder 200g','eastern-turmeric-powder-200g',
   'Pure golden turmeric with high curcumin content',
   'Eastern Turmeric Powder is sourced from the finest turmeric roots, dried and ground to a vivid golden powder.',
   'https://images.pexels.com/photos/2802527/pexels-photo-2802527.jpeg?auto=compress&cs=tinysrgb&w=400',
   1.49,NULL,c_spices,false,'approved','visible',ARRAY['turmeric','haldi','golden spice']),

  ('Eastern Chicken Masala 100g','eastern-chicken-masala-100g',
   'Aromatic masala blend for perfect chicken curry',
   'Eastern Chicken Masala is a hand-crafted blend of whole spices for authentic South Indian chicken curry.',
   'https://images.pexels.com/photos/2802527/pexels-photo-2802527.jpeg?auto=compress&cs=tinysrgb&w=400',
   2.29,2.79,c_spices,true,'approved','visible',ARRAY['chicken masala','eastern','curry powder']),

  ('Eastern Fish Masala 100g','eastern-fish-masala-100g',
   'Special spice blend for Kerala fish curry',
   'Eastern Fish Masala is a classic Kerala blend of red chillies, coriander, pepper and spices.',
   'https://images.pexels.com/photos/2802527/pexels-photo-2802527.jpeg?auto=compress&cs=tinysrgb&w=400',
   2.29,NULL,c_spices,false,'approved','visible',ARRAY['fish masala','eastern','kerala curry']),

  ('Catch Black Pepper Powder 100g','catch-black-pepper-powder-100g',
   'Bold and pungent ground black pepper',
   'Catch Black Pepper Powder is made from premium Malabar black pepper, known for its sharp aroma.',
   'https://images.pexels.com/photos/2802527/pexels-photo-2802527.jpeg?auto=compress&cs=tinysrgb&w=400',
   1.89,NULL,c_spices,false,'approved','visible',ARRAY['pepper','black pepper','malabar']),

  ('Shan Biryani Masala 60g','shan-biryani-masala-60g',
   'Premium biryani spice kit for restaurant-style biryani',
   'Shan Biryani Masala contains a pre-measured blend of whole and ground spices for perfectly flavoured biryani.',
   'https://images.pexels.com/photos/2802527/pexels-photo-2802527.jpeg?auto=compress&cs=tinysrgb&w=400',
   1.79,1.99,c_spices,false,'approved','visible',ARRAY['biryani masala','shan','biryani']),

  ('Tamarind Block 200g','tamarind-block-200g',
   'Sour tamarind pulp for sambar and chutneys',
   'Pure tamarind block from premium Tamil Nadu tamarind. Seedless and tangy — essential for South Indian cooking.',
   'https://images.pexels.com/photos/2802527/pexels-photo-2802527.jpeg?auto=compress&cs=tinysrgb&w=400',
   1.29,NULL,c_spices,false,'approved','visible',ARRAY['tamarind','imli','souring agent']),

  -- Snacks & Sweets
  ('Haldiram Kerala Mixture 400g','haldiram-kerala-mixture-400g',
   'Crispy spiced savoury snack mix',
   'Haldiram Kerala Mixture features a crunchy blend of sev, fried gram, peanuts and curry leaves.',
   'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
   3.49,3.99,c_snacks,true,'approved','visible',ARRAY['snack','mixture','haldiram']),

  ('Banana Chips Plain 200g','banana-chips-plain-200g',
   'Crispy thin-sliced Kerala banana chips in coconut oil',
   'Traditional Kerala Banana Chips made from raw nendran bananas, fried in pure coconut oil. Lightly salted.',
   'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
   2.49,NULL,c_snacks,true,'approved','visible',ARRAY['banana chips','nendran','kerala snack']),

  ('Banana Wafers Spicy 200g','banana-wafers-spicy-200g',
   'Thin crispy spicy banana wafers in coconut oil',
   'Spicy Kerala Banana Wafers from nendran bananas, fried in coconut oil and tossed with red chilli and salt.',
   'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
   2.69,NULL,c_snacks,false,'approved','visible',ARRAY['banana chips','spicy','wafers']),

  ('Murukku 250g','murukku-250g',
   'Crispy spiral rice flour snack with sesame and cumin',
   'Murukku is a traditional South Indian deep-fried snack made from rice flour and urad dal paste.',
   'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
   2.29,NULL,c_snacks,false,'approved','visible',ARRAY['murukku','snack','rice flour']),

  ('Kondattam Mixed 150g','kondattam-mixed-150g',
   'Sun-dried mixed kondattam for frying',
   'Kondattam is a traditional Kerala sun-dried snack. Mixed pack includes bitter gourd, raw mango and drumstick.',
   'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
   3.99,NULL,c_snacks,false,'approved','visible',ARRAY['kondattam','fried snack','kerala']),

  -- Pickles & Chutneys
  ('Mango Pickle 400g','mango-pickle-400g',
   'Tangy and spicy raw mango pickle in sesame oil',
   'Classic raw mango pickle made with raw nendran mangoes, red chillies, mustard and sesame oil.',
   'https://images.pexels.com/photos/3872373/pexels-photo-3872373.jpeg?auto=compress&cs=tinysrgb&w=400',
   3.29,3.99,c_pickles,true,'approved','visible',ARRAY['pickle','mango','achaar']),

  ('Lime Pickle 300g','lime-pickle-300g',
   'Zesty Kerala-style lime pickle with mustard',
   'Traditional South Indian lime pickle with whole lime pieces preserved in a blend of spices and mustard.',
   'https://images.pexels.com/photos/3872373/pexels-photo-3872373.jpeg?auto=compress&cs=tinysrgb&w=400',
   2.79,NULL,c_pickles,false,'approved','visible',ARRAY['lime pickle','lemon pickle']),

  ('Fish Pickle 250g','fish-pickle-250g',
   'Spicy Kerala-style fish pickle in coconut oil',
   'Traditional Kerala fish pickle made with fresh fish pieces in bold spices and preserved in coconut oil.',
   'https://images.pexels.com/photos/3872373/pexels-photo-3872373.jpeg?auto=compress&cs=tinysrgb&w=400',
   4.49,NULL,c_pickles,false,'approved','visible',ARRAY['fish pickle','seafood','non-veg']),

  ('Prawn Pickle 250g','prawn-pickle-250g',
   'Tangy Kerala-style prawn pickle',
   'Traditional Kerala prawn pickle made with fresh prawns in chilli, mustard, ginger and coconut oil.',
   'https://images.pexels.com/photos/3872373/pexels-photo-3872373.jpeg?auto=compress&cs=tinysrgb&w=400',
   5.49,NULL,c_pickles,false,'approved','visible',ARRAY['prawn pickle','seafood pickle','non-veg']),

  -- Oils & Ghee
  ('KLF Coconut Oil 500ml','klf-coconut-oil-500ml',
   'Pure cold-pressed virgin coconut oil',
   'KLF Coconut Oil is cold-pressed from fresh coconuts to retain maximum nutrition and natural flavour.',
   'https://images.pexels.com/photos/725998/pexels-photo-725998.jpeg?auto=compress&cs=tinysrgb&w=400',
   5.99,6.99,c_oils,true,'approved','visible',ARRAY['coconut oil','cold pressed','klf']),

  ('Amul Pure Ghee 500g','amul-pure-ghee-500g',
   'Clarified butter ghee with rich golden colour',
   'Amul Pure Ghee is made from fresh cream using traditional methods. Perfect for Indian cooking.',
   'https://images.pexels.com/photos/725998/pexels-photo-725998.jpeg?auto=compress&cs=tinysrgb&w=400',
   7.99,9.49,c_oils,true,'approved','visible',ARRAY['ghee','amul','clarified butter']),

  ('Idhayam Sesame Oil 500ml','idhayam-sesame-oil-500ml',
   'Pure cold-pressed sesame oil for cooking and pickling',
   'Idhayam Sesame Oil is extracted from premium sesame seeds. Ideal for South Indian cooking and pickles.',
   'https://images.pexels.com/photos/725998/pexels-photo-725998.jpeg?auto=compress&cs=tinysrgb&w=400',
   4.49,NULL,c_oils,false,'approved','visible',ARRAY['sesame oil','idhayam','gingelly']),

  -- Pulses & Lentils
  ('Toor Dal 2kg','toor-dal-2kg',
   'Split pigeon peas for sambar and dal dishes',
   'Toor Dal is the base ingredient for sambar, rasam and dal. Protein-rich and quick to cook.',
   'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=400',
   5.49,6.49,c_pulses,true,'approved','visible',ARRAY['toor dal','sambar','pulses']),

  ('Urad Dal 1kg','urad-dal-1kg',
   'Black gram lentils for idli, dosa and vada',
   'Urad Dal is an essential ingredient for idli, dosa batter and medu vada.',
   'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=400',
   3.49,NULL,c_pulses,false,'approved','visible',ARRAY['urad dal','idli','dosa']),

  ('Moong Dal 1kg','moong-dal-1kg',
   'Green gram split lentils, light and easy to digest',
   'Moong Dal is a light and nutritious lentil used in soups, khichdi and payasam.',
   'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=400',
   2.99,NULL,c_pulses,false,'approved','visible',ARRAY['moong dal','green gram']),

  ('Chana Dal 2kg','chana-dal-2kg',
   'Split chickpeas for dal, sambar and halwa',
   'Chana Dal (split Bengal gram) makes rich dals, halwa and savoury fritters.',
   'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=400',
   4.99,NULL,c_pulses,false,'approved','visible',ARRAY['chana dal','bengal gram']),

  -- Ready to Eat
  ('MTR Sambar 300g','mtr-ready-to-eat-sambar-300g',
   'Authentic South Indian sambar, ready in minutes',
   'MTR Ready Sambar is a classic South Indian lentil and vegetable stew. Heat and eat in 3 minutes.',
   'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=400',
   2.49,2.99,c_ready,true,'approved','visible',ARRAY['mtr','sambar','ready to eat']),

  ('MTR Dal Makhani 300g','mtr-dal-makhani-300g',
   'Creamy black lentil dal, restaurant-style at home',
   'MTR Dal Makhani is slow-cooked whole black lentils in a rich buttery tomato gravy.',
   'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=400',
   2.49,NULL,c_ready,false,'approved','visible',ARRAY['dal makhani','ready to eat','mtr']),

  ('Haldiram Palak Paneer 300g','haldiram-palak-paneer-300g',
   'Cottage cheese in spiced spinach gravy',
   'Haldiram Palak Paneer — soft paneer in vibrant spiced spinach sauce. Ready in 2 minutes.',
   'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=400',
   2.79,NULL,c_ready,false,'approved','visible',ARRAY['palak paneer','ready to eat','vegetarian']),

  ('MTR Chole 300g','mtr-ready-to-eat-chole-300g',
   'Spiced chickpea curry, restaurant quality',
   'MTR Chole — tender chickpeas in tangy tomato gravy spiced with amchur and garam masala.',
   'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=400',
   2.49,2.79,c_ready,false,'approved','visible',ARRAY['chole','chickpea curry','mtr']),

  -- Tea & Coffee
  ('Wagh Bakri Premium Tea 500g','wagh-bakri-premium-tea-500g',
   'Strong aromatic Indian chai blend',
   'Wagh Bakri Premium Tea is a robust blend of Assam and Darjeeling teas. Brews a strong rich cup.',
   'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=400',
   5.99,7.49,c_tea,true,'approved','visible',ARRAY['tea','wagh bakri','chai']),

  ('Bru Instant Coffee 200g','bru-instant-coffee-200g',
   'India''s favourite instant coffee blend',
   'Bru Instant Coffee is a blend of roasted coffee and chicory with rich South Indian taste.',
   'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=400',
   4.99,NULL,c_tea,false,'approved','visible',ARRAY['coffee','bru','instant coffee']),

  ('Kerala Ayurvedic Tea 100g','kerala-ayurvedic-tea-100g',
   'Herbal blend with tulsi, ginger and cardamom',
   'A soothing herbal tea with tulsi, dry ginger, cardamom and lemongrass. Naturally caffeine-free.',
   'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=400',
   3.99,NULL,c_tea,false,'approved','visible',ARRAY['herbal tea','ayurvedic','tulsi']),

  -- Coconut Products
  ('Dabur Coconut Milk 400ml','dabur-coconut-milk-400ml',
   'Rich creamy coconut milk for curries and desserts',
   'Dabur Coconut Milk pressed from fresh mature coconuts. Adds creaminess to curries and payasam.',
   'https://images.pexels.com/photos/2285165/pexels-photo-2285165.jpeg?auto=compress&cs=tinysrgb&w=400',
   1.99,2.29,c_coconut,true,'approved','visible',ARRAY['coconut milk','dabur','curry']),

  ('Desiccated Coconut 250g','desiccated-coconut-250g',
   'Fine shredded dry coconut for baking and chutneys',
   'Finely shredded desiccated coconut from fresh coconut. Used in burfi, ladoo and chutneys.',
   'https://images.pexels.com/photos/2285165/pexels-photo-2285165.jpeg?auto=compress&cs=tinysrgb&w=400',
   2.29,NULL,c_coconut,false,'approved','visible',ARRAY['coconut','desiccated','baking']),

  ('Coconut Vinegar 500ml','coconut-vinegar-500ml',
   'Naturally fermented Kerala coconut vinegar',
   'Traditional Kerala coconut vinegar fermented from fresh coconut water. Essential for fish curries.',
   'https://images.pexels.com/photos/2285165/pexels-photo-2285165.jpeg?auto=compress&cs=tinysrgb&w=400',
   3.49,NULL,c_coconut,false,'approved','visible',ARRAY['coconut vinegar','toddy vinegar']),

  ('Coconut Sugar 500g','coconut-sugar-500g',
   'Natural unrefined coconut palm sugar',
   'Made from coconut palm flower sap, crystallised naturally. Low GI with rich caramel flavour.',
   'https://images.pexels.com/photos/2285165/pexels-photo-2285165.jpeg?auto=compress&cs=tinysrgb&w=400',
   3.99,4.99,c_coconut,false,'approved','visible',ARRAY['coconut sugar','natural sugar','low GI']),

  -- Breakfast & Mixes
  ('Eastern Appam Mix 1kg','eastern-appam-mix-1kg',
   'Instant mix for soft, lacy Kerala appam',
   'Eastern Appam Mix makes perfectly lacy soft appam every time. Just add water and coconut milk.',
   'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=400',
   3.29,3.99,c_breakfast,true,'approved','visible',ARRAY['appam','instant mix','kerala breakfast']),

  ('MTR Idli Rava 1kg','mtr-idli-rava-1kg',
   'Specially processed rava for soft fluffy idlis',
   'MTR Idli Rava for soft spongy idlis. Mix with curd and steam. No grinding needed.',
   'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=400',
   2.49,NULL,c_breakfast,false,'approved','visible',ARRAY['idli','rava','mtr']),

  ('Double Horse Dosa Batter 900g','double-horse-dosa-batter-900g',
   'Ready-to-use fermented dosa batter',
   'Pre-fermented and ready to pour onto a hot tawa. Makes crispy golden dosas instantly.',
   'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=400',
   3.49,NULL,c_breakfast,true,'approved','visible',ARRAY['dosa batter','double horse','instant dosa']),

  ('Nirapara Wheat Rava 1kg','nirapara-wheat-rava-1kg',
   'Broken wheat rava for upma and porridge',
   'Nirapara Wheat Rava (Dalia) — coarsely ground whole wheat. High in fibre, ideal for upma.',
   'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=400',
   2.29,NULL,c_breakfast,false,'approved','visible',ARRAY['wheat rava','dalia','upma']),

  -- Frozen Foods
  ('Frozen Parotta 5 Pieces','frozen-parotta-5-pieces',
   'Flaky layered Kerala parotta, ready in 5 minutes',
   'Authentic Kerala Parotta — layered, flaky and buttery. Pan-fry or microwave.',
   'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=400',
   3.49,3.99,c_frozen,true,'approved','visible',ARRAY['parotta','frozen','kerala']),

  ('Frozen Kerala Fish Curry 400g','frozen-kerala-fish-curry-400g',
   'Traditional fish curry in coconut-tamarind gravy',
   'Authentic Kerala fish curry in a rich coconut milk and Kodampuli gravy. Frozen at source.',
   'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=400',
   5.99,NULL,c_frozen,false,'approved','visible',ARRAY['fish curry','frozen meal','kerala']),

  ('Frozen Idiyappam 10 Pieces','frozen-idiyappam-10-pieces',
   'Steamed rice string hoppers, ready to heat',
   'Authentic Kerala Idiyappam — delicate string hoppers steamed from fine rice flour.',
   'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=400',
   3.99,NULL,c_frozen,false,'approved','visible',ARRAY['idiyappam','string hoppers','frozen']),

  -- Papads & Fryums
  ('Lijjat Papad Urad 200g','lijjat-papad-urad-200g',
   'Crispy sun-dried urad dal papad',
   'Lijjat Papad made from urad dal. Roast or fry for a crispy accompaniment.',
   'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=400',
   1.99,2.29,c_papads,true,'approved','visible',ARRAY['papad','lijjat','urad']),

  ('Rice Papad 150g','rice-papad-150g',
   'Thin crispy Kerala rice papad',
   'Traditional Kerala rice papad made from sun-dried rice flour with cumin and pepper.',
   'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=400',
   1.79,NULL,c_papads,false,'approved','visible',ARRAY['rice papad','fryum','crispy'])

  ON CONFLICT (slug) DO NOTHING;
END $$;
