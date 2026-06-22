"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users, Search, Shield, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, MoreHorizontal
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  subscription_tier: string;
  trade_score: number;
  is_verified: boolean;
  is_admin: boolean;
  is_premium: boolean;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const pageSize = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString() });
    if (search) params.set("q", search);
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    setUsers(data.users || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleAction = async (userId: string, action: string) => {
    setActionMenu(null);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    fetchUsers();
  };

  const handleBulkAction = async (action: string) => {
    if (selected.size === 0) return;
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, userIds: Array.from(selected) }),
    });
    setSelected(new Set());
    fetchUsers();
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === users.length) setSelected(new Set());
    else setSelected(new Set(users.map((u) => u.id)));
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">{total.toLocaleString()} total users</p>
        </div>
      </div>

      {/* Search & Bulk Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by username or display name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline">Search</Button>
        </form>
        {selected.size > 0 && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-green-700 border-green-300" onClick={() => handleBulkAction("verify")}>
              <CheckCircle className="h-3 w-3 mr-1" /> Verify ({selected.size})
            </Button>
            <Button size="sm" variant="outline" className="text-red-700 border-red-300" onClick={() => handleBulkAction("suspend")}>
              <XCircle className="h-3 w-3 mr-1" /> Suspend ({selected.size})
            </Button>
          </div>
        )}
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="p-3 text-left">
                    <input
                      type="checkbox"
                      checked={selected.size === users.length && users.length > 0}
                      onChange={toggleAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="p-3 text-left font-medium text-gray-600">User</th>
                  <th className="p-3 text-left font-medium text-gray-600">Tier</th>
                  <th className="p-3 text-left font-medium text-gray-600">Trade Score</th>
                  <th className="p-3 text-left font-medium text-gray-600">Status</th>
                  <th className="p-3 text-left font-medium text-gray-600">Joined</th>
                  <th className="p-3 text-left font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="p-3"><Skeleton className="h-4 w-4" /></td>
                      <td className="p-3"><Skeleton className="h-8 w-48" /></td>
                      <td className="p-3"><Skeleton className="h-5 w-16" /></td>
                      <td className="p-3"><Skeleton className="h-5 w-12" /></td>
                      <td className="p-3"><Skeleton className="h-5 w-20" /></td>
                      <td className="p-3"><Skeleton className="h-5 w-24" /></td>
                      <td className="p-3"><Skeleton className="h-5 w-8" /></td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user, i) => (
                    <tr key={user.id} className={`border-b border-gray-100 ${i % 2 === 1 ? "bg-gray-50/50" : ""} hover:bg-blue-50/30`}>
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selected.has(user.id)}
                          onChange={() => toggleSelect(user.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0 overflow-hidden">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              user.username?.[0]?.toUpperCase() || "?"
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 flex items-center gap-1">
                              {user.display_name || user.username}
                              {user.is_admin && <Shield className="h-3 w-3 text-red-500" />}
                            </div>
                            <div className="text-xs text-gray-400">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            user.subscription_tier === "elite"
                              ? "border-yellow-300 text-yellow-700 bg-yellow-50"
                              : user.subscription_tier === "pro"
                              ? "border-blue-300 text-blue-700 bg-blue-50"
                              : "border-gray-300 text-gray-600"
                          }`}
                        >
                          {user.subscription_tier}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="text-gray-900 font-medium">{user.trade_score}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          {user.is_verified && (
                            <Badge variant="outline" className="text-[10px] border-green-300 text-green-700 bg-green-50">
                              Verified
                            </Badge>
                          )}
                          {user.is_admin && (
                            <Badge variant="outline" className="text-[10px] border-red-300 text-red-700 bg-red-50">
                              Admin
                            </Badge>
                          )}
                          {!user.is_verified && !user.is_admin && (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-gray-500 text-xs">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setActionMenu(actionMenu === user.id ? null : user.id)}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        {actionMenu === user.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              onClick={() => handleAction(user.id, "toggle_admin")}
                            >
                              <Shield className="h-3 w-3 text-blue-500" />
                              {user.is_admin ? "Remove Admin" : "Make Admin"}
                            </button>
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              onClick={() => handleAction(user.id, "toggle_verified")}
                            >
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {user.is_verified ? "Remove Verified" : "Verify"}
                            </button>
                            <div className="border-t border-gray-100 my-1" />
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                              onClick={() => handleAction(user.id, "suspend")}
                            >
                              <XCircle className="h-3 w-3" />
                              Suspend Account
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
