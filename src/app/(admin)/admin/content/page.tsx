"use client";

import { useEffect, useState } from "react";
import {
  Bell, Send, Megaphone, Star, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Announcement {
  id: string;
  details: string;
  performed_at: string;
}

export default function ContentPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", type: "info" });

  const fetchAnnouncements = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/announcements");
    const data = await res.json();
    setAnnouncements(data.announcements || []);
    setLoading(false);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.message) return;
    setSending(true);
    await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", message: "", type: "info" });
    setSending(false);
    fetchAnnouncements();
  };

  const parseAnnouncement = (details: string) => {
    try {
      return JSON.parse(details);
    } catch {
      return { title: "Announcement", message: details, type: "info" };
    }
  };

  const typeColors: Record<string, string> = {
    info: "border-blue-300 text-blue-700 bg-blue-50",
    warning: "border-yellow-300 text-yellow-700 bg-yellow-50",
    success: "border-green-300 text-green-700 bg-green-50",
    danger: "border-red-300 text-red-700 bg-red-50",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage announcements and platform content</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Create Announcement */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-blue-500" />
              Create Announcement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendAnnouncement} className="space-y-3">
              <Input
                placeholder="Announcement title *"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <textarea
                className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none"
                rows={4}
                placeholder="Announcement message *"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />
              <div className="flex gap-2">
                <span className="text-xs text-gray-500 self-center">Type:</span>
                {["info", "warning", "success", "danger"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`px-2 py-1 rounded text-xs border ${
                      form.type === type
                        ? typeColors[type]
                        : "border-gray-200 text-gray-500"
                    }`}
                    onClick={() => setForm({ ...form, type })}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <Button type="submit" size="sm" disabled={sending} className="w-full">
                {sending ? (
                  <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="h-3 w-3 mr-1" /> Send to All Users</>
                )}
              </Button>
              <p className="text-[10px] text-gray-400">
                This will create a notification for every registered user.
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Featured Cards Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Featured Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Star className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-1">Featured card selection</p>
              <p className="text-xs text-gray-400">
                Select cards to feature on the homepage marketplace section.
                Cards with &quot;featured_at&quot; timestamps will appear first.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcement History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-gray-500" />
            Announcement History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8">
              <Megaphone className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No announcements yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => {
                const parsed = parseAnnouncement(a.details);
                return (
                  <div key={a.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">{parsed.title}</span>
                      <Badge variant="outline" className={`text-[10px] ${typeColors[parsed.type] || typeColors.info}`}>
                        {parsed.type}
                      </Badge>
                      <span className="text-[10px] text-gray-400 ml-auto">
                        {new Date(a.performed_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{parsed.message}</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
