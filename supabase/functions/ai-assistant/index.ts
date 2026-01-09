import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, patientCode, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let contextData = "";
    let systemPrompt = "";

    // Patient mode - lookup referral by code
    if (mode === "patient" && patientCode) {
      const { data: referral, error } = await supabase
        .from("referrals")
        .select(`
          id, status, urgency, patient_name, created_at, updated_at,
          from_hospital:hospitals!referrals_from_hospital_id_fkey(name),
          to_hospital:hospitals!referrals_to_hospital_id_fkey(name)
        `)
        .eq("patient_code", patientCode)
        .single();

      if (error || !referral) {
        contextData = "No referral found with that code.";
      } else {
        const fromHospital = referral.from_hospital as unknown as { name: string } | null;
        const toHospital = referral.to_hospital as unknown as { name: string } | null;
        contextData = `
Referral Status: ${referral.status}
Urgency Level: ${referral.urgency}
From Hospital: ${fromHospital?.name || "Unknown"}
To Hospital: ${toHospital?.name || "Unknown"}
Created: ${new Date(referral.created_at).toLocaleDateString()}
Last Updated: ${new Date(referral.updated_at).toLocaleDateString()}
`;
      }

      systemPrompt = `You are a helpful medical referral assistant for patients. You help patients understand their referral status and answer general questions about the referral process.

IMPORTANT GUIDELINES:
- Be empathetic and supportive
- Keep responses concise and easy to understand
- Do not share sensitive medical details
- If asked about medical conditions, advise them to contact their doctor
- Only discuss referral status, process, and general information

Current referral information:
${contextData}

Respond helpfully to the patient's questions.`;
    }
    // Doctor mode - authenticated access
    else if (mode === "doctor") {
      const authHeader = req.headers.get("authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get doctor's profile and hospital
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, hospital_id, specialty")
        .eq("id", user.id)
        .single();

      // Get doctor's recent referrals
      const { data: referrals } = await supabase
        .from("referrals")
        .select(`
          id, patient_name, status, urgency, created_at,
          from_hospital:hospitals!referrals_from_hospital_id_fkey(name),
          to_hospital:hospitals!referrals_to_hospital_id_fkey(name)
        `)
        .or(`created_by.eq.${user.id},assigned_doctor_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(10);

      // Get pending referral counts
      const { count: pendingCount } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      const { count: urgentCount } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
        .eq("urgency", "urgent");

      contextData = `
Doctor: ${profile?.full_name || "Unknown"}
Specialty: ${profile?.specialty || "Not specified"}
Pending Referrals: ${pendingCount || 0}
Urgent Pending: ${urgentCount || 0}

Recent Referrals:
${referrals?.map(r => {
  const fromHospital = r.from_hospital as unknown as { name: string } | null;
  const toHospital = r.to_hospital as unknown as { name: string } | null;
  return `- ${r.patient_name}: ${r.status} (${r.urgency}) - From: ${fromHospital?.name || "Unknown"} To: ${toHospital?.name || "Unknown"}`;
}).join("\n") || "No recent referrals"}
`;

      systemPrompt = `You are an AI assistant for MedRefer, a medical referral management system. You help doctors with:
- Understanding their referral workflow
- Providing summaries of pending referrals
- Answering questions about the referral process
- Offering general medical workflow assistance

IMPORTANT GUIDELINES:
- Be professional and concise
- Help with administrative tasks and workflow
- Do NOT provide medical diagnoses or treatment advice
- Reference the doctor's actual referral data when relevant
- Suggest next steps when appropriate

Current context:
${contextData}

Respond helpfully to the doctor's questions.`;
    }
    // General assistant mode (for unauthenticated patient queries without code)
    else {
      systemPrompt = `You are a helpful assistant for MedRefer, a medical referral system. You can help with:
- Explaining how the referral process works
- Answering general questions about medical referrals
- Guiding patients on how to check their referral status (they need their referral code)
- Explaining what to expect during the referral process

IMPORTANT:
- Be helpful and empathetic
- Do not provide medical advice
- Encourage patients to enter their referral code to get specific status updates
- Keep responses concise and easy to understand

Respond helpfully to the user's questions.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
