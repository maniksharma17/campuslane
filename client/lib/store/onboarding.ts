// src/store/onboardingStore.ts
import { create } from "zustand";

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

  setField: (key: keyof OnboardingState, value: any) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  role: "",
  idToken: "",
  name: "",
  phone: "",
  pincode: "",
  state: "",
  city: "",
  country: "",
  age: undefined,

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
      age: undefined,
    }),
}));
