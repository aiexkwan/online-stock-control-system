'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/app/utils/supabase/client';
import { 
  toDbTime, 
  fromDbTime, 
  formatDbTime, 
  getTodayRange,
  getYesterdayRange,
  getThisWeekRange,
  USER_TIMEZONE,
  DATABASE_TIMEZONE
} from '@/app/utils/timezone';

export default function TimezoneTester() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [testResults, setTestResults] = useState<any[]>([]);
  const [dbRecords, setDbRecords] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const runTests = () => {
    const results = [];
    const now = new Date();
    
    // Test 1: Current time conversion
    results.push({
      test: 'Current Time Conversion',
      userTime: now.toLocaleString('en-GB', { timeZone: USER_TIMEZONE }),
      dbTime: toDbTime(now),
      backToUser: fromDbTime(toDbTime(now)).toLocaleString('en-GB', { timeZone: USER_TIMEZONE })
    });

    // Test 2: Today's range
    const todayRange = getTodayRange();
    results.push({
      test: "Today's Range",
      start: formatDbTime(todayRange.start, 'dd/MM/yyyy HH:mm:ss'),
      end: formatDbTime(todayRange.end, 'dd/MM/yyyy HH:mm:ss'),
      rawStart: todayRange.start,
      rawEnd: todayRange.end
    });

    // Test 3: Yesterday's range
    const yesterdayRange = getYesterdayRange();
    results.push({
      test: "Yesterday's Range",
      start: formatDbTime(yesterdayRange.start, 'dd/MM/yyyy HH:mm:ss'),
      end: formatDbTime(yesterdayRange.end, 'dd/MM/yyyy HH:mm:ss')
    });

    // Test 4: This week's range
    const weekRange = getThisWeekRange();
    results.push({
      test: "This Week's Range",
      start: formatDbTime(weekRange.start, 'dd/MM/yyyy HH:mm:ss'),
      end: formatDbTime(weekRange.end, 'dd/MM/yyyy HH:mm:ss')
    });

    setTestResults(results);
  };

  const fetchRecords = async () => {
    try {
      const todayRange = getTodayRange();
      
      // Fetch some records to test timezone conversion
      const { data: transfers } = await supabase
        .from('record_transfer')
        .select('transfer_id, plt_num, tran_date, updated_at')
        .gte('tran_date', todayRange.start)
        .lt('tran_date', todayRange.end)
        .limit(5)
        .order('tran_date', { ascending: false });

      if (transfers) {
        const processedRecords = transfers.map(record => ({
          ...record,
          tran_date_user: formatDbTime(record.tran_date, 'dd/MM/yyyy HH:mm:ss'),
          updated_at_user: formatDbTime(record.updated_at, 'dd/MM/yyyy HH:mm:ss')
        }));
        setDbRecords(processedRecords);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white mb-6">Timezone Testing Page</h1>
      
      {/* Current Time Display */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Current Time</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="text-slate-400">Browser Local Time:</span>
            <span className="ml-2 text-white">{currentTime.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-400">UK Time (User Timezone):</span>
            <span className="ml-2 text-white">
              {currentTime.toLocaleString('en-GB', { timeZone: USER_TIMEZONE })}
            </span>
          </div>
          <div>
            <span className="text-slate-400">Database Timezone (US East):</span>
            <span className="ml-2 text-white">
              {currentTime.toLocaleString('en-US', { timeZone: DATABASE_TIMEZONE })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Timezone Conversion Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={runTests} className="bg-blue-600 hover:bg-blue-700">
              Run Conversion Tests
            </Button>
            <Button onClick={fetchRecords} className="bg-green-600 hover:bg-green-700">
              Fetch Database Records
            </Button>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-semibold text-white">Test Results:</h3>
              {testResults.map((result, index) => (
                <div key={index} className="bg-slate-900/50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-400 mb-2">{result.test}</h4>
                  <pre className="text-xs text-slate-300 overflow-x-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {/* Database Records */}
          {dbRecords.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Database Records (Today):</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-2 text-slate-400">ID</th>
                      <th className="text-left p-2 text-slate-400">Pallet</th>
                      <th className="text-left p-2 text-slate-400">DB Time</th>
                      <th className="text-left p-2 text-slate-400">User Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbRecords.map((record) => (
                      <tr key={record.transfer_id} className="border-b border-slate-800">
                        <td className="p-2 text-white">{record.transfer_id}</td>
                        <td className="p-2 text-white">{record.plt_num}</td>
                        <td className="p-2 text-slate-300 text-xs">{record.tran_date}</td>
                        <td className="p-2 text-green-400">{record.tran_date_user}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-slate-300 space-y-2">
          <p>1. Click &quot;Run Conversion Tests&quot; to test timezone conversion functions</p>
          <p>2. Click &quot;Fetch Database Records&quot; to get today&apos;s records and see time conversion</p>
          <p>3. Check if the converted times match your expected UK time</p>
          <p>4. If there&apos;s a discrepancy, we may need to adjust the timezone settings</p>
        </CardContent>
      </Card>
    </div>
  );
}