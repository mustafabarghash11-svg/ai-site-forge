import { CodeFile } from "@/components/CodePanel";
import { AIQuestion } from "@/components/QuestionsDialog";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-website`;

export interface ThoughtBlock {
  title: string;
  steps: string[];
}

export interface GenerationResult {
  reply: string;
  html: string;
  files: CodeFile[];
  questions?: AIQuestion[];
  thought?: ThoughtBlock;
}

interface StreamCallbacks {
  onTextDelta: (text: string) => void;
  onComplete: (result: GenerationResult) => void;
  onError: (error: string) => void;
  onThinking: (thinking: boolean) => void;
  onThought?: (thought: ThoughtBlock) => void;
  onStepComplete?: (stepIndex: number) => void;
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

// Build a fallback thought block from the user message if AI doesn't provide one
function buildFallbackThought(userMessage: string): ThoughtBlock {
  const msg = userMessage.toLowerCase();

  let title = "Building your website";
  let steps = [
    "Designing the layout and structure",
    "Writing HTML and CSS code",
    "Adding JavaScript interactions",
    "Making it responsive",
  ];

  if (msg.includes("portfolio") || msg.includes("personal")) {
    title = "Build personal portfolio site";
    steps = [
      "Design hero and about sections",
      "Build projects showcase grid",
      "Add contact form and links",
      "Polish animations and styling",
    ];
  } else if (msg.includes("ecommerce") || msg.includes("shop") || msg.includes("store") || msg.includes("product")) {
    title = "Create e-commerce landing page";
    steps = [
      "Design hero and product sections",
      "Build product cards and grid",
      "Add cart and checkout flow",
      "Style with modern design",
    ];
  } else if (msg.includes("dashboard") || msg.includes("admin") || msg.includes("saas")) {
    title = "Build SaaS dashboard UI";
    steps = [
      "Create sidebar navigation",
      "Build analytics chart components",
      "Add data tables and stats",
      "Implement dark theme styling",
    ];
  } else if (msg.includes("landing") || msg.includes("startup")) {
    title = "Create startup landing page";
    steps = [
      "Design hero with CTA section",
      "Build features and pricing",
      "Add testimonials section",
      "Finalize and polish design",
    ];
  } else if (msg.includes("blog") || msg.includes("article")) {
    title = "Build blog website";
    steps = [
      "Design blog layout and header",
      "Create article cards grid",
      "Add category and tag filters",
      "Style typography and reading view",
    ];
  } else if (msg.includes("auth") || msg.includes("login") || msg.includes("register")) {
    title = "Create auth and dashboard pages";
    steps = [
      "Create database tables and RLS",
      "Implement auth with OAuth",
      "Build projects dashboard page",
      "Update routing and auth guards",
    ];
  }

  return { title, steps };
}

export async function streamGenerateWebsite(
  messages: ChatMsg[],
  callbacks: StreamCallbacks
) {
  callbacks.onThinking(true);

  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok || !resp.body) {
    let errMsg = "Failed to connect to AI";
    try {
      const data = await resp.json();
      errMsg = data.error || errMsg;
    } catch {}
    callbacks.onError(errMsg);
    return;
  }

  callbacks.onThinking(false);

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let fullContent = "";
  let streamDone = false;

  // Thought block state
  let thoughtParsed = false;
  let thoughtBlock: ThoughtBlock | null = null;
  let currentStepIndex = -1;
  let fallbackEmitted = false;
  let charsAfterStart = 0; // chars received after thinking stopped

  // The last user message (used for fallback thought)
  const lastUserMsg = messages.filter((m) => m.role === "user").pop()?.content || "";

  const tryParseThought = (content: string) => {
    if (thoughtParsed) return;
    const start = content.indexOf("|||THOUGHT_START|||");
    const end = content.indexOf("|||THOUGHT_END|||");
    if (start !== -1 && end !== -1) {
      const json = content.slice(start + "|||THOUGHT_START|||".length, end).trim();
      try {
        const parsed: ThoughtBlock = JSON.parse(json);
        thoughtBlock = parsed;
        thoughtParsed = true;
        fallbackEmitted = true; // real thought found, no need for fallback
        callbacks.onThought?.(parsed);
        currentStepIndex = 0;
        callbacks.onStepComplete?.(0);
      } catch {}
    }
  };

  // Emit fallback thought if AI hasn't sent one after ~200 chars
  const tryEmitFallback = () => {
    if (thoughtParsed || fallbackEmitted) return;
    // Check if this looks like a code-generating response (not questions/chat)
    const hasQuestionsMarker = fullContent.includes("|||QUESTIONS_START|||");
    if (hasQuestionsMarker) return; // it's asking questions, no thought needed

    if (charsAfterStart > 200) {
      // AI didn't include thought block — build fallback
      const fallback = buildFallbackThought(lastUserMsg);
      thoughtBlock = fallback;
      fallbackEmitted = true;
      callbacks.onThought?.(fallback);
      currentStepIndex = 0;
      callbacks.onStepComplete?.(0);
    }
  };

  // Advance steps based on content length
  const tryAdvanceSteps = (content: string) => {
    if (!thoughtBlock || currentStepIndex >= thoughtBlock.steps.length - 1) return;

    let afterThoughtLen: number;
    const thoughtEndIdx = content.indexOf("|||THOUGHT_END|||");
    if (thoughtEndIdx !== -1) {
      afterThoughtLen = content.slice(thoughtEndIdx + "|||THOUGHT_END|||".length).length;
    } else {
      // fallback thought — measure from start of content
      afterThoughtLen = charsAfterStart;
    }

    const charsPerStep = 500;
    const expectedStep = Math.min(
      Math.floor(afterThoughtLen / charsPerStep),
      thoughtBlock.steps.length - 1
    );
    if (expectedStep > currentStepIndex) {
      currentStepIndex = expectedStep;
      callbacks.onStepComplete?.(currentStepIndex);
    }
  };

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        streamDone = true;
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) {
          fullContent += content;
          charsAfterStart += content.length;

          // Try to parse real thought block
          tryParseThought(fullContent);
          // Try fallback if no thought yet
          tryEmitFallback();
          // Advance steps
          tryAdvanceSteps(fullContent);

          // Determine what text to stream to user
          const thoughtEndMarker = "|||THOUGHT_END|||";
          const codeStartMarker = "|||CODE_START|||";
          const thoughtEndIdx = fullContent.indexOf(thoughtEndMarker);
          const codeMarkerIdx = fullContent.indexOf(codeStartMarker);

          const hasThoughtStart = fullContent.includes("|||THOUGHT_START|||");

          if (codeMarkerIdx !== -1) {
            // Don't stream anything once we hit code marker
          } else if (thoughtEndIdx !== -1) {
            // Stream text after the real thought block
            const visibleStart = thoughtEndIdx + thoughtEndMarker.length;
            const prevLen = fullContent.length - content.length;
            if (prevLen < visibleStart) {
              // This chunk straddles the boundary
              const newPart = fullContent.slice(visibleStart);
              if (newPart) callbacks.onTextDelta(newPart);
            } else {
              callbacks.onTextDelta(content);
            }
          } else if (!hasThoughtStart) {
            // No thought block at all — stream directly (conversational or fallback path)
            callbacks.onTextDelta(content);
          }
          // else: we're inside |||THOUGHT_START||| ... |||THOUGHT_END||| — don't stream
        }
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  // Flush remaining buffer
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) fullContent += content;
      } catch {}
    }
  }

  // Mark all steps complete at the end
  if (thoughtBlock) {
    callbacks.onStepComplete?.(thoughtBlock.steps.length - 1);
  }

  // Check for questions
  const questionsStartIdx = fullContent.indexOf("|||QUESTIONS_START|||");
  const questionsEndIdx = fullContent.indexOf("|||QUESTIONS_END|||");

  if (questionsStartIdx !== -1 && questionsEndIdx !== -1) {
    const questionsJson = fullContent
      .slice(questionsStartIdx + "|||QUESTIONS_START|||".length, questionsEndIdx)
      .trim();
    try {
      const questions: AIQuestion[] = JSON.parse(questionsJson);
      callbacks.onComplete({ reply: "", html: "", files: [], questions });
      return;
    } catch (e) {
      console.error("Failed to parse questions JSON:", e);
    }
  }

  // Strip real thought block from content before parsing
  let processedContent = fullContent;
  const tStart = processedContent.indexOf("|||THOUGHT_START|||");
  const tEnd = processedContent.indexOf("|||THOUGHT_END|||");
  if (tStart !== -1 && tEnd !== -1) {
    processedContent =
      processedContent.slice(0, tStart) +
      processedContent.slice(tEnd + "|||THOUGHT_END|||".length);
  }

  // Parse code result
  const markerIdx = processedContent.indexOf("|||CODE_START|||");
  if (markerIdx !== -1) {
    const textPart = processedContent.slice(0, markerIdx).trim();
    const codePart = processedContent.slice(markerIdx + "|||CODE_START|||".length).trim();

    let html = "";
    let files: CodeFile[] = [];

    try {
      const jsonStart = codePart.indexOf("{");
      const jsonEnd = codePart.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = codePart.slice(jsonStart, jsonEnd + 1);
        const data = JSON.parse(jsonStr);
        html = data.previewHtml || "";
        files = (data.files || []).map((f: any) => ({
          name: f.name || "file",
          language: f.language || "html",
          content: f.content || "",
        }));
      }
    } catch (e) {
      console.error("Failed to parse code JSON:", e);
    }

    callbacks.onComplete({ reply: textPart, html, files, thought: thoughtBlock || undefined });
  } else {
    callbacks.onComplete({
      reply: processedContent.trim(),
      html: "",
      files: [],
      thought: thoughtBlock || undefined,
    });
  }
}
