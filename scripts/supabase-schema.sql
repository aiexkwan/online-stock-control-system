-- 庫存管理系統數據庫結構
-- 可以在 Supabase SQL 編輯器中運行此腳本

-- 創建必要的擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 刪除現有表（如果存在）
DROP TABLE IF EXISTS inventory_movements;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS data_id;

-- 創建用戶表
CREATE TABLE data_id (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT,
  password TEXT,
  qc BOOLEAN DEFAULT FALSE,
  receive BOOLEAN DEFAULT FALSE,
  void BOOLEAN DEFAULT FALSE,
  view BOOLEAN DEFAULT FALSE,
  resume BOOLEAN DEFAULT FALSE,
  report BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建產品表
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  quantity INTEGER DEFAULT 0,
  location TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建庫存移動記錄表
CREATE TABLE inventory_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  type TEXT NOT NULL,
  from_location TEXT,
  to_location TEXT,
  created_by TEXT REFERENCES data_id(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- 添加基本用戶數據
INSERT INTO data_id (id, name, department, password, qc, receive, void, view, resume, report)
VALUES 
  ('admin', '系統管理員', '資訊部', 'admin123', true, true, true, true, true, true),
  ('user1', '張三', '倉庫', 'user1', false, true, true, true, false, false),
  ('user2', '李四', '物流', 'user2', false, false, false, true, false, true);

-- 添加示範產品數據
INSERT INTO products (name, sku, quantity, location)
VALUES 
  ('顯示器', 'P001', 10, 'A-01'),
  ('鍵盤', 'P002', 25, 'A-02'),
  ('滑鼠', 'P003', 30, 'A-03'),
  ('USB 隨身碟 32GB', 'P004', 50, 'B-01'),
  ('網路線 2M', 'P005', 100, 'B-02');

-- 設置 RLS 策略
ALTER TABLE data_id ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- 創建 RLS 策略
CREATE POLICY "允許公開查詢用戶" ON data_id FOR SELECT TO anon USING (true);
CREATE POLICY "允許公開查詢產品" ON products FOR SELECT TO anon USING (true);
CREATE POLICY "允許公開查詢庫存移動" ON inventory_movements FOR SELECT TO anon USING (true);

-- 創建更新策略
CREATE POLICY "允許更新用戶" ON data_id FOR UPDATE TO anon USING (true);
CREATE POLICY "允許更新產品" ON products FOR UPDATE TO anon USING (true);
CREATE POLICY "允許更新庫存移動" ON inventory_movements FOR UPDATE TO anon USING (true);

-- 創建插入策略
CREATE POLICY "允許插入用戶" ON data_id FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "允許插入產品" ON products FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "允許插入庫存移動" ON inventory_movements FOR INSERT TO anon WITH CHECK (true);

-- 創建刪除策略
CREATE POLICY "允許刪除用戶" ON data_id FOR DELETE TO anon USING (true);
CREATE POLICY "允許刪除產品" ON products FOR DELETE TO anon USING (true);
CREATE POLICY "允許刪除庫存移動" ON inventory_movements FOR DELETE TO anon USING (true); 