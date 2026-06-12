
-- Users table (extends Supabase auth)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('client', 'pharmacy', 'deliverer', 'admin')),
  full_name text NOT NULL DEFAULT '',
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- Allow admins to read all profiles
CREATE POLICY "admin_select_all_profiles" ON profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Categories
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text,
  color text DEFAULT '#2563eb',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_categories" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_categories" ON categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_categories" ON categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_categories" ON categories FOR DELETE TO authenticated USING (true);

-- Pharmacies
CREATE TABLE pharmacies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL DEFAULT 'Abidjan',
  phone text,
  email text,
  latitude float,
  longitude float,
  opening_time text DEFAULT '08:00',
  closing_time text DEFAULT '20:00',
  is_open_sunday boolean DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  rating float DEFAULT 0,
  rating_count int DEFAULT 0,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_pharmacies" ON pharmacies FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_pharmacies" ON pharmacies FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "update_pharmacies" ON pharmacies FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "delete_pharmacies" ON pharmacies FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- Products / Medications
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  generic_name text,
  brand text,
  category_id uuid REFERENCES categories(id),
  description text,
  composition text,
  dosage text,
  contraindications text,
  requires_prescription boolean DEFAULT false,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_products" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_products" ON products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_products" ON products FOR DELETE TO authenticated USING (true);

-- Pharmacy stock (inventory)
CREATE TABLE pharmacy_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 0,
  price_xof int NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (pharmacy_id, product_id)
);

ALTER TABLE pharmacy_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_stock" ON pharmacy_stock FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_stock" ON pharmacy_stock FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_stock" ON pharmacy_stock FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_stock" ON pharmacy_stock FOR DELETE TO authenticated USING (true);

