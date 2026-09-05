import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const ASSISTANT_ROLE_ID = "33333333-3333-3333-3333-333333333333";
const ASSISTANT_EMAIL_DOMAIN = "assistants.internal";

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData, error: authError } = await callerClient.auth.getUser();
    if (authError || !authData.user) {
      return json({ error: "Not authenticated" }, 401);
    }

    const { username, password, fullName, tenantId } = await req.json();

    if (!username || !password || !tenantId) {
      return json({ error: "username, password, and tenantId are required" }, 400);
    }
    if (!/^[A-Za-z0-9]+$/.test(username)) {
      return json({ error: "Username must be letters and numbers only, no spaces" }, 400);
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: callerRow } = await adminClient
      .from("users")
      .select("id, role_id, roles(code)")
      .eq("auth_uid", authData.user.id)
      .single();

    if (!callerRow || (callerRow as any).roles?.code !== "founder") {
      return json({ error: "Only founders can create assistants" }, 403);
    }

    const { data: membership } = await adminClient
      .from("tenant_users")
      .select("tenant_id")
      .eq("user_id", callerRow.id)
      .eq("tenant_id", tenantId)
      .eq("is_founder", true)
      .maybeSingle();

    if (!membership) {
      return json({ error: "You do not own this project" }, 403);
    }

    const { data: usernameTaken } = await adminClient.rpc("fn_is_username_taken", {
      p_username: username,
    });
    if (usernameTaken) {
      return json({ error: "This username is already taken" }, 409);
    }

    const syntheticEmail = `${username.toLowerCase()}@${ASSISTANT_EMAIL_DOMAIN}`;

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email: syntheticEmail,
      password,
      email_confirm: true,
      user_metadata: { username, is_assistant: true },
    });

    if (createError || !created.user) {
      return json({ error: createError?.message || "Failed to create assistant account" }, 500);
    }

    const { data: newUserRow, error: insertUserError } = await adminClient
      .from("users")
      .insert({
        auth_uid: created.user.id,
        role_id: ASSISTANT_ROLE_ID,
        full_name: fullName || username,
        username,
        email: syntheticEmail,
      })
      .select()
      .single();

    if (insertUserError || !newUserRow) {
      await adminClient.auth.admin.deleteUser(created.user.id);
      return json({ error: insertUserError?.message || "Failed to create profile" }, 500);
    }

    await adminClient.from("tenant_users").insert({
      tenant_id: tenantId,
      user_id: newUserRow.id,
      is_founder: false,
    });

    return json({ ok: true, username, userId: newUserRow.id });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
