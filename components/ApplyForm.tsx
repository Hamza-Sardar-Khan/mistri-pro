"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { submitProposal } from "@/lib/actions/project";

interface AudioFile {
  id: string;
  file: File;
  name: string;
}

export default function ApplyForm({ projectId, projectTitle }: { projectId: string; projectTitle: string }) {
  const router = useRouter();
  const audioRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [estimatedArrivalAt, setEstimatedArrivalAt] = useState("");
  const [estimatedDurationValue, setEstimatedDurationValue] = useState("");
  const [estimatedDurationUnit, setEstimatedDurationUnit] = useState<"hours" | "days">("hours");
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const addAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: AudioFile[] = Array.from(files).map((f) => ({
      id: `${Date.now()}-${Math.random()}`,
      file: f,
      name: f.name,
    }));
    setAudioFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const removeAudio = (id: string) => {
    setAudioFiles((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = async () => {
    if (!description.trim() || !budgetAmount || !estimatedArrivalAt || !estimatedDurationValue) return;
    setIsSubmitting(true);

    try {
      const audioUrls: string[] = [];

      for (let i = 0; i < audioFiles.length; i++) {
        setUploadProgress(`Uploading audio ${i + 1} of ${audioFiles.length}...`);
        const formData = new FormData();
        formData.append("file", audioFiles[i].file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        audioUrls.push(data.url);
      }

      setUploadProgress("Submitting proposal...");
      await submitProposal({
        projectId,
        description,
        audioUrls,
        budgetAmount: Number(budgetAmount),
        estimatedArrivalAt,
        estimatedDurationValue: Number(estimatedDurationValue),
        estimatedDurationUnit,
      });

      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress("");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-2xl font-extrabold text-[#0e1724] mb-1">Submit a Proposal</h2>
          <p className="text-sm text-[#97a4b3] mb-2">For: <span className="font-medium text-[#5e6d80]">{projectTitle}</span></p>
          <div className="h-px bg-gray-100 mb-6" />

          {/* Description */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-[#0e1724] mb-1.5">
              Cover Letter <span className="font-normal text-[#97a4b3]">(visible to everyone)</span>
            </label>
            <textarea
              rows={6}
              placeholder="Describe why you're the right person for this project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm text-[#0e1724] outline-none placeholder:text-[#97a4b3] focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2]"
            />
          </div>

          {/* Private audio */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-[#0e1724] mb-1.5">
              Audio Message <span className="font-normal text-[#97a4b3]">(private — only you and the client can hear)</span>
            </label>
            <button
              type="button"
              onClick={() => audioRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-[#5e6d80] transition hover:bg-gray-50"
            >
              <svg className="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Attach Audio
            </button>
            <input ref={audioRef} type="file" accept="audio/*" multiple className="hidden" onChange={addAudio} />

            {audioFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {audioFiles.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 rounded-lg border border-gray-200 p-2.5">
                    <svg className="h-5 w-5 text-purple-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <span className="text-sm text-[#5e6d80] truncate flex-1">{a.name}</span>
                    <button onClick={() => removeAudio(a.id)} className="text-[#97a4b3] hover:text-red-500 transition text-sm">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Budget */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#0e1724] mb-1.5">Your Bid Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#97a4b3]">₨</span>
              <input
                type="number"
                min="0"
                placeholder="Enter your bid"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                className="w-full rounded-lg border border-gray-200 py-3 pl-9 pr-4 text-sm text-[#0e1724] outline-none placeholder:text-[#97a4b3] focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2]"
              />
            </div>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-[1fr_150px_130px]">
            <div>
              <label className="block text-sm font-semibold text-[#0e1724] mb-1.5">Arrival / Start Time</label>
              <input
                type="datetime-local"
                value={estimatedArrivalAt}
                onChange={(e) => setEstimatedArrivalAt(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-[#0e1724] outline-none focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0e1724] mb-1.5">Duration</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 4"
                value={estimatedDurationValue}
                onChange={(e) => setEstimatedDurationValue(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-[#0e1724] outline-none placeholder:text-[#97a4b3] focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0e1724] mb-1.5">Unit</label>
              <select
                value={estimatedDurationUnit}
                onChange={(e) => setEstimatedDurationUnit(e.target.value as "hours" | "days")}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-[#0e1724] outline-none focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2]"
              >
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !description.trim() ||
              !budgetAmount ||
              !estimatedArrivalAt ||
              !estimatedDurationValue
            }
            className="w-full rounded-lg bg-[#0d7cf2] py-3.5 text-sm font-semibold text-white transition hover:bg-[#0b6ad4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? uploadProgress || "Submitting..." : "Submit Proposal"}
          </button>
        </div>
      </main>
    </div>
  );
}
