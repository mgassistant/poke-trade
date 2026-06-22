"use client";

import { ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MarketplacePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your marketplace listings</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <ShoppingBag className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <h3 className="font-semibold mb-1">Coming Soon</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-xs">
            This section is being built. Create an account to be first to access it.
          </p>
          <Button size="sm" variant="outline">Get Notified</Button>
        </CardContent>
      </Card>
    </div>
  );
}
