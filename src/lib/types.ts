export type TargetModel = 'mistral_large' | 'gemini_flash_pro' | 'blocked';

export interface JevRoutingDecision {
  targetModel: TargetModel;
  confidence: number;
  probabilities: {
    mistral_large: number;
    gemini_flash_pro: number;
  };
  safety: {
    isSafeProb: number;
    jailbreakProb: number;
    severityScore: number;
  };
  reasoning: string;
  latencyMs: number;
}

export interface ExecutionMetrics {
  jevLatencyMs: number;
  llmLatencyMs: number;
  totalLatencyMs: number;
  overheadLatencyMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  actualCostUsd: number;
  baselineUnroutedCostUsd: number;
  costSavingsUsd: number;
  costSavingsPercent: number;
}

export interface PipelineExecutionResult {
  prompt: string;
  jev: JevRoutingDecision;
  response: string;
  modelUsed: string;
  tokensEstimated: number;
  totalLatencyMs: number;
  isBlocked: boolean;
  blockReason?: string;
  metrics: ExecutionMetrics;
}

export type PipelineNodeId = 'input' | 'router' | 'mistral' | 'gemini' | 'security' | 'output';

export type PipelineNodeStatus = 'idle' | 'active' | 'success' | 'failed';

export interface PipelineEvent {
  step: 'START' | 'ROUTING_START' | 'ROUTED' | 'EXECUTING_LLM' | 'COMPLETED' | 'BLOCKED';
  activeNode: PipelineNodeId;
  targetModel?: TargetModel;
  data?: Partial<PipelineExecutionResult>;
  message: string;
  timestamp: number;
}
