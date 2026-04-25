"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";

// Web Speech API types (the lib dom types are incomplete across browsers)
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

interface Props {
  onTranscriptChange: (value: string) => void;
  aiEnabled?: boolean;
  /** Starting value if an existing note is already present */
  initialText?: string;
  /** Called when the AI returns clean structured text */
  onStructured?: (summary: string, tags: string[]) => void;
}

/**
 * Voice note recorder — uses the browser's Web Speech API for live
 * transcription (Chrome/Edge/Safari iOS). The raw transcript is appended to
 * the caller's notes field; an optional "Nettoyer avec l'IA" button then
 * rewrites the text into a clean CRM note via /api/ai/structure-note.
 */
export function VoiceNoteRecorder({ onTranscriptChange, aiEnabled, initialText = "", onStructured }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState(initialText);
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setSupported(false);
      return;
    }
    const rec = new Ctor();
    rec.lang = "fr-FR";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalChunk += res[0].transcript;
        else interimChunk += res[0].transcript;
      }
      if (finalChunk) {
        setTranscript((prev) => {
          const sep = prev && !/[\s.]$/.test(prev) ? " " : "";
          const next = prev + sep + finalChunk.trim();
          onTranscriptChange(next);
          return next;
        });
      }
      setInterim(interimChunk);
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        addToast("Microphone refusé. Autorisez l'accès dans votre navigateur.", "error");
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        addToast(`Erreur micro : ${event.error}`, "error");
      }
      setIsRecording(false);
    };

    rec.onend = () => {
      setIsRecording(false);
      setInterim("");
    };

    recognitionRef.current = rec;
    return () => {
      rec.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function start() {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.start();
      setIsRecording(true);
    } catch {
      // already started
    }
  }

  function stop() {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }

  function clearAll() {
    setTranscript("");
    setInterim("");
    onTranscriptChange("");
  }

  async function cleanupWithAI() {
    if (!transcript.trim()) return;
    setCleaning(true);
    try {
      const res = await fetch("/api/ai/structure-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw: transcript }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur IA");
      }
      const data = (await res.json()) as { summary: string; tags: string[] };
      setTranscript(data.summary);
      onTranscriptChange(data.summary);
      onStructured?.(data.summary, data.tags || []);
      addToast("Note nettoyée avec l'IA", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Erreur IA", "error");
    } finally {
      setCleaning(false);
    }
  }

  if (!supported) {
    return (
      <p className="text-xs text-stone-400 dark:text-stone-500">
        Dictée vocale non supportée par ce navigateur. Utilisez Chrome, Edge ou Safari pour dicter vos notes.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={isRecording ? stop : start}
          aria-pressed={isRecording}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-95 ${
            isRecording
              ? "bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse"
              : "bg-anthracite-900 text-white hover:bg-anthracite-800 dark:bg-brand-500 dark:text-anthracite-950 dark:hover:bg-brand-400"
          }`}
        >
          {isRecording ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
              </span>
              Stopper
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
              Dicter une note
            </>
          )}
        </button>

        {aiEnabled && transcript && !isRecording && (
          <button
            type="button"
            onClick={cleanupWithAI}
            disabled={cleaning}
            className="flex items-center gap-1.5 rounded-full border border-brand-300 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-100 disabled:opacity-50 dark:border-brand-600 dark:bg-brand-900/30 dark:text-brand-200"
          >
            {cleaning ? (
              <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
              </svg>
            )}
            Nettoyer avec l&apos;IA
          </button>
        )}

        {transcript && !isRecording && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-stone-400 hover:text-red-600 dark:text-stone-500 dark:hover:text-red-400"
          >
            Effacer
          </button>
        )}
      </div>

      {(transcript || interim) && (
        <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3 text-sm text-anthracite-800 dark:border-stone-700 dark:bg-anthracite-800/50 dark:text-stone-200">
          {transcript}
          {interim && (
            <span className="italic text-stone-400 dark:text-stone-500"> {interim}</span>
          )}
        </div>
      )}

      {!transcript && !interim && !isRecording && (
        <p className="text-xs text-stone-400 dark:text-stone-500">
          Tapez le micro, parlez en français, votre note s&apos;écrit toute seule.
        </p>
      )}
    </div>
  );
}
