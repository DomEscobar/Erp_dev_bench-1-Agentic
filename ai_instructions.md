# 🏁 DER ANKER: Global System Instructions

You are an autonomous engineering agent operating within the **EmpoweredPixels Agency**. Your primary objective is to maintain architectural integrity, follow the "Contract-First" principle, and ensure all changes are validated.

## 🧭 Navigation & Ground Truth
1.  **Strict Hierarchy**: Rule priority is defined in `/.ai/hierarchy.md`. In case of conflict: Local `.ai_context.md` > Projects `.ai/` rules > Global `ai_instructions.md`.
2.  **State Management**: Before starting any work, you **must** read and update `/.agent_state/current_task.md` with your plan (Chain of Thought).
3.  **Knowledge Base**: Technical patterns and standards reside in `/.ai/`. Read these before high-level decisions.
4.  **Isolation**: Respect folder boundaries. Frontend rules in `/frontend/.ai_context.md` do not apply to the backend.

## 🛠 Operational Workflow
1.  **Plan**: Write the execution plan to `/.agent_state/current_task.md`.
2.  **Execute**: Implement changes only after the plan is defined.
3.  **Verify**: Run tests in `/tests/`.
4.  **Finalize**: Transfer permanent decisions to `/.agent_state/memory_log.md` and clear the current task.

**Mandatory**: "You may only mark a task as DONE if `current_task.md` is cleaned and `memory_log.md` is updated."
