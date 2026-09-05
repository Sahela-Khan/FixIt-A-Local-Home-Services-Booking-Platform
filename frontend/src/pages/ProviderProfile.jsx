import { useState, useRef } from "react";
import { Upload, ShieldCheck, CheckCircle2, Circle, Lightbulb, ChevronRight, ChevronLeft, Star, IdCard } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import ComingSoon from "../components/ComingSoon";
import featureFlags from "../config/featureFlags";

const STEPS = [
  { n: 1, label: "Basic Info" },
  { n: 2, label: "Skills" },
  { n: 3, label: "Service & Area" },
  { n: 4, label: "Preview" },
];

export default function ProviderProfile({ embedded = false }) {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const nidFileInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    skills: (user?.providerProfile?.skills || []).join(", "),
    experienceYears: user?.providerProfile?.experienceYears || "",
    serviceArea: user?.providerProfile?.serviceArea || "",
    bio: user?.providerProfile?.bio || "",
    photoUrl: user?.providerProfile?.photoUrl || "",
    nidPhotoUrl: user?.providerProfile?.nidPhotoUrl || "",
  });
  const [saving, setSaving] = useState(false);

  const skillsList = form.skills.split(",").map((s) => s.trim()).filter(Boolean);

  const checklist = [
    { label: "Basic information", done: true },
    { label: "Skills added", done: skillsList.length > 0 },
    { label: "Service area added", done: Boolean(form.serviceArea) },
    { label: "Profile photo added", done: Boolean(form.photoUrl) },
    { label: "NID uploaded", done: Boolean(form.nidPhotoUrl) },
  ];
  const strengthPct = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);
  const strengthLabel = strengthPct === 100 ? "Great" : strengthPct >= 50 ? "Good" : "Needs work";

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Please choose an image under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, photoUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleNidPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Please choose an image under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, nidPhotoUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put("/provider/profile", form);
      updateUser({ providerProfile: { ...user.providerProfile, ...res.data.providerProfile } });
      return true;
    } catch (err) {
      alert(err.response?.data?.message || "Could not save profile.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const goNext = async () => {
    if (step < 4) {
      await handleSave();
      setStep(step + 1);
    } else {
      const ok = await handleSave();
      if (ok) alert("Profile saved!");
    }
  };

  return (
    <div className={embedded ? "p-8" : "min-h-screen bg-slate-50 p-8"}>
      <h2 className="text-2xl font-bold mb-1">My Profile Setup</h2>
      <p className="text-slate-500 mb-6">Complete your profile to get more bookings and build trust with customers.</p>

      {/* Feature 1 — Service Provider Profile Setup: skills / experience / bio /
          service area / photo. Held back for Sprint 3 (see src/config/featureFlags.js).
          Identity verification below is a separate, required feature (gates admin
          approval + search visibility) and stays active regardless of this flag. */}
      {!featureFlags.providerProfileSetup ? (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-xl shadow-sm p-6">
            <ComingSoon
              title="Profile setup — coming in Sprint 3"
              description="Adding your skills, experience, bio, service area, and profile photo will be available soon."
            />

            <div className="mt-6 border-t pt-4">
              <h4 className="font-semibold mb-1 flex items-center gap-2">
                <IdCard size={16} className="text-orange-500" /> Identity Verification
              </h4>
              <p className="text-xs text-slate-500 mb-3">
                Upload a photo of your NID for our records.
              </p>

              <input
                ref={nidFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleNidPhotoChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => nidFileInputRef.current?.click()}
                className="w-full border border-dashed rounded-lg px-4 py-5 text-center text-sm text-slate-500"
              >
                <Upload size={18} className="mx-auto mb-1" />
                {form.nidPhotoUrl ? "Change NID photo" : "Upload NID photo"}
                <p className="text-xs text-slate-400 mt-1">JPG, PNG up to 2MB</p>
              </button>
              {form.nidPhotoUrl && (
                <img src={form.nidPhotoUrl} alt="NID preview" className="mt-2 max-h-32 rounded-lg border" />
              )}

              {form.nidPhotoUrl && (
                <div className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <ShieldCheck size={16} /> NID on file.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-4 flex gap-2">
              <Lightbulb size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">NID upload is available now — full profile customization arrives in Sprint 3.</p>
            </div>
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-3 gap-6">
        {/* Main wizard */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm p-6">
          {/* Step indicator */}
          <div className="flex items-center mb-8">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      step === s.n
                        ? "bg-orange-500 text-white"
                        : step > s.n
                        ? "bg-green-500 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {step > s.n ? <CheckCircle2 size={16} /> : s.n}
                  </div>
                  <span className="text-xs mt-1 text-slate-500 whitespace-nowrap">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className="flex-1 h-0.5 bg-slate-200 mx-2 mb-5" />}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div>
              <h3 className="font-semibold mb-1">Basic Information</h3>
              <p className="text-sm text-slate-500 mb-4">Add your basic details that customers will see.</p>

              <div className="flex items-center gap-4 mb-4">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 border border-dashed rounded-lg px-4 py-6 text-center text-sm text-slate-500"
                >
                  <Upload size={20} className="mx-auto mb-1" />
                  {form.photoUrl ? "Change photo" : "Upload your photo"}
                  <p className="text-xs text-slate-400 mt-1">JPG, PNG up to 2MB</p>
                </button>
                <div className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                  {form.photoUrl ? (
                    <img src={form.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-400 text-xs">Preview</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Full Name</label>
                  <input value={user?.name || ""} disabled className="w-full border rounded-lg px-3 py-2 text-sm mt-1 bg-slate-50 text-slate-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Email</label>
                  <input value={user?.email || ""} disabled className="w-full border rounded-lg px-3 py-2 text-sm mt-1 bg-slate-50 text-slate-500" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Skills */}
          {step === 2 && (
            <div>
              <h3 className="font-semibold mb-1">Skills</h3>
              <p className="text-sm text-slate-500 mb-4">List the services you're skilled at, separated by commas.</p>
              <input
                placeholder="AC repair, wiring, plumbing, installation"
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              {skillsList.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {skillsList.map((s) => (
                    <span key={s} className="bg-orange-50 text-orange-600 text-xs font-semibold px-3 py-1 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <label className="text-xs font-semibold text-slate-500">Years of experience</label>
                <input
                  type="number"
                  value={form.experienceYears}
                  onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                />
              </div>
            </div>
          )}

          {/* Step 3: Service & Area */}
          {step === 3 && (
            <div>
              <h3 className="font-semibold mb-1">Service & Area</h3>
              <p className="text-sm text-slate-500 mb-4">Where do you work, and what should customers know about you?</p>
              <label className="text-xs font-semibold text-slate-500">Service Area</label>
              <input
                placeholder="Uttara, Dhaka"
                value={form.serviceArea}
                onChange={(e) => setForm({ ...form, serviceArea: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1 mb-4"
              />
              <label className="text-xs font-semibold text-slate-500">Bio</label>
              <textarea
                placeholder="Tell customers about your experience and specialties"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                rows={4}
                maxLength={300}
              />
              <p className="text-xs text-slate-400 text-right mt-1">{form.bio.length}/300</p>
            </div>
          )}

          {/* Step 4: Preview */}
          {step === 4 && (
            <div>
              <h3 className="font-semibold mb-1">Preview</h3>
              <p className="text-sm text-slate-500 mb-4">This is what your public profile will look like.</p>
              <ProfileCard user={user} form={form} skillsList={skillsList} />

              <div className="mt-5 border-t pt-4">
                <h4 className="font-semibold mb-1 flex items-center gap-2">
                  <IdCard size={16} className="text-orange-500" /> Identity Verification
                </h4>
                <p className="text-xs text-slate-500 mb-3">
                  Upload a photo of your NID for our records.
                </p>

                <input
                  ref={nidFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleNidPhotoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => nidFileInputRef.current?.click()}
                  className="w-full border border-dashed rounded-lg px-4 py-5 text-center text-sm text-slate-500"
                >
                  <Upload size={18} className="mx-auto mb-1" />
                  {form.nidPhotoUrl ? "Change NID photo" : "Upload NID photo"}
                  <p className="text-xs text-slate-400 mt-1">JPG, PNG up to 2MB</p>
                </button>
                {form.nidPhotoUrl && (
                  <img src={form.nidPhotoUrl} alt="NID preview" className="mt-2 max-h-32 rounded-lg border" />
                )}

                {form.nidPhotoUrl && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <ShieldCheck size={16} /> NID on file.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-4 border-t">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="flex items-center gap-1 border border-slate-300 text-slate-600 font-semibold px-4 py-2 rounded-lg disabled:opacity-40"
            >
              <ChevronLeft size={16} /> Cancel
            </button>
            <button
              onClick={goNext}
              disabled={saving}
              className="flex items-center gap-1 bg-orange-500 text-white font-semibold px-4 py-2 rounded-lg disabled:opacity-60"
            >
              {saving ? "Saving..." : step < 4 ? "Save & Continue" : "Finish"}
              {step < 4 && <ChevronRight size={16} />}
            </button>
          </div>
        </div>

        {/* Right column: Profile Strength + Preview */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold">Profile Strength</h4>
              <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{strengthLabel}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
              <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${strengthPct}%` }} />
            </div>
            <p className="text-xs text-slate-400 mb-3">{strengthPct}%</p>
            <div className="space-y-1.5">
              {checklist.map((c) => (
                <div key={c.label} className="flex items-center gap-2 text-sm">
                  {c.done ? (
                    <CheckCircle2 size={16} className="text-green-500" />
                  ) : (
                    <Circle size={16} className="text-slate-300" />
                  )}
                  <span className={c.done ? "text-slate-700" : "text-slate-400"}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          <ProfileCard user={user} form={form} skillsList={skillsList} compact />

          <div className="bg-blue-50 rounded-xl p-4 flex gap-2">
            <Lightbulb size={16} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">A complete profile gets 3x more booking requests!</p>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

function ProfileCard({ user, form, skillsList, compact }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-5 ${compact ? "" : "border"}`}>
      {!compact && <h4 className="font-semibold mb-3">Profile Preview</h4>}
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
          {form.photoUrl ? (
            <img src={form.photoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-slate-400 text-xs">No photo</span>
          )}
        </div>
        <div>
          <p className="font-bold">{user?.name}</p>
          {form.serviceArea && <p className="text-xs text-slate-500 mt-0.5">📍 {form.serviceArea}</p>}
        </div>
      </div>

      {skillsList.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {skillsList.slice(0, 4).map((s) => (
            <span key={s} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">{s}</span>
          ))}
          {skillsList.length > 4 && (
            <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full">+{skillsList.length - 4}</span>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t text-center">
        <div>
          <p className="text-sm font-bold">{form.experienceYears || "—"}</p>
          <p className="text-[10px] text-slate-400">Experience</p>
        </div>
        <div>
          <p className="text-sm font-bold">{user?.providerProfile?.totalJobsCompleted ?? 0}</p>
          <p className="text-[10px] text-slate-400">Jobs Done</p>
        </div>
        <div>
          <p className="text-sm font-bold flex items-center justify-center gap-0.5">
            <Star size={12} className="text-yellow-500" /> {user?.providerProfile?.avgRating || "—"}
          </p>
          <p className="text-[10px] text-slate-400">Rating</p>
        </div>
      </div>
    </div>
  );
}