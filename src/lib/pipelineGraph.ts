import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { JevOutputGuardDecision, JevRoutingDecision, JevSafetyDecision, PipelineExecutionResult } from "./types";
import { checkSafetyWithJev, guardOutputWithJev, routeWithJev } from "./jevRouter";
import { executeMistralLarge, executeGoogleGemini } from "./llmProviders";
import { calculateMetrics } from "./metrics";

/**
 * 1. Define LangGraph State Schema
 */
export const PipelineStateAnnotation = Annotation.Root({
  prompt: Annotation<string>(),
  safety: Annotation<JevSafetyDecision | undefined>(),
  jev: Annotation<JevRoutingDecision>(),
  response: Annotation<string>(),
  modelUsed: Annotation<string>(),
  tokensEstimated: Annotation<number>(),
  totalLatencyMs: Annotation<number>(),
  isBlocked: Annotation<boolean>(),
  blockReason: Annotation<string>(),
  outputGuard: Annotation<JevOutputGuardDecision | undefined>(),
  startTime: Annotation<number>(),
});

export type PipelineStateType = typeof PipelineStateAnnotation.State;

/**
 * 2. Define Graph Nodes
 */

// Node 1: Upfront Jailbreak & Safety Firewall (Screens prompt BEFORE router)
async function firewallNode(state: PipelineStateType): Promise<Partial<PipelineStateType>> {
  const safety = await checkSafetyWithJev(state.prompt);
  return { safety };
}

// Node 2: Security Wall (Stopped at Firewall)
async function securityBlockedNode(state: PipelineStateType): Promise<Partial<PipelineStateType>> {
  const safety = state.safety;
  const reason = safety?.reasoning || "Request flagged by Jev In-Path Security Firewall.";
  const jailbreakPct = Math.round((safety?.jailbreakProb ?? 0) * 100);
  const explicitPct = Math.round((safety?.explicitProb ?? 0) * 100);
  const harmfulPct = Math.round((safety?.harmfulProb ?? 0) * 100);
  const severity = safety?.severityScore ?? 0;

  return {
    response: `⛔ **Request Blocked by Jev In-Path Security Firewall**\n\n**Reason:** ${reason}\n\n*Threat Analysis:*\n- Jailbreak Risk: **${jailbreakPct}%**\n- Explicit / NSFW Risk: **${explicitPct}%**\n- Harmful Action Risk: **${harmfulPct}%**\n- Severity Rating: **${severity.toFixed(1)} / 3.0**\n\nThis request was intercepted upfront before dispatching to downstream LLMs.`,
    modelUsed: "Jev Security Firewall",
    tokensEstimated: 0,
    isBlocked: true,
    blockReason: reason,
  };
}

// Node 3: Jev System One Router (Dispatches verified safe prompts)
async function jevRouterNode(state: PipelineStateType): Promise<Partial<PipelineStateType>> {
  const jevDecision = await routeWithJev(state.prompt, state.safety);
  return {
    jev: jevDecision,
  };
}

// Node 4a: Mistral Large Executor (Code / Technical / Architecture)
async function mistralExecutorNode(state: PipelineStateType): Promise<Partial<PipelineStateType>> {
  const { response, tokensEstimated, modelUsed } = await executeMistralLarge(state.prompt);
  return {
    response,
    modelUsed,
    tokensEstimated,
    isBlocked: false,
  };
}

// Node 4b: Google Gemini Executor (General / Synthesis / Creative)
async function geminiExecutorNode(state: PipelineStateType): Promise<Partial<PipelineStateType>> {
  const { response, tokensEstimated, modelUsed } = await executeGoogleGemini(state.prompt);
  return {
    response,
    modelUsed,
    tokensEstimated,
    isBlocked: false,
  };
}

// Node 5: Jev Output Guard — Evaluates generated answers independently
async function outputGuardNode(state: PipelineStateType): Promise<Partial<PipelineStateType>> {
  const outputGuard = await guardOutputWithJev(state.prompt, state.response);
  return { outputGuard };
}

async function outputBlockedNode(state: PipelineStateType): Promise<Partial<PipelineStateType>> {
  const reason = state.outputGuard?.reasoning || "Generated output did not pass output safety verification.";
  return {
    response: "⛔ **Response withheld by Jev Output Guard**\n\nThe generated answer contained potential safety hazards or sensitive credentials and was withheld.",
    modelUsed: "Jev Output Guard",
    isBlocked: true,
    blockReason: reason,
  };
}

