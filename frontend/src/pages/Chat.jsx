import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const MUTED = "mt-0 text-[0.95rem] text-ink-soft";
const ALERT =
  "mt-4 rounded-[7px] border border-danger-line bg-danger-bg px-[0.8rem] py-[0.6rem] text-[0.9rem] text-danger-text";
const BTN_SMALL =
  "cursor-pointer rounded-lg px-[0.85rem] py-[0.45rem] text-[0.85rem] font-semibold transition-colors duration-150 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none";
const BTN_DARK = `${BTN_SMALL} bg-ink text-white hover:bg-[#33434f]`;
const BTN_OUTLINE = `${BTN_SMALL} border border-line bg-transparent text-ink hover:border-ink`;
const CHAT_ITEM =
  "flex w-full cursor-pointer flex-col gap-[0.3rem] rounded-[7px] px-[0.9rem] py-[0.85rem] text-left";
const BADGE =
  "ml-[0.45rem] inline-block rounded-full px-[0.55rem] py-[0.18rem] text-[0.72rem] font-bold uppercase tracking-[0.05em]";
const BADGE_TONE = {
  customer: "bg-[#e4edf6] text-[#2b5d8a]",
  provider: "bg-[#fdeed3] text-[#a06a04]",
  admin: "bg-ink text-white",
};

