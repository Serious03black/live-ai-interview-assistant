import React, { useState, useRef } from 'react';
import { X, User, Upload, FileText, CheckCircle2, Save, Trash2 } from 'lucide-react';
import { CandidateProfile } from '../types';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile: CandidateProfile;
  onSave: (profile: CandidateProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  open,
  onClose,
  profile,
  onSave,
}) => {
  const [form, setForm] = useState<CandidateProfile>(profile);
  const [skillInput, setSkillInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!open) return null;

  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    if (!form.skills.includes(skillInput.trim())) {
      setForm({ ...form, skills: [...form.skills, skillInput.trim()] });
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skill: string) => {
    setForm({ ...form, skills: form.skills.filter((s) => s !== skill) });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const res = await fetch('http://localhost:3001/api/resume/parse', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to parse PDF on server');
      const data = await res.json();

      if (data.text) {
        setForm((prev) => ({
          ...prev,
          resumeText: data.text,
        }));
      }
    } catch {
      // Fallback: note file name
      setForm((prev) => ({
        ...prev,
        resumeText: `[Uploaded Resume: ${file.name} - ${(file.size / 1024).toFixed(1)} KB]`,
      }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0e172a] border border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-bold text-white">Candidate Profile & Resume Personalization</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Your Full Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Alex Mercer"
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Target Job Role
              </label>
              <input
                type="text"
                value={form.targetRole}
                onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
                placeholder="e.g. Senior Frontend / Full Stack Engineer"
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Years of Experience
              </label>
              <input
                type="text"
                value={form.yearsOfExperience}
                onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })}
                placeholder="e.g. 4 years"
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Education
              </label>
              <input
                type="text"
                value={form.education}
                onChange={(e) => setForm({ ...form, education: e.target.value })}
                placeholder="e.g. B.Tech in Information Technology"
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white outline-none"
              />
            </div>
          </div>

          {/* Skills Tag Input */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Key Skills & Technologies
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                placeholder="Type skill & press Enter (e.g. React, Docker, Redis)"
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
              {form.skills.map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1 text-[11px]"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(s)}
                    className="hover:text-rose-400 ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Key Projects Summary */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Key Projects & Accomplishments
            </label>
            <textarea
              rows={2}
              value={form.projectsSummary}
              onChange={(e) => setForm({ ...form, projectsSummary: e.target.value })}
              placeholder="Highlight 1-2 major projects, tech stacks, and scale..."
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white outline-none resize-none leading-relaxed"
            />
          </div>

            {/* Resume Upload & Direct Text Paste */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-400" />
                  <span className="font-semibold text-white">Resume & Work Experience Grounding</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-3 py-1 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30 transition-all flex items-center gap-1.5 font-semibold text-[11px]"
                >
                  <Upload className="w-3 h-3" />
                  <span>{isUploading ? 'Parsing PDF...' : 'Upload PDF Resume'}</span>
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-400">
                    Full Resume Content / Work History
                  </label>
                  <div className="flex items-center gap-2">
                    {form.resumeText ? (
                      <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {form.resumeText.length} characters loaded
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-mono">No resume loaded yet</span>
                    )}
                    {form.resumeText && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, resumeText: '' })}
                        className="text-[10px] text-slate-500 hover:text-rose-400 ml-1"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  rows={6}
                  value={form.resumeText}
                  onChange={(e) => setForm({ ...form, resumeText: e.target.value })}
                  placeholder="Paste your full resume text, work experience, past company roles, and project details here. The AI will strictly cite these facts and achievements in every interview response..."
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-sky-500 font-mono text-[11px] leading-relaxed resize-y"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  💡 Tip: You can upload a PDF resume above OR directly paste text from your CV/LinkedIn here. DeepSeek will directly cite your actual accomplishments!
                </p>
              </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/60 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition-colors text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-sky-500/20"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
