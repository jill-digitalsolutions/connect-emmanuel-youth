"use client";

import { useMemo, useRef, useState } from "react";
import { Send, SmilePlus, Trash2 } from "lucide-react";
import clsx from "clsx";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";
import { mergeChange } from "@/lib/utils/realtime";
import { useCurrentUser } from "@/lib/context/CurrentUserContext";
import type { ChatEmoji, ChatMessage, ChatReaction } from "@/lib/types/database.types";
import type { ProfileLite } from "@/lib/utils/profiles";
import { MESSENGER_URL, ZOOM_URL } from "@/lib/utils/constants";

const EMOJI: { key: ChatEmoji; char: string; label: string }[] = [
  { key: "heart", char: "❤️", label: "Love" },
  { key: "like", char: "👍", label: "Like" },
  { key: "laugh", char: "😂", label: "Haha" },
  { key: "sad", char: "😢", label: "Sad" },
];

type Member = { id: string; name: string; username: string; avatar_url: string | null };

// Turns "@maria hi" into pieces so known @usernames can be highlighted.
function renderBody(body: string, known: Map<string, Member>, mine: boolean, myUsername: string | null) {
  return body.split(/(@[a-z0-9._-]{3,30})/gi).map((part, i) => {
    if (part.startsWith("@")) {
      // Trailing punctuation ("@maria.") isn't part of the username.
      const core = part.replace(/[._-]+$/, "");
      const tail = part.slice(core.length);
      if (known.has(core.slice(1).toLowerCase())) {
        const toMe = myUsername && core.slice(1).toLowerCase() === myUsername.toLowerCase();
        return (
          <span key={i}>
            <span
              className={clsx(
                "rounded px-1 font-bold",
                mine ? "bg-white/25 text-white" : toMe ? "bg-amber/30 text-text" : "bg-accent-to/15 text-accent-to"
              )}
            >
              {core}
            </span>
            {tail}
          </span>
        );
      }
    }
    return part;
  });
}

