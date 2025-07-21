import { Module } from '@nestjs/common';
import { RpcController } from './rpc.controller';
import { RpcService } from './rpc.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [RpcController],
  providers: [RpcService],
  exports: [RpcService],
})
export class RpcModule {}
