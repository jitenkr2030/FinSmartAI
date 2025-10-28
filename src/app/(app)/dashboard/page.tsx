"use client";

import { useState } from "react";
import AuthWrapper from "@/components/auth/AuthWrapper";
import Dashboard from "@/components/dashboard/Dashboard";

export default function DashboardPage() {
  return (
    <AuthWrapper>
      <Dashboard />
    </AuthWrapper>
  );
}