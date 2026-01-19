# EffectTalk Agents Documentation

> **Comprehensive guide to AI agent infrastructure, patterns, and implementation in the EffectTalk monorepo**

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Agent Architecture](#-agent-architecture)
  - [Design Principles](#design-principles)
  - [Core Agent Pattern](#core-agent-pattern)
- [Agent Capabilities](#-agent-capabilities)
  - [LLM Integration (effect-ai-sdk)](#1-llm-integration-effect-ai-sdk)
  - [Memory & Search (effect-supermemory)](#2-memory--search-effect-supermemory)
  - [CLI/TUI Interface (effect-cli-tui)](#3-clitui-interface-effect-cli-tui)
  - [State Machine Orchestration (effect-actor)](#4-state-machine-orchestration-effect-actor)
- [Agent Patterns](#-agent-patterns)
  - [Conversational Agent](#1-conversational-agent)
  - [Task-Oriented Agent](#2-task-oriented-agent)
  - [Multi-Agent System](#3-multi-agent-system)
- [Agent Development Workflow](#-agent-development-workflow)
  - [Agent Definition](#1-agent-definition)
  - [Agent Implementation](#2-agent-implementation)
  - [Agent Registration](#3-agent-registration)
- [Agent Monitoring & Observability](#-agent-monitoring--observability)
  - [Agent Metrics](#1-agent-metrics)
  - [Agent Logging](#2-agent-logging)
- [Agent Deployment](#-agent-deployment)
  - [Local Development](#1-local-development)
  - [Production Deployment](#2-production-deployment)
- [Agent Testing](#-agent-testing)
  - [Unit Testing](#1-unit-testing)
  - [Integration Testing](#2-integration-testing)
- [Security Considerations](#-security-considerations)
  - [API Key Management](#1-api-key-management)
  - [Input Validation](#2-input-validation)
- [Performance Optimization](#-performance-optimization)
  - [Caching Strategy](#1-caching-strategy)
  - [Parallel Processing](#2-parallel-processing)
- [Troubleshooting](#-troubleshooting)
- [Additional Resources](#-additional-resources)
- [Contributing](#-contributing-to-agent-infrastructure)

---

## 🤖 Overview

EffectTalk provides a complete AI agent infrastructure built on functional programming principles with Effect.js. This document covers the architecture, patterns, and implementation details for building sophisticated AI-powered applications.

### Core Agent Components

```text
┌─────────────────────────────────────────────────────────┐
│                    AI Application Layer                   │
│              (Your Agent Implementation)                    │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────▼──────────────┐
        │   Agent Orchestration      │
        │   (effect-actor)           │
        ├──────────────────────────┤
        │ • State Machine Logic     │
        │ • Workflow Management     │
        │ • Event Handling          │
        │ • Error Recovery          │
        └────────────┬─────────────┘
                     │
        ┌────────────▼──────────────┐
        │   Agent Capabilities       │
        ├──────────────────────────┤
        │ • LLM Integration         │
        │ • Memory & Search         │
        │ • CLI/TUI Interface        │
        │ • Prompt Management       │
        │ • Data Processing         │
        └────────────┬─────────────┘
                     │
        ┌────────────▼──────────────┐
        │   Effect.js Runtime        │
        │   (Functional Effects)     │
        └──────────────────────────┘
```

---

## 🏗️ Agent Architecture

### Design Principles

1. **Functional Effects** - All agent operations use Effect.js for composability
2. **State Machine Semantics** - Agent behavior modeled as statecharts
3. **Type Safety** - Compile-time guarantees for all agent operations
4. **Error Transparency** - Discriminated unions for error handling
5. **Dependency Injection** - Service-based architecture with Effect.Service

### Core Agent Pattern

```typescript
import { Effect, Layer } from "effect";
import { createActor, interpret } from "effect-actor";
import { generateText } from "effect-ai-sdk";
import { SupermemoryClient } from "effect-supermemory";

// Define agent state machine
const AgentStateMachine = {
  initial: "idle",
  states: {
    idle: {
      on: {
        START_TASK: "processing",
      },
    },
    processing: {
      on: {
        COMPLETE: "completed",
        ERROR: "error",
      },
    },
    completed: {
      type: "final",
    },
    error: {
      type: "final",
    },
  },
};

// Agent service implementation
class AgentService extends Effect.Service<AgentService>()("AgentService", {
  effect: Effect.gen(function* () {
    return {
      processTask: (task: Task) =>
        Effect.gen(function* () {
          // 1. Retrieve relevant context from memory
          const memory = yield* SupermemoryClient.search(task.query);

          // 2. Generate response using LLM
          const response = yield* generateText({
            model: "claude-3.5-sonnet",
            prompt: task.prompt,
            context: memory.results,
          });

          // 3. Store interaction in memory
          yield* SupermemoryClient.store({
            type: "interaction",
            task: task.id,
            response: response.text,
            timestamp: new Date().toISOString(),
          });

          return response;
        }),
    };
  }),
}) {}

// Agent orchestration layer
const AgentLayer = Layer.merge(
  AgentService.Default,
  SupermemoryClient.Default,
  // Add other required layers
);

// Create and run agent
const agent = createActor(AgentStateMachine, {
  services: {
    AgentService,
    // Add other services
  },
});

const runAgent = (task: Task) =>
  Effect.gen(function* () {
    const actor = yield* agent;

    // Start processing
    yield* actor.send({ type: "START_TASK", task });

    // Wait for completion
    const state = yield* actor.observe(
      (state) => state.matches("completed") || state.matches("error"),
    );

    return state;
  }).pipe(Effect.provide(AgentLayer));
```

---

## 🧠 Agent Capabilities

### 1. LLM Integration (effect-ai-sdk)

Multi-provider LLM integration with unified interface:

```typescript
import { generateText, streamText, generateObject } from "effect-ai-sdk";

// Text generation
const textResponse =
  yield *
  generateText({
    model: "claude-3.5-sonnet",
    prompt: "Explain quantum computing",
    apiKey: process.env.ANTHROPIC_API_KEY,
    maxTokens: 1000,
  });

// Streaming responses
const responseStream =
  yield *
  streamText({
    model: "gpt-4",
    prompt: "Write a story",
    apiKey: process.env.OPENAI_API_KEY,
    onChunk: (chunk) => console.log(chunk.text),
  });

// Structured output
const structuredResponse =
  yield *
  generateObject({
    model: "claude-3-opus",
    prompt: "Extract user information from this text",
    schema: z.object({
      name: z.string(),
      age: z.number(),
      email: z.string().email(),
    }),
  });
```

**Supported Providers:**

- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude)
- Google (Gemini)
- Groq
- DeepSeek
- Perplexity
- xAI
- Qwen

### 2. Memory & Search (effect-supermemory)

Long-term memory with semantic search capabilities:

```typescript
import {
  SupermemoryClient,
  MemoriesService,
  SearchService,
} from "effect-supermemory";

// Store memories
yield *
  MemoriesService.put("user-preference", {
    type: "preference",
    userId: "user-123",
    preferences: {
      theme: "dark",
      language: "en",
    },
  });

// Semantic search
const searchResults =
  yield *
  SearchService.semanticSearch({
    query: "user preferences for dark theme",
    filters: {
      type: "preference",
      userId: "user-123",
    },
  });

// Hybrid search (semantic + keyword)
const hybridResults =
  yield *
  SearchService.hybridSearch({
    query: "theme settings",
    semantic: true,
    keyword: true,
    weights: { semantic: 0.7, keyword: 0.3 },
  });
```

### 3. CLI/TUI Interface (effect-cli-tui)

Rich terminal interfaces for agent interaction:

```typescript
import {
  prompt,
  selectOption,
  multiSelect,
  confirm,
  spinner,
  Table,
  Panel,
} from "effect-cli-tui";

// Interactive agent setup
const setupAgent = Effect.gen(function* () {
  const agentName = yield* prompt("What should I call this agent?");

  const capabilities = yield* multiSelect("Select agent capabilities:", [
    "text-generation",
    "code-analysis",
    "data-processing",
    "web-search",
  ]);

  const model = yield* selectOption("Choose primary LLM model:", [
    "claude-3.5-sonnet",
    "gpt-4",
    "gemini-pro",
  ]);

  const confirmed = yield* confirm(
    `Create agent "${agentName}" with ${capabilities.length} capabilities?`,
  );

  if (!confirmed) {
    return yield* Effect.fail(new Error("Agent creation cancelled"));
  }

  return { agentName, capabilities, model };
});

// Progress indication
const processWithProgress = (task: string) =>
  spinner(
    `Processing ${task}...`,
    Effect.gen(function* () {
      yield* Effect.sleep(2000); // Simulate work
      return `Completed ${task}`;
    }),
  );
```

### 4. State Machine Orchestration (effect-actor)

Complex workflow management with statechart semantics:

```typescript
import { createActor, interpret } from "effect-actor";

// Define complex agent workflow
const AgentWorkflow = {
  initial: "initialized",
  states: {
    initialized: {
      on: {
        CONFIGURE: "configured",
        ERROR: "failed",
      },
    },
    configured: {
      on: {
        START: "running",
        SHUTDOWN: "shutdown",
      },
    },
    running: {
      on: {
        PROCESS: "processing",
        PAUSE: "paused",
        COMPLETE: "completed",
        ERROR: "error",
      },
      activities: {
        enter: ["logStart", "initializeResources"],
        exit: ["cleanupResources"],
      },
    },
    processing: {
      on: {
        SUCCESS: "running",
        FAILURE: "error",
        RETRY: "processing",
      },
    },
    paused: {
      on: {
        RESUME: "running",
        SHUTDOWN: "shutdown",
      },
    },
    completed: {
      type: "final",
      activities: {
        enter: ["logCompletion", "saveResults"],
      },
    },
    error: {
      on: {
        RETRY: "processing",
        SHUTDOWN: "shutdown",
      },
      activities: {
        enter: ["logError", "triggerAlerts"],
      },
    },
    failed: {
      type: "final",
      activities: {
        enter: ["logFailure", "cleanup"],
      },
    },
    shutdown: {
      type: "final",
      activities: {
        enter: ["gracefulShutdown", "saveState"],
      },
    },
  },
};

// Create agent with workflow
const agent = createActor(AgentWorkflow, {
  services: {
    LoggerService,
    ResourceService,
    StateService,
  },
  activities: {
    logStart: () => Effect.log("Agent workflow started"),
    initializeResources: () => ResourceService.initialize(),
    logCompletion: () => Effect.log("Agent workflow completed"),
    saveResults: () => StateService.saveFinalResults(),
    // ... other activities
  },
});
```

---

## 🎯 Agent Patterns

### 1. Conversational Agent

```typescript
class ConversationalAgent extends Effect.Service<ConversationalAgent>()(
  "ConversationalAgent",
  {
    effect: Effect.gen(function* () {
      return {
        converse: (message: string, context: ConversationContext) =>
          Effect.gen(function* () {
            // 1. Retrieve conversation history
            const history = yield* MemoryService.getConversation(
              context.sessionId,
            );

            // 2. Get user preferences
            const preferences = yield* MemoryService.getUserPreferences(
              context.userId,
            );

            // 3. Generate contextual response
            const response = yield* generateText({
              model: preferences.model,
              prompt: `
              You are a helpful assistant with the following context:
              - User preferences: ${JSON.stringify(preferences)}
              - Conversation history: ${history
                .slice(-5)
                .map((h) => h.content)
                .join("\n")}
              
              User message: ${message}
              
              Respond naturally and helpfully.
            `,
            });

            // 4. Store interaction
            yield* MemoryService.storeInteraction({
              sessionId: context.sessionId,
              userId: context.userId,
              message,
              response: response.text,
              timestamp: new Date().toISOString(),
            });

            return response;
          }),
      };
    }),
  },
) {}
```

### 2. Task-Oriented Agent

```typescript
class TaskAgent extends Effect.Service<TaskAgent>()("TaskAgent", {
  effect: Effect.gen(function* () {
    return {
      executeTask: (task: TaskDefinition) =>
        Effect.gen(function* () {
          // 1. Parse and validate task
          const parsedTask = yield* TaskParser.parse(task);

          // 2. Create execution plan
          const plan = yield* PlannerService.createPlan(parsedTask);

          // 3. Execute plan steps
          const results = [];
          for (const step of plan.steps) {
            const stepResult = yield* executeStep(step);
            results.push(stepResult);

            // Check for failure conditions
            if (stepResult.status === "failed") {
              return yield* handleTaskFailure(stepResult, results);
            }
          }

          // 4. Aggregate results
          const finalResult = yield* AggregatorService.aggregate(results);

          // 5. Store completion
          yield* TaskService.markCompleted(task.id, finalResult);

          return finalResult;
        }),
    };
  }),
}) {}

const executeStep = (step: PlanStep) =>
  Effect.gen(function* () {
    switch (step.type) {
      case "llm-generation":
        return yield* LLMService.generate(step.config);
      case "data-processing":
        return yield* DataProcessor.process(step.config);
      case "external-api":
        return yield* APIService.call(step.config);
      case "memory-search":
        return yield* MemoryService.search(step.config);
      default:
        return yield* Effect.fail(new Error(`Unknown step type: ${step.type}`));
    }
  });
```

### 3. Multi-Agent System

```typescript
class AgentOrchestrator extends Effect.Service<AgentOrchestrator>()(
  "AgentOrchestrator",
  {
    effect: Effect.gen(function* () {
      return {
        coordinateAgents: (request: ComplexRequest) =>
          Effect.gen(function* () {
            // 1. Analyze request and determine required agents
            const analysis = yield* RequestAnalyzer.analyze(request);

            // 2. Create agent instances
            const agents = yield* Effect.all(
              analysis.requiredAgents.map((agentType) =>
                AgentFactory.create(agentType, analysis.context),
              ),
            );

            // 3. Coordinate agent execution
            const coordinator = yield* createAgentCoordinator(agents);

            // 4. Execute coordinated workflow
            const result = yield* coordinator.execute(request);

            // 5. Aggregate and return results
            return yield* ResultAggregator.aggregate(result);
          }),
      };
    }),
  },
) {}

const AgentFactory = {
  create: (type: AgentType, context: AgentContext) =>
    Effect.gen(function* () {
      switch (type) {
        case "researcher":
          return yield* ResearchAgent.create(context);
        case "analyst":
          return yield* AnalystAgent.create(context);
        case "writer":
          return yield* WriterAgent.create(context);
        case "validator":
          return yield* ValidatorAgent.create(context);
        default:
          return yield* Effect.fail(new Error(`Unknown agent type: ${type}`));
      }
    }),
};
```

---

## 🔧 Agent Development Workflow

### 1. Agent Definition

```typescript
// Define agent interface
interface AgentDefinition {
  name: string;
  description: string;
  capabilities: string[];
  requiredServices: string[];
  stateMachine: StateMachineDefinition;
  defaultConfig: AgentConfig;
}

// Create agent definition
const ResearchAgent: AgentDefinition = {
  name: "research-agent",
  description: "Research agent that gathers and analyzes information",
  capabilities: ["web-search", "document-analysis", "synthesis"],
  requiredServices: ["SearchService", "DocumentProcessor", "LLMService"],
  stateMachine: ResearchWorkflow,
  defaultConfig: {
    maxSources: 10,
    analysisDepth: "deep",
    synthesisModel: "claude-3.5-sonnet",
  },
};
```

### 2. Agent Implementation

```typescript
class ResearchAgentImpl extends Effect.Service<ResearchAgentImpl>()(
  "ResearchAgent",
  {
    effect: Effect.gen(function* () {
      return {
        research: (query: ResearchQuery) =>
          Effect.gen(function* () {
            // 1. Search for information
            const sources = yield* SearchService.search(query, {
              maxResults: query.maxSources || 10,
            });

            // 2. Analyze sources
            const analyses = yield* Effect.all(
              sources.map((source) =>
                DocumentProcessor.analyze(source, query.analysisDepth),
              ),
            );

            // 3. Synthesize findings
            const synthesis = yield* LLMService.generate({
              model: query.synthesisModel,
              prompt: `
              Synthesize the following research findings:
              ${analyses.map((a) => a.content).join("\n\n")}
              
              Original query: ${query.text}
              
              Provide a comprehensive analysis with:
              1. Key findings
              2. Supporting evidence
              3. Confidence level
              4. Recommendations
            `,
            });

            // 4. Store research results
            yield* ResearchService.store({
              queryId: query.id,
              sources,
              analyses,
              synthesis: synthesis.text,
              timestamp: new Date().toISOString(),
            });

            return {
              query: query.text,
              sources,
              analyses,
              synthesis: synthesis.text,
            };
          }),
      };
    }),
  },
) {}
```

### 3. Agent Registration

```typescript
// Register agent in system
const AgentRegistry = {
  register: (definition: AgentDefinition) =>
    Effect.gen(function* () {
      // Validate definition
      yield* AgentValidator.validate(definition);

      // Store definition
      yield* AgentStorage.store(definition);

      // Create agent factory
      const factory = yield* AgentFactory.create(definition);

      // Register with orchestrator
      yield* OrchestratorService.registerAgent(definition.name, factory);

      return definition;
    }),
};

// Register research agent
const registerResearchAgent = () => AgentRegistry.register(ResearchAgent);
```

---

## 📊 Agent Monitoring & Observability

### 1. Agent Metrics

```typescript
class AgentMetrics extends Effect.Service<AgentMetrics>()("AgentMetrics", {
  effect: Effect.gen(function* () {
    return {
      trackExecution: (agentId: string, execution: AgentExecution) =>
        Effect.gen(function* () {
          // Track execution metrics
          yield* MetricsService.record({
            agentId,
            executionId: execution.id,
            startTime: execution.startTime,
            endTime: execution.endTime,
            status: execution.status,
            steps: execution.steps.length,
            errors: execution.errors.length,
          });

          // Track performance
          yield* PerformanceService.track({
            agentId,
            duration: execution.endTime - execution.startTime,
            memoryUsage: execution.memoryUsage,
            cpuUsage: execution.cpuUsage,
          });

          // Track outcomes
          yield* OutcomeService.record({
            agentId,
            success: execution.status === "completed",
            quality: execution.quality,
            userSatisfaction: execution.userSatisfaction,
          });
        }),
    };
  }),
}) {}
```

### 2. Agent Logging

```typescript
class AgentLogger extends Effect.Service<AgentLogger>()("AgentLogger", {
  effect: Effect.gen(function* () {
    return {
      logEvent: (agentId: string, event: AgentEvent) =>
        Effect.gen(function* () {
          const logEntry = {
            timestamp: new Date().toISOString(),
            agentId,
            eventType: event.type,
            data: event.data,
            level: event.level || "info",
          };

          yield* LoggingService.write(logEntry);

          // Critical events trigger alerts
          if (event.level === "critical") {
            yield* AlertService.trigger({
              type: "agent-critical-event",
              agentId,
              event: logEntry,
            });
          }
        }),
    };
  }),
}) {}
```

---

## 🚀 Agent Deployment

### 1. Local Development

```typescript
// Development agent runner
const runAgentLocally = (agentName: string, config: AgentConfig) =>
  Effect.gen(function* () {
    // Load agent definition
    const definition = yield* AgentRegistry.get(agentName);

    // Create agent instance
    const agent = yield* AgentFactory.create(definition, config);

    // Setup development monitoring
    yield* DevMonitoring.setup(agent);

    // Run agent with development tools
    return yield* agent.run();
  }).pipe(Effect.provide(DevelopmentLayer));
```

### 2. Production Deployment

```typescript
// Production agent service
class ProductionAgentService extends Effect.Service<ProductionAgentService>()(
  "ProductionAgentService",
  {
    effect: Effect.gen(function* () {
      return {
        deployAgent: (deployment: AgentDeployment) =>
          Effect.gen(function* () {
            // Validate deployment
            yield* DeploymentValidator.validate(deployment);

            // Create agent instance
            const agent = yield* AgentFactory.create(
              deployment.definition,
              deployment.config,
            );

            // Setup production monitoring
            yield* ProductionMonitoring.setup(agent, deployment);

            // Register with load balancer
            yield* LoadBalancerService.register(agent, deployment);

            // Health check
            yield* HealthCheckService.register(agent, deployment.healthCheck);

            return {
              agentId: deployment.id,
              status: "deployed",
              endpoint: deployment.endpoint,
            };
          }),
      };
    }),
  },
) {}
```

---

## 🧪 Agent Testing

### 1. Unit Testing

```typescript
import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { ResearchAgent } from "../src/research-agent.js";

describe("ResearchAgent", () => {
  const testLayer = ResearchAgent.Default.withConfig({
    maxSources: 5,
    analysisDepth: "shallow",
  });

  it("should research a topic successfully", async () => {
    const program = Effect.gen(function* () {
      const agent = yield* ResearchAgent;

      const result = yield* agent.research({
        text: "What are the latest developments in quantum computing?",
        maxSources: 5,
        analysisDepth: "shallow",
        synthesisModel: "claude-3.5-sonnet",
      });

      expect(result.sources).toHaveLength(5);
      expect(result.analyses).toHaveLength(5);
      expect(result.synthesis).toBeDefined();
      expect(result.synthesis.length).toBeGreaterThan(100);
    }).pipe(Effect.provide(testLayer));

    const result = await Effect.runPromise(program);
    expect(result.query).toBe(
      "What are the latest developments in quantum computing?",
    );
  });

  it("should handle search failures gracefully", async () => {
    const program = Effect.gen(function* () {
      const agent = yield* ResearchAgent;

      const result = yield* agent.research({
        text: "invalid query that will fail",
        maxSources: 0, // This will cause failure
        analysisDepth: "shallow",
        synthesisModel: "claude-3.5-sonnet",
      });

      return result;
    }).pipe(
      Effect.provide(testLayer),
      Effect.catchAll((error) => Effect.succeed(error)),
    );

    const result = await Effect.runPromise(program);
    expect(result._tag).toBe("Left");
  });
});
```

### 2. Integration Testing

```typescript
import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { AgentOrchestrator } from "../src/orchestrator.js";

describe("Agent Integration", () => {
  it("should coordinate multiple agents for complex task", async () => {
    const program = Effect.gen(function* () {
      const orchestrator = yield* AgentOrchestrator;

      const result = yield* orchestrator.coordinateAgents({
        type: "research-and-analysis",
        query: "Analyze the impact of AI on healthcare",
        requirements: {
          research: ["web-search", "academic-papers"],
          analysis: ["data-analysis", "trend-analysis"],
          synthesis: ["executive-summary"],
        },
      });

      expect(result.research).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(result.synthesis).toBeDefined();
      expect(result.overallQuality).toBeGreaterThan(0.8);
    }).pipe(Effect.provide(IntegrationTestLayer));

    const result = await Effect.runPromise(program);
    expect(result.status).toBe("completed");
  });
});
```

---

## 🔒 Security Considerations

### 1. API Key Management

```typescript
class SecureAgentConfig extends Effect.Service<SecureAgentConfig>()(
  "SecureAgentConfig",
  {
    effect: Effect.gen(function* () {
      return {
        getApiKey: (service: string) =>
          Effect.gen(function* () {
            // Use environment variables, never hardcode
            const apiKey = process.env[`${service.toUpperCase()}_API_KEY`];

            if (!apiKey) {
              return yield* Effect.fail(
                new Error(`API key not found for service: ${service}`),
              );
            }

            // Validate key format
            yield* ApiKeyValidator.validate(service, apiKey);

            return apiKey;
          }),
      };
    }),
  },
) {}
```

### 2. Input Validation

```typescript
class AgentSecurity extends Effect.Service<AgentSecurity>()("AgentSecurity", {
  effect: Effect.gen(function* () {
    return {
      validateInput: (input: unknown, schema: Schema) =>
        Effect.gen(function* () {
          // Validate against schema
          const validated = yield* Schema.decodeUnknown(schema)(input);

          // Additional security checks
          yield* SecurityScanner.scan(validated);

          // Check for malicious content
          yield* ContentSecurity.check(validated);

          return validated;
        }),
    };
  }),
}) {}
```

---

## 📈 Performance Optimization

### 1. Caching Strategy

```typescript
class AgentCache extends Effect.Service<AgentCache>()("AgentCache", {
  effect: Effect.gen(function* () {
    return {
      getCachedResult: (key: string) =>
        Effect.gen(function* () {
          const cached = yield* CacheService.get(key);

          if (cached) {
            yield* MetricsService.recordCacheHit(key);
            return cached;
          }

          yield* MetricsService.recordCacheMiss(key);
          return null;
        }),

      setCachedResult: (key: string, value: unknown, ttl: number) =>
        Effect.gen(function* () {
          yield* CacheService.set(key, value, { ttl });
          yield* MetricsService.recordCacheSet(key);
        }),
    };
  }),
}) {}
```

### 2. Parallel Processing

```typescript
class ParallelAgentProcessor extends Effect.Service<ParallelAgentProcessor>()(
  "ParallelAgentProcessor",
  {
    effect: Effect.gen(function* () {
      return {
        processParallel: (tasks: AgentTask[]) =>
          Effect.gen(function* () {
            // Process tasks in parallel
            const results = yield* Effect.all(
              tasks.map((task) =>
                Effect.gen(function* () {
                  // Check cache first
                  const cached = yield* AgentCache.getCachedResult(
                    task.cacheKey,
                  );
                  if (cached) return cached;

                  // Process task
                  const result = yield* processTask(task);

                  // Cache result
                  yield* AgentCache.setCachedResult(
                    task.cacheKey,
                    result,
                    task.ttl,
                  );

                  return result;
                }),
              ),
            );

            return results;
          }),
      };
    }),
  },
) {}
```

---

## 🛠️ Troubleshooting

### Common Agent Issues

1. **Agent State Machine Errors**

   ```bash
   # Check state machine definition
   bun run --filter effect-actor test

   # Validate state transitions
   bun run --filter my-agent test:state-machine
   ```

2. **Memory Service Issues**

   ```bash
   # Check memory service connectivity
   bun run --filter effect-supermemory test:connection

   # Validate memory operations
   bun run --filter my-agent test:memory
   ```

3. **LLM Integration Problems**

   ```bash
   # Check API key configuration
   bun run --filter effect-ai-sdk test:api-keys

   # Test LLM connectivity
   bun run --filter my-agent test:llm
   ```

### Debugging Tools

```typescript
// Agent debugging utilities
class AgentDebugger extends Effect.Service<AgentDebugger>()("AgentDebugger", {
  effect: Effect.gen(function* () {
    return {
      debugExecution: (agentId: string, execution: AgentExecution) =>
        Effect.gen(function* () {
          // Log detailed execution trace
          yield* DebugLogger.trace(agentId, execution);

          // Check for common issues
          const issues = yield* IssueDetector.detect(execution);

          if (issues.length > 0) {
            yield* AlertService.debug(agentId, issues);
          }

          return {
            execution,
            issues,
            recommendations: yield* IssueDetector.getRecommendations(issues),
          };
        }),
    };
  }),
}) {}
```

---

## 📚 Additional Resources

### Documentation

- **Effect.js Documentation** - <https://effect.website>
- **Agent Architecture Guide** - `docs/agent-architecture.md`
- **State Machine Patterns** - `docs/state-machines.md`
- **Service Patterns** - `docs/service-patterns.md`

### Examples

- **Simple Chat Agent** - `examples/simple-chat-agent/`
- **Research Assistant** - `examples/research-assistant/`
- **Multi-Agent System** - `examples/multi-agent-system/`
- **Task Automation** - `examples/task-automation/`

### Community

- **Effect Discord** - <https://discord.gg/effect-ts>
- **GitHub Discussions** - <https://github.com/PaulJPhilp/EffectTalk/discussions>
- **Agent Development Channel** - Discord #agent-development

---

## 🤝 Contributing to Agent Infrastructure

We welcome contributions to the agent infrastructure! Please follow these guidelines:

1. **Agent Patterns** - Follow established agent patterns and conventions
2. **Testing** - Maintain 85%+ coverage for all agent code
3. **Documentation** - Document new agent capabilities and patterns
4. **Security** - Ensure all agent implementations follow security guidelines
5. **Performance** - Optimize for performance and resource usage

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

**Status:** ✅ Active Development  
**Last Updated:** January 2026  
**Repository:** <https://github.com/PaulJPhilp/EffectTalk>

---

Built with ❤️ for the AI agent development community.
