"use client";

import * as React from "react";
import { analytics, type AnalyticsPage } from "./analytics";

export function PageView({ page, variant }: { page: AnalyticsPage; variant: string }) {
  React.useEffect(() => {
    analytics.track({ name: "page_view", page, variant });
  }, [page, variant]);
  return null;
}
