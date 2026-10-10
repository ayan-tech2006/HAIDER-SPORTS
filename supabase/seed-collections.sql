-- ============================================================================
-- RASHY: dummy collections (safe to run more than once)
--
-- How to run: Supabase dashboard > SQL Editor > New query > paste this file > Run.
-- Existing rows are left alone (ON CONFLICT DO NOTHING), so nothing is duplicated or overwritten.
-- Same ids and slugs as the seed in schema.sql, so products from that seed still attach correctly.
-- Images are Unsplash photo ids, the same way the rest of the site stores them.
--
-- Tree:
--   Cricket
--     Bats            > Tape Ball Bats, Hardball Bats (> English Willow, Kashmir Willow), Junior Bats
--     Balls           > Hard Ball, Tape Ball, Tennis Ball
--     Hardball Kits   > Complete Kits, Helmets, Batting Gloves, Pads & Guards
--     Cricket Clothing> Shirts, Trousers
--   Footwear          > Running Shoes, Cricket Shoes, Sneakers
--   Sportswear        > T-Shirts, Track Trousers, Tracksuits
--   Accessories       > Bags, Water Bottles, Fitness Watches
-- ============================================================================

-- Level 1: top-level collections
INSERT INTO public.collections (id, parent_id, name, slug, image_url, sort_order) VALUES
  ('c1000000-0000-0000-0000-000000000001', NULL, 'Cricket',    'cricket',    '1593341646647-75b32930e4a1', 1),
  ('c1000000-0000-0000-0000-000000000002', NULL, 'Footwear',   'footwear',   '1542291026-7eec264c27ff',    2),
  ('c1000000-0000-0000-0000-000000000003', NULL, 'Sportswear', 'sportswear', '1760736534441-4d14bf11103e', 3),
  ('c1000000-0000-0000-0000-000000000004', NULL, 'Accessories','accessories','1553062407-98eeb64c6a62',    4)
ON CONFLICT DO NOTHING;

