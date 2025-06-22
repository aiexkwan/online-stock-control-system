const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkDashboardConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bbmkuiplnzvpudszrend.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWt1aXBsbnp2cHVkc3pyZW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3MTU2MDQsImV4cCI6MjA2MTI5MTYwNH0._xBzFK-3gOqyztwpvR6xfMbLd3ynTubEg5Z1iLYj92Q';
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No user found - need to authenticate first');
      return;
    }

    console.log('Current user:', user.email);

    // Check admin_dashboard_settings
    const { data, error } = await supabase
      .from('admin_dashboard_settings')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching dashboard settings:', error);
      return;
    }

    console.log('\n📊 Dashboard Settings:');
    if (data && data.length > 0) {
      data.forEach(setting => {
        console.log(`\nBreakpoint: ${setting.breakpoint}`);
        console.log('Layout:', JSON.stringify(setting.layout, null, 2));
        
        // Check each widget
        if (setting.layout && setting.layout.widgets) {
          console.log('\nWidget Analysis:');
          setting.layout.widgets.forEach(widget => {
            console.log(`  Widget ${widget.id}:`);
            console.log(`    Type: ${widget.type}`);
            console.log(`    GridProps: w=${widget.gridProps?.w}, h=${widget.gridProps?.h}`);
            console.log(`    Config Size: ${widget.config?.size}`);
            console.log(`    Position: x=${widget.gridProps?.x}, y=${widget.gridProps?.y}`);
          });
        }
      });
    } else {
      console.log('No dashboard settings found in database');
    }

    // Also check localStorage
    console.log('\n📦 LocalStorage Key:', `admin_dashboard_${user.id}_lg`);
    console.log('(Check browser console for localStorage data)');

  } catch (error) {
    console.error('Error:', error);
  }
}

checkDashboardConfig();