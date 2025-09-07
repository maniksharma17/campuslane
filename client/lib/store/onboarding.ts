// src/store/onboardingStore.ts
import mongoose from "mongoose";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Role = "student" | "parent" | "teacher" | "";

interface OnboardingState {
  role: Role;
  idToken: string;
  name: string;
  phone: string;
  pincode: string;
  state: string;
  city: string;
  country: string;
  age?: number;
  classLevel?: mongoose.Types.ObjectId | null;
  classOther?: string;

  setField: (key: keyof OnboardingState, value: any) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      role: "",
      idToken: "",
      name: "",
      phone: "",
      pincode: "",
      state: "",
      city: "",
      country: "",
      age: undefined,
      classLevel: null,
      classOther: "",

      setField: (key, value) => set((state) => ({ ...state, [key]: value })),
      reset: () =>
        set({
          role: "",
          idToken: "",
          name: "",
          phone: "",
          pincode: "",
          state: "",
          city: "",
          country: "",
          classLevel: null,
          classOther: "",
          age: undefined,
        }),
    }),
    {
      name: "onboarding-storage", 
    }
  )
);
