# Local AI setup and final live gate

Keep the API credential private. Add it only to the repository-root `.env.local` file, which is git-ignored. Do not paste it into chat, a test command, a screenshot, a log, or a committed file. Configure exactly one of the allowlisted provider/model combinations below; the server does not silently fall back between providers or models.

Open the private file locally, then enter one configuration below in the editor:

```bash
umask 077
${EDITOR:-vi} .env.local
```

OpenRouter with the verified free, tool-capable Nemotron endpoint uses the Agents SDK Chat Completions transport:

```dotenv
OPENROUTER_API_KEY=your-private-openrouter-key
BWMI_OPENAI_BASE_URL=https://openrouter.ai/api/v1
BWMI_OPENAI_MODEL=nvidia/nemotron-3.5-lightning:free
```

Official OpenAI uses the Agents SDK Responses transport:

```dotenv
OPENAI_API_KEY=your-private-key
BWMI_OPENAI_BASE_URL=https://api.openai.com/v1
BWMI_OPENAI_MODEL=gpt-5.6-sol
```

Start the application:

```bash
pnpm dev
```

Then choose an electronics product that is genuinely unseen by the implementation and fixtures, and run the configured real-model browser gate in a separate terminal. Supply the product at runtime:

```bash
RUN_LIVE_OPENAI_GUIDANCE=1 BWMI_BLACK_BOX_PRODUCT="your unseen electronics product" pnpm test:browser --grep "configured Agents SDK handles an unseen electronics product"
```

The browser gate must exercise the real `POST /api/chat` Agents SDK path and produce product-specific, cited, fail-closed guidance without source changes. The injected-provider orchestration harness is a separate key-independent integration test and is not evidence that the live provider works:

```bash
pnpm test:unseen-harness -- "a different runtime-supplied electronics product"
```

After testing, stop the server you started. Keep `.env.local` private; do not ask a collaborator to read, echo, or report the key.
