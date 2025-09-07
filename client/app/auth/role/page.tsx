"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";

export default function RolePage() {
  const router = useRouter();
  const { role, setField } = useOnboardingStore();

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setField("idToken", tokenResponse.access_token);

      try {
        const res = await axios.post("/api/auth/google", {
          idToken: tokenResponse.access_token,
          role,
        });

        if (res.data.success) {
          console.log("Existing user login");
          router.push("/dashboard");
        }
      } catch (err: any) {
        router.push("/auth/details");
      }
    },
    onError: () => console.error("Google Sign-In failed"),
  });

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
        <h1 className="text-4xl font-medium text-gray-800">Select Your Role</h1>
        <p className="mt-2 text-gray-500 text-lg">
          Choose whether you’re a student, teacher, or parent to continue
        </p>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {["student", "teacher", "parent"].map((r) => (
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
      {role && (
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
