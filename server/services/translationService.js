import axios from "axios";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

class TranslationService {
  constructor() {
    // For demo purposes, we'll use a free translation service
    // In production, you should use Google Translate API with proper authentication
    this.baseUrl = "https://api.mymemory.translated.net/get";
  }

  // Detect language of text
  async detectLanguage(text) {
    try {
      // Simple language detection based on common Krio words
      const krioWords = [
        "na",
        "de",
        "don",
        "bin",
        "go",
        "come",
        "make",
        "sabi",
        "no",
        "yes",
        "small",
        "big",
        "good",
        "bad",
        "time",
        "day",
        "night",
        "work",
        "money",
        "house",
        "car",
        "food",
        "water",
        "people",
        "man",
        "woman",
        "child",
        "family",
        "friend",
        "help",
        "give",
        "take",
        "see",
        "hear",
        "talk",
        "walk",
        "run",
        "sleep",
        "eat",
        "drink",
        "buy",
        "sell",
        "open",
        "close",
      ];

      const words = text.toLowerCase().split(/\s+/);
      const krioWordCount = words.filter((word) =>
        krioWords.includes(word)
      ).length;
      const krioPercentage = (krioWordCount / words.length) * 100;

      return krioPercentage > 30 ? "krio" : "en";
    } catch (error) {
      console.error("Error detecting language:", error);
      return "en"; // Default to English
    }
  }

  // Translate text from one language to another
  async translateText(text, fromLang, toLang) {
    try {
      if (!text || text.trim() === "") {
        return text;
      }

      // Use OpenAI for robust English-to-Krio translation
      if (fromLang === "en" && toLang === "krio") {
        try {
          const prompt = `Translate the following job posting into Sierra Leone Krio. Use natural, conversational Krio that is easy to understand for non-English speakers.\n\n${text}`;
          const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1500,
            temperature: 0.3,
          });
          const krioText = completion.choices[0].message.content.trim();
          return krioText;
        } catch (err) {
          console.error(
            "OpenAI Krio translation failed, falling back:",
            err.message
          );
          // Fallback to old method below
        }
      }

      // Map our language codes to MyMemory API codes
      const langMap = {
        en: "en",
        krio: "en", // MyMemory doesn't support Krio directly, so we'll use English as base
      };

      const fromCode = langMap[fromLang] || "en";
      const toCode = langMap[toLang] || "en";

      // For demo purposes, we'll implement a simple Krio-English translation
      if (fromLang === "krio" && toLang === "en") {
        return this.translateKrioToEnglish(text);
      } else if (fromLang === "en" && toLang === "krio") {
        return this.translateEnglishToKrio(text);
      }

      // Use MyMemory API for other translations
      const response = await axios.get(this.baseUrl, {
        params: {
          q: text,
          langpair: `${fromCode}|${toCode}`,
        },
      });

      if (response.data && response.data.responseData) {
        return response.data.responseData.translatedText;
      }

