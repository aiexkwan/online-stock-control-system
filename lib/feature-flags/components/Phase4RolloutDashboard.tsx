/**
 * Phase 4 Rollout Dashboard
 * 
 * 監控測試基礎設施的漸進式發布進度
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { phase4FeatureFlags, getCurrentCoverageTarget } from '../configs/phase4-rollout';
import { useFeatureFlags } from '../hooks/useFeatureFlag';
import { FeatureFlagStatus } from '../types';

interface RolloutMetrics {
  totalUsers: number;
  enabledUsers: number;
  testCoverage: number;
  testsRun: number;
  testsPassed: number;
  ciBuilds: number;
  successfulBuilds: number;
}

export function Phase4RolloutDashboard() {
  const [metrics, setMetrics] = useState<RolloutMetrics>({
    totalUsers: 100,
    enabledUsers: 10,
    testCoverage: 10.4,
    testsRun: 156,
    testsPassed: 148,
    ciBuilds: 25,
    successfulBuilds: 23
  });

  const { flags, loading } = useFeatureFlags(
    phase4FeatureFlags.map(f => f.key)
  );

  useEffect(() => {
    // 模擬實時數據更新
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        testsRun: prev.testsRun + Math.floor(Math.random() * 5),
        testsPassed: prev.testsPassed + Math.floor(Math.random() * 4),
        ciBuilds: prev.ciBuilds + (Math.random() > 0.7 ? 1 : 0),
        successfulBuilds: prev.successfulBuilds + (Math.random() > 0.8 ? 1 : 0)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div>Loading rollout dashboard...</div>;
  }

  const coverageTarget = getCurrentCoverageTarget();
  const coverageProgress = (metrics.testCoverage / coverageTarget) * 100;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Phase 4: Testing Infrastructure Rollout</h1>
        <Badge variant="secondary" className="text-sm">
          {new Date().toLocaleDateString()} - Day {Math.floor((Date.now() - new Date('2025-01-06').getTime()) / (1000 * 60 * 60 * 24)) + 1} of 14
        </Badge>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Rollout Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>User Rollout</span>
                <span>{metrics.enabledUsers}%</span>
              </div>
              <Progress value={metrics.enabledUsers} />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Test Coverage (Target: {coverageTarget}%)</span>
                <span>{metrics.testCoverage}%</span>
              </div>
              <Progress 
                value={coverageProgress} 
                className={coverageProgress >= 100 ? 'bg-green-500' : ''}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {phase4FeatureFlags.map(flag => {
          const isEnabled = flags[flag.key]?.enabled;
          
          return (
            <Card key={flag.key}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{flag.name}</CardTitle>
                  <Badge 
                    variant={
                      flag.status === FeatureFlagStatus.ENABLED ? 'default' :
                      flag.status === FeatureFlagStatus.PARTIAL ? 'secondary' :
                      'outline'
                    }
                  >
                    {flag.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {flag.description}
                </p>
                
                {flag.type === 'percentage' && flag.rolloutPercentage !== undefined && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Rollout</span>
                      <span>{flag.rolloutPercentage}%</span>
                    </div>
                    <Progress value={flag.rolloutPercentage} />
                  </div>
                )}
                
                {flag.type === 'variant' && flag.variants && (
                  <div className="space-y-1">
                    {flag.variants.map(variant => (
                      <div key={variant.key} className="flex justify-between text-sm">
                        <span>{variant.name}</span>
                        <span>{variant.weight}%</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-3 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-xs">
                    {isEnabled ? 'Enabled for you' : 'Not enabled'}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{metrics.testsRun}</div>
            <p className="text-xs text-muted-foreground">Tests Run</p>
            <div className="text-sm text-green-600 mt-1">
              {((metrics.testsPassed / metrics.testsRun) * 100).toFixed(1)}% Pass Rate
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{metrics.ciBuilds}</div>
            <p className="text-xs text-muted-foreground">CI Builds</p>
            <div className="text-sm text-green-600 mt-1">
              {((metrics.successfulBuilds / metrics.ciBuilds) * 100).toFixed(1)}% Success
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{metrics.testCoverage}%</div>
            <p className="text-xs text-muted-foreground">Code Coverage</p>
            <div className="text-sm text-amber-600 mt-1">
              +{(metrics.testCoverage - 2.12).toFixed(2)}% from baseline
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{metrics.enabledUsers}%</div>
            <p className="text-xs text-muted-foreground">Users with Access</p>
            <div className="text-sm text-blue-600 mt-1">
              Gradual rollout active
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Migration Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Migration Phases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Testing Infrastructure', progress: 100, status: 'completed' },
              { name: 'Unit Tests', progress: 10, status: 'in-progress' },
              { name: 'Integration Tests', progress: 0, status: 'pending' },
              { name: 'E2E Tests', progress: 0, status: 'pending' },
              { name: 'Performance Tests', progress: 0, status: 'pending' }
            ].map(phase => (
              <div key={phase.name} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{phase.name}</span>
                    <span className="text-muted-foreground">{phase.progress}%</span>
                  </div>
                  <Progress value={phase.progress} />
                </div>
                <Badge 
                  variant={
                    phase.status === 'completed' ? 'default' :
                    phase.status === 'in-progress' ? 'secondary' :
                    'outline'
                  }
                  className="text-xs"
                >
                  {phase.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {metrics.testCoverage < coverageTarget && (
        <Alert>
          <AlertDescription>
            Test coverage is below the target of {coverageTarget}%. 
            Continue adding tests to reach the milestone by {
              phase4FeatureFlags.find(f => f.key === 'jest_unit_tests')?.metadata?.coverage?.milestones?.[0]?.date
            }.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}