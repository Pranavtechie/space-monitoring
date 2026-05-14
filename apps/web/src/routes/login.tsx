import { Button } from "@app/ui/components/button";
import { Input } from "@app/ui/components/input";
import { Label } from "@app/ui/components/label";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { accountExists } from "@/functions/account-exists";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

const credentialsSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const nameSchema = z.string().min(2, "Name must be at least 2 characters");

type PendingSignup = {
  email: string;
  password: string;
};

function RouteComponent() {
  const navigate = useNavigate({ from: "/login" });
  const { isPending } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [pendingSignup, setPendingSignup] = useState<PendingSignup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialProvider, setSocialProvider] = useState<"google" | "twitter" | null>(null);

  const redirectToApp = () => {
    navigate({ to: "/" });
  };

  const signInWithSocial = async (provider: "google" | "twitter") => {
    setError(null);
    setSocialProvider(provider);

    await authClient.signIn.social(
      {
        provider,
        callbackURL: "/",
        newUserCallbackURL: "/",
        errorCallbackURL: "/login",
      },
      {
        onError: (authError) => {
          setSocialProvider(null);
          toast.error(authError.error.message || authError.error.statusText);
        },
      },
    );
  };

  const submitCredentials = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = credentialsSchema.safeParse({
      email,
      password,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your email and password");
      return;
    }

    const normalizedEmail = parsed.data.email.toLowerCase();
    setIsSubmitting(true);

    try {
      const exists = await accountExists({ data: { email: normalizedEmail } });

      if (!exists) {
        setPendingSignup({
          email: normalizedEmail,
          password: parsed.data.password,
        });
        toast.info("Add your name to finish creating your account");
        return;
      }

      await authClient.signIn.email(
        {
          email: normalizedEmail,
          password: parsed.data.password,
        },
        {
          onSuccess: () => {
            toast.success("Signed in");
            redirectToApp();
          },
          onError: (authError) => {
            setError(authError.error.message || authError.error.statusText);
          },
        },
      );
    } catch {
      setError("Unable to check this account right now");
    } finally {
      setIsSubmitting(false);
    }
  };

  const finishSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!pendingSignup) {
      return;
    }

    const parsedName = nameSchema.safeParse(name);

    if (!parsedName.success) {
      setError(parsedName.error.issues[0]?.message ?? "Enter your name");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    await authClient.signUp.email(
      {
        email: pendingSignup.email,
        password: pendingSignup.password,
        name: parsedName.data,
      },
      {
        onSuccess: () => {
          toast.success("Account created");
          redirectToApp();
        },
        onError: (authError) => {
          setError(authError.error.message || authError.error.statusText);
        },
      },
    );

    setIsSubmitting(false);
  };

  if (isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <main className="mx-auto mt-10 w-full max-w-md px-6">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Log in or sign up</h1>
          <p className="text-sm text-muted-foreground">
            Use one page for new and existing accounts.
          </p>
        </div>

        <div className="grid gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            disabled={Boolean(socialProvider) || isSubmitting}
            onClick={() => signInWithSocial("google")}
          >
            {socialProvider === "google" ? <Loader2 className="animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            disabled={Boolean(socialProvider) || isSubmitting}
            onClick={() => signInWithSocial("twitter")}
          >
            {socialProvider === "twitter" ? <Loader2 className="animate-spin" /> : <XIcon />}
            Continue with X
          </Button>
        </div>

        <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span>Email</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {pendingSignup ? (
          <form className="space-y-4" onSubmit={finishSignup}>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : null}
              Create account
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full"
              disabled={isSubmitting}
              onClick={() => {
                setPendingSignup(null);
                setError(null);
              }}
            >
              Use a different email
            </Button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={submitCredentials}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : null}
              Continue with email
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-current">
      <path d="M18.9 2h3.35l-7.32 8.36L23.54 22H16.8l-5.28-6.9L5.48 22H2.13l7.83-8.95L1.7 2h6.91l4.77 6.3L18.9 2Zm-1.18 17.95h1.86L7.6 3.95h-2L17.72 19.95Z" />
    </svg>
  );
}