      return text; // Return original text if translation fails
    } catch (error) {
      console.error("Translation error:", error);
      return text; // Return original text if translation fails
    }
  }

  // Simple Krio to English translation (basic implementation)
  translateKrioToEnglish(text) {
    const translations = {
      na: "is/are",
      de: "there/here",
      don: "have/has",
      bin: "was/were",
      go: "will",
      come: "come",
      make: "let/make",
      sabi: "know",
      no: "no",
      yes: "yes",
      small: "small",
      big: "big",
      good: "good",
      bad: "bad",
      time: "time",
      day: "day",
      night: "night",
      work: "work",
      money: "money",
      house: "house",
      car: "car",
      food: "food",
      water: "water",
      people: "people",
      man: "man",
      woman: "woman",
      child: "child",
      family: "family",
      friend: "friend",
      help: "help",
      give: "give",
      take: "take",
      see: "see",
      hear: "hear",
      talk: "talk",
      walk: "walk",
      run: "run",
      sleep: "sleep",
      eat: "eat",
      drink: "drink",
      buy: "buy",
      sell: "sell",
      open: "open",
      close: "close",
    };

    let translatedText = text;
    Object.keys(translations).forEach((krioWord) => {
      const regex = new RegExp(`\\b${krioWord}\\b`, "gi");
      translatedText = translatedText.replace(regex, translations[krioWord]);
    });

    return translatedText;
  }

  // Comprehensive English to Krio translation for job portal context
  translateEnglishToKrio(text) {
    if (!text || text.trim() === "") {
      return text;
    }

    let translatedText = text;

    // First, handle HTML tags and preserve them
    const htmlTags = [];
    let tagIndex = 0;
    translatedText = translatedText.replace(/<[^>]*>/g, (match) => {
      htmlTags.push(match);
      return `__HTML_TAG_${tagIndex++}__`;
    });

    // Comprehensive phrase replacements for job portal context
    const phraseReplacements = [
      // Job-related phrases
      { en: "job description", krio: "tori for dis wok" },
      { en: "job title", krio: "name for di wok" },
      { en: "job posting", krio: "wok we dem post" },
      { en: "job opportunity", krio: "chans fo wok" },
      { en: "job position", krio: "posishon fo wok" },
      { en: "job role", krio: "wetin yu go dae do" },
      { en: "job summary", krio: "smɔl tori for di wok" },
      { en: "job type", krio: "kain wok" },
      { en: "key responsibilities", krio: "important tin dem we yu go dae do" },
      { en: "requirements", krio: "tin dem we yu fo get" },
      { en: "preferred qualifications", krio: "buk dem we go help yu" },
      { en: "we are seeking", krio: "wi dae luk fo" },
      { en: "we are looking for", krio: "wi dae luk fo" },
      { en: "the ideal candidate", krio: "di pesin we wi want" },
      { en: "the successful candidate", krio: "di pesin we go get di wok" },
      { en: "candidate should", krio: "di pesin fo" },
      { en: "candidate must", krio: "di pesin mus" },
      { en: "candidate will", krio: "di pesin go" },
      { en: "proven experience", krio: "wok experience we yu don do" },
      { en: "strong problem-solving skills", krio: "sabii fo solv problem" },
      { en: "attention to detail", krio: "sabii fo check tin dem well" },
      { en: "ability to work independently", krio: "sabii fo wok alone" },
      { en: "ability to work in a team", krio: "sabii fo wok wit odas" },
      {
        en: "cross-browser compatibility",
        krio: "sabii fo make tin work na all browser",
      },
      { en: "mobile responsiveness", krio: "sabii fo make tin work na phone" },
      { en: "fast load times", krio: "sabii fo make tin load quick" },
      { en: "security best practices", krio: "sabii fo make tin safe" },
      { en: "data protection measures", krio: "sabii fo protect data" },
      { en: "emerging web technologies", krio: "new tin dem we de come" },
      { en: "industry trends", krio: "new tin dem we de happen" },
      { en: "version control", krio: "sabii fo save tin dem" },
      { en: "cloud services", krio: "tin dem we de na internet" },
      { en: "e-commerce solutions", krio: "tin dem fo sell tin na internet" },
      { en: "full-time", krio: "full tem wok" },
      { en: "part-time", krio: "pat tem wok" },
      { en: "contract", krio: "kontrakt wok" },
      { en: "remote", krio: "wok na os" },
      { en: "on-site", krio: "wok na di ofis" },
      { en: "hybrid", krio: "wok na os en na ofis" },
      { en: "web developer", krio: "pesin we sabii make website" },
      { en: "web development", krio: "making website" },
      { en: "front-end", krio: "di part we pipul de see" },
      { en: "back-end", krio: "di part we no de see" },
      { en: "user-friendly", krio: "easy fo use" },
      { en: "visually appealing", krio: "fine fo see" },
      { en: "digital experiences", krio: "tin dem we de happen na computer" },
      { en: "modern frameworks", krio: "new tin dem we de help make website" },
      {
        en: "server-side applications",
        krio: "tin dem we de work na computer",
      },
      { en: "seamless functionality", krio: "tin we de work well" },
      { en: "existing codebases", krio: "tin dem we don write before" },
      { en: "portfolio", krio: "tin dem we yu don do before" },
      { en: "github links", krio: "link dem we show tin we yu don do" },
      { en: "cms platforms", krio: "tin dem we de help make website" },
      { en: "restful apis", krio: "tin dem we de help computer talk" },
      { en: "devops basics", krio: "sabii fo make tin work well" },
      { en: "let me know", krio: "tok wit mi" },
      { en: "if you'd like", krio: "if yu want" },
      { en: "any adjustments", krio: "any change" },
    ];

    // Word-based replacements for job portal
    const englishToKrio = {
      is: "nah",
      are: "nah",
      was: "bin",
      were: "bin",
      will: "go",
      job: "wok",
      work: "wok",
      company: "kompani",
      posted: "post",
      by: "ba",
      for: "fo",
      month: "mont",
      description: "tori",
      requirement: "tin we yu fo get",
      requirements: "tin dem we yu fo get",
      apply: "aplay",
      salary: "moni",
      experience: "wok experience",
      skill: "sabii",
      skills: "sabii dem",
      benefit: "gain",
      benefits: "wetin yu go gain",
      full: "full",
      part: "pat",
      contract: "kontrakt",
      internship: "intern",
      deadline: "di last day",
      location: "side",
      position: "posishon",
      category: "kain wok",
      level: "level",
      junior: "small man",
      senior: "big man",
      manager: "oga",
      assistant: "bɔbɔ",
      remote: "wok na os",
      onsite: "wok na di ofis",
      urgent: "quick wan",
      and: "en",
      or: "ɔ",
      with: "wit",
      must: "mus",
      should: "fɔ",
      have: "get",
      has: "get",
      good: "bɛtɛ",
      excellent: "fayn",
      knowledge: "sabii",
      education: "buk",
      degree: "digrí",
      diploma: "diploma",
      certificate: "satiket",
      university: "yunivasiti",
      school: "skul",
      develop: "develop",
      maintain: "maintain",
      design: "design",
      build: "build",
      optimize: "betɛ",
      ensure: "make sure",
      collaborate: "wok wit",
      troubleshoot: "solv problem",
      debug: "solv problem",
      improve: "betɛ",
      implement: "use",
      stay: "stay",
      updated: "updated",
      seeking: "luk fo",
      skilled: "sabii",
      developer: "pesin we sabii make tin",
      high: "high",
      quality: "quality",
      websites: "website dem",
      applications: "application dem",
      expertise: "sabii",
      technologies: "tin dem",
      responsive: "responsive",
      user: "user",
      friendly: "friendly",
      appealing: "appealing",
      digital: "digital",
      experiences: "experience dem",
      key: "important",
      responsibilities: "wetin yu go dae do",
      responsibility: "wetin yu go dae do",
      html: "html",
      css: "css",
      javascript: "javascript",
      react: "react",
      angular: "angular",
      vue: "vue",
      server: "server",
      side: "side",
      applications: "application dem",
      php: "php",
      python: "python",
      node: "node",
      js: "js",
      ruby: "ruby",
      cross: "cross",
      browser: "browser",
      compatibility: "compatibility",
      mobile: "mobile",
      responsiveness: "responsiveness",
      fast: "quick",
      load: "load",
      times: "time dem",
      designers: "designer dem",
      ux: "ux",
      specialists: "specialist dem",
      other: "oda",
      developers: "developer dem",
      deliver: "gi",
      seamless: "seamless",
      functionality: "functionality",
      existing: "existing",
      codebases: "codebase dem",
      security: "security",
      best: "best",
      practices: "practice dem",
      data: "data",
      protection: "protection",
      measures: "measure dem",
      emerging: "emerging",
      web: "web",
      industry: "industry",
      trends: "trend dem",
      proven: "proven",
      portfolio: "portfolio",
      github: "github",
      links: "link dem",
      preferred: "preferred",
      proficiency: "sabii",
      html5: "html5",
      css3: "css3",
      sql: "sql",
      familiarity: "sabii small",
      cms: "cms",
      platforms: "platform dem",
      wordpress: "wordpress",
      shopify: "shopify",
      plus: "plus",
      strong: "strong",
      problem: "problem",
      solving: "solving",
      attention: "attention",
      detail: "detail",
      ability: "ability",
      work: "wok",
      independently: "independently",
      team: "team",
      qualifications: "qualification dem",
      qualification: "qualification",
      restful: "restful",
      apis: "api dem",
      api: "api",
      version: "version",
      control: "control",
      git: "git",
      devops: "devops",
      basics: "basic dem",
      cloud: "cloud",
      services: "service dem",
      aws: "aws",
      azure: "azure",
      ecommerce: "ecommerce",
      solutions: "solution dem",
      solution: "solution",
      type: "type",
      summary: "summary",
      preferred: "preferred",
      let: "let",
      know: "know",
      like: "like",
      any: "any",
      adjustments: "adjustment dem",
      adjustment: "adjustment",
    };

    // Phrase-based replacements first
    phraseReplacements.forEach(({ en, krio }) => {
      const regex = new RegExp(en, "gi");
      translatedText = translatedText.replace(regex, krio);
    });

    // Word-for-word replacements
    Object.keys(englishToKrio).forEach((englishWord) => {
      const regex = new RegExp(`\\b${englishWord}\\b`, "gi");
      translatedText = translatedText.replace(
        regex,
        englishToKrio[englishWord]
      );
    });

    // Always use "nah" for "is/are" and never "na"
    translatedText = translatedText.replace(/\bna\b/gi, "nah");

    // Restore HTML tags
    translatedText = translatedText.replace(
      /__HTML_TAG_(\d+)__/g,
      (match, idx) => htmlTags[idx] || match
    );

    return translatedText;
  }

  // Translate job posting
  async translateJob(jobData) {
    try {
      const { title, description, originalLanguage } = jobData;

      // Detect language if not specified
      const detectedLang =
        originalLanguage ||
        (await this.detectLanguage(title + " " + description));

      let translatedTitle, translatedDescription;

      if (detectedLang === "krio") {
        // Translate from Krio to English
        translatedTitle = await this.translateText(title, "krio", "en");
        translatedDescription = await this.translateText(
          description,
          "krio",
          "en"
        );

        return {
          originalLanguage: "krio",
          titleKrio: title,
          descriptionKrio: description,
          titleEnglish: translatedTitle,
          descriptionEnglish: translatedDescription,
          translationStatus: "completed",
          translationTimestamp: new Date(),
        };
      } else {
        // Translate from English to Krio
        translatedTitle = await this.translateText(title, "en", "krio");
        translatedDescription = await this.translateText(
          description,
          "en",
          "krio"
        );

        return {
          originalLanguage: "en",
          titleEnglish: title,
          descriptionEnglish: description,
          titleKrio: translatedTitle,
          descriptionKrio: translatedDescription,
          translationStatus: "completed",
          translationTimestamp: new Date(),
        };
      }
    } catch (error) {
      console.error("Error translating job:", error);
      return {
        originalLanguage: jobData.originalLanguage || "en",
        translationStatus: "failed",
        translationTimestamp: new Date(),
      };
    }
  }
}

export default new TranslationService();
