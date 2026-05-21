"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Package, ArrowRight, Loader2, Weight, Zap } from "lucide-react";
import AddressSearch from "@/app/components/ui/address-search";

const LeafletMap = dynamic(() => import("@/app/components/map/leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[220px] bg-surface-hover rounded-xl animate-pulse flex items-center justify-center text-sm text-muted">
      Loading map preview...
    </div>
  ),
});

export default function NewDeliveryPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ trackingId: string } | null>(null);
  const [error, setError] = useState("");

  const [pickup, setPickup] = useState({ address: "", lat: 0, lng: 0 });
  const [drop, setDrop] = useState({ address: "", lat: 0, lng: 0 });
  const [weight, setWeight] = useState("");
  const [priority, setPriority] = useState("MEDIUM");

  const showMap = pickup.lat !== 0 && drop.lat !== 0;
  const isFormValid = pickup.address && drop.address && weight && parseFloat(weight) > 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isFormValid) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupAddress: pickup.address,
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
          dropAddress: drop.address,
          dropLat: drop.lat,
          dropLng: drop.lng,
          weightKg: parseFloat(weight),
          priority,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to create delivery");
      }
      const data = await res.json();
      setSuccess({ trackingId: data.trackingId });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (success)
    return (
      <div className="animate-fade-in max-w-lg mx-auto mt-16 text-center">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Package className="w-10 h-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Delivery Request Submitted!</h2>
        <p className="text-muted mb-2">Your delivery has been created and is pending approval.</p>
        <div className="inline-block bg-surface-hover rounded-lg px-4 py-2 font-mono text-lg font-bold text-primary mb-6">
          {success.trackingId}
        </div>
        <div className="flex items-center justify-center gap-3">
          <a
            href="/client"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:shadow-lg"
          >
            Back to Dashboard
          </a>
          <a
            href={`/track?id=${success.trackingId}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-primary text-primary rounded-xl font-medium hover:bg-primary/5"
          >
            Track Package
          </a>
        </div>
      </div>
    );

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">New Delivery</h1>
        <p className="text-muted mt-1">Create a new delivery request</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-xl text-error text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Address Section */}
        <div className="bg-white rounded-xl border border-border-light p-6">
          <h3 className="font-semibold text-sm text-muted uppercase tracking-wider mb-5">
            📍 Addresses
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AddressSearch
              label="Pickup Location"
              placeholder="Search pickup address..."
              icon={<MapPin className="w-3.5 h-3.5 text-green-500" />}
              onSelect={setPickup}
            />
            <AddressSearch
              label="Drop-off Location"
              placeholder="Search drop-off address..."
              icon={<MapPin className="w-3.5 h-3.5 text-red-500" />}
              onSelect={setDrop}
            />
          </div>

          {/* Coordinates display */}
          {(pickup.lat !== 0 || drop.lat !== 0) && (
            <div className="mt-4 pt-4 border-t border-border-light grid grid-cols-2 gap-4">
              {pickup.lat !== 0 && (
                <div className="text-xs text-muted">
                  <span className="text-green-600 font-medium">Pickup:</span>{" "}
                  {pickup.lat.toFixed(4)}, {pickup.lng.toFixed(4)}
                </div>
              )}
              {drop.lat !== 0 && (
                <div className="text-xs text-muted">
                  <span className="text-red-600 font-medium">Drop-off:</span>{" "}
                  {drop.lat.toFixed(4)}, {drop.lng.toFixed(4)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Map Preview */}
        {showMap && (
          <div className="animate-fade-in">
            <LeafletMap
              pickupLat={pickup.lat}
              pickupLng={pickup.lng}
              dropLat={drop.lat}
              dropLng={drop.lng}
              pickupLabel={pickup.address}
              dropLabel={drop.address}
              height="220px"
            />
          </div>
        )}

        {/* Package Details */}
        <div className="bg-white rounded-xl border border-border-light p-6">
          <h3 className="font-semibold text-sm text-muted uppercase tracking-wider mb-5">
            📦 Package Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5">
                <Weight className="w-3.5 h-3.5 text-muted-light" />
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="25"
                required
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 2.5"
                className="w-full px-3 py-2.5 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="text-[10px] text-muted mt-1">Max capacity: 25kg</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-muted-light" />
                Priority
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(["LOW", "MEDIUM", "HIGH", "URGENT"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 rounded-lg text-xs font-medium transition-all ${
                      priority === p
                        ? p === "URGENT"
                          ? "bg-red-500 text-white shadow-md"
                          : p === "HIGH"
                          ? "bg-orange-500 text-white shadow-md"
                          : p === "MEDIUM"
                          ? "bg-blue-500 text-white shadow-md"
                          : "bg-gray-500 text-white shadow-md"
                        : "bg-surface-hover text-muted hover:bg-gray-200"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !isFormValid}
          className="w-full py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-medium rounded-xl hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 flex items-center justify-center gap-2 text-base"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Package className="w-5 h-5" />
              Create Delivery
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
