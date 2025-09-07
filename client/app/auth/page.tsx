"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin, useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth";

interface Kid {
  name: string;
  age: number;
  grade?: string;
}

export default function LoginFlow() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const { login } = useAuthStore();

  useEffect(() => setHydrated(true), []);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    role: "",
    idToken: "",
    name: "",
    phone: "",
    pincode: "",
    state: "",
    city: "",
    country: "",
    age: undefined as number | undefined,
  });

  const [studentCode, setStudentCode] = useState("");
  const [addedKids, setAddedKids] = useState<Kid[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Exchange access_token for user info
        const res = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          }
        );

        try {
          const res = await api.post("/auth/google", {
            idToken: tokenResponse.access_token,
            role: form.role,
          })
          console.log(res.data)
          const { user, token } = res.data.data;

          if(res.data.success){
            login(user, token)
          }

          console.log("Login successful!");
        } catch (err: any) {
          if (err.response?.status === 404 || err.response?.status === 400) {
            setForm((prev) => ({
              ...prev,
              idToken: tokenResponse.access_token,
            }));
            setStep(3);
          } else {
            console.error(err);
            setErrorMessage("Google login failed");
          }
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
        setErrorMessage("Failed to get Google user info");
      }
    },
    onError: () => setErrorMessage("Google Sign-In failed"),
  });

  const fetchLocation = async (pincode: string) => {
    try {
      const res = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`
      );
      const data = await res.json();
      if (data[0]?.PostOffice?.length > 0) {
        const info = data[0].PostOffice[0];
        setForm((prev) => ({
          ...prev,
          city: info.District,
          state: info.State,
          country: "India",
        }));
      }
    } catch (err) {
      console.error("Error fetching location:", err);
    }
  };

  const handleSubmit = async () => {
    try {
      const payload: any = {
        role: form.role,
        idToken: form.idToken,
        name: form.name,
        phone: form.phone,
        pincode: form.pincode,
        state: form.state,
        city: form.city,
        country: form.country,
      };

      if (form.role === "student" && form.age) {
        payload.age = form.age;
      }

      await api.post("/auth/google", payload)

      if (form.role === "parent") {
        setStep(4);
      } else {
        console.log("Login successful!");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Error signing up. Please try again.");
    }
  };

  const handleAddChild = async () => {
    if (!studentCode.trim()) {
      setErrorMessage("Please enter a student code");
      return;
    }
    try {
      setLoading(true);
      setErrorMessage("");
      const res = await api.post("/parent/links", {studentCode})
      
      const student = res.data?.data?.student;
      if (!student) {
        setErrorMessage("Unexpected response from server. Please try again.");
        return;
      }

      const kid: Kid = {
        name: student.name,
        age: student.age,
        grade: student.grade || "N/A",
      };

      setAddedKids((prev) => [...prev, kid]);
      setStudentCode("");
    } catch (err: any) {
      console.error("❌ Add Child Error:", err);
      setErrorMessage(
        err.response?.data?.message || "Failed to add child. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!hydrated) return null;

  function Header() {
    return (
      <div className="w-full flex items-center justify-center mb-12">
        <Image
          src="/logos/FULL LOGO VERTICAL COLOR.png"
          alt="Logo"
          width={200}
          height={200}
        />
      </div>
    );
  }

  function KidCard({ kid }: { kid: Kid }) {
    return (
      <div className="p-4 border rounded-xl bg-white shadow-sm flex items-center justify-between">
        <div>
          <p className="font-bold text-sm">{kid.name}</p>
          <p className="text-xs text-gray-500">
            Age: {kid.age} {kid.grade ? `• Grade: ${kid.grade}` : ""}
          </p>
        </div>
        <div className="text-xs text-gray-400">Pending</div>
      </div>
    );
  }

  function FooterLinks() {
    return (
      <div className="w-full mt-6 md:mt-8 flex justify-center">
        <div className="flex gap-6 text-sm text-gray-600 pr-2">
          <a href="/privacy" className="hover:underline">
            Privacy Policy
          </a>
          <a href="/terms" className="hover:underline">
            Terms of Service
          </a>
          <a href="/help" className="hover:underline">
            Contact
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Side */}
      <div className="hidden md:flex md:w-1/2 relative">
        <div className="absolute inset-0 bg-primary from-[rgba(97,92,158,0.7)] to-[rgba(237,227,164,0.05)]" />
      </div>

      {/* Right Side */}
      <div className="flex flex-col justify-center w-full min-h-screen md:w-1/2 p-8 relative">
        <Header />
        <div className="w-full max-w-full flex flex-col justify-center items-center">
          <div className="mt-4">
            {step === 1 && (
              <div className="text-center space-y-6">
                <div className="text-center space-y-2">
                  <h1 className="text-4xl font-semibold text-primary">
                    Who are you?
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Select your role to continue
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-8">
                  {["student", "teacher", "parent"].map((role) => (
                    <div
                      key={role}
                      onClick={() => setForm((prev) => ({ ...prev, role }))}
                      className={`bg-white cursor-pointer rounded-2xl shadow-md p-6 transition-transform ${
                        form.role === role
                          ? "border-2 border-primary"
                          : "border hover:scale-105"
                      }`}
                    >
                      <Image
                        width={160}
                        height={160}
                        src={`/${role}.png`}
                        alt={role}
                        className="w-28 h-28 mx-auto mb-3"
                      />
                      <p className="text-lg font-semibold capitalize">{role}</p>
                    </div>
                  ))}
                </div>

                {/* Google Button */}
                {form.role !== "" && (
                  <Button
                    onClick={() => googleLogin()}
                    className="mt-8 w-full text-lg py-6 px-6 bg-primary text-white rounded-xl"
                  >
                    Continue with Google
                  </Button>
                )}
              </div>
            )}

            {/* Step 3 → fill details */}
            {step === 3 && (
              <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 space-y-8 mx-auto">
                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-medium text-gray-800">
                    Complete your profile
                  </h1>
                  <p className="text-gray-500 text-sm">
                    Just a few more details before we finish setting up your
                    account.
                  </p>
                </div>

                {errorMessage && (
                  <p className="text-red-500 text-center text-sm">
                    {errorMessage}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter your full name"
                      value={form.name || ""}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                  </div>

                  {/* Phone */}
                  <div className={`flex flex-col gap-1 ${
                    form.role !== "student" && "col-span-2"
                  }`}>
                    <label className="text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter your phone"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                    />
                  </div>

                  {/* Age (only for student) */}
                  {form.role === "student" && (
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">
                        Age
                      </label>
                      <Input
                        type="number"
                        placeholder="Enter your age"
                        value={form.age}
                        onChange={(e) =>
                          setForm({ ...form, age: Number(e.target.value) })
                        }
                      />
                    </div>
                  )}

                  {/* PIN Code */}
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">
                      PIN Code
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter PIN code"
                      value={form.pincode}
                      onChange={(e) => {
                        setForm({ ...form, pincode: e.target.value });
                        if (e.target.value.length === 6)
                          fetchLocation(e.target.value);
                      }}
                    />
                  </div>

                  {/* Auto-filled fields */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      City
                    </label>
                    <Input
                      type="text"
                      value={form.city}
                      onChange={(e) =>
                        setForm({ ...form, city: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      State
                    </label>
                    <Input
                      type="text"
                      value={form.state}
                      onChange={(e) =>
                        setForm({ ...form, state: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">
                      Country
                    </label>
                    <Input
                      type="text"
                      value={form.country}
                      onChange={(e) =>
                        setForm({ ...form, country: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="flex-1 py-3 border border-primary text-primary"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-1 py-3 bg-primary text-white"
                  >
                    Submit
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4 → add kids */}
{step === 4 && (
  <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-10 space-y-8 mx-auto">
    {/* Heading */}
    <div className="text-center space-y-2">
      <h1 className="text-2xl font-medium text-gray-800">
        Enter a student code to add your kids
      </h1>
      <p className="text-gray-500 text-sm">
        You can always add more kids later from your profile.
      </p>
    </div>

    {/* Input + Add button */}
    <div className="flex items-center gap-3">
      <Input
        type="text"
        placeholder="Enter student code"
        value={studentCode}
        onChange={(e) => setStudentCode(e.target.value)}
      />
      <Button
        onClick={handleAddChild}
        disabled={loading}
        className="whitespace-nowrap bg-primary text-white"
      >
        {loading ? "Adding..." : "Add Child"}
      </Button>
    </div>

    {/* Error message */}
    {errorMessage && (
      <p className="text-red-500 text-center text-sm mt-2">{errorMessage}</p>
    )}

    {/* Kids List */}
    {addedKids.length > 0 && (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Added Kids</h2>
        <ul className="space-y-2">
          {addedKids.map((kid, idx) => (
            <li key={idx}>
              <KidCard kid={kid} />
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Footer actions */}
    <div className="flex justify-between items-center pt-4">
      {/* Skip with arrow */}
      <button
        onClick={() => router.push("/content")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition"
      >
        Skip <span className="text-lg">→</span>
      </button>

      {/* Finish */}
      <Button
        onClick={() => console.log("Done")}
        className="px-6 py-3 bg-primary text-white"
      >
        Finish
      </Button>
    </div>
  </div>
)}


            <FooterLinks />
          </div>
        </div>
      </div>
    </div>
  );
}
