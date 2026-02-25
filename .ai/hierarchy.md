# ⚖️ RECHTE: Rule Hierarchy

To prevent agent confusion, use the following precedence (highest priority first):

1.  **Direct Human Intervention**: Explicit instructions in the current chat.
2.  **Local Context (`**/.ai_context.md`)**: Domain-specific rules (e.g., Backend SQL vs Frontend CSS).
3.  **Governance (`/.ai/`)**: Project-wide standards and architecture.
4.  **The Anchor (`/ai_instructions.md`)**: Global agent behavior protocol.
5.  **General AI Knowledge**: Pre-trained patterns (use only if no specific project rule exists).

*Note: If an agent finds a conflict between a local rule and a global standard, it must flag this in `/.agent_state/current_task.md` before proceeding.*
