import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Only create a default profile for a first-time user. Never overwrite
      // fields, including status, on an existing profile during sign-in.
      const { data: existingProfile, error: profileLookupError } = await supabase
        .from("profiles")
        .select("id, status")
        .eq("id", data.user.id)
        .single();

      if (profileLookupError && profileLookupError.code !== "PGRST116") {
        return NextResponse.redirect(`${origin}/login?error=profile_lookup_failed`);
      }

      if (existingProfile?.status === "inactive") {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=inactive`);
      }

      if (!existingProfile) {
        const { error: profileInsertError } = await supabase.from("profiles").insert({
          id: data.user.id,
          full_name: data.user.user_metadata?.full_name ?? "",
          avatar_url: data.user.user_metadata?.avatar_url ?? "",
          role: "member",
          status: "active",
          profile_completed: false,
        });

        if (profileInsertError) {
          return NextResponse.redirect(`${origin}/login?error=profile_creation_failed`);
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