export default function Chat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [contacts, setContacts] = useState([]);
  const [showContacts, setShowContacts] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadConversations = async () => {
    try {
      const res = await api.get("/chat/conversations");
      setConversations(res.data.conversations);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load conversations.");
    }
  };

  const loadMessages = async (id) => {
    try {
      const res = await api.get(`/chat/conversations/${id}/messages`);
      setMessages(res.data.messages);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load messages.");
    }
  };

  useEffect(() => {
    loadConversations();
    const timer = setInterval(loadConversations, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId);
    const timer = setInterval(() => loadMessages(activeId), 1500);
    return () => clearInterval(timer);
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const openContacts = async () => {
    setError("");
    try {
      const res = await api.get("/chat/contacts");
      setContacts(res.data.contacts);
      setShowContacts(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load contacts.");
    }
  };

  const startChat = async (contactId) => {
    setError("");
    try {
      const res = await api.post("/chat/conversations", { userId: contactId });
      setShowContacts(false);
      await loadConversations();
      setActiveId(res.data.conversationId);
    } catch (err) {
      setError(err.response?.data?.message || "Could not start chat.");
    }
  };

  const send = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !activeId) return;
    setSending(true);
    setError("");
    try {
      await api.post(`/chat/conversations/${activeId}/messages`, {
        content: text,
      });
      setDraft("");
      await loadMessages(activeId);
      await loadConversations();
    } catch (err) {
      setError(err.response?.data?.message || "Message not sent.");
    } finally {
      setSending(false);
    }
  };

  const activeName =
    conversations.find((c) => c.id === activeId)?.name || "Conversation";

  return (
    <div className="flex-1 px-8 py-10">
      <h2 className="mb-1 text-2xl font-bold">Messages</h2>
      <p className={MUTED}>
        Chat directly with the {user?.role === "customer" ? "providers" : "customers"} you work with.
      </p>

      {error && <div className={ALERT}>{error}</div>}

      <div className="mt-6 grid h-[calc(100vh-220px)] min-h-[480px] grid-cols-[340px_1fr] gap-5 max-[900px]:h-auto max-[900px]:grid-cols-1">
        <aside className="flex flex-col gap-[0.5rem] overflow-y-auto rounded-lg border border-line bg-surface p-4 max-[900px]:max-h-[240px]">
          <button
            className={`${BTN_DARK} mb-[0.5rem] w-full !py-3 !text-[1rem]`}
            onClick={openContacts}
          >
            New chat
          </button>

          {conversations.length === 0 && (
            <p className="mt-6 text-center text-base text-ink-soft">
              No conversations yet.
            </p>
          )}

          {conversations.map((c) => (
            <button
              key={c.id}
              className={
                c.id === activeId
                  ? `${CHAT_ITEM} border border-brand bg-[#f4f1ea]`
                  : `${CHAT_ITEM} border border-transparent bg-transparent hover:bg-[#f4f1ea]`
              }
              onClick={() => setActiveId(c.id)}
            >
              <span className="flex items-center justify-between gap-[0.4rem]">
                <span className="text-[1.02rem] font-semibold">{c.name}</span>
                {c.unread > 0 && (
                  <span className="rounded-full bg-brand px-[0.5rem] py-[0.1rem] text-[0.78rem] font-bold text-ink">
                    {c.unread}
                  </span>
                )}
              </span>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.88rem] text-ink-soft">
                {c.lastMessage || "No messages yet"}
              </span>
            </button>
          ))}
        </aside>

        <section className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface max-[900px]:h-[420px]">
          {!activeId ? (
            <p className="m-auto text-lg text-ink-soft">
              Select a conversation or start a new one.
            </p>
          ) : (
            <>
              <header className="border-b border-line bg-[#fbfaf7] px-[1.1rem] py-[0.8rem] font-bold">
                {activeName}
              </header>

              <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-[1.1rem] py-4">
                {messages.length === 0 && (
                  <p className="mb-0 mt-[0.4rem] text-[0.8rem] text-ink-soft">
                    Say hello to start the conversation.
                  </p>
                )}
                {messages.map((m) => {
                  const mine = m.sender?._id === user?.id;
                  return (
                    <div
                      key={m._id}
                      className={
                        mine
                          ? "flex max-w-[70%] flex-col gap-[0.2rem] self-end rounded-xl rounded-br-[3px] bg-brand px-[0.8rem] py-[0.55rem] text-ink"
                          : "flex max-w-[70%] flex-col gap-[0.2rem] self-start rounded-xl rounded-bl-[3px] bg-[#eeeae2] px-[0.8rem] py-[0.55rem] text-ink"
                      }
                    >
                      <span className="break-words text-[0.92rem]">{m.content}</span>
                      <span className="self-end text-[0.68rem] opacity-70">
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <form
                className="flex gap-2 border-t border-line p-3"
                onSubmit={send}
              >
                <input
                  className="flex-1 rounded-[7px] border border-line bg-white px-[0.8rem] py-[0.6rem] text-ink focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/20"
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message"
                  maxLength={1000}
                />
                <button
                  className={`${BTN_SMALL} w-auto bg-brand text-ink hover:bg-brand-dark hover:text-white disabled:cursor-wait disabled:opacity-60`}
                  type="submit"
                  disabled={sending || !draft.trim()}
                >
                  Send
                </button>
              </form>
            </>
          )}
        </section>
      </div>

      {showContacts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4"
          onClick={() => setShowContacts(false)}
        >
          <div
            className="w-full max-w-[400px] rounded-lg bg-surface p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="m-0 mb-2 text-[1.17rem] font-bold">Start a new chat</h3>
            {contacts.length === 0 ? (
              <p className={MUTED}>
                No {user?.role === "customer" ? "providers" : "customers"} are registered yet.
              </p>
            ) : (
              <ul className="m-0 mt-2 list-none p-0">
                {contacts.map((c) => (
                  <li
                    className="flex items-center justify-between border-b border-line py-2 text-[0.92rem] last:border-b-0"
                    key={c._id}
                  >
                    <span>
                      {c.name}
                      <span className={`${BADGE} ${BADGE_TONE[c.role] || ""}`}>
                        {c.role}
                      </span>
                    </span>
                    <button
                      className={BTN_OUTLINE}
                      onClick={() => startChat(c._id)}
                    >
                      Chat
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-[1.4rem] flex justify-end gap-[0.6rem]">
              <button
                className={BTN_OUTLINE}
                onClick={() => setShowContacts(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
