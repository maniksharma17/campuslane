"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import Image from "next/image";
import { PlusCircle } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";

export default function ParentPage() {
  const router = useRouter();
  const [studentCode, setStudentCode] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddStudent = async () => {
    if (!studentCode.trim()) {
      setError("Please enter a student code.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await api.post("/parent/links", { studentCode });
      const student = res.data.data.student;

      setStudents((prev) => [...prev, student]);
      setStudentCode("");
    } catch (err: any) {
      setError("We couldn’t find a student with that code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-primary/10 p-6">
      

      {/* Card */}
      <div className="flex flex-col max-w-2xl bg-white p-10 rounded-2xl border space-y-8">
        {/* Logo */}
      <div className="mb-8 mx-auto">
        <Image
          src="/logos/FULL LOGO VERTICAL COLOR.png"
          alt="Logo"
          width={180}
          height={180}
          priority
        />
      </div>
        {/* Heading */}
        <div className="text-center">
          <h1 className="text-3xl font-medium text-gray-800">
            Add Your Kids
          </h1>
          <p className="mt-2 text-gray-500 text-lg">
            Link your account with your children by entering their student code.  
            You can add more later from your profile.
          </p>
        </div>

        {/* Input + Add button */}
        <div className="flex flex-row items-center gap-3">
          <Input
            className="h-14 text-lg"
            placeholder="Enter student code"
            value={studentCode}
            onChange={(e) => setStudentCode(e.target.value)}
          />
          <Button
            onClick={handleAddStudent}
            disabled={loading}
            className="px-6 bg-primary text-white"
          >
            {loading ? "Adding..." : "Add"}
            <PlusCircle className="text-white h-4 w-4 ml-2"/>
          </Button>
        </div>

        {/* Error */}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Student list */}
        {students.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-medium text-green-600">
              Request Sent
            </h2>
            <ul className="space-y-3">
              {students.map((student, i) => (
                <li
                  key={i}
                  className="p-4 rounded-xl border shadow-sm bg-gray-50 flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      {student.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Age: {student.age}{" "}
                      {student.grade && <>• Grade {student.grade}</>}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">Pending</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex justify-between items-center pt-4">
          {/* Skip */}
          <button
            onClick={() => router.replace("/explore")}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition"
          >
            Skip for now <span className="text-lg">→</span>
          </button>

          {/* Finish */}
          <Button
            onClick={() => router.replace("/explore")}
            className="px-6 py-3 bg-primary text-white"
          >
            Finish
          </Button>
        </div>
      </div>
    </div>
  );
}
