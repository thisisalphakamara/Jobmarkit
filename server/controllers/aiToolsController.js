import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ensureKey = () => {
  if (!process.env.OPENAI_API_KEY) {
    const err = new Error("OpenAI API key not configured");
    err.status = 500;
    throw err;
  }
};

// Helpers
const isQuotaError = (error) => {
  const code = error?.code || error?.response?.status;
  const message = error?.message || "";
  return (
    code === 429 ||
    message.includes("insufficient_quota") ||
    message.includes("You exceeded your current quota")
  );
};

const buildResumeMarkdown = ({
  fullName,
  headline,
  email,
  phone,
  location,
  linkedin,
  github,
  website,
  summary,
  skills,
  experience,
  education,
  certifications,
  projects,
  awards,
  volunteering,
  languages,
  references,
}) => {
  const nameLine = fullName ? `# ${fullName}\n\n` : "";
  const titleLine = headline ? `**${headline}**\n\n` : "";
  const contactParts = [email, phone, location, linkedin, github, website]
    .filter(Boolean)
    .join(" | ");
  const contactLine = contactParts ? `${contactParts}\n\n` : "";
  const skillsList = (Array.isArray(skills) ? skills : String(skills || ""))
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `- ${s}`)
    .join("\n");
  const expList = (
    Array.isArray(experience)
      ? experience
      : String(experience || "")
          .split(/\n+/)
          .map((l) => l.trim())
  )
    .filter(Boolean)
    .map((l) => `- ${l}`)
    .join("\n");
  const eduList = (
    Array.isArray(education)
      ? education
      : String(education || "")
          .split(/\n+/)
          .map((l) => l.trim())
  )
    .filter(Boolean)
    .map((l) => `- ${l}`)
    .join("\n");
  const certList = (
    Array.isArray(certifications)
      ? certifications
      : String(certifications || "")
          .split(/\n+/)
          .map((l) => l.trim())
  )
    .filter(Boolean)
    .map((l) => `- ${l}`)
    .join("\n");
  const projList = (
    Array.isArray(projects)
      ? projects
      : String(projects || "")
          .split(/\n+/)
          .map((l) => l.trim())
  )
    .filter(Boolean)
    .map((l) => `- ${l}`)
    .join("\n");
  const awardsList = (
    Array.isArray(awards)
      ? awards
      : String(awards || "")
          .split(/\n+/)
          .map((l) => l.trim())
  )
    .filter(Boolean)
    .map((l) => `- ${l}`)
    .join("\n");
  const volunteerList = (
    Array.isArray(volunteering)
      ? volunteering
      : String(volunteering || "")
          .split(/\n+/)
          .map((l) => l.trim())
  )
    .filter(Boolean)
    .map((l) => `- ${l}`)
    .join("\n");
  const langList = (Array.isArray(languages) ? languages : String(languages || ""))
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => `- ${l}`)
    .join("\n");
  const refList = (
    Array.isArray(references)
      ? references
      : String(references || "")
          .split(/\n+/)
          .map((l) => l.trim())
  )
    .filter(Boolean)
    .map((l) => `- ${l}`)
    .join("\n");

  return [
    `${nameLine}${titleLine}${contactLine}`,
    "## Professional Summary",
    summary ||
      "Results-driven professional with strengths tailored to the target role. Replace this line with a concise 2–3 sentence summary highlighting your impact and focus.",
    "",
    "## Core Competencies",
    "- [Add core strength]",
    "- [Add tool or framework expertise]",
    "- [Add domain knowledge]",
    "",
    skillsList ? `## Skills\n${skillsList}` : "",
    "",
    expList ? `## Experience\n${expList}` : "## Experience\n- [Add your role – Company – Dates]\n- [Quantified achievement]\n- [Project or impact detail]",
    "",
    eduList
      ? `## Education\n${eduList}`
      : [
          "## Education",
          "- [Institution] — [Degree], [Years]",
          "- [Relevant coursework or honors]",
        ].join("\n"),
    "",
    certList
      ? `## Certifications\n${certList}`
      : "## Certifications\n- [Certification Name] — [Issuer], [Year]",
    "",
    projList
      ? `## Projects\n${projList}`
      : "## Projects\n- [Project Name] — [Tech/Role]\n  - [One-line impact or metric]\n  - [Role-specific responsibility]",
    "",
    langList ? `## Languages\n${langList}` : "",
    "",
    awardsList ? `## Awards\n${awardsList}` : "",
    "",
    volunteerList ? `## Volunteering\n${volunteerList}` : "",
    "",
    refList ? `## References\n${refList}` : "## References\nAvailable upon request",
  ]
    .filter(Boolean)
    .join("\n");
};

