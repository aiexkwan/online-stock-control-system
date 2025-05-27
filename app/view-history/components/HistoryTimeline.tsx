import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Clock, MapPin, User, FileText, History } from 'lucide-react';

// 從 actions 文件導入類型
interface HistoryEvent {
  time?: string;
  action?: string;
  loc?: string;
  id?: number;
  remark?: string;
  [key: string]: any;
}

interface HistoryTimelineProps {
  history: HistoryEvent[];
}

// 格式化日期函數
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleString();
  } catch (e) {
    return dateString;
  }
};

export default function HistoryTimeline({ history }: HistoryTimelineProps) {
  // 按時間排序：最舊的在前，最新的在後
  const sortedHistory = [...history].sort((a, b) => {
    if (!a.time || !b.time) return 0;
    return new Date(a.time).getTime() - new Date(b.time).getTime();
  });

  return (
    <Card className="border-blue-400 bg-gray-800 text-white">
      <CardHeader>
        <CardTitle className="text-blue-400 flex items-center">
          <History className="w-5 h-5 mr-2" />
          Operation History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedHistory.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-400">No history records found</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {sortedHistory.map((event, index) => (
              <div key={index} className="relative">
                {/* Timeline line */}
                {index < sortedHistory.length - 1 && (
                  <div className="absolute left-2 top-8 w-0.5 h-full bg-gray-600" />
                )}
                
                <div className="flex items-start space-x-4">
                  {/* Timeline dot */}
                  <div className="flex-shrink-0 w-4 h-4 bg-blue-400 rounded-full mt-2 relative z-10" />
                  
                  {/* Event content */}
                  <div className="flex-1 bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-medium text-blue-400">
                        {event.action || 'Unknown Action'}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDate(event.time)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-300 space-y-2">
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-2 text-gray-400" />
                        <span><strong>Location:</strong> {event.loc || 'N/A'}</span>
                      </div>
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-2 text-gray-400" />
                        <span><strong>Operator:</strong> {event.id || 'N/A'}</span>
                      </div>
                      {event.remark && (
                        <div className="flex items-start">
                          <FileText className="w-3 h-3 mr-2 mt-0.5 text-gray-400" />
                          <span><strong>Remark:</strong> {event.remark}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 