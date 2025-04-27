-- Cities 表：存储城市信息
CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    city_name VARCHAR(100) NOT NULL,
    country TEXT DEFAULT 'China'
);

-- Users 表：存储用户信息
CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'visitor', -- 'admin' / 'visitor'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stores 表：存储店铺信息（使用 latitude 和 longitude）
CREATE TABLE stores (
    store_id SERIAL PRIMARY KEY,
    store_name VARCHAR(255) NOT NULL,
    address TEXT,
    city_id INTEGER REFERENCES cities(id),
    latitude DECIMAL(9, 6), -- 存储纬度
    longitude DECIMAL(9, 6), -- 存储经度
    is_active BOOLEAN NOT NULL DEFAULT TRUE, -- 新增字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    contact_info TEXT,
    contract_info TEXT,           -- 新增：合同详细信息
    contract_file_url TEXT       -- 新增：合同文件 URL
);

-- Products 表：存储产品信息
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    sku_name VARCHAR(255) NOT NULL,
    sku_code VARCHAR(50) UNIQUE NOT NULL,
    price DECIMAL(10, 2) NOT NULL, -- price in CNY
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Settlements 表：存储结算信息
CREATE TABLE settlements (
    settlement_id SERIAL PRIMARY KEY,
    settle_date DATE NOT NULL,
    store_id INTEGER REFERENCES stores(store_id),
    total_amount DECIMAL(10, 2) NOT NULL,
    remarks TEXT,
    created_by UUID REFERENCES users(user_id), -- 修改为 UUID 类型
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    settle_month DATE NOT NULL -- 普通字段，手动填充
);

-- Settlement Items 表：存储结算明细
CREATE TABLE settlement_items (
    item_id SERIAL PRIMARY KEY,
    settlement_id INTEGER REFERENCES settlements(settlement_id),
    product_id INTEGER REFERENCES products(product_id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL
);

-- Inventory Shipments 表：存储库存发货信息
CREATE TABLE inventory_shipments (
    shipment_id SERIAL PRIMARY KEY,
    shipment_group_id INTEGER,
    store_id INTEGER REFERENCES stores(store_id),
    product_id INTEGER REFERENCES products(product_id),
    quantity INTEGER NOT NULL,
    is_sample BOOLEAN DEFAULT FALSE,
    tracking_no VARCHAR(100),
    shipping_date TIMESTAMP WITH TIME ZONE NOT NULL,
    remarks TEXT,
    created_by UUID REFERENCES users(user_id), 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提升查询性能
CREATE INDEX idx_settlement_items_product_id ON settlement_items(product_id);
CREATE INDEX idx_settlement_items_settlement_id ON settlement_items(settlement_id);
CREATE INDEX idx_settlements_settle_month ON settlements(settle_month);
CREATE INDEX idx_inventory_shipments_shipping_date ON inventory_shipments(shipping_date);

-- 创建库存视图
CREATE VIEW stock_view AS
SELECT
  i.store_id,
  i.product_id,
  COALESCE(
    SUM(CASE WHEN i.is_sample = FALSE THEN i.quantity ELSE 0 END),
    0::bigint
  ) - COALESCE(
    (SELECT SUM(si.quantity)
     FROM settlements s
     JOIN settlement_items si ON s.settlement_id = si.settlement_id
     WHERE s.store_id = i.store_id
       AND si.product_id = i.product_id),
    0::bigint
  ) AS stock
FROM
  inventory_shipments i
GROUP BY
  i.store_id,
  i.product_id;
    