-- Delivery addresses
CREATE TABLE addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Domicile',
  full_address text NOT NULL,
  city text NOT NULL DEFAULT 'Abidjan',
  latitude float,
  longitude float,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_addresses" ON addresses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_addresses" ON addresses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_addresses" ON addresses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_addresses" ON addresses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Orders
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6),
  client_id uuid NOT NULL REFERENCES profiles(id),
  pharmacy_id uuid NOT NULL REFERENCES pharmacies(id),
  deliverer_id uuid REFERENCES profiles(id),
  address_id uuid REFERENCES addresses(id),
  delivery_address text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'preparing', 'ready', 'picked_up', 'delivering', 'delivered', 'cancelled')),
  has_prescription boolean DEFAULT false,
  prescription_url text,
  subtotal_xof int NOT NULL DEFAULT 0,
  delivery_fee_xof int NOT NULL DEFAULT 1500,
  total_xof int NOT NULL DEFAULT 0,
  payment_method text DEFAULT 'mobile_money',
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  confirmation_code text,
  pharmacy_pickup_code text,
  notes text,
  estimated_delivery_minutes int DEFAULT 45,
  client_rating int,
  deliverer_rating int,
  pharmacy_rating int,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_orders" ON orders FOR SELECT TO authenticated
  USING (auth.uid() = client_id OR auth.uid() = deliverer_id OR
    EXISTS (SELECT 1 FROM pharmacies p WHERE p.id = pharmacy_id AND p.owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin'));
CREATE POLICY "insert_own_orders" ON orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE POLICY "update_orders" ON orders FOR UPDATE TO authenticated
  USING (auth.uid() = client_id OR auth.uid() = deliverer_id OR
    EXISTS (SELECT 1 FROM pharmacies p WHERE p.id = pharmacy_id AND p.owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin'))
  WITH CHECK (true);
CREATE POLICY "delete_orders" ON orders FOR DELETE TO authenticated USING (auth.uid() = client_id);

-- Order items
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  product_name text NOT NULL,
  quantity int NOT NULL,
  unit_price_xof int NOT NULL,
  total_price_xof int NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_order_items" ON order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND
    (o.client_id = auth.uid() OR o.deliverer_id = auth.uid() OR
     EXISTS (SELECT 1 FROM pharmacies p WHERE p.id = o.pharmacy_id AND p.owner_id = auth.uid()) OR
     EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin'))));
CREATE POLICY "insert_order_items" ON order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_order_items" ON order_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_order_items" ON order_items FOR DELETE TO authenticated USING (true);

-- Deliverer profiles
CREATE TABLE deliverer_profiles (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_type text DEFAULT 'moto',
  zone text,
  is_available boolean DEFAULT false,
  current_lat float,
  current_lng float,
  rating float DEFAULT 0,
  rating_count int DEFAULT 0,
  total_deliveries int DEFAULT 0,
  wallet_balance_xof int DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE deliverer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_deliverer" ON deliverer_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "insert_own_deliverer" ON deliverer_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own_deliverer" ON deliverer_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "delete_own_deliverer" ON deliverer_profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- Allow pharmacies/admins to read deliverer profiles
CREATE POLICY "select_deliverer_for_order" ON deliverer_profiles FOR SELECT TO authenticated USING (true);

-- Deliverer earnings
CREATE TABLE deliverer_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverer_id uuid NOT NULL REFERENCES profiles(id),
  order_id uuid REFERENCES orders(id),
  amount_xof int NOT NULL,
  type text NOT NULL CHECK (type IN ('delivery', 'bonus', 'withdrawal')),
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE deliverer_earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_earnings" ON deliverer_earnings FOR SELECT TO authenticated USING (auth.uid() = deliverer_id);
CREATE POLICY "insert_earnings" ON deliverer_earnings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_earnings" ON deliverer_earnings FOR UPDATE TO authenticated USING (auth.uid() = deliverer_id) WITH CHECK (true);
CREATE POLICY "delete_earnings" ON deliverer_earnings FOR DELETE TO authenticated USING (auth.uid() = deliverer_id);

-- Insert seed data: categories
INSERT INTO categories (name, icon, color) VALUES
  ('Médicaments', 'pill', '#2563eb'),
  ('Vitamines', 'star', '#16a34a'),
  ('Premiers secours', 'heart-pulse', '#dc2626'),
  ('Dermatologie', 'sparkles', '#7c3aed'),
  ('Pédiatrie', 'baby', '#ea580c'),
  ('Hygiène', 'droplets', '#0891b2');

-- Insert demo pharmacies (without owner_id for public browsing)
INSERT INTO pharmacies (name, address, city, phone, status, rating, rating_count, latitude, longitude, image_url) VALUES
  ('Pharmacie Centrale', 'Plateau, Avenue Noguès', 'Abidjan', '+225 27 20 21 00 00', 'active', 4.8, 124, 5.3600, -4.0083, 'https://images.pexels.com/photos/3786126/pexels-photo-3786126.jpeg?w=400&h=300&fit=crop'),
  ('Pharmacie Cocody', 'Cocody, Rue des Jardins', 'Abidjan', '+225 27 22 44 55 66', 'active', 4.6, 89, 5.3659, -3.9744, 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?w=400&h=300&fit=crop'),
  ('Pharmacie Yopougon', 'Yopougon, Marché Selmer', 'Abidjan', '+225 27 23 33 44 55', 'active', 4.5, 67, 5.3538, -4.0742, 'https://images.pexels.com/photos/5726794/pexels-photo-5726794.jpeg?w=400&h=300&fit=crop'),
  ('Pharmacie Deux Plateaux', 'Deux Plateaux, Vallons', 'Abidjan', '+225 27 22 41 42 43', 'active', 4.7, 201, 5.3755, -3.9852, 'https://images.pexels.com/photos/3683053/pexels-photo-3683053.jpeg?w=400&h=300&fit=crop');

-- Insert demo products
INSERT INTO products (name, generic_name, brand, description, dosage, requires_prescription, image_url) VALUES
  ('Doliprane 500mg', 'Paracétamol', 'Sanofi', 'Antalgique et antipyrétique. Soulage la douleur et fait baisser la fièvre.', '1 à 2 comprimés toutes les 4-6h', false, 'https://images.pexels.com/photos/3683053/pexels-photo-3683053.jpeg?w=400&h=400&fit=crop'),
  ('Amoxicilline 500mg', 'Amoxicilline', 'Générique', 'Antibiotique de la famille des pénicillines.', '1 gélule 3 fois par jour', true, 'https://images.pexels.com/photos/5726794/pexels-photo-5726794.jpeg?w=400&h=400&fit=crop'),
  ('Vitamin C 1000mg', 'Acide ascorbique', 'Bayer', 'Complément alimentaire en vitamine C.', '1 comprimé par jour', false, 'https://images.pexels.com/photos/3786126/pexels-photo-3786126.jpeg?w=400&h=400&fit=crop'),
  ('Ibuprofène 400mg', 'Ibuprofène', 'Advil', 'Anti-inflammatoire non stéroïdien (AINS).', '1 comprimé toutes les 6-8h', false, 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?w=400&h=400&fit=crop'),
  ('Metformine 850mg', 'Metformine HCl', 'Générique', 'Antidiabétique oral. Traitement du diabète de type 2.', '1 comprimé 2-3 fois par jour', true, 'https://images.pexels.com/photos/3683053/pexels-photo-3683053.jpeg?w=400&h=400&fit=crop'),
  ('Zinc 15mg', 'Gluconate de zinc', 'Therascience', 'Complément alimentaire en zinc, essentiel au système immunitaire.', '1 comprimé par jour', false, 'https://images.pexels.com/photos/3786126/pexels-photo-3786126.jpeg?w=400&h=400&fit=crop'),
  ('Loratadine 10mg', 'Loratadine', 'Clarityne', 'Antihistaminique. Traitement des allergies.', '1 comprimé par jour', false, 'https://images.pexels.com/photos/5726794/pexels-photo-5726794.jpeg?w=400&h=400&fit=crop'),
  ('Oméprazole 20mg', 'Oméprazole', 'Mopral', 'Inhibiteur de la pompe à protons. Traitement des brûlures d''estomac.', '1 gélule par jour', false, 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?w=400&h=400&fit=crop');
