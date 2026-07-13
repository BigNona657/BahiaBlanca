-- ============================================================
-- BigNona - Schema inicial para Neon PostgreSQL
-- ============================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------
CREATE TYPE user_role      AS ENUM ('CLIENT', 'ADMIN');
CREATE TYPE order_status   AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'DELIVERING', 'DELIVERED', 'CANCELLED');
CREATE TYPE payment_method AS ENUM ('CASH', 'TRANSFER');

-- ------------------------------------------------------------
-- NextAuth: users
-- ------------------------------------------------------------
CREATE TABLE users (
  id             TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name           TEXT,
  email          TEXT        UNIQUE,
  email_verified TIMESTAMPTZ,
  image          TEXT,
  role           user_role   NOT NULL DEFAULT 'CLIENT',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- NextAuth: accounts (OAuth providers)
-- ------------------------------------------------------------
CREATE TABLE accounts (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                TEXT NOT NULL,
  provider            TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token       TEXT,
  access_token        TEXT,
  expires_at          BIGINT,
  token_type          TEXT,
  scope               TEXT,
  id_token            TEXT,
  session_state       TEXT,
  UNIQUE (provider, provider_account_id)
);

-- ------------------------------------------------------------
-- NextAuth: sessions
-- ------------------------------------------------------------
CREATE TABLE sessions (
  id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  session_token TEXT        UNIQUE NOT NULL,
  user_id       TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires       TIMESTAMPTZ NOT NULL
);

-- ------------------------------------------------------------
-- NextAuth: verification_tokens (Magic Links)
-- ------------------------------------------------------------
CREATE TABLE verification_tokens (
  identifier TEXT        NOT NULL,
  token      TEXT        UNIQUE NOT NULL,
  expires    TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- ------------------------------------------------------------
-- Categorías de productos
-- ------------------------------------------------------------
CREATE TABLE categories (
  id         SERIAL      PRIMARY KEY,
  name       TEXT        NOT NULL UNIQUE,
  slug       TEXT        NOT NULL UNIQUE,
  image_url  TEXT,
  sort_order INT         NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Productos
-- ------------------------------------------------------------
CREATE TABLE products (
  id          SERIAL          PRIMARY KEY,
  category_id INT             NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name        TEXT            NOT NULL,
  slug        TEXT            NOT NULL UNIQUE,
  description TEXT,
  price       NUMERIC(10, 2)  NOT NULL,
  image_url   TEXT,
  image_data  TEXT,
  available   BOOLEAN         NOT NULL DEFAULT TRUE,
  sort_order  INT             NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Pedidos
-- ------------------------------------------------------------
CREATE TABLE orders (
  id             SERIAL          PRIMARY KEY,
  user_id        TEXT            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status         order_status    NOT NULL DEFAULT 'PENDING',
  payment_method payment_method  NOT NULL DEFAULT 'CASH',
  delivery_address TEXT          NOT NULL,
  phone          TEXT,
  notes          TEXT,
  subtotal       NUMERIC(10, 2)  NOT NULL,
  delivery_fee   NUMERIC(10, 2)  NOT NULL DEFAULT 0,
  total          NUMERIC(10, 2)  NOT NULL,
  created_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Items de cada pedido
-- ------------------------------------------------------------
CREATE TABLE order_items (
  id         SERIAL         PRIMARY KEY,
  order_id   INT            NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT            NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity   INT            NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL,
  note       TEXT,
  subtotal   NUMERIC(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- ------------------------------------------------------------
-- Índices
-- ------------------------------------------------------------
CREATE INDEX idx_accounts_user_id       ON accounts(user_id);
CREATE INDEX idx_sessions_user_id       ON sessions(user_id);
CREATE INDEX idx_products_category_id   ON products(category_id);
CREATE INDEX idx_products_available     ON products(available);
CREATE INDEX idx_orders_user_id         ON orders(user_id);
CREATE INDEX idx_orders_status          ON orders(status);
CREATE INDEX idx_order_items_order_id   ON order_items(order_id);

-- ------------------------------------------------------------
-- Seed: categorías iniciales
-- ------------------------------------------------------------
INSERT INTO categories (name, slug, sort_order) VALUES
  ('Entradas',   'entradas',   1),
  ('Principales','principales',2),
  ('Postres',    'postres',    3),
  ('Bebidas',    'bebidas',    4);
