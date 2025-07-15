import { Module } from '@nestjs/common';
import { AcoController } from './aco.controller';
import { AcoService } from './aco.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [AcoController],
  providers: [AcoService],
  exports: [AcoService],
})
export class AcoModule {}