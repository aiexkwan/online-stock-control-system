-- 庫存管理系統數據庫結構
-- 可以在 Supabase SQL 編輯器中運行此腳本

-- 用戶表 (data_id)
CREATE TABLE IF NOT EXISTS data_id (
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

-- 產品表 (products)
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  quantity INTEGER DEFAULT 0,
  location TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 庫存移動記錄表 (inventory_movements)
CREATE TABLE IF NOT EXISTS inventory_movements (
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

-- 添加管理員用戶
INSERT INTO data_id (id, name, department, qc, receive, void, view, resume, report, password)
VALUES ('admin', '系統管理員', '資訊部', true, true, true, true, true, true, 'admin123')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name,
    department = EXCLUDED.department,
    qc = EXCLUDED.qc,
    receive = EXCLUDED.receive,
    void = EXCLUDED.void,
    view = EXCLUDED.view,
    resume = EXCLUDED.resume,
    report = EXCLUDED.report,
    password = EXCLUDED.password;

-- 添加測試用戶
INSERT INTO data_id (id, name, department, qc, receive, void, view, resume, report, password)
VALUES 
  ('user1', '張三', '倉庫', false, true, true, true, false, false, 'user1'),
  ('user2', '李四', '物流', false, false, false, true, false, true, 'user2')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name,
    department = EXCLUDED.department;

-- 添加示範產品數據
INSERT INTO products (name, sku, quantity, location)
VALUES 
  ('顯示器', 'P001', 10, 'A-01'),
  ('鍵盤', 'P002', 25, 'A-02'),
  ('滑鼠', 'P003', 30, 'A-03'), 
  ('USB 隨身碟 32GB', 'P004', 50, 'B-01'),
  ('網路線 2M', 'P005', 100, 'B-02')
ON CONFLICT (sku) DO UPDATE
SET quantity = EXCLUDED.quantity,
    location = EXCLUDED.location;

-- 設置 RLS (行級安全) 策略，讓未認證用戶可以查詢數據
ALTER TABLE data_id ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- 創建查詢策略
CREATE POLICY "允許公開查詢 data_id" ON data_id FOR SELECT TO anon USING (TRUE);
CREATE POLICY "允許公開查詢產品" ON products FOR SELECT TO anon USING (TRUE);
CREATE POLICY "允許公開查詢庫存移動" ON inventory_movements FOR SELECT TO anon USING (TRUE);
CREATE POLICY "允許插入庫存移動" ON inventory_movements FOR INSERT TO anon WITH CHECK (TRUE);
CREATE POLICY "允許更新產品" ON products FOR UPDATE TO anon USING (TRUE);
CREATE POLICY "允許更新用戶" ON data_id FOR UPDATE TO anon USING (TRUE); 