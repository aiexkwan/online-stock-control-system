-- 創建用戶 channel 訂閱表
CREATE TABLE IF NOT EXISTS user_channel_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscribed_channels TEXT[] DEFAULT ARRAY[]::TEXT[],
  expanded_channels TEXT[] DEFAULT ARRAY[]::TEXT[],
  channel_order JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  UNIQUE(user_id)
);

-- 創建索引
CREATE INDEX idx_user_channel_subscriptions_user_id ON user_channel_subscriptions(user_id);

-- 創建更新時間戳觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_channel_subscriptions_updated_at
  BEFORE UPDATE ON user_channel_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 設置 RLS (Row Level Security)
ALTER TABLE user_channel_subscriptions ENABLE ROW LEVEL SECURITY;

-- 創建 RLS 策略
CREATE POLICY "Users can view their own channel subscriptions"
  ON user_channel_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own channel subscriptions"
  ON user_channel_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own channel subscriptions"
  ON user_channel_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own channel subscriptions"
  ON user_channel_subscriptions FOR DELETE
  USING (auth.uid() = user_id);
