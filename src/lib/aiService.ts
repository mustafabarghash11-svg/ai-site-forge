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

  // Helper: try to extract and emit thought as content accumulates
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
        callbacks.onThought?.(parsed);
        currentStepIndex = 0;
        callbacks.onStepComplete?.(0);
      } catch {}
    }
  };

  // Simulate steps completing as text streams in
  const tryAdvanceSteps = (content: string) => {
    if (!thoughtBlock || currentStepIndex >= thoughtBlock.steps.length - 1) return;
    // Each step completes roughly after each 600 chars of content past the thought block
    const thoughtEnd = content.indexOf("|||THOUGHT_END|||");
    if (thoughtEnd === -1) return;
    const afterThought = content.slice(thoughtEnd + "|||THOUGHT_END|||".length);
    const charsPerStep = 600;
    const expectedStep = Math.min(
      Math.floor(afterThought.length / charsPerStep),
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

          // Try to parse thought block as it arrives
          tryParseThought(fullContent);
          tryAdvanceSteps(fullContent);

          // Only stream the visible text part (after THOUGHT_END, before CODE_START)
          const thoughtEndMarker = "|||THOUGHT_END|||";
          const codeStartMarker = "|||CODE_START|||";
          const thoughtEndIdx = fullContent.indexOf(thoughtEndMarker);
          const codeMarkerIdx = fullContent.indexOf(codeStartMarker);

          if (thoughtEndIdx !== -1 && codeMarkerIdx === -1) {
            // Stream text between thought block and code marker
            const visibleStart = thoughtEndIdx + thoughtEndMarker.length;
            const prevVisibleLen = Math.max(0, fullContent.length - content.length - visibleStart);
            const newVisible = fullContent.slice(visibleStart);
            if (newVisible.length > prevVisibleLen) {
              callbacks.onTextDelta(content);
            }
          } else if (thoughtEndIdx === -1 && codeMarkerIdx === -1) {
            // No thought block yet - might be a conversational response
            const hasThoughtStart = fullContent.includes("|||THOUGHT_START|||");
            if (!hasThoughtStart) {
              callbacks.onTextDelta(content);
            }
          }
        }
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  // Flush remaining
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

  // Strip thought block from content before parsing the rest
  let processedContent = fullContent;
  const thoughtStart = processedContent.indexOf("|||THOUGHT_START|||");
  const thoughtEnd = processedContent.indexOf("|||THOUGHT_END|||");
  if (thoughtStart !== -1 && thoughtEnd !== -1) {
    processedContent =
      processedContent.slice(0, thoughtStart) +
      processedContent.slice(thoughtEnd + "|||THOUGHT_END|||".length);
  }

  // Parse the code result
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
