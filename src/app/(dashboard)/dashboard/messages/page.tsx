"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import {
  MessageSquare, Send, ArrowLeft, Search, Loader2, User
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  sender: Profile;
}

interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string | null;
  participant1: Profile;
  participant2: Profile;
  last_message: { content: string; sender_id: string; created_at: string } | null;
  unread_count: number;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // New conversation
  const [showNewConv, setShowNewConv] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<Profile[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch current user
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.profile?.id) setCurrentUserId(data.profile.id);
      } catch {}
    })();
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (data.conversations) setConversations(data.conversations);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async () => {
    if (!activeConvId) return;
    try {
      const res = await fetch(`/api/messages?conversation_id=${activeConvId}`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch {
    } finally {
      setMessagesLoading(false);
    }
  }, [activeConvId]);

  useEffect(() => {
    if (activeConvId) {
      setMessagesLoading(true);
      fetchMessages();
    }
  }, [activeConvId, fetchMessages]);

  // Poll for new messages every 10s (pause when tab is hidden)
  useEffect(() => {
    if (!activeConvId) return;

    const startPolling = () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => {
        if (!document.hidden) fetchMessages();
      }, 10000);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        if (pollRef.current) clearInterval(pollRef.current);
      } else {
        fetchMessages(); // Fetch immediately on return
        startPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [activeConvId, fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Search users for new conversation
  useEffect(() => {
    if (!userQuery.trim() || userQuery.length < 2) {
      setUserResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(userQuery)}`);
        const data = await res.json();
        if (data.users) setUserResults(data.users);
      } catch {
      } finally {
        setSearchingUsers(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userQuery]);

  const getOtherParticipant = (conv: Conversation): Profile => {
    return conv.participant_1 === currentUserId ? conv.participant2 : conv.participant1;
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConvId) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: activeConvId,
          content: newMessage.trim(),
        }),
      });
      if (res.ok) {
        setNewMessage("");
        await fetchMessages();
        fetchConversations();
      }
    } catch {
    } finally {
      setSending(false);
    }
  };

  const startConversation = async (recipientId: string) => {
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_id: recipientId,
          content: "Hey! 👋",
        }),
      });
      const data = await res.json();
      if (data.conversation_id) {
        setShowNewConv(false);
        setUserQuery("");
        await fetchConversations();
        setActiveConvId(data.conversation_id);
      }
    } catch {
    } finally {
      setSending(false);
    }
  };

  // Mobile: show chat view or list
  const showChat = !!activeConvId;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground text-sm mt-1">Private messages with other traders</p>
        </div>
        {!showNewConv && (
          <Button size="sm" variant="outline" onClick={() => setShowNewConv(true)} className="gap-2">
            <MessageSquare className="h-4 w-4" /> New Message
          </Button>
        )}
      </div>

      {/* New Conversation */}
      {showNewConv && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Start a Conversation</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Search users..."
                className="pl-10"
                autoFocus
              />
            </div>
            <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
              {searchingUsers ? (
                <div className="py-4 text-center text-sm text-muted-foreground">Searching...</div>
              ) : userResults.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  {userQuery.length >= 2 ? "No users found" : "Type to search users"}
                </div>
              ) : (
                userResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => startConversation(u.id)}
                    disabled={sending}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {u.avatar_url ? (
                        <Image src={u.avatar_url} alt="" width={32} height={32} className="object-cover" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <span className="text-sm">{u.display_name || u.username}</span>
                  </button>
                ))
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowNewConv(false)} className="mt-2">
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Chat Area */}
      <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[400px]">
        {/* Conversation List */}
        <Card className={`w-full md:w-80 shrink-0 overflow-hidden flex flex-col ${showChat ? "hidden md:flex" : "flex"}`}>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6">
                <MessageSquare className="h-8 w-8 text-muted-foreground/20 mb-2" />
                <p className="text-sm text-muted-foreground text-center">No conversations yet</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const other = getOtherParticipant(conv);
                const isActive = conv.id === activeConvId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50 ${
                      isActive ? "bg-muted/70" : ""
                    }`}
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {other?.avatar_url ? (
                        <Image src={other.avatar_url} alt="" width={40} height={40} className="object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground">
                          {(other?.display_name || other?.username || "?")[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">
                          {other?.display_name || other?.username}
                        </span>
                        {conv.unread_count > 0 && (
                          <Badge className="text-[10px] bg-primary text-primary-foreground ml-1">
                            {conv.unread_count}
                          </Badge>
                        )}
                      </div>
                      {conv.last_message && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {conv.last_message.sender_id === currentUserId ? "You: " : ""}
                          {conv.last_message.content}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Chat View */}
        <Card className={`flex-1 overflow-hidden flex flex-col ${!showChat ? "hidden md:flex" : "flex"}`}>
          {!activeConvId ? (
            <CardContent className="flex flex-col items-center justify-center h-full">
              <MessageSquare className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <h3 className="font-semibold mb-1">Select a conversation</h3>
              <p className="text-sm text-muted-foreground text-center">
                Choose a conversation from the left or start a new one
              </p>
            </CardContent>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-3 border-b border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setActiveConvId(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {(() => {
                  const conv = conversations.find((c) => c.id === activeConvId);
                  const other = conv ? getOtherParticipant(conv) : null;
                  return (
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {other?.avatar_url ? (
                          <Image src={other.avatar_url} alt="" width={32} height={32} className="object-cover" />
                        ) : (
                          <User className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className="font-medium text-sm">
                        {other?.display_name || other?.username || "Unknown"}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messagesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : ""}`}>
                        <Skeleton className="h-10 w-48 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No messages yet. Say hello! 👋</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === currentUserId;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                            isMine
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted rounded-bl-sm"
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${
                            isMine ? "text-primary-foreground/60" : "text-muted-foreground"
                          }`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-3 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={sending}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={sending || !newMessage.trim()}
                    size="sm"
                    className="px-3"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
