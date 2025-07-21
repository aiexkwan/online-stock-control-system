import { Module } from '@nestjs/common';
import { WarehouseTransfersController } from './warehouse-transfers.controller';
import { WarehouseTransfersService } from './warehouse-transfers.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [WarehouseTransfersController],
  providers: [WarehouseTransfersService],
  exports: [WarehouseTransfersService],
})
export class WarehouseTransfersModule {}