-- Level 2: under Cricket
INSERT INTO public.collections (id, parent_id, name, slug, image_url, sort_order) VALUES
  ('c2000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Bats',             'bats',          '1758791184255-411236a49346', 1),
  ('c2000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'Balls',            'balls',         '1743342873510-55d49972b746', 2),
  ('c2000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'Hardball Kits',    'hardball-kits', '1776229705264-6b437229654b', 3),
  ('c2000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 'Cricket Clothing', 'clothing',      '1586790170083-2f9ceadc732d', 4)
ON CONFLICT DO NOTHING;

-- Level 3: under Bats
INSERT INTO public.collections (id, parent_id, name, slug, image_url, sort_order) VALUES
  ('c3000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 'Tape Ball Bats', 'tape-ball-bats', '1758791184255-411236a49346', 1),
  ('c3000000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000001', 'Hardball Bats',  'hardball-bats',  '1630851278830-c0c9b12933ee', 2),
  ('c3000000-0000-0000-0000-000000000003', 'c2000000-0000-0000-0000-000000000001', 'Junior Bats',    'junior-bats',    '1643593595725-80986444214e', 3)
ON CONFLICT DO NOTHING;

-- Level 4: under Hardball Bats
INSERT INTO public.collections (id, parent_id, name, slug, image_url, sort_order) VALUES
  ('c4000000-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-000000000002', 'English Willow', 'english-willow', '1630851278830-c0c9b12933ee', 1),
  ('c4000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000002', 'Kashmir Willow', 'kashmir-willow', '1593341646647-75b32930e4a1', 2)
ON CONFLICT DO NOTHING;

-- Level 3: under Balls
INSERT INTO public.collections (id, parent_id, name, slug, image_url, sort_order) VALUES
  ('c3000000-0000-0000-0000-000000000004', 'c2000000-0000-0000-0000-000000000002', 'Hard Ball',   'hard-ball',   '1743342873510-55d49972b746', 1),
  ('c3000000-0000-0000-0000-000000000005', 'c2000000-0000-0000-0000-000000000002', 'Tape Ball',   'tape-ball',   '1777713174772-73f9da4984ed', 2),
  ('c3000000-0000-0000-0000-000000000006', 'c2000000-0000-0000-0000-000000000002', 'Tennis Ball', 'tennis-ball', '1768360647310-2612990f3572', 3)
ON CONFLICT DO NOTHING;

-- Level 3: under Hardball Kits
INSERT INTO public.collections (id, parent_id, name, slug, image_url, sort_order) VALUES
  ('c3000000-0000-0000-0000-000000000007', 'c2000000-0000-0000-0000-000000000003', 'Complete Kits',  'complete-kits', '1785906359975-3b9e7fd8d230', 1),
  ('c3000000-0000-0000-0000-000000000008', 'c2000000-0000-0000-0000-000000000003', 'Helmets',        'helmets',       '1776229705528-9bcd14792045', 2),
  ('c3000000-0000-0000-0000-000000000009', 'c2000000-0000-0000-0000-000000000003', 'Batting Gloves', 'gloves',        '1785906359585-9c053458d551', 3),
  ('c3000000-0000-0000-0000-000000000010', 'c2000000-0000-0000-0000-000000000003', 'Pads & Guards',  'pads-guards',   '1785906359458-a03460ad7073', 4)
ON CONFLICT DO NOTHING;

-- Level 3: under Cricket Clothing
INSERT INTO public.collections (id, parent_id, name, slug, image_url, sort_order) VALUES
  ('c3000000-0000-0000-0000-000000000011', 'c2000000-0000-0000-0000-000000000004', 'Shirts',   'shirts',   '1583743814966-8936f5b7be1a', 1),
  ('c3000000-0000-0000-0000-000000000012', 'c2000000-0000-0000-0000-000000000004', 'Trousers', 'trousers', '1473966968600-fa801b869a1a', 2)
ON CONFLICT DO NOTHING;

-- Level 2: under Footwear
INSERT INTO public.collections (id, parent_id, name, slug, image_url, sort_order) VALUES
  ('c3000000-0000-0000-0000-000000000013', 'c1000000-0000-0000-0000-000000000002', 'Running Shoes', 'running-shoes', '1542291026-7eec264c27ff', 1),
  ('c3000000-0000-0000-0000-000000000014', 'c1000000-0000-0000-0000-000000000002', 'Cricket Shoes',  'cricket-shoes',  '1560769629-975ec94e6a86', 2),
  ('c3000000-0000-0000-0000-000000000015', 'c1000000-0000-0000-0000-000000000002', 'Sneakers',       'sneakers',       '1525966226538-464812378f94', 3)
ON CONFLICT DO NOTHING;

-- Level 2: under Sportswear
INSERT INTO public.collections (id, parent_id, name, slug, image_url, sort_order) VALUES
  ('c3000000-0000-0000-0000-000000000016', 'c1000000-0000-0000-0000-000000000003', 'T-Shirts',       't-shirts',       '1503341504253-dff4815485f1', 1),
  ('c3000000-0000-0000-0000-000000000017', 'c1000000-0000-0000-0000-000000000003', 'Track Trousers', 'track-trousers', '1715532098035-a343b26eaeaa', 2),
  ('c3000000-0000-0000-0000-000000000018', 'c1000000-0000-0000-0000-000000000003', 'Tracksuits',     'tracksuits',     '1760736534441-4d14bf11103e', 3)
ON CONFLICT DO NOTHING;

-- Level 2: under Accessories
INSERT INTO public.collections (id, parent_id, name, slug, image_url, sort_order) VALUES
  ('c3000000-0000-0000-0000-000000000019', 'c1000000-0000-0000-0000-000000000004', 'Bags',            'bags',          '1553062407-98eeb64c6a62', 1),
  ('c3000000-0000-0000-0000-000000000020', 'c1000000-0000-0000-0000-000000000004', 'Water Bottles',   'water-bottles', '1602143407151-7111542de6e8', 2),
  ('c3000000-0000-0000-0000-000000000021', 'c1000000-0000-0000-0000-000000000004', 'Fitness Watches', 'watches',       '1523275335684-37898b6baf30', 3)
ON CONFLICT DO NOTHING;

-- Quick check: should show 4 top-level collections and 31 rows in total
SELECT (SELECT count(*) FROM public.collections WHERE parent_id IS NULL) AS top_level,
       (SELECT count(*) FROM public.collections) AS total;
