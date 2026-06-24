"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  Heart, MessageCircle, Share2, Plus, X, Search, Loader2,
  Sparkles, TrendingUp, Clock, Package
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

interface ShowcaseCard {
  id: string;
  name: string;
  number: string;
  rarity: string;
  image_url: string | null;
  market_value: number | null;
  card_sets: { name: string; symbol_url?: string | null } | null;
}

interface ShowcasePost {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  card_ids: string[];
  likes_count: number;
  created_at: string;
  user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    trade_score: number;
    trader_level: number;
  } | null;
  cards: ShowcaseCard[];
  liked: boolean;
}

interface Comment {
  id: string;
  text: string;
  created_at: string;
  user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface CollectionCard {
  id: string;
  card_id: string;
  cards: {
    id: string;
    name: string;
    number: string;
    rarity: string;
    image_url: string | null;
    market_value: number | null;
    card_sets: { name: string } | null;
  };
}

export default function ShowcasePage() {
  const [posts, setPosts] = useState<ShowcasePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("newest");
  const [showCreate, setShowCreate] = useState(false);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/showcase?filter=${filter}`);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {} finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleLike = async (postId: string) => {
    try {
      const res = await fetch(`/api/showcase/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like" }),
      });
      const data = await res.json();
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, liked: data.liked, likes_count: data.liked ? p.likes_count + 1 : Math.max(0, p.likes_count - 1) }
          : p
      ));
    } catch {}
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            ✨ Showcase
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Show off your best pulls and collections
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 bg-[#E3350D] hover:bg-[#c72e0b]">
          <Plus className="h-4 w-4" /> New Post
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
        {[
          { key: "newest", label: "Newest", icon: Clock },
          { key: "trending", label: "Trending", icon: TrendingUp },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${
              filter === f.key ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <f.icon className="h-3.5 w-3.5" />
            {f.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1"><Skeleton className="h-4 w-32 mb-1" /><Skeleton className="h-3 w-20" /></div>
                </div>
                <Skeleton className="h-5 w-2/3 mb-2" />
                <Skeleton className="h-48 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Sparkles className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <h3 className="font-semibold mb-1">No showcases yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Be the first to show off your cards!</p>
            <Button size="sm" onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Create Showcase
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <Card key={post.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Post Header */}
                <div className="p-4 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                      {post.user?.avatar_url ? (
                        <Image src={post.user.avatar_url} alt="" width={40} height={40} className="object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-gray-500">
                          {(post.user?.display_name || post.user?.username || "?")[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">
                        {post.user?.display_name || post.user?.username}
                      </p>
                      <p className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</p>
                    </div>
                  </div>
                  <h3 className="font-bold mt-3">{post.title}</h3>
                  {post.description && (
                    <p className="text-sm text-muted-foreground mt-1">{post.description}</p>
                  )}
                </div>

                {/* Card Images */}
                <div className={`px-4 pb-2 ${
                  post.cards.length === 1 ? "max-w-xs mx-auto" : ""
                }`}>
                  <div className={`grid gap-2 ${
                    post.cards.length === 1 ? "grid-cols-1" :
                    post.cards.length === 2 ? "grid-cols-2" :
                    post.cards.length <= 4 ? "grid-cols-2" : "grid-cols-3"
                  }`}>
                    {post.cards.map(card => (
                      <div key={card.id} className="relative group">
                        <div className="aspect-[2.5/3.5] rounded-lg overflow-hidden bg-gray-50 border border-gray-100 relative">
                          {card.image_url ? (
                            <Image src={card.image_url} alt={card.name} fill className="object-contain p-1" sizes="200px" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center"><Package className="h-6 w-6 text-gray-300" /></div>
                          )}
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <p className="text-[10px] truncate font-medium flex-1">{card.name}</p>
                          {card.market_value && (
                            <span className="text-[10px] text-green-600 font-medium shrink-0">${Number(card.market_value).toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-4">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${
                      post.liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${post.liked ? "fill-red-500" : ""}`} />
                    {post.likes_count > 0 && <span className="text-xs font-medium">{post.likes_count}</span>}
                  </button>
                  <button
                    onClick={() => setExpandedComments(expandedComments === post.id ? null : post.id)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-xs">Comment</span>
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/dashboard/showcase?post=${post.id}`).catch(() => {});
                    }}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="text-xs">Share</span>
                  </button>
                </div>

                {/* Comments Section */}
                {expandedComments === post.id && (
                  <CommentsSection postId={post.id} />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Showcase Modal */}
      {showCreate && (
        <CreateShowcaseModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchPosts(); }}
        />
      )}
    </div>
  );
}

/* ============================================================
   COMMENTS SECTION
   ============================================================ */
function CommentsSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/showcase/${postId}`);
        const data = await res.json();
        setComments(data.comments || []);
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, [postId]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/showcase/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "comment", text }),
      });
      const data = await res.json();
      if (data.comment) {
        setComments(prev => [...prev, data.comment]);
        setText("");
      }
    } catch {} finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 pb-4 border-t border-gray-100">
      {loading ? (
        <div className="py-3"><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-2/3" /></div>
      ) : (
        <>
          {comments.length > 0 && (
            <div className="py-3 space-y-3 max-h-48 overflow-y-auto">
              {comments.map(c => (
                <div key={c.id} className="flex gap-2">
                  <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-[9px] font-bold text-gray-500">
                    {(c.user?.display_name || c.user?.username || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs">
                      <span className="font-semibold">{c.user?.display_name || c.user?.username}</span>{" "}
                      <span className="text-muted-foreground">{c.text}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Add a comment..."
              className="text-sm h-8"
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
            />
            <Button size="sm" onClick={handleSubmit} disabled={submitting || !text.trim()} className="h-8 text-xs">
              {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Post"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   CREATE SHOWCASE MODAL
   ============================================================ */
function CreateShowcaseModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCards, setSelectedCards] = useState<CollectionCard[]>([]);
  const [collectionCards, setCollectionCards] = useState<CollectionCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/collection");
        const data = await res.json();
        const allItems: CollectionCard[] = [];
        if (data.collections) {
          for (const col of data.collections) {
            if (col.collection_items) {
              for (const item of col.collection_items) {
                if (item.cards) {
                  allItems.push({ id: item.id, card_id: item.card_id, cards: item.cards });
                }
              }
            }
          }
        }
        setCollectionCards(allItems);
      } catch {} finally {
        setLoadingCards(false);
      }
    })();
  }, []);

  const filteredCards = collectionCards.filter(c =>
    c.cards?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleCard = (card: CollectionCard) => {
    setSelectedCards(prev => {
      const exists = prev.find(c => c.card_id === card.card_id);
      if (exists) return prev.filter(c => c.card_id !== card.card_id);
      if (prev.length >= 5) return prev;
      return [...prev, card];
    });
  };

  const handleCreate = async () => {
    if (!title || selectedCards.length === 0) return;
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/showcase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          card_ids: selectedCards.map(c => c.card_id),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create showcase");
        return;
      }
      onCreated();
    } catch {
      setError("Failed to create showcase");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">✨ New Showcase</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-gray-500">Title</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Just pulled this from a Crown Zenith ETB!"
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-gray-500">Description (optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Tell the story behind these cards..."
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Selected Cards */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500">Cards ({selectedCards.length}/5)</label>
              <Button variant="outline" size="sm" onClick={() => setShowPicker(!showPicker)} className="text-xs h-7 gap-1">
                <Plus className="h-3 w-3" /> Add Cards
              </Button>
            </div>

            {selectedCards.length > 0 ? (
              <div className="grid grid-cols-5 gap-2">
                {selectedCards.map(card => (
                  <div key={card.card_id} className="relative group">
                    <div className="aspect-[2.5/3.5] rounded-md overflow-hidden bg-gray-50 border border-gray-200 relative">
                      {card.cards?.image_url ? (
                        <Image src={card.cards.image_url} alt={card.cards.name} fill className="object-contain" sizes="80px" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center"><Package className="h-4 w-4 text-gray-300" /></div>
                      )}
                    </div>
                    <button
                      onClick={() => toggleCard(card)}
                      className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-400">Select 1-5 cards to showcase</p>
              </div>
            )}
          </div>

          {/* Card Picker */}
          {showPicker && (
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search your collection..."
                  className="pl-9"
                />
              </div>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {loadingCards ? (
                  [...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-[2.5/3.5] rounded-md" />)
                ) : filteredCards.length === 0 ? (
                  <p className="col-span-4 text-center text-sm text-gray-400 py-4">No cards found</p>
                ) : (
                  filteredCards.slice(0, 20).map(card => {
                    const isSelected = selectedCards.some(c => c.card_id === card.card_id);
                    return (
                      <button
                        key={card.id}
                        onClick={() => toggleCard(card)}
                        className={`relative rounded-md overflow-hidden ${isSelected ? "ring-2 ring-[#E3350D]" : ""}`}
                        disabled={!isSelected && selectedCards.length >= 5}
                      >
                        <div className="aspect-[2.5/3.5] bg-gray-50 relative">
                          {card.cards?.image_url ? (
                            <Image src={card.cards.image_url} alt={card.cards.name} fill className="object-contain" sizes="80px" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center"><Package className="h-3 w-3 text-gray-300" /></div>
                          )}
                          {isSelected && (
                            <div className="absolute inset-0 bg-[#E3350D]/20 flex items-center justify-center">
                              <div className="h-5 w-5 rounded-full bg-[#E3350D] flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-[9px] truncate mt-0.5 px-0.5">{card.cards?.name}</p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            onClick={handleCreate}
            disabled={creating || !title || selectedCards.length === 0}
            className="flex-1 gap-2 bg-[#E3350D] hover:bg-[#c72e0b]"
          >
            {creating && <Loader2 className="h-4 w-4 animate-spin" />}
            Post Showcase
          </Button>
        </div>
      </div>
    </div>
  );
}
