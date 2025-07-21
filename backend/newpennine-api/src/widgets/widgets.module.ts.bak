import { Module } from '@nestjs/common';
import { WidgetsController } from './widgets.controller';
import { WidgetsService } from './widgets.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { WidgetCacheService } from './cache/widget-cache.service';
import { WidgetPermissionsGuard } from './guards/widget-permissions.guard';

@Module({
  imports: [SupabaseModule],
  controllers: [WidgetsController],
  providers: [WidgetsService, WidgetCacheService, WidgetPermissionsGuard],
  exports: [WidgetsService, WidgetCacheService],
})
export class WidgetsModule {}
