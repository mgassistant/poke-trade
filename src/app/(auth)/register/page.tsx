"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";

// Client-side password strength (mirrors auth-security.ts logic)
function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  score = Math.min(score, 4);

  const labels: Record<number, { label: string; color: string }> = {
    0: { label: "Very Weak", color: "bg-red-500" },
    1: { label: "Weak", color: "bg-orange-500" },
    2: { label: "Fair", color: "bg-yellow-500" },
    3: { label: "Strong", color: "bg-green-400" },
    4: { label: "Very Strong", color: "bg-green-600" },
  };

  return { score, ...labels[score] };
}

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [honeypot, setHoneypot] = useState(""); // bot trap
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [phone, setPhone] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [emailConsent, setEmailConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Honeypot check — bots fill hidden fields
    if (honeypot) {
      // Silently "succeed" to confuse bots
      setSuccess(true);
      setLoading(false);
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      setLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username can only contain letters, numbers, and underscores");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    if (passwordStrength.score < 2) {
      setError("Password is too weak. Add uppercase letters, numbers, or special characters.");
      setLoading(false);
      return;
    }

    if (!ageConfirmed) {
      setError("You must be 13 or older to create an account");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // Check username availability
      const { data: existing, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.toLowerCase())
        .single();

      if (!profileError && existing) {
        setError("Username is already taken");
        setLoading(false);
        return;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.toLowerCase(),
            display_name: username,
            phone: phone || undefined,
            sms_consent: smsConsent,
            email_consent: emailConsent,
          },
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message || "Failed to create account. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  if (success) {
    return (
      <Card>
        <CardContent className="pt-8 text-center">
          <div className="text-4xl mb-4">📧</div>
          <h2 className="text-xl font-bold mb-2">Check Your Email</h2>
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent a verification link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <Button variant="outline" className="mt-6" asChild>
            <Link href="/login">Back to Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create Account</CardTitle>
        <CardDescription>Start trading Pokémon cards today</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md p-3">
              {typeof error === "string" ? error : "Something went wrong. Please try again."}
            </div>
          )}

          {/* Honeypot field — hidden from real users, bots fill it */}
          <div className="absolute opacity-0 -z-10" aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
            <label htmlFor="website">Website</label>
            <Input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">Username</label>
            <Input
              id="username"
              type="text"
              placeholder="ash_ketchum"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9_]+"
            />
            <p className="text-xs text-muted-foreground">Letters, numbers, and underscores only</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input
              id="email"
              type="email"
              placeholder="trainer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            {/* Password strength meter */}
            {password.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1 h-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-colors ${
                        i < passwordStrength.score
                          ? passwordStrength.color
                          : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Strength: {passwordStrength.label}
                </p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">At least 8 characters</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">Phone Number <span className="text-muted-foreground font-normal">(optional)</span></label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Communication Preferences — required for ClickSend SMS compliance */}
          <div className="space-y-3 rounded-lg border border-border p-3">
            <p className="text-sm font-medium">Communication Preferences</p>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="sms-consent"
                className="mt-1 accent-primary"
                checked={smsConsent}
                onChange={(e) => setSmsConsent(e.target.checked)}
              />
              <label htmlFor="sms-consent" className="text-xs text-muted-foreground">
                I agree to receive <strong>text messages</strong> from Poké-Trade regarding my account,
                trade updates, restock alerts, and promotions. Message frequency may vary.
                Message and data rates may apply. Reply STOP to opt out or HELP for assistance.
              </label>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="email-consent"
                className="mt-1 accent-primary"
                checked={emailConsent}
                onChange={(e) => setEmailConsent(e.target.checked)}
              />
              <label htmlFor="email-consent" className="text-xs text-muted-foreground">
                I agree to receive <strong>emails</strong> from Poké-Trade regarding my account,
                trade updates, restock alerts, and promotions. You may unsubscribe at any time.
              </label>
            </div>

            <p className="text-[11px] text-red-500">
              Consent is not a condition of purchase. Your mobile information will not be shared with
              third parties or affiliates for marketing or promotional purposes.{" "}
              <Link href="/sms-terms" className="text-primary hover:underline">SMS Terms</Link>
              {" · "}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
            </p>
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="age-confirm"
              required
              className="mt-1 accent-primary"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
            />
            <label htmlFor="age-confirm" className="text-xs text-muted-foreground">
              I confirm I am 13 years of age or older
            </label>
          </div>

          <div className="flex items-start gap-2">
            <input type="checkbox" id="terms" required className="mt-1 accent-primary" />
            <label htmlFor="terms" className="text-xs text-muted-foreground">
              I agree to the{" "}
              <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
            </label>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !ageConfirmed}>
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>

        <Button variant="outline" className="w-full" onClick={handleGoogleSignup}>
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </Button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign In
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