const buildCoverLetterMarkdown = ({
  fullName,
  companyName,
  jobTitle,
  tone,
  companyAddress,
}) => {
  const date = new Date().toLocaleDateString();
  const insideAddress = [companyName, ...(String(companyAddress || "").split(/\n+/).map((l) => l.trim()).filter(Boolean))]
    .filter(Boolean)
    .join("\n");
  const greeting = `Dear ${companyName ? "Hiring Team" : "Hiring Manager"},`;

  return [
    `${date}`,
    "",
    insideAddress,
    "",
    greeting,
    "",
    `I am pleased to submit my application for the ${jobTitle || "position"} at ${companyName || "your organization"}. With a strong record of delivering results and collaborating across teams, I bring a disciplined, outcomes‑focused approach and a commitment to high standards.`,
    "",
    "Throughout my experience, I have developed strengths in problem solving, stakeholder communication, and consistent execution under tight timelines. I am adept at learning quickly, adapting to new processes, and aligning my work to business priorities while maintaining attention to detail and quality.",
    "",
    `I am excited about the opportunity to contribute to ${companyName || "your organization"} and support the goals of the ${jobTitle || "role"}. I would welcome the chance to discuss how my strengths can add value to your team.`,
    "",
    "Sincerely,",
    "",
    `${fullName || "Your Name"}`,
  ]
    .filter(Boolean)
    .join("\n");
};

const buildInterviewPack = ({ jobTitle, experienceLevel }) => {
  const role = jobTitle || "the role";
  const level = experienceLevel || "mid-level";

  const makeSTAR = (s, t, a, r) =>
    [
      `Situation: ${s}`,
      `Task: ${t}`,
      `Action: ${a}`,
      `Result: ${r}`,
    ].join("\n");

  const roleSpecific = [
    {
      question: `Walk me through your most relevant project for ${role}.`,
      answer: makeSTAR(
        `Our team needed to deliver a critical ${role} initiative with tight timelines in Sierra Leone.`,
        `Own the delivery while aligning stakeholders and mitigating risks.`,
        `Scoped the work, clarified requirements, set milestones, and coordinated with cross‑functional teams. Resolved blockers early and communicated progress transparently.`,
        `Delivered on time with quality; stakeholders adopted the solution and we improved key KPIs.`,
      ),
      guidance:
        "Pick one strong example. Keep it focused and quantified. Emphasize your role, decisions, and impact.",
    },
    {
      question: `How do you measure success in ${role}?`,
      answer:
        "I align success metrics to business outcomes and leading indicators for the role. I track a small set of KPIs weekly, review trends, and adjust priorities early. I also collect qualitative feedback from stakeholders to complement data.",
      guidance:
        "Mention 2–3 relevant KPIs for the role and how you review and act on them.",
    },
    {
      question: `Describe a challenge you faced in ${role} and how you resolved it.`,
      answer: makeSTAR(
        `A key dependency slipped and threatened delivery.`,
        `Protect the deadline and maintain scope.`,
        `Re‑planned work, created a mitigation path, and aligned stakeholders on trade‑offs. Escalated early for support.`,
        `Hit the date with minimal scope changes and preserved user value; improved our risk process afterward.`,
      ),
      guidance:
        "Show judgment under pressure and communication with stakeholders.",
    },
    {
      question: `What tools and processes do you rely on at ${level}?`,
      answer:
        "I standardize on a lightweight process: clear goals, prioritized backlog, weekly planning, and async status updates. Tools depend on the environment; I value consistency, transparency, and automation to reduce errors.",
      guidance:
        "Name tools you’re comfortable with but stress principles over brands.",
    },
    {
      question: `Why are you interested in this opportunity?`,
      answer:
        "The role aligns with my strengths and the organization’s mission. I’m motivated by problems with clear community impact in Sierra Leone and teams that value ownership, learning, and measurable outcomes.",
      guidance:
        "Connect your values/skills to the company’s goals in a sincere, specific way.",
    },
  ];

  const behavioral = [
    {
      question: "Tell me about a time you led a project.",
      answer: makeSTAR(
        "We had an ambiguous project with unclear scope.",
        "Create clarity, build a plan, and align the team.",
        "Facilitated a brief discovery, defined success metrics, built a roadmap, and delegated work with clear owners.",
        "Delivered iteratively; stakeholders saw steady progress and we hit the target outcomes.",
      ),
      guidance: "Show initiative, planning, delegation, and stakeholder alignment.",
    },
    {
      question: "Describe a conflict and how you resolved it.",
      answer: makeSTAR(
        "Two teams had competing priorities affecting dependencies.",
        "Unblock delivery while preserving relationships.",
        "Facilitated a joint session, clarified constraints, proposed a phased plan, and documented decisions.",
        "We unblocked delivery and improved collaboration for future work.",
      ),
      guidance: "Demonstrate empathy, mediation, and solution focus.",
    },
    {
      question: "Give an example of a failure and what you learned.",
      answer: makeSTAR(
        "A release caused unexpected user friction.",
        "Recover quickly and prevent recurrence.",
        "Rolled back, added guardrails, and implemented pre‑release checks.",
        "Stabilized metrics and updated our playbooks; improved quality going forward.",
      ),
      guidance: "Own the mistake, show learning and system improvement.",
    },
    {
      question: "How do you handle tight deadlines?",
      answer:
        "I re‑assess scope against impact, sequence work for maximum value, and set clear, realistic checkpoints. I communicate risks early and ask for help where needed.",
      guidance: "Prioritization, transparency, and focus are key points to hit.",
    },
    {
      question: "Describe a time you went above and beyond.",
      answer: makeSTAR(
        "A partner team lacked bandwidth for a critical deliverable.",
        "Protect downstream commitments.",
        "Volunteered to assist, documented a repeatable approach, and shared learnings.",
        "We met the deadline and the template became a team standard.",
      ),
      guidance: "Highlight ownership and repeatable impact, not heroics.",
    },
  ];

  const tips = [
    "Practice aloud; aim for 60–90s per answer.",
    "Lead with outcomes and data where possible.",
    "Tailor examples to the company and context in Sierra Leone.",
  ];

  return { roleSpecific, behavioral, tips };
};

