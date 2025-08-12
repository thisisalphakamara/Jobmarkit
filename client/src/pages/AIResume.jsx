import React, { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import html2pdf from "html2pdf.js";

const AIResume = () => {
  const [form, setForm] = useState({
    fullName: "",
    targetRole: "",
    skills: "",
    experience: "",
    references: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    website: "",
    summary: "",
    education: "",
    certifications: "",
    projects: "",
    awards: "",
    volunteering: "",
    languages: "",
  });
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
  const printRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setContent("");
    try {
      const payload = {
        fullName: form.fullName || undefined,
        headline: form.targetRole || undefined,
        skills: form.skills,
        experience: form.experience,
        references: form.references,
        email: form.email || undefined,
        phone: form.phone || undefined,
        location: form.location || undefined,
        linkedin: form.linkedin || undefined,
        github: form.github || undefined,
        website: form.website || undefined,
        summary: form.summary || undefined,
        education: form.education,
        certifications: form.certifications,
        projects: form.projects,
        awards: form.awards,
        volunteering: form.volunteering,
        languages: form.languages,
      };
      const res = await fetch(
        `${API_BASE.replace(/\/api$/, "")}/api/ai/resume`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (data.success) setContent(data.content);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    const fileName = `${(form.fullName || "resume").trim()}.pdf`;
    const opt = {
      margin: [12, 12, 12, 12],
      filename: fileName,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    };
    // Ensure fonts/colors on white background
    await html2pdf().set(opt).from(printRef.current).save();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">AI Resume Generator</h1>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
      >
        <input
          className="border rounded-lg px-3 py-2"
          name="fullName"
          placeholder="Full name"
          value={form.fullName}
          onChange={handleChange}
        />
        <input
          className="border rounded-lg px-3 py-2"
          name="targetRole"
          placeholder="Target role (e.g., Frontend Developer)"
          value={form.targetRole}
          onChange={handleChange}
          required
        />
        <input
          className="border rounded-lg px-3 py-2"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />
        <input
          className="border rounded-lg px-3 py-2"
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
        />
        <input
          className="border rounded-lg px-3 py-2 md:col-span-2"
          name="location"
          placeholder="Location (City, Country)"
          value={form.location}
          onChange={handleChange}
        />
        <input
          className="border rounded-lg px-3 py-2"
          name="linkedin"
          placeholder="LinkedIn URL"
          value={form.linkedin}
          onChange={handleChange}
        />
        <input
          className="border rounded-lg px-3 py-2"
          name="github"
          placeholder="GitHub URL"
          value={form.github}
          onChange={handleChange}
        />
        <input
          className="border rounded-lg px-3 py-2 md:col-span-2"
          name="website"
          placeholder="Portfolio/Website URL"
          value={form.website}
          onChange={handleChange}
        />
        <textarea
          className="border rounded-lg px-3 py-2 md:col-span-2"
          rows="3"
          name="summary"
          placeholder="Professional Summary (2–3 sentences about your focus and value)"
          value={form.summary}
          onChange={handleChange}
        />
        <textarea
          className="border rounded-lg px-3 py-2 md:col-span-2"
          rows="3"
          name="skills"
          placeholder="Skills (comma-separated, you will enter your real skills here)"
          value={form.skills}
          onChange={handleChange}
        />
        <textarea
          className="border rounded-lg px-3 py-2 md:col-span-2"
          rows="4"
          name="experience"
          placeholder="Experience (one bullet per line; your exact roles/achievements)"
          value={form.experience}
          onChange={handleChange}
        />
        <textarea
          className="border rounded-lg px-3 py-2 md:col-span-2"
          rows="3"
          name="education"
          placeholder="Education (one per line: Institution – Degree – Years)"
          value={form.education}
          onChange={handleChange}
        />
        <textarea
          className="border rounded-lg px-3 py-2 md:col-span-2"
          rows="3"
          name="certifications"
          placeholder="Certifications (one per line: Name – Issuer – Year)"
          value={form.certifications}
          onChange={handleChange}
        />
        <textarea
          className="border rounded-lg px-3 py-2 md:col-span-2"
          rows="3"
          name="projects"
          placeholder="Projects (one per line: Project – Tech/Role – Impact)"
          value={form.projects}
          onChange={handleChange}
        />
        <textarea
          className="border rounded-lg px-3 py-2"
          rows="2"
          name="languages"
          placeholder="Languages (comma-separated, e.g., English, Krio)"
          value={form.languages}
          onChange={handleChange}
        />
        <textarea
          className="border rounded-lg px-3 py-2"
          rows="2"
          name="awards"
          placeholder="Awards (one per line)"
          value={form.awards}
          onChange={handleChange}
        />
        <textarea
          className="border rounded-lg px-3 py-2 md:col-span-2"
          rows="2"
          name="volunteering"
          placeholder="Volunteering (one per line: Org – Role – Impact)"
          value={form.volunteering}
          onChange={handleChange}
        />
        <textarea
          className="border rounded-lg px-3 py-2 md:col-span-2"
          rows="3"
          name="references"
          placeholder="References (e.g., Name – Title – Contact; one per line)"
          value={form.references}
          onChange={handleChange}
        />
        <button
          disabled={loading}
          className="md:col-span-2 bg-gray-800 text-white rounded-lg px-4 py-2"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </form>
      {content && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleDownloadPdf}
              className="bg-gray-800 hover:bg-gray-900 text-white rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Download PDF
            </button>
          </div>
          <div
            ref={printRef}
            className="bg-white border rounded-xl p-8 text-gray-900 text-[13px] leading-relaxed max-w-[794px] mx-auto shadow-sm print:shadow-none"
          >
            <article className="prose prose-sm max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </article>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIResume;
