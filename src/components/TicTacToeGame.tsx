"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Bot, User, RotateCcw, Trophy, Sparkles, Swords, Zap } from "lucide-react";

type Player = "X" | "O";
type Board = (Player | null)[];
type Difficulty = "master" | "strategic" | "casual";

const WINNING_COMBOS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function checkWinner(board: Board): { winner: Player | "tie" | null; line: number[] | null } {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: combo };
    }
  }

  if (board.every((cell) => cell !== null)) {
    return { winner: "tie", line: null };
  }

  return { winner: null, line: null };
}

// Minimax algorithm for Master difficulty
function minimax(board: Board, depth: number, isMaximizing: boolean): number {
  const result = checkWinner(board);
  if (result.winner === "O") return 10 - depth;
  if (result.winner === "X") return depth - 10;
  if (result.winner === "tie") return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = "O";
        const score = minimax(board, depth + 1, false);
        board[i] = null;
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = "X";
        const score = minimax(board, depth + 1, true);
        board[i] = null;
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
}

function findBestMove(board: Board, difficulty: Difficulty): number {
  const availableMoves = board.map((val, idx) => (val === null ? idx : null)).filter((val) => val !== null) as number[];

  if (availableMoves.length === 0) return -1;

  // Casual: 50% random chance
  if (difficulty === "casual" && Math.random() < 0.5) {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // Strategic: 25% random chance
  if (difficulty === "strategic" && Math.random() < 0.25) {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // Master: 100% Minimax optimal move
  let bestScore = -Infinity;
  let bestMove = availableMoves[0];

  for (const move of availableMoves) {
    board[move] = "O";
    const score = minimax(board, 0, false);
    board[move] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

export const TicTacToeGame: React.FC = () => {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(true);
  const [difficulty, setDifficulty] = useState<Difficulty>("strategic");
  const [scores, setScores] = useState({ player: 0, bot: 0, ties: 0 });
  const [botCommentary, setBotCommentary] = useState<string>("Make your move. I'm calculating all 255,168 game states.");
  const [isBotThinking, setIsBotThinking] = useState<boolean>(false);

  const gameState = checkWinner(board);

  // Handle Bot Turn
  const handleBotMove = useCallback(() => {
    if (gameState.winner || isPlayerTurn) return;

    setIsBotThinking(true);
    setBotCommentary("Analyzing tactical positions...");

    const delay = 400 + Math.random() * 250;

    const timer = setTimeout(() => {
      const bestMove = findBestMove([...board], difficulty);
      if (bestMove !== -1) {
        const newBoard = [...board];
        newBoard[bestMove] = "O";
        setBoard(newBoard);

        // Generate dynamic AI commentary
        const winCheck = checkWinner(newBoard);
        if (winCheck.winner === "O") {
          setBotCommentary("Checkmate! Unavoidable victory path achieved.");
          setScores((prev) => ({ ...prev, bot: prev.bot + 1 }));
        } else if (winCheck.winner === "tie") {
          setBotCommentary("A balanced game! Neither side yielded tactical advantage.");
          setScores((prev) => ({ ...prev, ties: prev.ties + 1 }));
        } else {
          const moveCommentaries = [
            "Controlling center space to maximize diagonal forks.",
            "Countering your perimeter pressure with positional defense.",
            "Neutralizing your alignment on row 2.",
            "Setting up future branching opportunities.",
          ];
          setBotCommentary(moveCommentaries[Math.floor(Math.random() * moveCommentaries.length)]);
        }
      }
      setIsBotThinking(false);
      setIsPlayerTurn(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [board, difficulty, gameState.winner, isPlayerTurn]);

  useEffect(() => {
    if (!isPlayerTurn && !gameState.winner) {
      const cleanup = handleBotMove();
      return cleanup;
    }
  }, [isPlayerTurn, gameState.winner, handleBotMove]);

  // Handle Player Click
  const handleCellClick = (index: number) => {
    if (board[index] || !isPlayerTurn || gameState.winner) return;

    const newBoard = [...board];
    newBoard[index] = "X";
    setBoard(newBoard);

    const winCheck = checkWinner(newBoard);
    if (winCheck.winner === "X") {
      setBotCommentary("Brilliant play! You found a winning angle I failed to block.");
      setScores((prev) => ({ ...prev, player: prev.player + 1 }));
      return;
    } else if (winCheck.winner === "tie") {
      setBotCommentary("Stalemate! Cleanly executed defensive balance.");
      setScores((prev) => ({ ...prev, ties: prev.ties + 1 }));
      return;
    }

    setIsPlayerTurn(false);
  };

  const handleReset = () => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setIsBotThinking(false);
    setBotCommentary("Fresh match initialized. Your turn (X)!");
  };

  return (
    <div className="card-panel tictactoe-container">
      {/* Header */}
      <div className="ttt-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div className="ttt-icon-badge">
            <Swords size={20} color="white" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h2 className="brand-title" style={{ fontSize: "1.15rem" }}>
                Autonomous AI Tic-Tac-Toe Arena
              </h2>
              <span className="ttt-live-pill">
                <span className="status-dot" style={{ width: 6, height: 6 }} />
                Minimax Engine
              </span>
            </div>
            <p className="brand-subtitle" style={{ fontSize: "0.8rem", marginTop: "2px" }}>
              Human (X) vs. Autonomous Bot (O) with 255,168 State Tree Search
            </p>
          </div>
        </div>

        {/* Difficulty Selector & Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div className="ttt-diff-pill-group">
            {(["casual", "strategic", "master"] as Difficulty[]).map((level) => (
              <button
                key={level}
                className={`ttt-diff-btn ${difficulty === level ? "active" : ""}`}
                onClick={() => {
                  setDifficulty(level);
                  handleReset();
                }}
              >
                {level === "master" && "⚡ "}
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>

          <button onClick={handleReset} className="ttt-reset-btn" title="Reset Current Match">
            <RotateCcw size={14} className="reset-icon" />
            <span>Reset Match</span>
          </button>
        </div>
      </div>

      {/* Main Game Arena */}
      <div className="ttt-arena">
        {/* Left: Scoreboard & Commentary */}
        <div className="ttt-meta-col">
          {/* Scoreboard */}
          <div className="ttt-scoreboard">
            <div className="ttt-score-card card-user">
              <div className="ttt-score-header" style={{ color: "var(--gemini-blue)" }}>
                <div className="score-icon-box user-box">
                  <User size={13} />
                </div>
                <span>You (X)</span>
              </div>
              <div className="ttt-score-num num-user">{scores.player}</div>
              <span className="ttt-score-sublabel">Human Wins</span>
            </div>

            <div className="ttt-score-card card-tie">
              <div className="ttt-score-header" style={{ color: "var(--text-muted)" }}>
                <div className="score-icon-box tie-box">
                  <Trophy size={13} />
                </div>
                <span>Draws</span>
              </div>
              <div className="ttt-score-num num-tie">{scores.ties}</div>
              <span className="ttt-score-sublabel">Stalemates</span>
            </div>

            <div className="ttt-score-card card-bot">
              <div className="ttt-score-header" style={{ color: "var(--mistral-amber)" }}>
                <div className="score-icon-box bot-box">
                  <Bot size={13} />
                </div>
                <span>Bot (O)</span>
              </div>
              <div className="ttt-score-num num-bot">{scores.bot}</div>
              <span className="ttt-score-sublabel">AI Wins</span>
            </div>
          </div>

          {/* Turn Status Pill */}
          <div className={`ttt-turn-banner ${gameState.winner ? "finished" : isPlayerTurn ? "player" : "bot"}`}>
            {gameState.winner ? (
              gameState.winner === "tie" ? (
                <span className="banner-content">🤝 Match Drawn! Both sides demonstrated flawless defense.</span>
              ) : gameState.winner === "X" ? (
                <span className="banner-content">🎉 Outstanding Victory! You defeated the Minimax evaluation!</span>
              ) : (
                <span className="banner-content">🤖 AI Victory! Bot locked in an optimal branching branch.</span>
              )
            ) : isPlayerTurn ? (
              <span className="banner-content">
                <span className="turn-pulse-dot user-pulse" />
                Your Turn — Select any unoccupied tile to place <strong>X</strong>
              </span>
            ) : (
              <span className="banner-content">
                <span className="turn-pulse-dot bot-pulse" />
                Bot Calculating (Analyzing Minimax Tree Depth 9)...
              </span>
            )}
          </div>

          {/* AI Tactical Commentary Box */}
          <div className="ttt-commentary-box">
            <div className="commentary-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Zap size={14} color="var(--jev-emerald)" />
                <span style={{ fontWeight: 700, fontSize: "0.76rem", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Autonomous Tactical Stream
                </span>
              </div>
              <span className="commentary-state-tag">
                {isBotThinking ? "CALCULATING..." : "LIVE FEED"}
              </span>
            </div>
            <div className="commentary-body">
              <span className="quote-mark">&ldquo;</span>
              <span className="commentary-text">{botCommentary}</span>
              <span className="cursor-blink">▎</span>
            </div>
          </div>
        </div>

        {/* Right: 3x3 Interactive Board */}
        <div className="ttt-board-wrapper">
          <div className="ttt-board">
            {board.map((cell, idx) => {
              const isWinningCell = gameState.line?.includes(idx);
              return (
                <button
                  key={idx}
                  className={`ttt-cell ${cell ? "filled" : ""} ${isWinningCell ? "winning" : ""}`}
                  onClick={() => handleCellClick(idx)}
                  disabled={!isPlayerTurn || cell !== null || !!gameState.winner}
                  aria-label={`Board cell ${idx + 1}`}
                >
                  {cell === "X" && (
                    <svg className="ttt-symbol symbol-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" className="path-x1" />
                      <line x1="6" y1="6" x2="18" y2="18" className="path-x2" />
                    </svg>
                  )}
                  {cell === "O" && (
                    <svg className="ttt-symbol symbol-o" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round">
                      <circle cx="12" cy="12" r="8" className="path-o" />
                    </svg>
                  )}
                  {!cell && isPlayerTurn && !gameState.winner && (
                    <span className="ttt-hover-ghost">✕</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
