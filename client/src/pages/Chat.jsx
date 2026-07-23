import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

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
    <div className="page">
      <h2>Messages</h2>
      <p className="muted">
        Chat directly with the {user?.role === "customer" ? "providers" : "customers"} you work with.
      </p>

      {error && <div className="alert">{error}</div>}

      <div className="chat-layout">
        <aside className="chat-list">
          <button className="btn btn-small btn-dark chat-new" onClick={openContacts}>
            New chat
          </button>

          {conversations.length === 0 && (
            <p className="muted small chat-empty">No conversations yet.</p>
          )}

          {conversations.map((c) => (
            <button
              key={c.id}
              className={c.id === activeId ? "chat-item chat-item-active" : "chat-item"}
              onClick={() => setActiveId(c.id)}
            >
              <span className="chat-item-top">
                <span className="chat-name">{c.name}</span>
                {c.unread > 0 && <span className="chat-unread">{c.unread}</span>}
              </span>
              <span className="chat-preview">
                {c.lastMessage || "No messages yet"}
              </span>
            </button>
          ))}
        </aside>

        <section className="chat-thread">
          {!activeId ? (
            <p className="muted chat-placeholder">
              Select a conversation or start a new one.
            </p>
          ) : (
            <>
              <header className="chat-header">{activeName}</header>

              <div className="chat-messages">
                {messages.length === 0 && (
                  <p className="muted small">Say hello to start the conversation.</p>
                )}
                {messages.map((m) => {
                  const mine = m.sender?._id === user?.id;
                  return (
                    <div
                      key={m._id}
                      className={mine ? "bubble bubble-mine" : "bubble bubble-them"}
                    >
                      <span className="bubble-text">{m.content}</span>
                      <span className="bubble-time">
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

              <form className="chat-composer" onSubmit={send}>
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message"
                  maxLength={1000}
                />
                <button
                  className="btn btn-small btn-primary chat-send"
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
        <div className="modal-backdrop" onClick={() => setShowContacts(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Start a new chat</h3>
            {contacts.length === 0 ? (
              <p className="muted">
                No {user?.role === "customer" ? "providers" : "customers"} are registered yet.
              </p>
            ) : (
              <ul className="contact-list">
                {contacts.map((c) => (
                  <li key={c._id}>
                    <span>
                      {c.name}
                      <span className={`badge badge-${c.role}`}>{c.role}</span>
                    </span>
                    <button
                      className="btn btn-small btn-outline"
                      onClick={() => startChat(c._id)}
                    >
                      Chat
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="modal-actions">
              <button
                className="btn btn-small btn-outline"
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
