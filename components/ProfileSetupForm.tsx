"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AVAILABLE_SKILLS, type Skill } from "@/lib/constants";
import { saveProfileSetup } from "@/lib/actions/user";

interface ProfileSetupFormProps {
  initialData: {
    firstName: string;
    lastName: string;
    avatarUrl: string;
  };
  initialProfile?: {
    title: string;
    bio: string;
    hourlyRate: number;
    phone: string;
    city: string;
    country: string;
    skills: Skill[];
    education: string;
    experience: string;
    languages: string[];
  };
  mode?: "create" | "edit";
}

export default function ProfileSetupForm({
  initialData,
  initialProfile,
  mode = "create",
}: ProfileSetupFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(initialData.avatarUrl);
  const [avatarUrl, setAvatarUrl] = useState(initialData.avatarUrl);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    firstName: initialData.firstName,
    lastName: initialData.lastName,
    title: initialProfile?.title ?? "",
    bio: initialProfile?.bio ?? "",
    hourlyRate: initialProfile?.hourlyRate ?? 0,
    phone: initialProfile?.phone ?? "",
    city: initialProfile?.city ?? "",
    country: initialProfile?.country ?? "Pakistan",
    education: initialProfile?.education ?? "",
    experience: initialProfile?.experience ?? "",
    languages: initialProfile?.languages?.length
      ? initialProfile.languages
      : ["English", "Urdu"],
  });
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>(
    initialProfile?.skills ?? []
  );
  const [languageInput, setLanguageInput] = useState("");

  const hashtag = `@${form.firstName}${form.lastName}`.toLowerCase().replace(/\s+/g, "");

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarPreview(URL.createObjectURL(file));
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (data.url) setAvatarUrl(data.url);
    } catch {
      alert("Avatar upload failed. Please try again.");
      setAvatarPreview(avatarUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleSkill = (skill: Skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : prev.length < 5
        ? [...prev, skill]
        : prev
    );
  };

  const addLanguage = () => {
    const lang = languageInput.trim();
    if (lang && !form.languages.includes(lang)) {
      setForm((f) => ({ ...f, languages: [...f.languages, lang] }));
      setLanguageInput("");
    }
  };

  const removeLanguage = (lang: string) => {
    setForm((f) => ({ ...f, languages: f.languages.filter((l) => l !== lang) }));
  };

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.title.trim() || selectedSkills.length === 0) return;
    setLoading(true);
    try {
      await saveProfileSetup({
        firstName: form.firstName,
        lastName: form.lastName,
        avatarUrl,
        title: form.title,
        bio: form.bio,
        hourlyRate: form.hourlyRate,
        phone: form.phone,
        city: form.city,
        country: form.country,
        skills: selectedSkills,
        education: form.education,
        experience: form.experience,
        languages: form.languages,
      });
      router.push(mode === "edit" ? "/profile" : "/dashboard");
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    step >= s
                      ? "bg-[#0d7cf2] text-white"
                      : "bg-gray-200 text-[#97a4b3]"
                  }`}
                >
                  {s}
                </div>
                <span className="text-xs font-medium text-[#5e6d80] hidden sm:inline">
                  {s === 1 ? "Basic Info" : s === 2 ? "Professional" : "Skills & Finish"}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0d7cf2] rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <h1 className="text-2xl font-extrabold text-[#0e1724] mb-1">
            {mode === "edit" ? "Edit Your Profile" : "Complete Your Profile"}
          </h1>
          <p className="text-sm text-[#5e6d80] mb-6">
            {mode === "edit"
              ? "Update your details to keep your profile fresh"
              : "Set up your professional profile to start getting hired"}
          </p>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-24 h-24 rounded-full cursor-pointer group"
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="avatar"
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-[#0d7cf2]/20"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-[#0d7cf2]/10 flex items-center justify-center">
                      <svg className="w-8 h-8 text-[#0d7cf2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
                <p className="text-xs text-[#97a4b3]">Click to upload profile photo</p>
              </div>

              {/* Name fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#0e1724] mb-1">First Name *</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-[#0e1724] focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2] outline-none"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0e1724] mb-1">Last Name</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-[#0e1724] focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2] outline-none"
                    placeholder="Doe"
                  />
                </div>
              </div>

              {/* Hashtag preview */}
              <div className="rounded-lg bg-[#0d7cf2]/5 border border-[#0d7cf2]/20 px-4 py-3">
                <p className="text-xs text-[#5e6d80] mb-0.5">Your unique hashtag</p>
                <p className="text-lg font-bold text-[#0d7cf2]">{hashtag || "@username"}</p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-[#0e1724] mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-[#0e1724] focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2] outline-none"
                  placeholder="+92 300 1234567"
                />
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#0e1724] mb-1">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-[#0e1724] focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2] outline-none"
                    placeholder="Lahore"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0e1724] mb-1">Country</label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-[#0e1724] focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2] outline-none"
                    placeholder="Pakistan"
                  />
                </div>
              </div>

                <button
                onClick={() => {
                  if (form.firstName.trim()) setStep(2);
                }}
                  disabled={isUploading}
                  className="w-full mt-2 bg-[#0d7cf2] hover:bg-[#0b6ad4] text-white font-semibold py-3 rounded-xl transition disabled:opacity-60"
              >
                  {isUploading ? "Uploading..." : "Continue"}
              </button>
            </div>
          )}

          {/* Step 2: Professional Details */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Professional Title */}
              <div>
                <label className="block text-sm font-medium text-[#0e1724] mb-1">Professional Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-[#0e1724] focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2] outline-none"
                  placeholder="e.g. Master Electrician with 10+ years experience"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-[#0e1724] mb-1">Bio / Description</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-[#0e1724] focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2] outline-none resize-none"
                  placeholder="Tell clients about yourself, your work experience, and what makes you stand out..."
                />
              </div>

              {/* Hourly Rate */}
              <div>
                <label className="block text-sm font-medium text-[#0e1724] mb-1">Hourly Rate (PKR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#97a4b3]">₨</span>
                  <input
                    type="number"
                    value={form.hourlyRate || ""}
                    onChange={(e) => setForm({ ...form, hourlyRate: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-200 pl-8 pr-3 py-2.5 text-sm text-[#0e1724] focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2] outline-none"
                    placeholder="500"
                  />
                </div>
              </div>

              {/* Education */}
              <div>
                <label className="block text-sm font-medium text-[#0e1724] mb-1">Education</label>
                <input
                  type="text"
                  value={form.education}
                  onChange={(e) => setForm({ ...form, education: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-[#0e1724] focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2] outline-none"
                  placeholder="e.g. Diploma in Electrical Engineering, GCT Lahore"
                />
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-[#0e1724] mb-1">Work Experience</label>
                <textarea
                  value={form.experience}
                  onChange={(e) => setForm({ ...form, experience: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-[#0e1724] focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2] outline-none resize-none"
                  placeholder="Describe your past roles... e.g. 5 years at XYZ Construction Company"
                />
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-medium text-[#0e1724] mb-1">Languages</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.languages.map((lang) => (
                    <span
                      key={lang}
                      className="inline-flex items-center gap-1 rounded-full bg-[#0d7cf2]/10 text-[#0d7cf2] px-3 py-1 text-xs font-medium"
                    >
                      {lang}
                      <button onClick={() => removeLanguage(lang)} className="hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={languageInput}
                    onChange={(e) => setLanguageInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLanguage())}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#0e1724] focus:border-[#0d7cf2] focus:ring-1 focus:ring-[#0d7cf2] outline-none"
                    placeholder="Add a language"
                  />
                  <button
                    onClick={addLanguage}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#5e6d80] hover:bg-gray-50 transition"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border border-gray-200 text-[#5e6d80] font-semibold py-3 rounded-xl hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (form.title.trim()) setStep(3);
                  }}
                  className="flex-1 bg-[#0d7cf2] hover:bg-[#0b6ad4] text-white font-semibold py-3 rounded-xl transition"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Skills Selection */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#0e1724] mb-1">
                  Select Your Skills * <span className="text-[#97a4b3] font-normal">(up to 5)</span>
                </label>
                <p className="text-xs text-[#97a4b3] mb-3">Choose the services you offer</p>
                <div className="grid grid-cols-2 gap-3">
                  {AVAILABLE_SKILLS.map((skill) => {
                    const selected = selectedSkills.includes(skill);
                    const icons: Record<string, string> = {
                      Electrician: "⚡", Plumber: "🔧", Carpenter: "🪚", Painter: "🎨",
                      Mason: "🧱", Welder: "🔥", "HVAC Technician": "❄️", Roofer: "🏠",
                      Tiler: "🔲", Landscaper: "🌿",
                    };
                    return (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`relative flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-all ${
                          selected
                            ? "border-[#0d7cf2] bg-[#0d7cf2]/5 shadow-sm"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-xl">{icons[skill] || "🛠️"}</span>
                        <span className={`text-sm font-medium ${selected ? "text-[#0d7cf2]" : "text-[#0e1724]"}`}>
                          {skill}
                        </span>
                        {selected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#0d7cf2] flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary Preview */}
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-[#0e1724] mb-3">Profile Preview</h3>
                <div className="flex items-center gap-3 mb-3">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#0d7cf2] flex items-center justify-center text-white font-bold">
                      {form.firstName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-[#0e1724]">{form.firstName} {form.lastName}</p>
                    <p className="text-xs text-[#0d7cf2]">{hashtag}</p>
                  </div>
                </div>
                <p className="text-sm text-[#5e6d80]">{form.title}</p>
                {form.city && (
                  <p className="text-xs text-[#97a4b3] mt-1">📍 {form.city}, {form.country}</p>
                )}
                {selectedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedSkills.map((s) => (
                      <span key={s} className="rounded-full bg-[#0d7cf2]/10 text-[#0d7cf2] px-2.5 py-0.5 text-xs font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 border border-gray-200 text-[#5e6d80] font-semibold py-3 rounded-xl hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || isUploading || selectedSkills.length === 0}
                  className="flex-1 bg-[#0d7cf2] hover:bg-[#0b6ad4] text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving...
                    </span>
                  ) : isUploading ? (
                    "Uploading..."
                  ) : mode === "edit" ? (
                    "Save Changes"
                  ) : (
                    "Complete Profile"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
