"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Search, MapPin, Clock, Loader2, Plane, AlertTriangle,
  RefreshCw, Battery, Weight, Copy, Check, Share2, Pause, Play,
} from "lucide-react";
import Link from "next/link";

const LeafletMap = dynamic(() => import("@/app/components/map/leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[350px] bg-surface-hover rounded-xl animate-pulse flex items-center justify-center text-sm text-muted">
      Loading map...
    </div>
  ),
});

type DeliveryLog = { status: string; message: string; createdAt: string };
type TrackData = {
  trackingId: string; status: string; estimatedETA: string | null;
  pickupAddress: string; pickupLat: number; pickupLng: number;
  dropAddress: string; dropLat: number; dropLng: number;
  priority: string; weightKg: number; createdAt: string; updatedAt: string;
  drone: { droneCode: string; currentLat: number; currentLng: number; batteryPercent: number } | null;
  logs: DeliveryLog[];
};

const statusFlow = ["PENDING", "APPROVED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"];

const sc: Record<string, { color: string; bg: string; icon: string; gradient: string }> = {
  PENDING: { color: "text-yellow-700", bg: "bg-yellow-100", icon: "🕐", gradient: "from-yellow-400 to-yellow-600" },
  APPROVED: { color: "text-blue-700", bg: "bg-blue-100", icon: "✅", gradient: "from-blue-400 to-blue-600" },
  ASSIGNED: { color: "text-indigo-700", bg: "bg-indigo-100", icon: "🚁", gradient: "from-indigo-400 to-indigo-600" },
  PICKED_UP: { color: "text-purple-700", bg: "bg-purple-100", icon: "📦", gradient: "from-purple-400 to-purple-600" },
  IN_TRANSIT: { color: "text-sky-700", bg: "bg-sky-100", icon: "✈️", gradient: "from-sky-400 to-sky-600" },
  DELIVERED: { color: "text-green-700", bg: "bg-green-100", icon: "🎉", gradient: "from-green-400 to-green-600" },
  FAILED: { color: "text-red-700", bg: "bg-red-100", icon: "❌", gradient: "from-red-400 to-red-600" },
  CANCELLED: { color: "text-gray-700", bg: "bg-gray-100", icon: "🚫", gradient: "from-gray-400 to-gray-600" },
};

