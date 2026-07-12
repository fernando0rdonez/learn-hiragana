import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

type OtpStage = "idle" | "codeSent" | "verifying";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [otpStage, setOtpStage] = useState<OtpStage>("idle");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  async function requestCode(email: string) {
    setOtpError(null);
    const emailRedirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } });
    if (error) {
      setOtpError(error.message);
      return false;
    }
    setPendingEmail(email);
    setOtpStage("codeSent");
    return true;
  }

  async function verifyCode(code: string) {
    setOtpError(null);
    setOtpStage("verifying");
    const { error } = await supabase.auth.verifyOtp({ email: pendingEmail, token: code, type: "email" });
    if (error) {
      setOtpError(error.message);
      setOtpStage("codeSent");
      return false;
    }
    setOtpStage("idle");
    setPendingEmail("");
    return true;
  }

  function cancelOtp() {
    setOtpStage("idle");
    setOtpError(null);
    setPendingEmail("");
  }

  async function signOut() {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  }

  return {
    session, user: session?.user ?? null, authLoading,
    otpStage, otpError, pendingEmail,
    requestCode, verifyCode, cancelOtp, signOut,
  };
}
