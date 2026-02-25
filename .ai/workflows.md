# 🔄 Governance Workflows

## 🎯 Agent Onboarding Flow
1. **Entry Point**: Agent starts in repository root.
2. **Read Anchor**: immediately read `ai_instructions.md`.
3. **Role Discovery**: read `agents.md` to determine desk.
4. **State Init**: open `/.agent_state/current_task.md` to understand current focus.
5. **Context Load**: read relevant `.ai_context.md` from domain folder.
6. **Begin Work**: follow the plan already written or create a new one if empty.

## 🔁 Ralph Wiggum Loop (Medic Workflow)
The Medic runs this loop on build/test failures:
1. **Detect**: CI reports failure → Medic reads logs from `/.agent_state/session_logs/`.
2. **Isolate**: Identify failing package or test.
3. **Heal**:
   - If dependency issue → update `go.mod` / `package.json`.
   - If type error → run `go vet` / `tsc` to diagnose.
   - If test flake → add retry logic or skip with justification.
4. **Re-run**: Execute targeted test command.
5. **Commit**: If healed, update `/.agent_state/memory_log.md` with the fix pattern.
6. **Exit Condition**: All tests pass; loop terminates.

**MAX_ITERATIONS = 7** to prevent infinite healing loops.

## 🤝 Handoff Protocol (Between Agents)
When one agent finishes and another must continue:
1. **Finalize**:
   - Clear `current_task.md` (status: DONE).
   - Append permanent decisions to `memory_log.md`.
2. **Signal**: Send a message via the orchestrator to the next agent with the updated `memory_log` excerpt.
3. **Clean Slate**: The orchestrator kills the worker process and starts the next agent fresh (Zero-Context-Rot).

## 🛡️ Skeptic Veto & Override
- A Skeptic can REJECT any PR with a `VETO` entry in `shared/VETO_LOG.json`:
  ```json
  {
    "task": "bench-002",
    "reason": "Missing index on category_id",
    "agent": "hammer",
    "timestamp": "2026-02-25T10:30:00Z"
  }
  ```
- The Architect must then revise `contract.yaml` or `architecture.md` to address the concern.
- A human `--interactive` approval can override a veto, but must be documented in the `memory_log`.

## 📊 Live Pulse Dashboard (Telegram)
The orchestrator pushes status updates to Telegram on every:
- Task phase transition
- Veto recorded
- Build/test result change
- Agent heartbeat missed

Messages follow a strict template with emoji indicators for rapid scanning.