export const generateResume = async (req, res) => {
  try {
    ensureKey();
    const {
      fullName,
      headline,
      summary,
      experience, // string or array (user-provided)
      skills, // string or array (user-provided)
      education, // string or array (optional)
      references, // string or array (user-provided)
      email,
      phone,
      location,
      linkedin,
      github,
      website,
      certifications, // string or array
      projects, // string or array
      awards, // string or array
      volunteering, // string or array
      languages, // string or comma-separated
    } = req.body || {};

    const exp = Array.isArray(experience)
      ? experience.join("\n")
      : experience || "";
    const skl = Array.isArray(skills) ? skills.join(", ") : skills || "";
    const edu = Array.isArray(education) ? education.join("\n") : education || "";
    const refs = Array.isArray(references)
      ? references.join("\n")
      : references || "";
    const certs = Array.isArray(certifications)
      ? certifications.join("\n")
      : certifications || "";
    const projs = Array.isArray(projects) ? projects.join("\n") : projects || "";
    const awds = Array.isArray(awards) ? awards.join("\n") : awards || "";
    const vols = Array.isArray(volunteering) ? volunteering.join("\n") : volunteering || "";
    const langs = Array.isArray(languages) ? languages.join(", ") : languages || "";

    const prompt = `Create a full, ATS-friendly professional resume in Markdown tailored to the target role and Sierra Leone context.
Return ONLY Markdown (no preamble). Use these sections in order:
1) Header (Name, Headline)
   - Below header, add one line with contact info (any provided): Email | Phone | Location | LinkedIn | GitHub | Website
2) Professional Summary (2–3 sentences; role-tailored; do NOT invent personal details)
3) Core Competencies (role-tailored generic strengths; no personal claims)
4) Skills (USE USER-PROVIDED ONLY)
5) Experience (USE USER-PROVIDED ONLY, keep as bullets if roles are not specified)
6) Education (generic template if none provided; no fabricated institutions)
7) Certifications (generic template placeholders; no fabrication)
8) Projects (role-tailored generic templates; no personal claims)
10) Languages (if provided)
11) Awards (if provided)
12) Volunteering (if provided)
9) References (USE USER-PROVIDED ONLY; if none, write "Available upon request")

Candidate:
Name: ${fullName || ""}
Headline (target role): ${headline || ""}
Location: ${location || "Sierra Leone"}
Email: ${email || ""}
Phone: ${phone || ""}
LinkedIn: ${linkedin || ""}
GitHub: ${github || ""}
Website: ${website || ""}
User Summary (optional context): ${summary || ""}
User Skills (verbatim): ${skl}
User Experience (verbatim; one per line):\n${exp}
User Education (optional):\n${edu}
User Certifications (optional):\n${certs}
User Projects (optional):\n${projs}
User Languages (optional): ${langs}
User Awards (optional):\n${awds}
User Volunteering (optional):\n${vols}
User References (verbatim; one per line):\n${refs}

Formatting rules:
- Output clean Markdown, bullet points, and concise lines.
- Do NOT fabricate any experience, skills, references, or specific institutions.
- Where user info is missing, provide clear placeholders the user can replace.`;

    let content = "";
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You craft full professional resume scaffolds for Sierra Leone candidates. Never fabricate user-specific details (experience, skills, references). Where needed, provide placeholders.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1200,
      });
      content = completion.choices?.[0]?.message?.content || "";
      return res.json({ success: true, format: "markdown", content });
    } catch (err) {
      if (isQuotaError(err)) {
        const fallback = buildResumeMarkdown({
          fullName,
          headline,
          email,
          phone,
          location,
          linkedin,
          github,
          website,
          summary,
          skills: skl,
          experience: exp,
          education: edu,
          certifications: certs,
          projects: projs,
          awards: awds,
          volunteering: vols,
          languages: langs,
          references: refs,
        });
        return res.json({
          success: true,
          format: "markdown",
          content: fallback,
          meta: { fallback: true, reason: "quota_exceeded" },
        });
      }
      throw err;
    }
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to generate resume",
    });
  }
};

