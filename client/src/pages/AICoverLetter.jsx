import React, { useRef, useState } from "react";
import html2pdf from "html2pdf.js";

const AICoverLetter = () => {
  const [form, setForm] = useState({
    fullName: "",
    companyName: "",
    jobTitle: "",
    companyAddress: "",
    tone: "professional",
  });
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
  const printRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  // Ensure proper paragraph breaks even if API returns single-line breaks
  const normalizeCoverMarkdown = (md) => {
    if (!md) return "";
    let text = md.trim();
    // If there are no double line breaks, promote single breaks between non-empty lines
    if (!/\n\n/.test(text)) {
      text = text.replace(/([^\n])\n(?!\n)(?=[^\n])/g, "$1\n\n");
    }
    // Ensure a blank line after Greeting (lines starting with "Dear ")
    text = text.replace(/(^|\n)(Dear [^\n]*)(\n)(?!\n)/, "$1$2\n\n");
    // Ensure a blank line after date line if followed by address
    text = text.replace(/(^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}.*)(\n)(?!\n)/, "$1\n\n");
    return text;
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    const fileName = `${(form.fullName || "cover-letter").trim()}_${
      form.jobTitle || "role"
    }.pdf`;
    const opt = {
      margin: [12, 12, 12, 12],
      filename: fileName,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    };
    await html2pdf().set(opt).from(printRef.current).save();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setContent("");
    setError("");
    try {
      const res = await fetch(
        `${API_BASE.replace(/\/api$/, "")}/api/ai/cover-letter`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setContent(normalizeCoverMarkdown(data.content));
      } else {
        setError(data.message || "Failed to generate cover letter.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">AI Cover Letter</h1>
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
          name="companyName"
          placeholder="Company"
          value={form.companyName}
          onChange={handleChange}
        />
        <input
          className="border rounded-lg px-3 py-2"
          name="jobTitle"
          placeholder="Job title"
          value={form.jobTitle}
          onChange={handleChange}
        />
        <select
          className="border rounded-lg px-3 py-2"
          name="tone"
          value={form.tone}
          onChange={handleChange}
        >
          <option value="professional">Professional</option>
          <option value="friendly">Friendly</option>
          <option value="confident">Confident</option>
        </select>
        <textarea
          className="border rounded-lg px-3 py-2 md:col-span-2"
          rows="3"
          name="companyAddress"
          placeholder="Company address (street, city, etc.)"
          value={form.companyAddress}
          onChange={handleChange}
        />
        <button
          disabled={loading}
          className="md:col-span-2 bg-gray-800 text-white rounded-lg px-4 py-2"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </form>
      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
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
            {content
              .split(/\n\s*\n/) // split into paragraphs on blank lines
              .map((para, idx) => (
                <p
                  key={idx}
                  className={`whitespace-pre-line ${
                    idx === 0
                      ? "mb-4" // date
                      : idx === 1
                      ? "mb-6" // inside address block
                      : idx === 2
                      ? "mb-6" // greeting
                      : idx === content.split(/\n\s*\n/).length - 1
                      ? "mt-6" // signature
                      : "mb-6"
                  }`}
                >
                  {para.trim()}
                </p>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AICoverLetter;
