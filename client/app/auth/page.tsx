"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useGoogleLogin } from "@react-oauth/google";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth";
import { useEffect } from "react";

export default function RolePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlRole = searchParams.get("role") as "student" | "teacher" | "parent" | null;

  const { role, setField } = useOnboardingStore();
  const { login } = useAuthStore();

  // Sync role from URL
  useEffect(() => {
    if (urlRole) setField("role", urlRole);
  }, [urlRole, setField]);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setField("idToken", tokenResponse.access_token);

      try {
        const res = await api.post("/auth/google", {
          idToken: tokenResponse.access_token,
          role: urlRole || role,
        });

        if (res.data.success) {
          const { user, token } = res.data.data;
          login(user, token);
          router.replace("/explore");
        }
      } catch (err: any) {
        router.push("/auth/details");
      }
    },
    onError: () => console.error("Google Sign-In failed"),
  });

  const headingMap: Record<string, string> = {
    student: "Continue as Student",
    teacher: "Continue as Teacher",
    parent: "Continue as Parent",
  };

  const subtitleMap: Record<string, string> = {
    student: "Sign in to start your learning journey",
    teacher: "Sign in to manage your classes and students",
    parent: "Sign in to stay updated with your child’s progress",
  };

  // roles list to render → either all 3, or just the one from URL
  const rolesToRender = urlRole ? [urlRole] : ["student", "teacher", "parent"];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      {/* Logo */}
      <div className="mb-10">
        <Image
          src="/logos/FULL LOGO VERTICAL COLOR.png"
          alt="Logo"
          width={180}
          height={180}
          priority
        />
      </div>

      {/* Heading */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-medium text-gray-800">
          {urlRole ? headingMap[urlRole] : "Select Your Role"}
        </h1>
        <p className="mt-2 text-gray-500 text-lg">
          {urlRole ? subtitleMap[urlRole] : "Choose whether you’re a student, teacher, or parent to continue"}
        </p>
      </div>

      {/* Role cards */}
      <div
        className={`grid gap-6 w-full ${
          rolesToRender.length === 1 ? "max-w-sm" : "max-w-4xl md:grid-cols-3"
        }`}
      >
        {rolesToRender.map((r) => (
          <div
            key={r}
            onClick={() => setField("role", r)}
            className={`flex flex-col items-center justify-center p-10 rounded-3xl shadow-md transition-transform cursor-pointer bg-white
              ${
                role === r
                  ? "border-2 border-primary scale-105"
                  : "border hover:scale-105"
              }`}
          >
            <Image
              src={`/${r}.png`}
              alt={r}
              width={120}
              height={120}
              className="mb-4"
            />
            <p className="text-xl font-semibold capitalize text-gray-700">
              {r}
            </p>
          </div>
        ))}
      </div>

      {/* Google button */}
      {(role || urlRole) && (
        <Button
          onClick={() => googleLogin()}
          className="flex bg-white border flex-row gap-8 justify-center mt-12 w-fit mx-auto text-lg py-8 px-8 rounded-xl shadow-md hover:shadow-xl hover:bg-white hover:scale-105 transition"
        >
          <Image
            src={"/google-icon.svg"}
            alt="google-icon"
            height={36}
            width={36}
          />
          <p className="text-gray-600">Continue with Google</p>
        </Button>
      )}
    </div>
  );
}
