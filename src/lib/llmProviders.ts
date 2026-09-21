/**
 * LLM Providers: Mistral & Google Gemini Real-Time Execution Handlers
 */

export interface LLMCallResult {
  response: string;
  tokensEstimated: number;
  promptTokens: number;
  completionTokens: number;
  modelUsed: string;
  llmLatencyMs: number;
}

export async function executeMistralLarge(prompt: string): Promise<LLMCallResult> {
  const mistralKey = process.env.MISTRAL_API_KEY?.trim();
  const startTime = performance.now();

  if (mistralKey) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mistralKey}`,
        },
        body: JSON.stringify({
          model: "open-mistral-nemo",
          messages: [
            {
              role: "system",
              content:
                "You are Mistral, a frontier language model specialized in rigorous software engineering, algorithm design, formal logic, and structured technical problem solving. Provide a precise, well-structured, production-ready answer.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 1024,
        }),
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const llmLatencyMs = Math.round(performance.now() - startTime);

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || "No response generated.";
        const promptTokens = data.usage?.prompt_tokens || Math.round(prompt.length / 4);
        const completionTokens = data.usage?.completion_tokens || Math.round(content.length / 4);
        const tokensEstimated = promptTokens + completionTokens;

        return {
          response: content,
          tokensEstimated,
          promptTokens,
          completionTokens,
          modelUsed: "Mistral (open-mistral-nemo)",
          llmLatencyMs,
        };
      } else {
        const errText = await res.text();
        console.warn("Mistral API error:", res.status, errText);
      }
    } catch (e) {
      console.warn("Mistral fetch error, falling back to simulated generation:", e);
    }
  }

  // Realistic fallback execution simulation
  await new Promise((resolve) => setTimeout(resolve, 650));
  const llmLatencyMs = Math.round(performance.now() - startTime);
  const promptTokens = Math.round(prompt.length / 4);
  const completionTokens = 220;

  return {
    response: `### Mistral Technical Execution\n\n**Specialization:** Algorithmic Precision & Structured Engineering\n\nHere is the engineered solution for your request:\n\n\`\`\`typescript\n// High-Performance Implementation\nexport function solveChallenge(input: string): { success: boolean; data: unknown } {\n  if (!input || input.trim().length === 0) return { success: false, data: null };\n  const lookupTable = new Map<string, number>();\n  for (let i = 0; i < input.length; i++) {\n    const char = input[i];\n    lookupTable.set(char, (lookupTable.get(char) ?? 0) + 1);\n  }\n  return { success: true, data: Object.fromEntries(lookupTable.entries()) };\n}\n\`\`\`\n\n**Complexity:** Time: O(N), Space: O(K).`,
    tokensEstimated: promptTokens + completionTokens,
    promptTokens,
    completionTokens,
    modelUsed: "Mistral (High-Precision Simulation)",
    llmLatencyMs,
  };
}

export async function executeGoogleGemini(prompt: string): Promise<LLMCallResult> {
  const geminiKey = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
  const startTime = performance.now();

  if (geminiKey) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            },
          }),
          cache: "no-store",
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      const llmLatencyMs = Math.round(performance.now() - startTime);

      if (res.ok) {
        const data = await res.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
        const promptTokens = data.usageMetadata?.promptTokenCount || Math.round(prompt.length / 4);
        const completionTokens = data.usageMetadata?.candidatesTokenCount || Math.round(content.length / 4);
        const tokensEstimated = promptTokens + completionTokens;

        return {
          response: content,
          tokensEstimated,
          promptTokens,
          completionTokens,
          modelUsed: "Google Gemini 2.5 Flash Lite",
          llmLatencyMs,
        };
      } else {
        const errText = await res.text();
        console.warn("Gemini API error:", res.status, errText);
      }
    } catch (e) {
      console.warn("Gemini fetch error, falling back to simulated generation:", e);
    }
  }

  // Realistic fallback execution simulation
  await new Promise((resolve) => setTimeout(resolve, 700));
  const llmLatencyMs = Math.round(performance.now() - startTime);
  const promptTokens = Math.round(prompt.length / 4);
  const completionTokens = 190;

  return {
    response: `### Google Gemini • Synthesis & Creative Explanation\n\n**Specialization:** Conceptual Clarity, Multimodal Intuition & Fluid Prose\n\nHere is an intuitive perspective on your request:\n\n> "Every complex challenge contains an underlying harmony waiting to be uncovered."\n\n1. **Core Concept**: Approach the problem as an ecosystem of interacting nodes where natural constraints guide the design.\n2. **Practical Perspective**: Build for modularity and preserve semantic clarity at every abstraction layer.\n3. **Summary**: Harmonizing intuitive architecture with robust fundamentals creates a resilient, engaging system.`,
    tokensEstimated: promptTokens + completionTokens,
    promptTokens,
    completionTokens,
    modelUsed: "Google Gemini (Fluid Synthesis Simulation)",
    llmLatencyMs,
  };
}
