"use client";

import { useState } from "react";
import { migrateNutrinosData } from "@/lib/migrate-nutrinos";

const MigrationPage = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);

  const runMigration = async () => {
    setIsRunning(true);
    setResult(null);
    
    try {
      const migrationResult = await migrateNutrinosData();
      setResult(migrationResult);
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Nutrinos Data Migration
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This utility will update existing Nutrinos records to include user names from the students database.
            This should only be run once to migrate existing data.
          </p>
          
          <button
            onClick={runMigration}
            disabled={isRunning}
            className={`px-6 py-3 rounded-lg font-semibold text-white ${
              isRunning 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isRunning ? 'Running Migration...' : 'Run Migration'}
          </button>
          
          {result && (
            <div className={`mt-6 p-4 rounded-lg ${
              result.success 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {result.success ? (
                <div>
                  <h3 className="font-semibold">Migration Successful!</h3>
                  <p>Updated {result.updatedCount} user records with names.</p>
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold">Migration Failed</h3>
                  <p>Error: {result.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MigrationPage;
