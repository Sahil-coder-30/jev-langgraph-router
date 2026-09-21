import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { JevRoutingDecision, PipelineExecutionResult, TargetModel } from "./types";
import { routeWithJev } from "./jevRouter";
import { executeMistralLarge, executeGoogleGemini } from "./llmProviders";
import { calculateMetrics } from "./metrics";

/**
 * 1. Define LangGraph State Schema
 */
export const PipelineStateAnnotation = Annotation.Root({
  prompt: Annotation<string>(),
  jev: Annotation<JevRoutingDecision>(),
  response: Annotation<string>(),
  modelUsed: Annotation<string>(),
  tokensEstimated: Annotation<number>(),
  totalLatencyMs: Annotation<number>(),
  isBlocked: Annotation<boolean>(),
  blockReason: Annotation<string>(),
  startTime: Annotation<number>(),
});

export type PipelineStateType = typeof PipelineStateAnnotation.State;

/**
 * 2. Define Graph Nodes
 */

// Node: Jev System One Router
async function jevRouterNode(state: PipelineStateType): Promise<Partial<PipelineStateType>> {
  const jevDecision = await routeWithJev(state.prompt);
  return {
    jev: jevDecision,
  };
}

// Node: Mistral Large Executor
async function mistralExecutorNode(state: PipelineStateType): Promise<Partial<PipelineStateType>> {
  const { response, tokensEstimated, modelUsed } = await executeMistralLarge(state.prompt);
  return {
    response,
    modelUsed,
    tokensEstimated,
    isBlocked: false,
  };
}

// Node: Google Gemini Executor
async function geminiExecutorNode(state: PipelineStateType): Promise<Partial<PipelineStateType>> {
  const { response, tokensEstimated, modelUsed } = await executeGoogleGemini(state.prompt);
  return {
    response,
    modelUsed,
    tokensEstimated,
    isBlocked: false,
  };
}

// Node: Security Wall (Jev Policy Violation)
async function securityBlockedNode(state: PipelineStateType): Promise<Partial<PipelineStateType>> {
  const reason = state.jev?.reasoning || "Request flagged by Jev AI Security Boundary.";
  return {
    response: `⛔ **Request Blocked by Jev In-Path Security Firewall**\n\n**Reason:** ${reason}\n\n*Threat Analysis:*\n- Jailbreak Probability: **${((state.jev?.safety.jailbreakProb ?? 0) * 100).toFixed(0)}%**\n- Severity Rating: **${(state.jev?.safety.severityScore ?? 0).toFixed(1)} / 3.0**\n\nThis request was stopped before invoking downstream LLMs.`,
    modelUsed: "Jev Security Firewall",
    tokensEstimated: 0,
    isBlocked: true,
    blockReason: reason,
  };
}

// Node: Formatter & Final Assembly
async function formatterNode(state: PipelineStateType): Promise<Partial<PipelineStateType>> {
  const totalLatencyMs = Math.round(performance.now() - (state.startTime || performance.now()));
  return {
    totalLatencyMs,
  };
}

/**
 * 3. Conditional Routing Function
 */
function routeByJevDecision(state: PipelineStateType): "mistralExecutor" | "geminiExecutor" | "securityBlocked" {
  const target = state.jev?.targetModel;
  if (target === "blocked") {
    return "securityBlocked";
  }
  if (target === "mistral_large") {
    return "mistralExecutor";
  }
  return "geminiExecutor";
}

/**
 * 4. Assemble and Compile LangGraph
 */
export const pipelineGraph = new StateGraph(PipelineStateAnnotation)
  .addNode("jevRouter", jevRouterNode)
  .addNode("mistralExecutor", mistralExecutorNode)
  .addNode("geminiExecutor", geminiExecutorNode)
  .addNode("securityBlocked", securityBlockedNode)
  .addNode("formatter", formatterNode)
  // Edges
  .addEdge(START, "jevRouter")
  .addConditionalEdges("jevRouter", routeByJevDecision, {
    mistralExecutor: "mistralExecutor",
    geminiExecutor: "geminiExecutor",
    securityBlocked: "securityBlocked",
  })
  .addEdge("mistralExecutor", "formatter")
  .addEdge("geminiExecutor", "formatter")
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
    jevLatencyMs: result.jev.latencyMs,
    llmLatencyMs: Math.max(0, result.totalLatencyMs - result.jev.latencyMs),
    totalLatencyMs: result.totalLatencyMs,
    promptTokens,
    completionTokens,
  });

  return {
    prompt: result.prompt,
    jev: result.jev,
    response: result.response,
    modelUsed: result.modelUsed,
    tokensEstimated: result.tokensEstimated,
    totalLatencyMs: result.totalLatencyMs,
    isBlocked: result.isBlocked,
    blockReason: result.blockReason,
    metrics,
  };
}
