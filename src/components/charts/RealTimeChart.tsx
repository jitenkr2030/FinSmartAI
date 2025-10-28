"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface RealTimeChartProps {
  type: "line" | "area" | "bar" | "pie";
  title: string;
  description?: string;
  dataKey: string;
  color?: string;
  height?: number;
}

export function RealTimeLineChart({ 
  title, 
  description, 
  dataKey = "value", 
  color = "#3b82f6",
  height = 300 
}: Omit<RealTimeChartProps, "type">) {
  const [data, setData] = useState<Array<{time: string; value: number}>>([]);

  useEffect(() => {
    const generateData = () => {
      const now = new Date();
      const newData = Array.from({ length: 20 }, (_, i) => {
        const time = new Date(now.getTime() - (19 - i) * 60000);
        return {
          time: time.toLocaleTimeString(),
          value: Math.random() * 100 + 50 + Math.sin(i * 0.5) * 20
        };
      });
      setData(newData);
    };

    generateData();
    const interval = setInterval(generateData, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function RealTimeAreaChart({ 
  title, 
  description, 
  dataKey = "value", 
  color = "#10b981",
  height = 300 
}: Omit<RealTimeChartProps, "type">) {
  const [data, setData] = useState<Array<{time: string; value: number}>>([]);

  useEffect(() => {
    const generateData = () => {
      const now = new Date();
      const newData = Array.from({ length: 20 }, (_, i) => {
        const time = new Date(now.getTime() - (19 - i) * 60000);
        return {
          time: time.toLocaleTimeString(),
          value: Math.random() * 100 + 30 + Math.cos(i * 0.3) * 15
        };
      });
      setData(newData);
    };

    generateData();
    const interval = setInterval(generateData, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              fill={color}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function RealTimeBarChart({ 
  title, 
  description, 
  dataKey = "value", 
  color = "#f59e0b",
  height = 300 
}: Omit<RealTimeChartProps, "type">) {
  const [data, setData] = useState<Array<{name: string; value: number}>>([]);

  useEffect(() => {
    const generateData = () => {
      const models = ["Sentiment", "News", "Options", "Risk", "FundFlow", "Alpha"];
      const newData = models.map(model => ({
        name: model,
        value: Math.random() * 100 + 20
      }));
      setData(newData);
    };

    generateData();
    const interval = setInterval(generateData, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey={dataKey} fill={color} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function RealTimePieChart({ 
  title, 
  description, 
  height = 300 
}: Omit<RealTimeChartProps, "type" | "dataKey">) {
  const [data, setData] = useState<Array<{name: string; value: number; color: string}>>([]);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

  useEffect(() => {
    const generateData = () => {
      const categories = ["Sentiment", "News", "Options", "Risk", "FundFlow", "Alpha"];
      const newData = categories.map((category, index) => ({
        name: category,
        value: Math.random() * 100 + 10,
        color: COLORS[index % COLORS.length]
      }));
      setData(newData);
    };

    generateData();
    const interval = setInterval(generateData, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function MarketDataStream() {
  const [marketData, setMarketData] = useState([
    { symbol: "NIFTY", price: 19850.75, change: 0.85, volume: "2.1M" },
    { symbol: "BANKNIFTY", price: 43250.20, change: -0.32, volume: "1.8M" },
    { symbol: "RELIANCE", price: 2845.60, change: 1.25, volume: "8.5M" },
    { symbol: "TCS", price: 3750.40, change: 0.67, volume: "3.2M" },
    { symbol: "INFY", price: 1520.80, change: -0.45, volume: "4.1M" },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => prev.map(item => ({
        ...item,
        price: item.price * (1 + (Math.random() - 0.5) * 0.002),
        change: item.change + (Math.random() - 0.5) * 0.1,
        volume: (parseFloat(item.volume) * (1 + Math.random() * 0.1)).toFixed(1) + "M"
      })));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Market Data Stream</CardTitle>
            <CardDescription>Real-time market prices and volumes</CardDescription>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {marketData.map((item) => (
            <div key={item.symbol} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="font-semibold">{item.symbol}</div>
                <div className="text-lg font-mono">₹{item.price.toFixed(2)}</div>
              </div>
              <div className="flex items-center space-x-4">
                <div className={`text-sm font-medium ${
                  item.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                </div>
                <div className="text-sm text-gray-500">
                  Vol: {item.volume}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}