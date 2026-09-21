import { NextRequest, NextResponse } from "next/server";
import { routeWithJev } from "@/lib/jevRouter";
import { executeMistralLarge, executeGoogleGemini, LLMCallResult } from "@/lib/llmProviders";
import { calculateMetrics } from "@/lib/metrics";
import { PipelineEvent, PipelineExecutionResult } from "@/lib/types";
import { getSessionUser } from "@/lib/auth/session";
import { consumePrompt } from "@/lib/quota";
import { connectDb } from "@/lib/db";
import { PipelineHistory } from "@/models/PipelineHistory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // 1. Enforce Authentication
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in with Google to access the LLM pipeline." },
      { status: 401 }
    );
  }

  // 2. Enforce Prompt Quota Limit (5 requests per user)
  const quotaResult = await consumePrompt();
  if (!quotaResult.success) {
    return NextResponse.json(
      {
        error: quotaResult.error || "Prompt quota limit reached (5/5 requests used).",
        quota: quotaResult.quota,
      },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const prompt = (body.prompt || "").trim();

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendEvent = async (event: PipelineEvent) => {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    await writer.write(encoder.encode(data));
  };

  // Run pipeline asynchronously while streaming events
  (async () => {
    const startTime = performance.now();

    try {
      // 1. Initial Prompt Ingestion
      await sendEvent({
        step: "START",
        activeNode: "input",
        message: "Prompt ingested into LangGraph pipeline.",
        timestamp: Date.now(),
      });

      // 2. Jev Router Node
      await sendEvent({
        step: "ROUTING_START",
        activeNode: "router",
        message: "Jev System One evaluating safety (Noul/Score) & model specialization (Choice)...",
        timestamp: Date.now(),
      });

      const jevDecision = await routeWithJev(prompt);

      // 3. Routing Resolved: Check if blocked
      if (jevDecision.targetModel === "blocked") {
        const totalLatencyMs = Math.round(performance.now() - startTime);
        const promptTokens = Math.round(prompt.length / 4);
        const metrics = calculateMetrics({
          targetModel: "blocked",
          jevLatencyMs: jevDecision.latencyMs,
          llmLatencyMs: 0,
          totalLatencyMs,
          promptTokens,
          completionTokens: 0,
        });

        const blockedResult: PipelineExecutionResult = {
          prompt,
          jev: jevDecision,
          response: `⛔ **Request Blocked by Jev In-Path Security Firewall**\n\n**Reason:** ${jevDecision.reasoning}\n\n*Threat Analysis:*\n- Jailbreak Probability: **${(jevDecision.safety.jailbreakProb * 100).toFixed(0)}%**\n- Severity Rating: **${jevDecision.safety.severityScore.toFixed(1)} / 3.0**\n\nThis request was stopped before invoking downstream LLMs.`,
          modelUsed: "Jev Security Firewall",
          tokensEstimated: promptTokens,
          totalLatencyMs,
          isBlocked: true,
          blockReason: jevDecision.reasoning,
          metrics,
        };

        await sendEvent({
          step: "BLOCKED",
          activeNode: "security",
          targetModel: "blocked",
          data: blockedResult,
          message: "Critical safety hazard detected. Request routed to Security Block.",
          timestamp: Date.now(),
        });

        // Save blocked execution to MongoDB History
        try {
          await connectDb();
          await PipelineHistory.create({
            userId: user.id,
            userEmail: user.email,
            userName: user.name,
            prompt,
            response: blockedResult.response,
            modelUsed: blockedResult.modelUsed,
            targetModel: "blocked",
            isBlocked: true,
            blockReason: jevDecision.reasoning,
            totalLatencyMs,
            tokensEstimated: promptTokens,
          });
        } catch (dbErr) {
          console.warn("[Pipeline] Failed to save blocked history:", dbErr);
        }

        return;
      }

      const activeTargetNode = jevDecision.targetModel === "mistral_large" ? "mistral" : "gemini";
      await sendEvent({
        step: "ROUTED",
        activeNode: activeTargetNode,
        targetModel: jevDecision.targetModel,
        data: { jev: jevDecision },
        message: `Jev routed to ${jevDecision.targetModel === "mistral_large" ? "Mistral" : "Google Gemini"} (${(jevDecision.confidence * 100).toFixed(0)}% confidence).`,
        timestamp: Date.now(),
      });

      // 4. Execute Selected LLM
      await sendEvent({
        step: "EXECUTING_LLM",
        activeNode: activeTargetNode,
        targetModel: jevDecision.targetModel,
        message: `Executing ${jevDecision.targetModel === "mistral_large" ? "Mistral" : "Google Gemini"}...`,
        timestamp: Date.now(),
      });

      let llmResult: LLMCallResult;

      if (jevDecision.targetModel === "mistral_large") {
        llmResult = await executeMistralLarge(prompt);
      } else {
        llmResult = await executeGoogleGemini(prompt);
      }

      const totalLatencyMs = Math.round(performance.now() - startTime);
      const metrics = calculateMetrics({
        targetModel: jevDecision.targetModel,
        jevLatencyMs: jevDecision.latencyMs,
        llmLatencyMs: llmResult.llmLatencyMs,
        totalLatencyMs,
        promptTokens: llmResult.promptTokens,
        completionTokens: llmResult.completionTokens,
      });

      const finalResult: PipelineExecutionResult = {
        prompt,
        jev: jevDecision,
        response: llmResult.response,
        modelUsed: llmResult.modelUsed,
        tokensEstimated: llmResult.tokensEstimated,
        totalLatencyMs,
        isBlocked: false,
        metrics,
      };

      // 5. Completed & Formatted
      await sendEvent({
        step: "COMPLETED",
        activeNode: "output",
        targetModel: jevDecision.targetModel,
        data: finalResult,
        message: `Pipeline completed in ${totalLatencyMs}ms. Output synthesized.`,
        timestamp: Date.now(),
      });

      // Save successful execution to MongoDB History
      try {
        await connectDb();
        await PipelineHistory.create({
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          prompt,
          response: finalResult.response,
          modelUsed: finalResult.modelUsed,
          targetModel: jevDecision.targetModel,
          confidence: jevDecision.confidence,
          isBlocked: false,
          totalLatencyMs,
          tokensEstimated: finalResult.tokensEstimated,
          metrics: {
            actualCostUsd: metrics.actualCostUsd,
            baselineUnroutedCostUsd: metrics.baselineUnroutedCostUsd,
            costSavingsPercent: metrics.costSavingsPercent,
            promptTokens: metrics.promptTokens,
            completionTokens: metrics.completionTokens,
          },
        });
      } catch (dbErr) {
        console.warn("[Pipeline] Failed to save completed history:", dbErr);
      }
    } catch (err: unknown) {
      console.error("Pipeline streaming error:", err);
      const errorMessage = err instanceof Error ? err.message : "Pipeline execution failed";
      await sendEvent({
        step: "BLOCKED",
        activeNode: "security",
        message: `Pipeline Error: ${errorMessage}`,
        timestamp: Date.now(),
      });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
