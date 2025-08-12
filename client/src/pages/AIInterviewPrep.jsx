import React, { useMemo, useState } from "react";

const AIInterviewPrep = () => {
  const [form, setForm] = useState({
    jobTitle: "",
    experienceLevel: "mid",
    jobDescription: "",
  });
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  // Removed audio features
  const [loading, setLoading] = useState(false);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(
        `${API_BASE.replace(/\/api$/, "")}/api/ai/interview-prep`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data);
      } else {
        setError(json.message || "Failed to generate interview prep.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Removed audio functions

  const toQA = (item) =>
    typeof item === "string"
      ? { question: item, answer: "", guidance: "" }
      : item;

  const roleQAs = useMemo(() => (data?.roleSpecific || []).map(toQA), [data]);
  const behavioralQAs = useMemo(
    () => (data?.behavioral || []).map(toQA),
    [data]
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">AI Interview Prep</h1>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
      >
        <input
          className="border rounded-lg px-3 py-2"
          name="jobTitle"
          placeholder="Role (e.g., Sales Manager)"
          value={form.jobTitle}
          onChange={handleChange}
        />
        <select
          className="border rounded-lg px-3 py-2"
          name="experienceLevel"
          value={form.experienceLevel}
          onChange={handleChange}
        >
          <option value="junior">Junior</option>
          <option value="mid">Mid-level</option>
          <option value="senior">Senior</option>
        </select>
        <textarea
          className="border rounded-lg px-3 py-2 md:col-span-2"
          rows="4"
          name="jobDescription"
          placeholder="Paste job description (optional)"
          value={form.jobDescription}
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
      {data && (
        <div className="grid gap-4">
          {roleQAs.length > 0 && (
            <div className="bg-white border rounded-xl p-4">
              <h2 className="font-semibold mb-3">Role-specific Questions</h2>
              <div className="space-y-4">
                {roleQAs.map((qa, i) => (
                  <div key={`r-${i}`} className="border rounded-lg p-3">
                    <p className="font-medium text-gray-900">{qa.question}</p>
                    {qa.answer && (
                      <div className="mt-2 text-gray-800 text-sm whitespace-pre-line">
                        <span className="font-semibold">Answer</span>
                        <br />
                        {qa.answer}
                      </div>
                    )}
                    {qa.guidance && (
                      <p className="mt-2 text-gray-600 text-xs">
                        <span className="font-semibold">How to answer:</span> {qa.guidance}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {behavioralQAs.length > 0 && (
            <div className="bg-white border rounded-xl p-4">
              <h2 className="font-semibold mb-3">Behavioral Questions</h2>
              <div className="space-y-4">
                {behavioralQAs.map((qa, i) => (
                  <div key={`b-${i}`} className="border rounded-lg p-3">
                    <p className="font-medium text-gray-900">{qa.question}</p>
                    {qa.answer && (
                      <div className="mt-2 text-gray-800 text-sm whitespace-pre-line">
                        <span className="font-semibold">Answer</span>
                        <br />
                        {qa.answer}
                      </div>
                    )}
                    {qa.guidance && (
                      <p className="mt-2 text-gray-600 text-xs">
                        <span className="font-semibold">How to answer:</span> {qa.guidance}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.tips && (
            <div className="bg-white border rounded-xl p-4">
              <h2 className="font-semibold mb-2">Tips</h2>
              <ul className="list-disc ml-5 text-gray-700">
                {data.tips.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIInterviewPrep;
