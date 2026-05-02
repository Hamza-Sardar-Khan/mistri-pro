"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AVAILABLE_LOCATIONS, AVAILABLE_SKILLS, type Location, type Skill } from "@/lib/constants";
import { createProject } from "@/lib/actions/project";
import AppFooter from "@/components/AppFooter";

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: "image" | "video" | "audio";
}

export default function PostProjectPage() {
  const router = useRouter();
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Skill | "">("");
  const [location, setLocation] = useState<Location | "">("");
  const [complexity, setComplexity] = useState<"simple" | "intermediate" | "complex">("intermediate");
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [budgetType, setBudgetType] = useState<"fixed" | "hourly">("fixed");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const toggleSkill = (skill: Skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : prev.length < 5
        ? [...prev, skill]
        : prev
    );
  };

  const addMedia = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video" | "audio"
  ) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: MediaFile[] = Array.from(files).map((f) => ({
      id: `${Date.now()}-${Math.random()}`,
      file: f,
      preview: type === "audio" ? "" : URL.createObjectURL(f),
      type,
    }));
    setMediaFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const removeMedia = (id: string) => {
    setMediaFiles((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !category || !location || selectedSkills.length === 0 || !budgetAmount) return;
    setIsSubmitting(true);

    try {
      const imageUrls: string[] = [];
      const videoUrls: string[] = [];
      const audioUrls: string[] = [];

      // Upload all media files
      const toUpload = mediaFiles.filter((m) => m.file);
      for (let i = 0; i < toUpload.length; i++) {
        setUploadProgress(`Uploading file ${i + 1} of ${toUpload.length}...`);
        const formData = new FormData();
        formData.append("file", toUpload[i].file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        if (toUpload[i].type === "image") imageUrls.push(data.url);
        else if (toUpload[i].type === "video") videoUrls.push(data.url);
        else audioUrls.push(data.url);
      }

      setUploadProgress("Creating project...");
      await createProject({
        title,
        description,
        category,
        location,
        complexity,
        skills: selectedSkills,
        budgetType,
        budgetAmount: Number(budgetAmount),
        imageUrls,
        videoUrls,
        audioUrls,
      });

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress("");
    }
  };

  const images = mediaFiles.filter((m) => m.type === "image");
  const videos = mediaFiles.filter((m) => m.type === "video");
  const audios = mediaFiles.filter((m) => m.type === "audio");

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-2xl font-extrabold text-[#0e1724] mb-1">Post a Project</h2>
          <p className="text-sm text-[#97a4b3] mb-8">Describe your project and find the right professional</p>

          {/* Title */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-[#0e1724] mb-1.5">Project Title</label>
            <input
              type="text"
              placeholder="e.g. Kitchen plumbing repair needed"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-[#0e1724] outline-none placeholder:text-[#97a4b3] focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2]"
            />
          </div>

          {/* Description */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-[#0e1724] mb-1.5">Description</label>
            <textarea
              rows={5}
              placeholder="Describe the project in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm text-[#0e1724] outline-none placeholder:text-[#97a4b3] focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2]"
            />
          </div>

          {/* Skills */}
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-[#0e1724] mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Skill)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-[#0e1724] outline-none focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2]"
              >
                <option value="" disabled>
                  Select category
                </option>
                {AVAILABLE_SKILLS.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0e1724] mb-1.5">Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value as Location)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-[#0e1724] outline-none focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2]"
              >
                <option value="" disabled>
                  Select location
                </option>
                {AVAILABLE_LOCATIONS.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-[#0e1724] mb-1.5">Complexity</label>
            <select
              value={complexity}
              onChange={(e) => setComplexity(e.target.value as "simple" | "intermediate" | "complex")}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-[#0e1724] outline-none focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2]"
            >
              <option value="simple">Simple</option>
              <option value="intermediate">Intermediate</option>
              <option value="complex">Complex</option>
            </select>
          </div>

          {/* Skills */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-[#0e1724] mb-1.5">
              Skills Required <span className="font-normal text-[#97a4b3]">(select up to 5)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SKILLS.map((skill) => {
                const selected = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      selected
                        ? "bg-[#0d7cf2] text-white"
                        : "bg-gray-100 text-[#5e6d80] hover:bg-gray-200"
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#0e1724] mb-1.5">Budget</label>
            <div className="flex gap-3 mb-3">
              <button
                type="button"
                onClick={() => setBudgetType("fixed")}
                className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition ${
                  budgetType === "fixed"
                    ? "border-[#0d7cf2] bg-[#0d7cf2]/5 text-[#0d7cf2]"
                    : "border-gray-200 text-[#5e6d80] hover:border-gray-300"
                }`}
              >
                Fixed Price
              </button>
              <button
                type="button"
                onClick={() => setBudgetType("hourly")}
                className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition ${
                  budgetType === "hourly"
                    ? "border-[#0d7cf2] bg-[#0d7cf2]/5 text-[#0d7cf2]"
                    : "border-gray-200 text-[#5e6d80] hover:border-gray-300"
                }`}
              >
                Hourly Rate
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#97a4b3]">₨</span>
              <input
                type="number"
                min="0"
                placeholder={budgetType === "fixed" ? "Total budget" : "Rate per hour"}
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                className="w-full rounded-lg border border-gray-200 py-3 pl-9 pr-4 text-sm text-[#0e1724] outline-none placeholder:text-[#97a4b3] focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2]"
              />
            </div>
          </div>

          {/* Media attachments */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#0e1724] mb-3">Attachments</label>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                onClick={() => imageRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-[#5e6d80] transition hover:bg-gray-50"
              >
                <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Images
              </button>
              <button
                type="button"
                onClick={() => videoRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-[#5e6d80] transition hover:bg-gray-50"
              >
                <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Videos
              </button>
              <button
                type="button"
                onClick={() => audioRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-[#5e6d80] transition hover:bg-gray-50"
              >
                <svg className="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Audio
              </button>
            </div>

            <input ref={imageRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addMedia(e, "image")} />
            <input ref={videoRef} type="file" accept="video/*" multiple className="hidden" onChange={(e) => addMedia(e, "video")} />
            <input ref={audioRef} type="file" accept="audio/*" multiple className="hidden" onChange={(e) => addMedia(e, "audio")} />

            {/* Image previews */}
            {images.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-[#97a4b3] mb-2">Images ({images.length})</p>
                <div className="grid grid-cols-3 gap-2">
                  {images.map((m) => (
                    <div key={m.id} className="relative group rounded-lg overflow-hidden border border-gray-200">
                      <img src={m.preview} alt="" className="h-24 w-full object-cover" />
                      <button
                        onClick={() => removeMedia(m.id)}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video previews */}
            {videos.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-[#97a4b3] mb-2">Videos ({videos.length})</p>
                <div className="space-y-2">
                  {videos.map((m) => (
                    <div key={m.id} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-black">
                      <video src={m.preview} className="h-32 w-full object-contain" />
                      <button
                        onClick={() => removeMedia(m.id)}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audio previews */}
            {audios.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-[#97a4b3] mb-2">Audio ({audios.length})</p>
                <div className="space-y-2">
                  {audios.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 rounded-lg border border-gray-200 p-2">
                      <svg className="h-5 w-5 text-purple-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      <span className="text-sm text-[#5e6d80] truncate flex-1">{m.file.name}</span>
                      <button
                        onClick={() => removeMedia(m.id)}
                        className="text-[#97a4b3] hover:text-red-500 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !title.trim() ||
              !description.trim() ||
              !category ||
              !location ||
              selectedSkills.length === 0 ||
              !budgetAmount
            }
            className="w-full rounded-lg bg-[#0d7cf2] py-3.5 text-sm font-semibold text-white transition hover:bg-[#0b6ad4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? uploadProgress || "Posting..." : "Post Project"}
          </button>
          <p className="mt-4 text-center text-[11px] text-[#97a4b3]">
            By posting this project, you agree to MISTRI PRO&apos;s Terms of Service
            and Community Guidelines. Your contact details will only be shared
            with professionals you choose to engage with.
          </p>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
