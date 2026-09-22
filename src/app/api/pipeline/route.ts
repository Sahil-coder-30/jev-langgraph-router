import { NextRequest, NextResponse } from "next/server";
import { checkSafetyWithJev, guardOutputWithJev, routeWithJev } from "@/lib/jevRouter";
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

  const body = await req.json().catch(() => ({}));
  const prompt = (body.prompt || "").trim();

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }
  if (prompt.length > 4000) {
    return NextResponse.json(
      { error: "Please keep prompts to 4,000 characters or fewer." },
      { status: 400 }
    );
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

      // 2. Upfront Jailbreak & Safety Firewall Node (Before Router!)
      await sendEvent({
        step: "FIREWALL_START",
        activeNode: "firewall",
        message: "Jev In-Path Security Firewall analyzing prompt for jailbreaks, explicit content, and threats...",
        timestamp: Date.now(),
      });

      const safety = await checkSafetyWithJev(prompt);

      // Check if blocked by Safety Firewall
      if (!safety.isSafe) {
        const totalLatencyMs = Math.round(performance.now() - startTime);
        const promptTokens = Math.round(prompt.length / 4);
        const metrics = calculateMetrics({
          targetModel: "blocked",
          jevLatencyMs: safety.latencyMs,
          llmLatencyMs: 0,
          totalLatencyMs,
          promptTokens,
          completionTokens: 0,
        });

        const jailbreakPct = Math.round(safety.jailbreakProb * 100);
        const explicitPct = Math.round(safety.explicitProb * 100);
        const harmfulPct = Math.round(safety.harmfulProb * 100);

        const blockedResult: PipelineExecutionResult = {
          prompt,
          safety,
          jev: {
            targetModel: "blocked",
            confidence: Math.max(safety.jailbreakProb, safety.explicitProb, safety.harmfulProb),
            probabilities: { mistral_large: 0, gemini_flash_pro: 0 },
            safety: {
              isSafeProb: safety.isSafeProb,
              jailbreakProb: safety.jailbreakProb,
              explicitProb: safety.explicitProb,
              harmfulProb: safety.harmfulProb,
              severityScore: safety.severityScore,
              topHazard: safety.topHazard,
            },
            reasoning: safety.reasoning,
            latencyMs: safety.latencyMs,
          },
          response: `⛔ **Request Blocked by Jev In-Path Security Firewall**\n\n**Reason:** ${safety.reasoning}\n\n*Threat Analysis:*\n- Jailbreak Risk: **${jailbreakPct}%**\n- Explicit / NSFW Risk: **${explicitPct}%**\n- Harmful Action Risk: **${harmfulPct}%**\n- Severity Rating: **${safety.severityScore.toFixed(1)} / 3.0**\n\nThis prompt was blocked upfront at the firewall. No prompt quota was consumed and no downstream LLMs were invoked.`,
          modelUsed: "Jev Security Firewall",
          tokensEstimated: promptTokens,
          totalLatencyMs,
          isBlocked: true,
          blockReason: safety.reasoning,
          metrics,
        };

        await sendEvent({
          step: "BLOCKED",
          activeNode: "security",
          targetModel: "blocked",
          data: blockedResult,
          message: "Critical safety hazard detected. Request blocked at Safety Firewall.",
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
            blockReason: safety.reasoning,
            totalLatencyMs,
            tokensEstimated: promptTokens,
          });
        } catch (dbErr) {
          console.warn("[Pipeline] Failed to save blocked history:", dbErr);
        }

        return;
      }

      // 3. Quota Deduction (Only spent once prompt passes the upfront firewall)
      const quotaResult = await consumePrompt();
      if (!quotaResult.success) {
        await sendEvent({
          step: "BLOCKED",
          activeNode: "security",
          message: quotaResult.error || "Prompt quota limit reached.",
          timestamp: Date.now(),
        });
        return;
      }

      // 4. Jev System One Router Node
      await sendEvent({
        step: "ROUTING_START",
        activeNode: "router",
        message: "Prompt verified safe. Jev System One selecting optimal model specialization...",
        timestamp: Date.now(),
      });

      const jevDecision = await routeWithJev(prompt, safety);
      const activeTargetNode = jevDecision.targetModel === "mistral_large" ? "mistral" : "gemini";

      await sendEvent({
        step: "ROUTED",
        activeNode: activeTargetNode,
        targetModel: jevDecision.targetModel,
        data: { jev: jevDecision, safety },
        message: `Jev routed to ${jevDecision.targetModel === "mistral_large" ? "Mistral Large" : "Google Gemini"} (${(jevDecision.confidence * 100).toFixed(0)}% confidence).`,
        timestamp: Date.now(),
      });

      // 5. Execute Selected LLM
      await sendEvent({
        step: "EXECUTING_LLM",
        activeNode: activeTargetNode,
        targetModel: jevDecision.targetModel,
        message: `Executing ${jevDecision.targetModel === "mistral_large" ? "Mistral Large" : "Google Gemini"}...`,
        timestamp: Date.now(),
      });

      let llmResult: LLMCallResult;
      if (jevDecision.targetModel === "mistral_large") {
        llmResult = await executeMistralLarge(prompt);
      } else {
        llmResult = await executeGoogleGemini(prompt);
      }

      // 6. Independent Output Guard
      await sendEvent({
        step: "OUTPUT_GUARD_START",
        activeNode: "guard",
        targetModel: jevDecision.targetModel,
        message: "Jev output guard independently checking response integrity...",
        timestamp: Date.now(),
      });

      const outputGuard = await guardOutputWithJev(prompt, llmResult.response);

      const totalLatencyMs = Math.round(performance.now() - startTime);
      const metrics = calculateMetrics({
        targetModel: jevDecision.targetModel,
        jevLatencyMs: safety.latencyMs + jevDecision.latencyMs,
        llmLatencyMs: llmResult.llmLatencyMs,
        totalLatencyMs,
        promptTokens: llmResult.promptTokens,
        completionTokens: llmResult.completionTokens,
      });

      const finalResult: PipelineExecutionResult = {
        prompt,
        safety,
        jev: jevDecision,
        response: outputGuard.allowed
          ? llmResult.response
          : "⛔ **Response withheld by Jev Output Guard**\n\nThe generated answer contained safety policy violations and was withheld.",
        modelUsed: outputGuard.allowed ? llmResult.modelUsed : "Jev Output Guard",
        tokensEstimated: llmResult.tokensEstimated,
        totalLatencyMs,
        isBlocked: !outputGuard.allowed,
        blockReason: outputGuard.allowed ? undefined : outputGuard.reasoning,
        outputGuard,
        metrics,
      };

      // 7. Completed & Formatted
      await sendEvent({
        step: outputGuard.allowed ? "COMPLETED" : "BLOCKED",
        activeNode: outputGuard.allowed ? "output" : "security",
        targetModel: jevDecision.targetModel,
        data: finalResult,
        message: outputGuard.allowed
          ? `Pipeline completed in ${totalLatencyMs}ms. Output synthesized.`
          : "Generated output did not pass output guard and was withheld.",
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
          isBlocked: finalResult.isBlocked,
          blockReason: finalResult.blockReason,
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
