/**
 * Channel 網格容器
 * 管理所有 channel 的顯示和佈局
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChannelCard } from './ChannelCard';
import { ChannelSubscriptionDialog } from './ChannelSubscriptionDialog';
import { Button } from '@/components/ui/button';
import { CogIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { 
  ChannelType, 
  CHANNEL_CONFIG, 
  UserChannelSubscription,
  getChannelWidgets 
} from '@/app/types/channel';
import { WidgetType } from '@/app/types/dashboard';
import { useAdminRefresh } from '../../contexts/AdminRefreshContext';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/app/hooks/useAuth';
import { toast } from 'sonner';

interface ChannelGridProps {
  onWidgetClick?: (widgetType: WidgetType) => void;
}

export function ChannelGrid({ onWidgetClick }: ChannelGridProps) {
  const { user } = useAuth();
  const { refreshTrigger } = useAdminRefresh();
  
  // 狀態管理
  const [subscription, setSubscription] = useState<UserChannelSubscription>({
    userId: user?.id || '',
    subscribedChannels: Object.values(ChannelType), // 默認訂閱所有
    expandedChannels: []
  });
  
  const [widgetData, setWidgetData] = useState<Record<WidgetType, any>>({} as Record<WidgetType, any>);
  const [loadingChannels, setLoadingChannels] = useState<Set<ChannelType>>(new Set());
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  
  // 載入用戶訂閱設置
  useEffect(() => {
    const loadSubscription = async () => {
      if (!user?.id) return;
      
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('user_channel_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (data) {
          setSubscription({
            userId: user.id,
            subscribedChannels: data.subscribed_channels || [],
            expandedChannels: data.expanded_channels || [],
            channelOrder: data.channel_order || {}
          });
        }
      } catch (error) {
        console.error('Error loading subscription:', error);
      }
    };
    
    loadSubscription();
  }, [user?.id]);
  
  // 載入 widget 數據
  const loadChannelData = useCallback(async (channelType: ChannelType) => {
    setLoadingChannels(prev => new Set(prev).add(channelType));
    
    try {
      const widgets = getChannelWidgets(channelType);
      const newData: Record<WidgetType, any> = {} as Record<WidgetType, any>;
      
      // 這裡應該根據不同的 widget 類型載入相應的數據
      // 暫時使用模擬數據
      for (const widgetType of widgets) {
        switch (widgetType) {
          case WidgetType.OUTPUT_STATS:
            newData[widgetType] = { todayCount: 125, percentage: 85 };
            break;
          case WidgetType.BOOKED_OUT_STATS:
            newData[widgetType] = { todayCount: 45, percentage: 92 };
            break;
          case WidgetType.PRODUCT_MIX_CHART:
            newData[widgetType] = { utilizationRate: 78, totalProducts: 234 };
            break;
          case WidgetType.RECENT_ACTIVITY:
            newData[widgetType] = { activeUsers: 12, recentActions: 156 };
            break;
          default:
            newData[widgetType] = {};
        }
      }
      
      setWidgetData(prev => ({ ...prev, ...newData }));
    } catch (error) {
      console.error(`Error loading channel ${channelType} data:`, error);
    } finally {
      setLoadingChannels(prev => {
        const newSet = new Set(prev);
        newSet.delete(channelType);
        return newSet;
      });
    }
  }, []);
  
  // 載入訂閱的 channels 數據
  useEffect(() => {
    subscription.subscribedChannels.forEach(channelType => {
      loadChannelData(channelType);
    });
  }, [subscription.subscribedChannels, refreshTrigger, loadChannelData]);
  
  // 切換 channel 展開狀態
  const handleToggleExpanded = useCallback((channelId: ChannelType) => {
    setSubscription(prev => {
      const expandedChannels = prev.expandedChannels || [];
      const isExpanded = expandedChannels.includes(channelId);
      
      return {
        ...prev,
        expandedChannels: isExpanded
          ? expandedChannels.filter(id => id !== channelId)
          : [...expandedChannels, channelId]
      };
    });
  }, []);
  
  // 切換 channel 訂閱狀態
  const handleToggleSubscribe = useCallback(async (channelId: ChannelType) => {
    const isSubscribed = subscription.subscribedChannels.includes(channelId);
    
    const newSubscription = {
      ...subscription,
      subscribedChannels: isSubscribed
        ? subscription.subscribedChannels.filter(id => id !== channelId)
        : [...subscription.subscribedChannels, channelId]
    };
    
    setSubscription(newSubscription);
    
    // 保存到資料庫
    if (user?.id) {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('user_channel_subscriptions')
          .upsert({
            user_id: user.id,
            subscribed_channels: newSubscription.subscribedChannels,
            expanded_channels: newSubscription.expandedChannels,
            channel_order: newSubscription.channelOrder,
            updated_at: new Date().toISOString()
          });
          
        if (error) throw error;
        
        toast.success(isSubscribed ? 'Channel 已取消訂閱' : 'Channel 已訂閱');
      } catch (error) {
        console.error('Error saving subscription:', error);
        toast.error('儲存失敗');
      }
    }
  }, [subscription, user?.id]);
  
  // 處理訂閱更新
  const handleSubscriptionUpdate = useCallback((newChannels: ChannelType[]) => {
    setSubscription(prev => ({
      ...prev,
      subscribedChannels: newChannels
    }));
    setShowSubscriptionDialog(false);
    
    // 保存到資料庫
    if (user?.id) {
      const supabase = createClient();
      supabase
        .from('user_channel_subscriptions')
        .upsert({
          user_id: user.id,
          subscribed_channels: newChannels,
          expanded_channels: subscription.expandedChannels,
          channel_order: subscription.channelOrder,
          updated_at: new Date().toISOString()
        })
        .then(({ error }) => {
          if (error) {
            console.error('Error saving subscription:', error);
            toast.error('儲存失敗');
          } else {
            toast.success('訂閱設置已更新');
          }
        });
    }
  }, [subscription.expandedChannels, subscription.channelOrder, user?.id]);
  
  // 根據訂閱狀態排序 channels
  const sortedChannels = Object.values(CHANNEL_CONFIG).sort((a, b) => {
    const aSubscribed = subscription.subscribedChannels.includes(a.id);
    const bSubscribed = subscription.subscribedChannels.includes(b.id);
    
    // 訂閱的排在前面
    if (aSubscribed && !bSubscribed) return -1;
    if (!aSubscribed && bSubscribed) return 1;
    
    // 根據自定義順序或默認順序排序
    const aOrder = subscription.channelOrder?.[a.id] ?? a.order ?? 999;
    const bOrder = subscription.channelOrder?.[b.id] ?? b.order ?? 999;
    return aOrder - bOrder;
  });
  
  return (
    <>
      {/* 控制欄 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Dashboard</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSubscriptionDialog(true)}
            className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 hover:border-slate-500/70 text-slate-300 hover:text-white"
          >
            <Squares2X2Icon className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">管理 Channels</span>
          </Button>
        </div>
      </div>
      
      {/* Channel 網格 */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {sortedChannels.map((channel, index) => {
            const isSubscribed = subscription.subscribedChannels.includes(channel.id);
            const isExpanded = subscription.expandedChannels?.includes(channel.id) || false;
            const isLoading = loadingChannels.has(channel.id);
            
            return (
              <motion.div
                key={channel.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <ChannelCard
                  channel={channel}
                  isSubscribed={isSubscribed}
                  isExpanded={isExpanded}
                  onToggleExpanded={handleToggleExpanded}
                  onToggleSubscribe={handleToggleSubscribe}
                  widgetData={widgetData}
                  isLoading={isLoading}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      
      {/* 訂閱管理對話框 */}
      <ChannelSubscriptionDialog
        open={showSubscriptionDialog}
        onClose={() => setShowSubscriptionDialog(false)}
        subscribedChannels={subscription.subscribedChannels}
        onUpdate={handleSubscriptionUpdate}
      />
    </>
  );
}