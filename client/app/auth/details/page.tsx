"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useState } from "react";
import { useAuthStore } from "@/lib/store/auth";
import Image from "next/image";

export default function DetailsPage() {
  const router = useRouter();
  const {
    role,
    idToken,
    name,
    phone,
    pincode,
    state,
    city,
    country,
    age,
    setField,
  } = useOnboardingStore();
  const { login } = useAuthStore();

  const [errorMessage, setErrorMessage] = useState("");

  const fetchLocation = async (pin: string) => {
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (data[0]?.PostOffice?.length > 0) {
        const info = data[0].PostOffice[0];
        setField("city", info.District);
        setField("state", info.State);
        setField("country", "India");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    try {
      const payload: any = {
        role,
        idToken,
        name,
        phone,
        pincode,
        state,
        city,
        country,
        age,
      };

      const res = await api.post("/auth/google", payload);
      const { user, token } = res.data.data;

      login(user, token);

      if (role === "parent") router.push("/auth/add-student");
      else if (role === "student") router.push("/auth/student");
      else router.push("/auth/teacher");
    } catch (err) {
      setErrorMessage("Failed to submit. Try again.");
    }
  };

  return (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
    {/* Logo */}
    <div className="mb-8">
      <Image
        src="/logos/FULL LOGO VERTICAL COLOR.png"
        alt="Logo"
        width={160}
        height={160}
        priority
      />
    </div>

    {/* Card */}
    <div className="border w-full max-w-2xl bg-white p-10 rounded-2xl shadow-lg space-y-8">
      {/* Heading + subtitle */}
      <div className="text-center">
        <h1 className="text-3xl font-medium text-gray-800">
          Complete Your Profile
        </h1>
        <p className="mt-2 text-gray-500 text-lg">
          Just a few more details to finish setting up your account
        </p>
      </div>

      {/* Error */}
      {errorMessage && (
        <p className="text-red-500 text-sm text-center">{errorMessage}</p>
      )}

      {/* Input fields */}
      <div className="space-y-5">
        <Input
          className="h-14 text-lg"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setField("name", e.target.value)}
        />
        <Input
          className="h-14 text-lg"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setField("phone", e.target.value)}
        />
        {role === "student" && (
          <Input
            className="h-14 text-lg"
            placeholder="Age"
            type="number"
            value={age || ""}
            onChange={(e) => setField("age", Number(e.target.value))}
          />
        )}

        {/* PIN + City row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            className="h-14 text-lg"
            placeholder="PIN Code"
            value={pincode}
            onChange={(e) => {
              setField("pincode", e.target.value);
              if (e.target.value.length === 6) fetchLocation(e.target.value);
            }}
          />
          <Input
            className="h-14 text-lg"
            placeholder="City"
            value={city}
            onChange={(e) => setField("city", e.target.value)}
          />
        </div>

        {/* State + Country row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            className="h-14 text-lg"
            placeholder="State"
            value={state}
            onChange={(e) => setField("state", e.target.value)}
          />
          <Input
            className="h-14 text-lg"
            placeholder="Country"
            value={country}
            onChange={(e) => setField("country", e.target.value)}
          />
        </div>
      </div>

      {/* Submit button aligned right */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          className="px-6 py-3 bg-primary text-white text-lg w-fit flex items-center gap-2"
        >
          Submit <span className="text-xl">→</span>
        </Button>
      </div>
    </div>
  </div>
);

}
