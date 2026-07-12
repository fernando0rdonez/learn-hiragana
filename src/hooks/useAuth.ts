import { useEffect, useRef, useState } from "react";
import type { AuthError, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

type OtpStage = "idle" | "codeSent" | "verifying";

/** Los mensajes de Supabase vienen en inglés y a veces con jerga de API — se traducen los casos comunes. */
function describeRequestError(error: AuthError): string {
  if (error.code === "email_address_invalid") return "Ese correo no parece válido.";
  return "No se pudo enviar el código. Intenta de nuevo en un momento.";
}

function describeVerifyError(error: AuthError): string {
  if (error.code === "otp_expired") return "Código incorrecto o expirado. Pide uno nuevo.";
  return "No se pudo verificar el código. Intenta de nuevo.";
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [otpStage, setOtpStage] = useState<OtpStage>("idle");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => () => { if (cooldownTimer.current) clearInterval(cooldownTimer.current); }, []);

  function startCooldown(seconds: number) {
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    setCooldownSeconds(seconds);
    cooldownTimer.current = setInterval(() => {
      setCooldownSeconds((s) => {
        if (s <= 1) {
          if (cooldownTimer.current) clearInterval(cooldownTimer.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  async function requestCode(email: string) {
    setOtpError(null);
    const emailRedirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } });
    if (error) {
      if (error.code === "over_email_send_rate_limit") {
        const match = error.message.match(/(\d+)\s*second/i);
        startCooldown(match ? Number(match[1]) : 60);
      } else {
        setOtpError(describeRequestError(error));
      }
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
      setOtpError(describeVerifyError(error));
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
    otpStage, otpError, pendingEmail, cooldownSeconds,
    requestCode, verifyCode, cancelOtp, signOut,
  };
}
