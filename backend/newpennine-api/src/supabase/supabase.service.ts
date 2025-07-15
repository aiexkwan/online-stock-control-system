import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import supabaseConfig from '../config/supabase.config';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(
    @Inject(supabaseConfig.KEY)
    private config: ConfigType<typeof supabaseConfig>,
  ) {
    if (!this.config.url || !this.config.serviceRoleKey) {
      throw new Error('Supabase URL and service role key must be configured');
    }

    this.supabase = createClient(this.config.url, this.config.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }
}
