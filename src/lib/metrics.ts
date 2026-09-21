import { ExecutionMetrics, TargetModel } from "./types";

/**
 * Pricing Constants (per 1M tokens in USD)
 */
const PRICING = {
  // Baseline: Unrouted Heavyweight Frontier Model (e.g. GPT-4o / Claude 3.5 Sonnet / Mistral Large)
  baselineFrontier: {
    inputPer1M: 3.0,
    outputPer1M: 15.0,
  },
  // TypeSafe Jev System One Evaluation
  jevRouter: {
    fixedCostPerQuery: 0.00004, // ~100x cheaper than LLM generation
  },
  // Google Gemini 2.5 Flash Lite
  geminiFlash: {
    inputPer1M: 0.075,
    outputPer1M: 0.30,
  },
  // Mistral Open-Nemo / Small
  mistralModel: {
    inputPer1M: 0.15,
    outputPer1M: 0.60,
  },
};

export function calculateMetrics(params: {
  targetModel: TargetModel;
  jevLatencyMs: number;
  llmLatencyMs: number;
  totalLatencyMs: number;
  promptTokens: number;
  completionTokens: number;
}): ExecutionMetrics {
  const { targetModel, jevLatencyMs, llmLatencyMs, totalLatencyMs, promptTokens, completionTokens } = params;
  const totalTokens = promptTokens + completionTokens;

  // 1. Baseline Cost (if routed to an expensive unrouted frontier model)
  const baselineUnroutedCostUsd =
    (promptTokens / 1_000_000) * PRICING.baselineFrontier.inputPer1M +
    (completionTokens / 1_000_000) * PRICING.baselineFrontier.outputPer1M;

  // 2. Actual Pipeline Cost
  let llmCostUsd = 0;

  if (targetModel === "gemini_flash_pro") {
    llmCostUsd =
      (promptTokens / 1_000_000) * PRICING.geminiFlash.inputPer1M +
      (completionTokens / 1_000_000) * PRICING.geminiFlash.outputPer1M;
  } else if (targetModel === "mistral_large") {
    llmCostUsd =
      (promptTokens / 1_000_000) * PRICING.mistralModel.inputPer1M +
      (completionTokens / 1_000_000) * PRICING.mistralModel.outputPer1M;
  } else {
    // Blocked: Downstream LLM was completely avoided!
    llmCostUsd = 0;
  }

  const actualCostUsd = PRICING.jevRouter.fixedCostPerQuery + llmCostUsd;
  const costSavingsUsd = Math.max(0, baselineUnroutedCostUsd - actualCostUsd);
  const costSavingsPercent = baselineUnroutedCostUsd > 0 ? (costSavingsUsd / baselineUnroutedCostUsd) * 100 : 0;
  const overheadLatencyMs = Math.max(0, totalLatencyMs - (jevLatencyMs + llmLatencyMs));

  return {
    jevLatencyMs,
    llmLatencyMs,
    totalLatencyMs,
    overheadLatencyMs,
    promptTokens,
    completionTokens,
    totalTokens,
    actualCostUsd: Number(actualCostUsd.toFixed(6)),
    baselineUnroutedCostUsd: Number(baselineUnroutedCostUsd.toFixed(6)),
    costSavingsUsd: Number(costSavingsUsd.toFixed(6)),
    costSavingsPercent: Number(costSavingsPercent.toFixed(1)),
  };
}
