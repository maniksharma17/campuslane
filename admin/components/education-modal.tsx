"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadApi } from "@/lib/api";
import axios from "axios";
import { useAuthStore } from "@/lib/auth"; // ✅ import auth store
import Image from "next/image";

export type Field =
  | {
      name: string;
      label: string;
      type: "text" | "textarea" | "number";
      required?: boolean;
    }
  | {
      name: string;
      label: string;
      type: "select";
      options: { value: string; label: string }[];
      required?: boolean;
    };

interface CommonModalProps {
  open: boolean;
  onClose: () => void;
  mode: "add" | "edit" | "delete";
  title: string;
  initialData?: Record<string, any>;
  fields?: Field[];
  onSubmit: (values?: Record<string, any>) => Promise<void> | void;
  fileUploadAllowed: boolean;
}

type QuestionLocal = {
  questionText: string;
  options: string[]; // length 4
  correctOption: number | null;
  s3Key?: string;
  file?: File | null;
};

export default function CommonModal({
  open,
  onClose,
  mode,
  title,
  initialData = {},
  fields = [],
  onSubmit,
  fileUploadAllowed,
}: CommonModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  // Upload states
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    thumbnail?: number;
    file?: number;
    [key: string]: number | undefined;
  }>({});
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [detectedType, setDetectedType] = useState<
    "file" | "video" | "image" | null
  >(null);

  // Quiz-specific
  const [localQuizType, setLocalQuizType] = useState<string>(
    (initialData && initialData.quizType) || "googleForm"
  );
  const [questions, setQuestions] = useState<QuestionLocal[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);

    if (!selectedFile) {
      setFileSize(null);
      setDuration(null);
      setDetectedType(null);
      return;
    }

    setFileSize(selectedFile.size);

    if (selectedFile.type.startsWith("video/")) {
      setDetectedType("video");
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = URL.createObjectURL(selectedFile);
      video.onloadedmetadata = () => {
        setDuration(video.duration);
        URL.revokeObjectURL(video.src);
      };
    } else if (selectedFile.type.startsWith("image/")) {
      setDetectedType("image");
      setDuration(null);
    } else {
      setDetectedType("file"); // default for PDFs, docs, etc.
      setDuration(null);
    }
  };

  useEffect(() => {
    if (mode === "edit") {
      setFormData(initialData);
      // initialize quizType and questions
      setLocalQuizType(initialData?.quizType || "googleForm");

      const initQuestions: QuestionLocal[] = (initialData?.questions || []).map(
        (q: any) => ({
          questionText: q.questionText || "",
          options: q.options?.length === 4 ? q.options : ["", "", "", ""],
          correctOption:
            typeof q.correctOption === "number" ? q.correctOption : null,
          s3Key: q.s3Key,
          file: null,
        })
      );
      console.log(initQuestions);
      setQuestions(initQuestions);
    } else {
      setFormData({});
      setLocalQuizType("googleForm");
      setQuestions([]);
    }
    setThumbnail(null);
    setFile(null);
    setUploadProgress({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialData, open]);

  const handleChange = (name: string, value: any) => {
    // keep quizType in sync
    if (name === "quizType") {
      setLocalQuizType(value);
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const uploadToS3 = async (file: File) => {
    const { data } = await uploadApi.getPresignedUrl({
      contentType: file.type,
      fileSize: file.size,
      fileName: file.name,
    });

    // simple upload (no complex progress handling here)
    await axios.put(data.data.url, file, {
      headers: { "Content-Type": file.type },
    });

    return data.data.key;
  };

  // per-question file select
  const handleQuestionFileSelect = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = e.target.files?.[0] || null;
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        file: selectedFile,
        // clear existing s3Key to force re-upload if new file selected
        s3Key: selectedFile ? undefined : copy[index].s3Key,
      };
      return copy;
    });
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        questionText: "",
        options: ["", "", "", ""],
        correctOption: null,
        s3Key: undefined,
        file: null,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuestionField = (
    index: number,
    field: keyof QuestionLocal,
    value: any
  ) => {
    setQuestions((prev) => {
      const copy = [...prev];
      (copy[index] as any)[field] = value;
      return copy;
    });
  };

  const updateQuestionOption = (
    qIndex: number,
    optIndex: number,
    value: string
  ) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const q = { ...copy[qIndex] };
      const newOptions = [...q.options];
      newOptions[optIndex] = value;
      q.options = newOptions;
      copy[qIndex] = q;
      return copy;
    });
  };

  const validateQuiz = () => {
    if (localQuizType === "googleForm") {
      if (!formData.googleFormUrl || formData.googleFormUrl.trim() === "") {
        alert("Google Form URL is required for external quizzes.");
        return false;
      }
      // optional: rudimentary URL check
      try {
        // eslint-disable-next-line no-new
        new URL(formData.googleFormUrl);
      } catch {
        alert("Please enter a valid Google Form URL.");
        return false;
      }
    } else if (localQuizType === "native") {
      if (!questions || questions.length === 0) {
        alert("Add at least one question for native quiz.");
        return false;
      }
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.questionText || q.questionText.trim() === "") {
          alert(`Question ${i + 1}: question text is required.`);
          return false;
        }
        if (!q.options || q.options.length !== 4) {
          alert(`Question ${i + 1}: exactly 4 options are required.`);
          return false;
        }
        for (let j = 0; j < 4; j++) {
          if (!q.options[j] || q.options[j].trim() === "") {
            alert(`Question ${i + 1}: option ${j + 1} is required.`);
            return false;
          }
        }
        if (
          typeof q.correctOption !== "number" ||
          q.correctOption < 0 ||
          q.correctOption > 3
        ) {
          alert(`Question ${i + 1}: pick a correct option (1-4).`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    try {
      // 🔹 Validate required fields
      if (mode !== "delete") {
        for (const field of fields) {
          // skip googleFormUrl validation here - handled by validateQuiz()
          if (
            field.required &&
            field.name !== "googleFormUrl" &&
            !formData[field.name]
          ) {
            alert(`${field.label} is required.`);
            return; // stop submission
          }
        }

        // 🔹 Require thumbnail if neither exists in edit/add mode
        if (!thumbnail && !initialData.thumbnailKey) {
          alert("Thumbnail is required.");
          return;
        }

        // Quiz specific validation
        if (title === "quiz" && !validateQuiz()) {
          return;
        }
      }

      setLoading(true);

      let uploadedThumbnail: string | undefined;
      let uploadedFile: string | undefined;

      if (thumbnail) {
        uploadedThumbnail = await uploadToS3(thumbnail);
      }

      if (file && fileUploadAllowed) {
        uploadedFile = await uploadToS3(file);
      }

      // For native quiz: upload per-question files (if any)
      const questionsToSend: any[] | undefined =
        title === "quiz" && localQuizType === "native"
          ? JSON.parse(JSON.stringify(questions)) // deep copy
          : undefined;

      if (questionsToSend) {
        for (let i = 0; i < questionsToSend.length; i++) {
          const qLocal = questions[i];
          // if user selected a new file, upload it
          if (qLocal.file) {
            try {
              const key = await uploadToS3(qLocal.file);
              questionsToSend[i].s3Key = key;
            } catch (err) {
              console.error("Failed uploading question media", err);
              alert("Failed uploading question media. Try again.");
              setLoading(false);
              return;
            }
          } else {
            // preserve existing s3Key if present
            if (qLocal.s3Key) {
              questionsToSend[i].s3Key = qLocal.s3Key;
            } else {
              delete questionsToSend[i].s3Key;
            }
          }

          // ensure correct types
          questionsToSend[i].correctOption = Number(
            questionsToSend[i].correctOption
          );
        }
      }

      const { admin } = useAuthStore.getState();

      const finalData: Record<string, any> = {
        ...formData,
        thumbnailKey:
          mode === "edit"
            ? thumbnail
              ? uploadedThumbnail
              : initialData.thumbnailKey
            : uploadedThumbnail,
        s3Key:
          mode === "edit"
            ? fileUploadAllowed
              ? file
                ? uploadedFile
                : initialData.s3Key
              : initialData.s3Key
            : uploadedFile,

        uploaderId: admin?.id,
        uploaderRole: "admin",
        approvalStatus: "approved",
        isAdminContent: true,

        fileSize,
        duration,
      };

      // attach questions only when native quiz
      if (title === "quiz" && localQuizType === "native") {
        finalData.questions = questionsToSend;
        finalData.quizType = "native";
      } else if (title === "quiz" && localQuizType === "googleForm") {
        finalData.quizType = "googleForm";
        // ensure googleFormUrl present on finalData
      }

      if (mode === "delete") {
        await onSubmit();
      } else {
        await onSubmit(finalData);
      }

      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="min-w-[80vw] max-h-[80vh] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" && `Add ${title}`}
            {mode === "edit" && `Edit ${title}`}
            {mode === "delete" && `Delete ${title}`}
          </DialogTitle>
        </DialogHeader>

        {mode === "delete" ? (
          <p className="text-red-600">
            Are you sure you want to delete this {title.toLowerCase()}? This
            action cannot be undone.
          </p>
        ) : (
          <form className="space-y-4">
            {fields.map((field) => {
              // hide googleFormUrl input if quizType is native
              if (
                field.name === "googleFormUrl" &&
                localQuizType === "native"
              ) {
                return null;
              }

              return (
                <div key={field.name} className="space-y-1">
                  <Label>{field.label}</Label>

                  {field.type === "text" && (
                    <Input
                      type="text"
                      required={field.required}
                      value={formData[field.name] || ""}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                    />
                  )}

                  {field.type === "number" && (
                    <Input
                      type="number"
                      required={field.required}
                      value={formData[field.name] || ""}
                      onChange={(e) =>
                        handleChange(field.name, Number(e.target.value))
                      }
                    />
                  )}

                  {field.type === "textarea" && (
                    <Textarea
                      required={field.required}
                      value={formData[field.name] || ""}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                    />
                  )}

                  {field.type === "select" && "options" in field && (
                    <Select
                      value={formData[field.name] || localQuizType || ""}
                      onValueChange={(value) => {
                        handleChange(field.name, value);
                        // specifically keep localQuizType in sync
                        if (field.name === "quizType") {
                          setLocalQuizType(value);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${field.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              );
            })}

            {/* Thumbnail Upload */}
            <div className="space-y-1">
              <Label>Thumbnail (required)</Label>
              <Input
                type="file"
                accept="image/*"
                required
                onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
              />
              {uploadProgress.thumbnail !== undefined && (
                <div className="h-2 bg-gray-200 rounded">
                  <div
                    className="h-2 bg-blue-500 rounded"
                    style={{ width: `${uploadProgress.thumbnail}%` }}
                  />
                </div>
              )}
            </div>

            {/* File Upload (top-level) */}
            {fileUploadAllowed && (
              <div className="space-y-1">
                <Label>File</Label>
                <Input type="file" onChange={handleFileSelect} />

                {uploadProgress.file !== undefined && (
                  <div className="h-2 bg-gray-200 rounded">
                    <div
                      className="h-2 bg-green-500 rounded"
                      style={{ width: `${uploadProgress.file}%` }}
                    />
                  </div>
                )}
              </div>
            )}
            {file && (
              <p className="text-sm text-gray-600">
                Size: {(fileSize! / (1024 * 1024)).toFixed(2)} MB{" "}
                {duration !== null &&
                  `(Duration: ${Math.floor(duration / 60)}:${String(
                    Math.floor(duration % 60)
                  ).padStart(2, "0")})`}
              </p>
            )}

            {/* Native quiz questions UI */}
            {title === "quiz" && localQuizType === "native" && (
              <div className="space-y-3 border-t pt-3">
                <div className="flex items-center justify-between">
                  <Label>Questions</Label>
                  <Button type="button" size="sm" onClick={addQuestion}>
                    + Add Question
                  </Button>
                </div>

                {questions.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No questions added yet.
                  </p>
                )}

                {questions.map((q, qi) => (
                  <div key={qi} className="p-3 border rounded space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="font-medium">Question {qi + 1}</div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeQuestion(qi)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label>Question Text</Label>
                      <Input
                        value={q.questionText || ""}
                        onChange={(e) =>
                          updateQuestionField(
                            qi,
                            "questionText",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Optional media (image/audio)</Label>
                      <Input
                        type="file"
                        accept="image/*,audio/*,video/*"
                        onChange={(e) => handleQuestionFileSelect(qi, e)}
                      />
                      {q.s3Key &&
                        !q.file &&
                        (() => {
                          const url = `${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${q.s3Key}`;
                          const ext = q.s3Key.split(".").pop()?.toLowerCase();

                          if (!ext) return null;

                          if (
                            ["jpg", "jpeg", "png", "gif", "webp"].includes(ext)
                          ) {
                            // Image preview
                            return (
                              <Image
                                height={100}
                                width={100}
                                src={url}
                                alt="Question media"
                                className="w-24 h-24 object-cover rounded border"
                              />
                            );
                          }

                          if (["mp3", "wav", "ogg"].includes(ext)) {
                            // Audio preview
                            return (
                              <audio controls className="w-32">
                                <source src={url} />
                                Your browser does not support audio.
                              </audio>
                            );
                          }

                          if (["mp4", "webm", "mov"].includes(ext)) {
                            // Video preview
                            return (
                              <video
                                controls
                                width={160}
                                height={120}
                                className="border rounded"
                              >
                                <source src={url} />
                                Your browser does not support video.
                              </video>
                            );
                          }

                          // Fallback
                          return (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline"
                            >
                              View File
                            </a>
                          );
                        })()}
                    </div>

                    <div className="space-y-1">
                      <Label>Options (exactly 4)</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${qi}`}
                              checked={q.correctOption === oi}
                              onChange={() =>
                                updateQuestionField(qi, "correctOption", oi)
                              }
                            />
                            <Input
                              value={opt}
                              onChange={(e) =>
                                updateQuestionOption(qi, oi, e.target.value)
                              }
                            />
                          </div>
                        ))}
                      </div>
                      <div className="text-sm text-gray-500">
                        Select the radio for the correct option.
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </form>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={mode === "delete" ? "destructive" : "default"}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Processing..." : mode === "delete" ? "Delete" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
