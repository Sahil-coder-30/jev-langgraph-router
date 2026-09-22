import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { typesafeClient } from "@/lib/jevRouter";
import { choice, noul, score } from "@typesafe-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Player = "X" | "O" | null;

const GAME_QUESTIONS = {
  advantage: choice(
    "Who currently holds the tactical advantage in this Tic-Tac-Toe match?",
    {
      human_win: { what: "Human player (X) has a dominant position, tactical lead, or forcing fork." },
      bot_win: { what: "AI bot (O) has a dominant position, tactical lead, or forcing fork." },
      draw_balanced: { what: "The board is balanced and heading toward a draw or stalemate with sound play." },
    }
  ),
  fork_threat: noul(
    "Is there an active double-fork or imminent lethal winning threat on this board state?",
    {
      true: "An immediate winning threat or unstoppable double-fork is active.",
      false: "No immediate unavoidable threat exists.",
    }
  ),
  tension: score(
    "How high is the tactical tension in this game state?",
    [
      "Low: early opening, wide open board with many neutral squares",
      "Moderate: developing tactical lines, contested center",
      "High: critical defensive block or fork imminent",
      "Decisive: decisive winning alignment or stalemate reached",
    ]
  ),
  strategy: choice(
    "What is the best tactical priority for the next move?",
    {
      block_threat: { what: "Directly block an opponent winning line." },
      create_fork: { what: "Create two simultaneous winning lines (fork)." },
      tempo_corner: { what: "Control strategic corners to restrict opponent lines." },
      center_anchor: { what: "Occupy or leverage the center square for maximum diagonal coverage." },
    }
  ),
};

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const board: Player[] = Array.isArray(body.board) && body.board.length === 9
    ? body.board
    : Array(9).fill(null);
  const moveCount: number = typeof body.moveCount === "number" ? body.moveCount : 0;
  const playerTurn: string = body.playerTurn || "player";
  const difficulty: string = body.difficulty || "strategic";

  const startTime = performance.now();

  const xCount = board.filter((c) => c === "X").length;
  const oCount = board.filter((c) => c === "O").length;
  const emptyCount = board.filter((c) => c === null).length;

  const state = {
    board,
    boardGrid: [
      board.slice(0, 3).map((c) => c ?? "-"),
      board.slice(3, 6).map((c) => c ?? "-"),
      board.slice(6, 9).map((c) => c ?? "-"),
    ],
    xPositions: board.map((c, i) => (c === "X" ? i : null)).filter((i) => i !== null),
    oPositions: board.map((c, i) => (c === "O" ? i : null)).filter((i) => i !== null),
    xCount,
    oCount,
    emptyCount,
    turn: playerTurn === "player" ? "Human (X)" : "AI Bot (O)",
    difficulty,
  };

  if (typesafeClient) {
    try {
      const response = await typesafeClient.systemOne(
        {
          state,
          questions: GAME_QUESTIONS,
          model: "jev-latest",
        },
        { timeout: 3500, retry: { maxRetries: 0 } }
      );

      const latencyMs = Math.round(performance.now() - startTime);
      const answers = response.answers;

      const advantageAns = answers.advantage;
      const forkAns = answers.fork_threat;
      const tensionAns = answers.tension;
      const stratAns = answers.strategy;

      const advantageChoice = advantageAns.type === "choice" ? advantageAns.choice : "draw_balanced";
      const advantageConf = advantageAns.type === "choice" ? advantageAns.confidence : 0.4;
      const advantageProbs = advantageAns.type === "choice" && advantageAns.probabilities
        ? {
            human_win: Number((advantageAns.probabilities.human_win ?? 0.33).toFixed(2)),
            bot_win: Number((advantageAns.probabilities.bot_win ?? 0.33).toFixed(2)),
            draw_balanced: Number((advantageAns.probabilities.draw_balanced ?? 0.34).toFixed(2)),
          }
        : { human_win: 0.33, bot_win: 0.33, draw_balanced: 0.34 };

      const forkProb = forkAns.type === "noul" ? Number(forkAns.noul.toFixed(2)) : 0.15;
      const tensionScore = tensionAns.type === "score" ? Number(tensionAns.score.toFixed(2)) : 1.0;
      const tensionProbs = tensionAns.type === "score" && tensionAns.probabilities
        ? tensionAns.probabilities
        : { "0": 0.25, "1": 0.5, "2": 0.2, "3": 0.05 };

      const strategyChoice = stratAns.type === "choice" ? stratAns.choice : "tempo_corner";
      const strategyConf = stratAns.type === "choice" ? stratAns.confidence : 0.5;
      const strategyProbs = stratAns.type === "choice" && stratAns.probabilities
        ? stratAns.probabilities
        : { block_threat: 0.25, create_fork: 0.25, tempo_corner: 0.25, center_anchor: 0.25 };

      return NextResponse.json({
        advantage: {
          choice: advantageChoice,
          confidence: advantageConf,
          probabilities: advantageProbs,
        },
        forkThreat: forkProb,
        tensionScore,
        tensionProbabilities: tensionProbs,
        strategy: {
          choice: strategyChoice,
          confidence: strategyConf,
          probabilities: strategyProbs,
        },
        latencyMs,
        model: "Jev System One (jev-latest)",
        moveCount,
        evaluatedAt: Date.now(),
      });
    } catch (err) {
      console.warn("[Jev Game API] Live model evaluation error; fallback heuristic:", err);
    }
  }

  // Fallback heuristic evaluation
  const latencyMs = Math.round(performance.now() - startTime);

  let humanWinProb = 0.35;
  let botWinProb = 0.35;
  let drawProb = 0.3;

  if (board[4] === "O") {
    botWinProb += 0.12;
    humanWinProb -= 0.06;
  } else if (board[4] === "X") {
    humanWinProb += 0.12;
    botWinProb -= 0.06;
  }

  if (moveCount > 6) {
    drawProb += 0.25;
    humanWinProb = Math.max(0.1, humanWinProb - 0.12);
    botWinProb = Math.max(0.1, botWinProb - 0.12);
  }

  const total = humanWinProb + botWinProb + drawProb;
  humanWinProb = Number((humanWinProb / total).toFixed(2));
  botWinProb = Number((botWinProb / total).toFixed(2));
  drawProb = Number((1 - humanWinProb - botWinProb).toFixed(2));

  let advantageChoice: "human_win" | "bot_win" | "draw_balanced" = "draw_balanced";
  if (humanWinProb > botWinProb && humanWinProb > 0.4) advantageChoice = "human_win";
  else if (botWinProb > humanWinProb && botWinProb > 0.4) advantageChoice = "bot_win";

  const forkProb = moveCount >= 3 ? Math.min(0.85, 0.15 + (moveCount * 0.08)) : 0.1;
  const tensionScore = Math.min(3.0, Number((0.4 + moveCount * 0.3).toFixed(2)));

  return NextResponse.json({
    advantage: {
      choice: advantageChoice,
      confidence: Math.max(humanWinProb, botWinProb, drawProb),
      probabilities: {
        human_win: humanWinProb,
        bot_win: botWinProb,
        draw_balanced: drawProb,
      },
    },
    forkThreat: forkProb,
    tensionScore,
    tensionProbabilities: {
      "0": Math.max(0.05, 0.6 - moveCount * 0.08),
      "1": 0.35,
      "2": Math.min(0.5, 0.1 + moveCount * 0.07),
      "3": moveCount >= 7 ? 0.3 : 0.05,
    },
    strategy: {
      choice: moveCount <= 2 ? "center_anchor" : forkProb > 0.4 ? "block_threat" : "create_fork",
      confidence: 0.65,
      probabilities: {
        block_threat: forkProb > 0.4 ? 0.55 : 0.2,
        create_fork: 0.35,
        tempo_corner: 0.25,
        center_anchor: moveCount <= 2 ? 0.6 : 0.15,
      },
    },
    latencyMs: Math.max(18, latencyMs),
    model: "Jev Heuristic Simulator",
    moveCount,
    evaluatedAt: Date.now(),
  });
}
