import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Check database connection
    await db.$queryRaw`SELECT 1`;
    
    // Get system stats
    const [userCount, modelCount, predictionCount] = await Promise.all([
      db.user.count(),
      db.aIModel.count(),
      db.prediction.count()
    ]);

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      database: "connected",
      stats: {
        users: userCount,
        models: modelCount,
        predictions: predictionCount
      },
      uptime: process.uptime()
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}