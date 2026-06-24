"use client";

import { useState } from "react";
import {
  Shield, Lock, Smartphone, Download,
  Trash2, AlertTriangle, Loader2, ExternalLink, Key
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function UserSecurityPage() {
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleChangePassword = () => {
    // Redirect to Supabase-hosted password reset
    const siteUrl = window.location.origin;
    window.location.href = `${siteUrl}/api/auth/callback?type=recovery`;
  };

  const handleDownloadData = async () => {
    setDownloading(true);
    try {
      // Fetch user profile and related data
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch data");
      const data = await res.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `poke-trade-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download data. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/settings", {
        method: "DELETE",
      });
      if (res.ok) {
        window.location.href = "/?deleted=true";
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete account");
      }
    } catch {
      alert("Failed to delete account. Please contact support.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Security Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account security and privacy
        </p>
      </div>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm">
                Add an extra layer of security to your account with 2FA.
              </p>
              <Badge className="mt-2 bg-yellow-100 text-yellow-700 border-yellow-200 text-[10px]">
                Coming Soon
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                Two-factor authentication via authenticator app will be available soon.
                We&apos;ll notify you when it&apos;s ready.
              </p>
            </div>
            <Button variant="outline" size="sm" disabled className="gap-2">
              <Lock className="h-4 w-4" />
              Enable 2FA
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" />
            Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Change your account password.</p>
              <p className="text-xs text-muted-foreground mt-1">
                You&apos;ll receive an email with a password reset link.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleChangePassword}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4" />
            Data & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Download My Data</p>
              <p className="text-xs text-muted-foreground mt-1">
                Download a copy of all your account data (GDPR compliant).
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadData}
              disabled={downloading}
              className="gap-2"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download
            </Button>
          </div>

          <Separator />

          {/* Delete Account */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Delete My Account
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Permanently delete your account and all associated data. This action
                cannot be undone.
              </p>
            </div>
            {!showDeleteConfirm ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            ) : (
              <div className="flex flex-col gap-2 items-end">
                <p className="text-xs text-red-600 font-medium">
                  Are you sure? This is irreversible.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="gap-2"
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Confirm Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
