"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/auth";
import Image from "next/image";
import { ObjectId } from "mongoose";

interface IClass {
  _id: ObjectId;
  name: string;
}

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
    classLevel,
    classOther,
    setField,
    reset,
  } = useOnboardingStore();
  const { login, user, isAuthenticated } = useAuthStore();
  const [classes, setClasses] = useState<IClass[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  console.log(role);

  useEffect(() => {
    if (!user || !isAuthenticated || !role) return;

    if (user && isAuthenticated) {
      if (role && role == "parent") {
        router.replace("/auth/add-student");
      } else {
        router.replace("/explore");
      }
    }
  }, [user, isAuthenticated, role, router]);

  const fetchClasses = async () => {
    try {
      const res = await api.get("/classes");
      setClasses(res.data.data);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

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
        classLevel: classLevel || undefined,
        classOther: classOther || undefined,
      };

      const res = await api.post("/auth/google", payload);
      const { user, token } = res.data.data;

      login(user, token);
    } catch (err) {
      setErrorMessage("Failed to submit. Try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-primary/10 p-6">
      {/* Logo */}

      {/* Card */}
      <div className="border w-full max-w-2xl flex flex-col items-center justify-center bg-white p-10 rounded-2xl shadow-lg space-y-8">
        <div className="mb-8">
          <Image
            src="/logos/FULL LOGO VERTICAL COLOR.png"
            alt="Logo"
            width={180}
            height={180}
            priority
          />
        </div>
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
            <>
              <Input
                className="h-14 text-lg"
                placeholder="Age"
                type="number"
                value={age || ""}
                onChange={(e) => setField("age", Number(e.target.value))}
              />

              {/* Class Dropdown with shadcn */}

              <Select
                value={classLevel ? String(classLevel) : ""}
                onValueChange={(value) => {
                  if (value === "other") {
                    setField("classLevel", null);
                    setField("classOther", undefined);
                  } else {
                    setField("classLevel", value as unknown as ObjectId);
                  }
                }}
              >
                <SelectTrigger className="h-14 text-lg w-full">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={String(c._id)} value={String(c._id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </>
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
            className="px-8 py-6 bg-primary text-white text-xl w-fit flex items-center gap-2"
          >
            Submit <span className="text-lg">→</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
