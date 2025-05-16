import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt/mod.ts";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: rows, error } = await supabase
    .from("data_id")  // <<<<<<<< 將這裡改成你個表名
    .select("id")
    .is("password", null);  // <<<<<<<< password 欄位名，唔好打錯！

  if (error) {
    console.error("Fetch error:", error.message);
    return new Response("Fetch error: " + error.message, { status: 500 });
  }

  for (const row of rows) {
    const hashed = await bcrypt.hash(row.id.toString(), 12);

    const { error: updateErr } = await supabase
      .from("data_id") // <<<<<<<< 改成你的表名
      .update({ password: hashed })
      .eq("id", row.id);

    if (updateErr) {
      console.error(`Failed to update ID ${row.id}: ${updateErr.message}`);
    }
  }

  return new Response(`Hashed ${rows.length} IDs`, { status: 200 });
});