export const generateCoverLetter = async (req, res) => {
  try {
    ensureKey();
    const {
      fullName,
      companyName,
      jobTitle,
      companyAddress,
      tone,
    } = req.body || {};

    const prompt = `Write a classic, formal cover letter in Markdown for Sierra Leone context.
Tone: ${tone || "professional and confident"}

Strict structure (use BLANK LINES between each logical block so paragraphs render correctly):
- Date line (on its own line)
- Inside address block (company name and address as provided; multiple lines if needed)
- BLANK LINE
- Greeting (Dear Hiring Manager/Team), followed by a BLANK LINE
- Opening paragraph: name the job title and provide a concise value proposition
- BLANK LINE
- One or two middle paragraphs with role‑aligned strengths (no fabricated specifics)
- BLANK LINE
- Closing paragraph with call to action and appreciation
- BLANK LINE
- Signature with applicant name

Formatting rules:
- Absolutely NO bullet lists; use prose paragraphs only.
- Insert a BLANK LINE between paragraphs as shown so it is not one big block.
- Do NOT fabricate employers, projects, or metrics. Use only generic strengths if specifics are not provided.
- Keep length ~250–400 words.
- Return ONLY Markdown (no preamble).

Applicant: ${fullName || ""}
Company: ${companyName || ""}
Company Address (verbatim):\n${companyAddress || ""}
Job Title: ${jobTitle || ""}`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You write traditional, formal cover letters for Sierra Leone roles. Never fabricate user-specific details; avoid invented employers/projects/metrics.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.35,
        max_tokens: 1200,
      });
      const content = completion.choices?.[0]?.message?.content || "";
      return res.json({ success: true, format: "markdown", content });
    } catch (err) {
      if (isQuotaError(err)) {
        const fallback = buildCoverLetterMarkdown({
          fullName,
          companyName,
          jobTitle,
          tone,
          companyAddress,
        });
        return res.json({
          success: true,
          format: "markdown",
          content: fallback,
          meta: { fallback: true, reason: "quota_exceeded" },
        });
      }
      throw err;
    }
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to generate cover letter",
    });
  }
};

export const generateInterviewQuestions = async (req, res) => {
  try {
    ensureKey();
    const { jobTitle, experienceLevel, jobDescription } = req.body || {};

    const prompt = `Generate a structured interview prep pack for a ${
      jobTitle || "role"
    } (${experienceLevel || "mid-level"}).
Include:
- roleSpecific: 8–10 items, each an object { question, answer, guidance }
- behavioral: 5–6 items, each an object { question, answer, guidance }
- tips: 3–5 concise strings tailored to Sierra Leone context
Guidelines:
- Answers must be professional and concise (60–90s when spoken), using STAR where appropriate.
- Guidance should teach the candidate how to approach the question (1–2 sentences).
- Do not fabricate company-specific data; keep examples generic unless provided.
Return strict JSON with keys: { roleSpecific, behavioral, tips }.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You prepare interview packs for job candidates in Sierra Leone.",
          },
          {
            role: "user",
            content: `${prompt}\n\nJob Description:\n${jobDescription || ""}`,
          },
        ],
        temperature: 0.25,
        max_tokens: 1200,
      });

      const content = completion.choices?.[0]?.message?.content || "{}";
      let data;
      try {
        data = JSON.parse(content);
      } catch {
        data = { raw: content };
      }
      return res.json({ success: true, data });
    } catch (err) {
      if (isQuotaError(err)) {
        const fallback = buildInterviewPack({ jobTitle, experienceLevel });
        return res.json({
          success: true,
          data: fallback,
          meta: { fallback: true, reason: "quota_exceeded" },
        });
      }
      throw err;
    }
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to generate interview prep",
    });
  }
};
