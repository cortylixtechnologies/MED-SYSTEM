import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SecurityLogEntry {
  event_type: string;
  ip_address?: string;
  user_agent?: string;
  user_id?: string;
  email?: string;
  details?: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get client IP
    const forwarded = req.headers.get("x-forwarded-for");
    const clientIp = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const body = await req.json() as SecurityLogEntry;
    const { event_type, ip_address, user_agent: bodyUserAgent, user_id, email, details } = body;

    // Check if IP is blocked
    const { data: blockedIp } = await supabase
      .from("blocked_ips")
      .select("*")
      .eq("ip_address", ip_address || clientIp)
      .eq("is_active", true)
      .single();

    if (blockedIp) {
      // Check if block has expired
      if (blockedIp.expires_at && new Date(blockedIp.expires_at) < new Date()) {
        // Deactivate expired block
        await supabase
          .from("blocked_ips")
          .update({ is_active: false })
          .eq("id", blockedIp.id);
      } else {
        // Log blocked access attempt
        await supabase.from("security_logs").insert({
          event_type: "blocked_access",
          ip_address: ip_address || clientIp,
          user_agent: bodyUserAgent || userAgent,
          user_id,
          email,
          details: { ...details, block_reason: blockedIp.reason },
        });

        return new Response(
          JSON.stringify({ error: "Access denied", blocked: true }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Insert security log
    const { error: insertError } = await supabase.from("security_logs").insert({
      event_type,
      ip_address: ip_address || clientIp,
      user_agent: bodyUserAgent || userAgent,
      user_id,
      email,
      details,
    });

    if (insertError) {
      console.error("Error inserting security log:", insertError);
      throw insertError;
    }

    // Check for brute force attempts (5+ failed logins in 15 minutes)
    if (event_type === "login_failure") {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      
      const { data: recentFailures, error: countError } = await supabase
        .from("security_logs")
        .select("id")
        .eq("event_type", "login_failure")
        .eq("ip_address", ip_address || clientIp)
        .gte("created_at", fifteenMinutesAgo);

      if (!countError && recentFailures && recentFailures.length >= 5) {
        // Auto-block IP for 1 hour
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        
        await supabase.from("blocked_ips").upsert({
          ip_address: ip_address || clientIp,
          reason: "Automatic block: Too many failed login attempts",
          blocked_at: new Date().toISOString(),
          expires_at: expiresAt,
          is_active: true,
        }, { onConflict: "ip_address" });

        // Log the auto-block
        await supabase.from("security_logs").insert({
          event_type: "auto_block",
          ip_address: ip_address || clientIp,
          user_agent: bodyUserAgent || userAgent,
          details: { 
            reason: "Too many failed login attempts",
            failed_attempts: recentFailures.length,
            expires_at: expiresAt,
          },
        });

        return new Response(
          JSON.stringify({ 
            success: true, 
            warning: "IP has been temporarily blocked due to suspicious activity" 
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Security logger error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