function clock(iso: string) {
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T"));
  const today = new Date().toDateString() === d.toDateString();
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return today ? time : `${d.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
}

export function ChatClient({
  initialMessages,
  initialReactions,
  profilesById,
}: {
  initialMessages: ChatMessage[];
  initialReactions: ChatReaction[];
  profilesById: Map<string, ProfileLite>;
}) {
  const me = useCurrentUser();
  const toast = useToast();
  const [messages, setMessages] = useState(initialMessages); // newest first
  const [reactions, setReactions] = useState(initialReactions);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [mention, setMention] = useState<{ query: string; start: number } | null>(null);
  const [mentionIdx, setMentionIdx] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const members = useMemo(
    () =>
      [...profilesById.entries()]
        .filter(([, p]) => p.username)
        .map(([id, p]) => ({ id, name: p.name, username: p.username as string, avatar_url: p.avatar_url })),
    [profilesById]
  );
  const knownByUsername = useMemo(() => new Map(members.map((m) => [m.username.toLowerCase(), m])), [members]);
  const suggestions = useMemo(() => {
    if (!mention) return [];
    const q = mention.query.toLowerCase();
    return members
      .filter((m) => m.id !== me.id && (m.username.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)))
      .slice(0, 6);
  }, [mention, members, me.id]);

  function updateText(value: string, caret: number) {
    setText(value);
    // An "@word" right before the caret opens the tag picker.
    const m = /(^|\s)@([a-z0-9._-]*)$/i.exec(value.slice(0, caret));
    if (m) {
      setMention({ query: m[2], start: caret - m[2].length - 1 });
      setMentionIdx(0);
    } else {
      setMention(null);
    }
  }

  function pickMention(member: Member) {
    if (!mention) return;
    const caret = inputRef.current?.selectionStart ?? text.length;
    const next = `${text.slice(0, mention.start)}@${member.username} ${text.slice(caret)}`;
    const pos = mention.start + member.username.length + 2;
    setText(next);
    setMention(null);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(pos, pos);
    });
  }
  const [sending, setSending] = useState(false);

  useRealtimeTable<ChatMessage>("chat_messages", (payload) => {
    setMessages((prev) => mergeChange(prev, payload));
  });

  useRealtimeTable<ChatReaction>("chat_reactions", (payload) => {
    setReactions((prev) => mergeChange(prev, payload));
  });

  async function toggleReaction(messageId: string, emoji: ChatEmoji) {
    setPickerFor(null);
    const supabase = createClient();
    const existing = reactions.find((r) => r.message_id === messageId && r.user_id === me.id && r.emoji === emoji);
    if (existing) {
      setReactions((prev) => prev.filter((r) => r.id !== existing.id));
      const { error } = await supabase.from("chat_reactions").delete().eq("id", existing.id);
      if (error) {
        setReactions((prev) => [existing, ...prev]);
        toast(error.message);
      }
      return;
    }
    const { data, error } = await supabase
      .from("chat_reactions")
      .insert({ message_id: messageId, user_id: me.id, emoji })
      .select()
      .single();
    if (error) {
      toast(/chat_reactions/.test(error.message) ? "Reactions aren't set up yet — run the reactions SQL in Supabase." : error.message);
      return;
    }
    setReactions((prev) => (prev.some((r) => r.id === data.id) ? prev : [data, ...prev]));
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({ sender_id: me.id, body })
      .select()
      .single();
    setSending(false);
    if (error) {
      toast(/chat_messages/.test(error.message) ? "Chat isn't set up yet — run the chat SQL in Supabase." : error.message);
      return;
    }
    setText("");
    setMention(null);
    setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [data, ...prev]));
  }

  async function remove(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("chat_messages").delete().eq("id", id);
    if (error) toast(error.message);
  }

  return (
    <div>
      <Card className="flex h-[calc(100dvh-230px)] min-h-[360px] flex-col p-0">
        <div className="border-b border-line px-4 py-3">
          <div className="text-sm font-extrabold">Youth Chat</div>
          <div className="text-xs text-text-soft">Everyone in CONNECT · live</div>
        </div>

        <div className="flex flex-1 flex-col-reverse gap-2.5 overflow-y-auto px-4 py-3">
          {messages.length === 0 && (
            <p className="m-auto text-center text-[13px] text-text-soft">No messages yet — say hello 👋</p>
          )}
          {messages.map((m, i) => {
            const mine = m.sender_id === me.id;
            const sender = profilesById.get(m.sender_id);
            const name = mine ? me.name : (sender?.name ?? "Member");
            // Older neighbour in the list = next index (list is newest-first).
            const counts = EMOJI.map((e) => {
              const list = reactions.filter((r) => r.message_id === m.id && r.emoji === e.key);
              return { ...e, count: list.length, mine: list.some((r) => r.user_id === me.id) };
            }).filter((e) => e.count > 0);
            const showName = messages[i + 1]?.sender_id !== m.sender_id;
            return (
              <div key={m.id} className={clsx("group flex items-end gap-2", mine && "flex-row-reverse")}>
                <div className="w-8 flex-none">
                  {showName && <Avatar name={name} avatarUrl={mine ? me.avatar_url : sender?.avatar_url} size={32} />}
                </div>
                <div className={clsx("flex max-w-[78%] flex-col", mine ? "items-end" : "items-start")}>
                  {showName && !mine && <span className="mb-0.5 px-1 text-[11px] font-bold text-text-soft">{name}</span>}
                  <div
                    className={clsx(
                      "rounded-2xl px-3.5 py-2 text-[14px] leading-snug break-words whitespace-pre-wrap",
                      mine ? "rounded-br-md bg-gradient-to-r from-accent-from to-accent-to text-white" : "rounded-bl-md bg-page text-text"
                    )}
                  >
                    {renderBody(m.body, knownByUsername, mine, me.username)}
                  </div>
                  <div className={clsx("relative mt-1 flex flex-wrap items-center gap-1", mine && "justify-end")}>
                    {counts.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => toggleReaction(m.id, c.key)}
                        aria-label={`${c.label} (${c.count})`}
                        aria-pressed={c.mine}
                        className={clsx(
                          "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[12px] transition",
                          c.mine ? "border-accent-to bg-accent-to/15 font-bold" : "border-line bg-surface hover:bg-page"
                        )}
                      >
                        <span>{c.char}</span>
                        <span className="text-[11px]">{c.count}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPickerFor(pickerFor === m.id ? null : m.id)}
                      aria-label="Add reaction"
                      className={clsx(
                        "flex h-6 w-6 items-center justify-center rounded-full text-text-soft transition hover:bg-page",
                        pickerFor === m.id ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
                      )}
                    >
                      <SmilePlus className="h-3.5 w-3.5" />
                    </button>
                    {pickerFor === m.id && (
                      <div
                        className={clsx(
                          "absolute bottom-full z-10 mb-1 flex gap-0.5 rounded-full border border-line bg-surface px-1.5 py-1 shadow-lg",
                          mine ? "right-0" : "left-0"
                        )}
                      >
                        {EMOJI.map((e) => (
                          <button
                            key={e.key}
                            type="button"
                            onClick={() => toggleReaction(m.id, e.key)}
                            aria-label={e.label}
                            className="rounded-full px-1.5 py-0.5 text-[20px] transition hover:scale-125"
                          >
                            {e.char}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="mt-0.5 flex items-center gap-1.5 px-1 text-[10px] text-text-soft">
                    {clock(m.created_at)}
                    {(mine || me.role === "admin") && (
                      <button
                        type="button"
                        onClick={() => remove(m.id)}
                        aria-label="Delete message"
                        className="opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={send} className="relative flex items-end gap-2 border-t border-line p-3">
          {mention && suggestions.length > 0 && (
            <div className="absolute right-3 bottom-[62px] left-3 z-20 overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
              {suggestions.map((m, i) => (
                <button
                  key={m.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pickMention(m);
                  }}
                  className={clsx(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left",
                    i === mentionIdx ? "bg-page" : "hover:bg-page"
                  )}
                >
                  <Avatar name={m.name} avatarUrl={m.avatar_url} size={28} />
                  <span className="min-w-0 truncate text-[13.5px] font-bold">{m.name}</span>
                  <span className="truncate text-[12.5px] text-text-soft">@{m.username}</span>
                </button>
              ))}
            </div>
          )}
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => updateText(e.target.value, e.target.selectionStart)}
            onKeyDown={(e) => {
              if (mention && suggestions.length > 0) {
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  const step = e.key === "ArrowDown" ? 1 : -1;
                  setMentionIdx((i) => (i + step + suggestions.length) % suggestions.length);
                  return;
                }
                if (e.key === "Enter" || e.key === "Tab") {
                  e.preventDefault();
                  pickMention(suggestions[mentionIdx] ?? suggestions[0]);
                  return;
                }
                if (e.key === "Escape") {
                  setMention(null);
                  return;
                }
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder="Message everyone… use @ to tag someone"
            className="max-h-28 min-h-[42px] flex-1 resize-none rounded-2xl border border-line bg-surface px-4 py-2.5 text-[14px] text-text focus:border-accent-to focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            aria-label="Send"
            className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full bg-gradient-to-r from-accent-from to-accent-to text-white transition hover:brightness-105 disabled:opacity-50"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </form>
      </Card>

      <p className="mt-3 text-center text-xs text-text-soft">
        Prefer another app?{" "}
        <a href={MESSENGER_URL} target="_blank" rel="noopener noreferrer" className="font-bold text-accent-to">
          Messenger
        </a>{" "}
        ·{" "}
        <a href={ZOOM_URL} target="_blank" rel="noopener noreferrer" className="font-bold text-accent-to">
          Zoom
        </a>
      </p>
    </div>
  );
}