function TrackPageContent() {
  const searchParams = useSearchParams();
  const [trackingId, setTrackingId] = useState("");
  const [data, setData] = useState<TrackData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [polling, setPolling] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const search = useCallback(async (id?: string, silent = false) => {
    const tid = id || trackingId;
    if (!tid.trim()) return;
    if (!silent) { setLoading(true); setError(""); setData(null); }
    else { setRefreshing(true); }
    try {
      const res = await fetch(`/api/track/${tid.trim()}`);
      if (!res.ok) throw new Error("Delivery not found");
      setData(await res.json());
      setLastRefresh(new Date());
    } catch {
      if (!silent) setError("Delivery not found. Check your tracking ID.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [trackingId]);

  // Auto-search from URL param
  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setTrackingId(id);
      search(id);
    }
  }, [searchParams]);

  // Polling with toggle
  useEffect(() => {
    if (!data || !polling) return;
    const isActive = ["PENDING", "APPROVED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(data.status);
    if (!isActive) return;
    const interval = setInterval(() => search(data.trackingId, true), 10000);
    return () => clearInterval(interval);
  }, [data, polling, search]);

  function copyTrackingId() {
    if (!data) return;
    navigator.clipboard.writeText(data.trackingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareLink() {
    if (!data) return;
    const url = `${window.location.origin}/track?id=${data.trackingId}`;
    if (navigator.share) {
      navigator.share({ title: `SkyDrop Tracking - ${data.trackingId}`, url });
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // Progress percentage
  const progressIndex = data ? statusFlow.indexOf(data.status) : -1;
  const progressPercent = data
    ? data.status === "FAILED" || data.status === "CANCELLED"
      ? 100
      : progressIndex >= 0
      ? (progressIndex / (statusFlow.length - 1)) * 100
      : 0
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-orange-50">
      {/* Nav */}
      <nav className="p-4 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center">
            <Plane className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold">Sky<span className="text-primary">Drop</span></span>
        </Link>
        {data && (
          <div className="flex items-center gap-2">
            <button onClick={shareLink} className="p-2 hover:bg-white/60 rounded-lg" title="Share tracking link">
              <Share2 className="w-4 h-4 text-muted" />
            </button>
            <button
              onClick={() => setPolling(!polling)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                polling ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
              }`}
              title={polling ? "Auto-refresh is on" : "Auto-refresh is off"}
            >
              {polling ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              {polling ? "Live" : "Paused"}
            </button>
          </div>
        )}
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Track Your Package</h1>
          <p className="text-muted">Enter your tracking ID to see live delivery status</p>
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-light" />
            <input
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="e.g. SKY-2026-001"
              className="w-full pl-10 pr-4 py-3 bg-white border border-border rounded-xl text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <button
            onClick={() => search()}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Track"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm flex items-center gap-2 mb-6">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Results */}
        {data && (
          <div className="animate-fade-in space-y-6">
            {/* Progress bar */}
            <div className="bg-white rounded-xl border border-border-light p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${sc[data.status]?.bg} ${sc[data.status]?.color}`}>
                    {sc[data.status]?.icon} {data.status.replace("_", " ")}
                  </span>
                  <button onClick={copyTrackingId} className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-surface-hover text-xs font-mono text-muted">
                    {data.trackingId}
                    {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {lastRefresh && (
                    <span className="text-[10px] text-muted-light">
                      Updated {lastRefresh.toLocaleTimeString()}
                    </span>
                  )}
                  <button
                    onClick={() => search(data.trackingId, true)}
                    disabled={refreshing}
                    className="p-1.5 hover:bg-surface-hover rounded-lg"
                    title="Refresh now"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-muted ${refreshing ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Status progress */}
              {data.status !== "FAILED" && data.status !== "CANCELLED" && (
                <div className="mt-4">
                  <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${sc[data.status]?.gradient} transition-all duration-1000 ease-out`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    {statusFlow.map((s, i) => {
                      const isCompleted = progressIndex >= i;
                      const isCurrent = progressIndex === i;
                      return (
                        <div key={s} className="flex flex-col items-center" style={{ width: `${100 / statusFlow.length}%` }}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border-2 ${
                            isCurrent ? `border-current ${sc[s]?.color} bg-white` : isCompleted ? "border-green-500 bg-green-500 text-white" : "border-gray-200 bg-gray-50 text-muted-light"
                          }`}>
                            {isCompleted && !isCurrent ? "✓" : sc[s]?.icon}
                          </div>
                          <span className={`text-[9px] mt-1 text-center leading-tight ${isCurrent ? "font-bold " + sc[s]?.color : isCompleted ? "text-green-600" : "text-muted-light"}`}>
                            {s.replace("_", " ")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Map */}
            <LeafletMap
              pickupLat={data.pickupLat}
              pickupLng={data.pickupLng}
              dropLat={data.dropLat}
              dropLng={data.dropLng}
              pickupLabel={data.pickupAddress}
              dropLabel={data.dropAddress}
              droneLat={data.drone?.currentLat}
              droneLng={data.drone?.currentLng}
              droneLabel={data.drone?.droneCode}
              height="350px"
              animateDrone={!!data.drone}
              status={data.status}
            />

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Route info */}
              <div className="bg-white rounded-xl border border-border-light p-5">
                <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Route Details</h4>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted uppercase">Pickup</p>
                      <p className="text-sm font-medium">{data.pickupAddress}</p>
                      <p className="text-[10px] text-muted-light">{data.pickupLat.toFixed(4)}, {data.pickupLng.toFixed(4)}</p>
                    </div>
                  </div>
                  <div className="border-l-2 border-dashed border-border-light ml-4 h-3" />
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted uppercase">Drop-off</p>
                      <p className="text-sm font-medium">{data.dropAddress}</p>
                      <p className="text-[10px] text-muted-light">{data.dropLat.toFixed(4)}, {data.dropLng.toFixed(4)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Package & Drone info */}
              <div className="bg-white rounded-xl border border-border-light p-5">
                <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Package & Drone</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-surface-hover rounded-lg">
                    <div className="flex items-center gap-2"><Weight className="w-4 h-4 text-muted-light" /><span className="text-sm text-muted">Weight</span></div>
                    <span className="text-sm font-bold">{data.weightKg}kg</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-surface-hover rounded-lg">
                    <div className="flex items-center gap-2"><span className="text-sm">⚡</span><span className="text-sm text-muted">Priority</span></div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      data.priority === "URGENT" ? "bg-red-100 text-red-700" : data.priority === "HIGH" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                    }`}>{data.priority}</span>
                  </div>
                  {data.estimatedETA && (
                    <div className="flex items-center justify-between p-3 bg-surface-hover rounded-lg">
                      <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-light" /><span className="text-sm text-muted">ETA</span></div>
                      <span className="text-sm font-bold text-primary">{data.estimatedETA}</span>
                    </div>
                  )}
                  {data.drone ? (
                    <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-mono font-medium">🚁 {data.drone.droneCode}</span>
                        <div className="flex items-center gap-1">
                          <Battery className={`w-4 h-4 ${data.drone.batteryPercent > 70 ? "text-green-500" : data.drone.batteryPercent > 30 ? "text-yellow-500" : "text-red-500"}`} />
                          <span className="text-sm font-bold">{data.drone.batteryPercent}%</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted mt-1">
                        📍 {data.drone.currentLat.toFixed(4)}, {data.drone.currentLng.toFixed(4)}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-surface-hover rounded-lg text-center">
                      <p className="text-sm text-muted-light italic">No drone assigned yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl border border-border-light p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Delivery Timeline
                </h3>
                <span className="text-xs text-muted">{data.logs.length} events</span>
              </div>
              <div className="space-y-0">
                {data.logs.map((log, i) => {
                  const isLast = i === data.logs.length - 1;
                  const s = sc[log.status];
                  return (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm border-2 flex-shrink-0 ${
                          isLast
                            ? `bg-gradient-to-br ${s?.gradient} text-white border-transparent shadow-md`
                            : "bg-surface-hover border-border-light text-muted"
                        }`}>
                          {s?.icon || "•"}
                        </div>
                        {!isLast && <div className="w-0.5 flex-1 bg-border-light my-1 min-h-[20px]" />}
                      </div>
                      <div className={`pb-5 ${isLast ? "" : ""}`}>
                        <p className={`text-sm font-medium ${isLast ? "text-foreground" : "text-muted"}`}>{log.message}</p>
                        <p className="text-xs text-muted-light mt-0.5">
                          {new Date(log.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })} • {new Date(log.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Created date */}
            <div className="text-center text-xs text-muted-light">
              Order placed on {new Date(data.createdAt).toLocaleDateString("en-IN", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </div>
          </div>
        )}

        {/* Quick demo when no data */}
        {!data && !error && !loading && (
          <div className="text-center mt-8 p-6 bg-white/60 rounded-xl border border-border-light">
            <p className="text-sm text-muted mb-3">Try these tracking IDs:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {["SKY-2026-001", "SKY-2026-002", "SKY-2026-003"].map((id) => (
                <button
                  key={id}
                  onClick={() => { setTrackingId(id); search(id); }}
                  className="px-4 py-2 bg-surface-hover rounded-lg text-sm font-mono text-primary hover:bg-primary/10 transition-colors"
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-orange-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <TrackPageContent />
    </Suspense>
  );
}
