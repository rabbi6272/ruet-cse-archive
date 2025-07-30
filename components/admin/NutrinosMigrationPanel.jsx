"use client";

import { useState } from "react";
import { 
  migrateExistingUsersNutrinos, 
  checkMigrationStatus, 
  dryRunMigration 
} from "@/lib/nutrinos-migration";
import toast from "react-hot-toast";

const NutrinosMigrationPanel = ({ userRoll }) => {
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [preview, setPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Check if current user is admin (you can modify this logic)
  const isAdmin = userRoll === "2403172" || userRoll === "2403142"; // Rabbi or Bitto

  const handleCheckStatus = async () => {
    try {
      const status = await checkMigrationStatus();
      setMigrationStatus(status);
      if (status) {
        toast.success("Migration already completed!");
      } else {
        toast.info("Migration not run yet");
      }
    } catch (error) {
      toast.error("Error checking migration status");
      console.error(error);
    }
  };

  const handleDryRun = async () => {
    setIsRunning(true);
    try {
      const previewData = await dryRunMigration();
      setPreview(previewData);
      setShowPreview(true);
      toast.success("Dry run completed! Check preview below.");
    } catch (error) {
      toast.error("Dry run failed");
      console.error(error);
    }
    setIsRunning(false);
  };

  const handleRunMigration = async () => {
    if (!confirm("Are you sure you want to run the Nutrinos migration? This will award retroactive points to all existing users.")) {
      return;
    }

    setIsRunning(true);
    try {
      const result = await migrateExistingUsersNutrinos();
      if (result.success) {
        toast.success(`Migration completed! Processed ${result.totalUsersProcessed} users.`);
        setMigrationStatus({
          completed: true,
          completedAt: new Date().toISOString(),
          totalUsersProcessed: result.totalUsersProcessed
        });
      }
    } catch (error) {
      toast.error("Migration failed! Check console for details.");
      console.error(error);
    }
    setIsRunning(false);
  };

  if (!isAdmin) {
    return null; // Don't show to non-admin users
  }

  return (
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg mb-6 shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">⚡</span>
        <h2 className="text-lg font-bold">Nutrinos Migration Panel (Admin Only)</h2>
      </div>
      
      <p className="text-sm mb-4 bg-white/20 p-3 rounded">
        This panel allows you to precompute Nutrinos for all existing users based on their historical activities 
        (code snippets, doubts, comments). Run this once to ensure fairness for users who contributed before the points system.
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleCheckStatus}
          disabled={isRunning}
          className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <i className="fas fa-search mr-2"></i>
          Check Status
        </button>

        <button
          onClick={handleDryRun}
          disabled={isRunning}
          className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <i className="fas fa-eye mr-2"></i>
          {isRunning ? "Running..." : "Dry Run (Preview)"}
        </button>

        <button
          onClick={handleRunMigration}
          disabled={isRunning || (migrationStatus && migrationStatus.completed)}
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
        >
          <i className="fas fa-rocket mr-2"></i>
          {isRunning ? "Migrating..." : "Run Migration"}
        </button>
      </div>

      {/* Migration Status */}
      {migrationStatus && (
        <div className="mt-4 bg-white/20 p-3 rounded-lg">
          <h3 className="font-semibold mb-2">Migration Status</h3>
          {migrationStatus.completed ? (
            <div className="text-green-200">
              <p>✅ Migration completed on {new Date(migrationStatus.completedAt).toLocaleString()}</p>
              <p>👥 Processed {migrationStatus.totalUsersProcessed} users</p>
            </div>
          ) : (
            <p className="text-yellow-200">⏳ Migration not completed yet</p>
          )}
        </div>
      )}

      {/* Preview Results */}
      {showPreview && preview && (
        <div className="mt-4 bg-white/20 p-3 rounded-lg max-h-64 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Migration Preview (Top Users)</h3>
            <button
              onClick={() => setShowPreview(false)}
              className="text-white/60 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="text-sm space-y-1">
            <p className="mb-2">Total users to process: {Object.keys(preview).length}</p>
            {Object.entries(preview)
              .sort(([, a], [, b]) => b.totalPoints - a.totalPoints)
              .slice(0, 10)
              .map(([roll, data]) => (
                <div key={roll} className="flex justify-between text-xs bg-white/10 p-2 rounded">
                  <span>{roll}</span>
                  <span>{data.totalPoints} pts ({data.snippets}s, {data.doubtsAsked}d, {data.doubtsSolved}solved)</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NutrinosMigrationPanel;
