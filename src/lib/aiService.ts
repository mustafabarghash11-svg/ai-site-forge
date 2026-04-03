import { CodeFile } from "@/components/CodePanel";
import { AIQuestion } from "@/components/QuestionsDialog";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-website`;

export interface GenerationResult {
  reply: string;
  html: string;
  files: CodeFile[];
  questions?: AIQuestion[];
}

interface StreamCallbacks {
  onTextDelta: (text: string) => void;
  onComplete: (result: GenerationResult) => void;
  onError: (error: string) => void;
  onThinking: (thinking: boolean) => void;
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
          // Only stream the text part (before code marker)
          const markerIdx = fullContent.indexOf("|||CODE_START|||");
          if (markerIdx === -1) {
            callbacks.onTextDelta(content);
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

  // Check for questions
  const questionsStartIdx = fullContent.indexOf("|||QUESTIONS_START|||");
  const questionsEndIdx = fullContent.indexOf("|||QUESTIONS_END|||");
  
  if (questionsStartIdx !== -1 && questionsEndIdx !== -1) {
    const questionsJson = fullContent.slice(
      questionsStartIdx + "|||QUESTIONS_START|||".length,
      questionsEndIdx
    ).trim();
    
    try {
      const questions: AIQuestion[] = JSON.parse(questionsJson);
      callbacks.onComplete({ reply: "", html: "", files: [], questions });
      return;
    } catch (e) {
      console.error("Failed to parse questions JSON:", e);
    }
  }

  // Parse the code result
  const markerIdx = fullContent.indexOf("|||CODE_START|||");
  if (markerIdx !== -1) {
    const textPart = fullContent.slice(0, markerIdx).trim();
    const codePart = fullContent.slice(markerIdx + "|||CODE_START|||".length).trim();

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

    callbacks.onComplete({ reply: textPart, html, files });
  } else {
    callbacks.onComplete({ reply: fullContent.trim(), html: "", files: [] });
  }
}