// Node 6: Formatter & Final Assembly
async function formatterNode(state: PipelineStateType): Promise<Partial<PipelineStateType>> {
  const totalLatencyMs = Math.round(performance.now() - (state.startTime || performance.now()));
  return {
    totalLatencyMs,
  };
}

/**
 * 3. Conditional Routing Functions
 */
function routeAfterFirewall(state: PipelineStateType): "securityBlocked" | "jevRouter" {
  if (state.safety && !state.safety.isSafe) {
    return "securityBlocked";
  }
  return "jevRouter";
}

function routeByJevDecision(state: PipelineStateType): "mistralExecutor" | "geminiExecutor" {
  if (state.jev?.targetModel === "mistral_large") {
    return "mistralExecutor";
  }
  return "geminiExecutor";
}

function routeAfterOutputGuard(state: PipelineStateType): "formatter" | "outputBlocked" {
  return state.outputGuard?.allowed ? "formatter" : "outputBlocked";
}

/**
 * 4. Assemble and Compile LangGraph Pipeline
 */
export const pipelineGraph = new StateGraph(PipelineStateAnnotation)
  .addNode("firewall", firewallNode)
  .addNode("securityBlocked", securityBlockedNode)
  .addNode("jevRouter", jevRouterNode)
  .addNode("mistralExecutor", mistralExecutorNode)
  .addNode("geminiExecutor", geminiExecutorNode)
  .addNode("outputGuard", outputGuardNode)
  .addNode("outputBlocked", outputBlockedNode)
  .addNode("formatter", formatterNode)
  // Edges:
  // Step 1 -> Step 2 (Firewall)
  .addEdge(START, "firewall")
  // Step 2 conditional: Hazardous -> Security Blocked | Safe -> Jev Router
  .addConditionalEdges("firewall", routeAfterFirewall, {
    securityBlocked: "securityBlocked",
    jevRouter: "jevRouter",
  })
  // Step 3 conditional: Mistral vs Gemini
  .addConditionalEdges("jevRouter", routeByJevDecision, {
    mistralExecutor: "mistralExecutor",
    geminiExecutor: "geminiExecutor",
  })
  // Step 4: LLMs -> Output Guard
  .addEdge("mistralExecutor", "outputGuard")
  .addEdge("geminiExecutor", "outputGuard")
  // Step 5: Output Guard verification
  .addConditionalEdges("outputGuard", routeAfterOutputGuard, {
    formatter: "formatter",
    outputBlocked: "outputBlocked",
  })
  .addEdge("outputBlocked", "formatter")
  .addEdge("securityBlocked", "formatter")
  .addEdge("formatter", END)
  .compile();

/**
 * Helper to run the pipeline end-to-end
 */
export async function runPipeline(prompt: string): Promise<PipelineExecutionResult> {
  const startTime = performance.now();
  const result = await pipelineGraph.invoke({
    prompt,
    startTime,
    isBlocked: false,
    response: "",
    modelUsed: "",
    tokensEstimated: 0,
    totalLatencyMs: 0,
    blockReason: "",
    outputGuard: undefined,
    safety: undefined,
    jev: {
      targetModel: "gemini_flash_pro",
      confidence: 0,
      probabilities: { mistral_large: 0, gemini_flash_pro: 0 },
      safety: { isSafeProb: 1, jailbreakProb: 0, severityScore: 0 },
      reasoning: "",
      latencyMs: 0,
    },
  });

  const promptTokens = Math.round(result.prompt.length / 4);
  const completionTokens = Math.max(0, result.tokensEstimated - promptTokens);
  const metrics = calculateMetrics({
    targetModel: result.jev.targetModel,
    jevLatencyMs: (result.safety?.latencyMs ?? 0) + result.jev.latencyMs,
    llmLatencyMs: Math.max(0, result.totalLatencyMs - result.jev.latencyMs - (result.safety?.latencyMs ?? 0)),
    totalLatencyMs: result.totalLatencyMs,
    promptTokens,
    completionTokens,
  });

  return {
    prompt: result.prompt,
    safety: result.safety,
    jev: result.jev,
    response: result.response,
    modelUsed: result.modelUsed,
    tokensEstimated: result.tokensEstimated,
    totalLatencyMs: result.totalLatencyMs,
    isBlocked: result.isBlocked,
    blockReason: result.blockReason,
    outputGuard: result.outputGuard,
    metrics,
  };
}
