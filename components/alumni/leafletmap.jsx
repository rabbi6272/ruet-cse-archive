"use client"; // Mark as client component.

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";

// Dynamically import React-Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

// Import Leaflet CSS
import "leaflet/dist/leaflet.css";
import Link from "next/link";

// Import alumni data and utilities
import { alumniData } from "./alumnidata";
import { listenToAlumniUpdates, mergeAlumniData, formatAlumnusForDisplay } from "@/lib/alumni-utils";

export function Leafletmap() {
  const [allAlumniData, setAllAlumniData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const L = require("leaflet");

      // Fix Leaflet marker icon issue
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    }
  }, []);

  // Set up real-time listener for alumni data
  useEffect(() => {
    setLoading(true);
    
    // Listen to dynamic alumni updates
    const unsubscribe = listenToAlumniUpdates((dynamicAlumni) => {
      try {
        // Merge static and dynamic data
        const mergedData = mergeAlumniData(alumniData, dynamicAlumni);
        setAllAlumniData(mergedData);
        setError(null);
      } catch (err) {
        console.error('Error processing alumni data:', err);
        setError('Failed to load dynamic alumni data');
        // Fall back to static data only
        setAllAlumniData(alumniData);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Custom component to handle map instance and marker events
  const MarkerWithEvents = ({ alumnus }) => {
    const map = useMap(); // Safely access the map instance
    const formattedAlumnus = formatAlumnusForDisplay(alumnus);

    const handleClick = () => {
      // Ensure coordinates are in the correct format [lat, lng] for leaflet
      const coords = Array.isArray(alumnus.coordinates) && alumnus.coordinates.length >= 2
        ? [alumnus.coordinates[1], alumnus.coordinates[0]] // Convert [lng, lat] to [lat, lng]
        : [0, 0];
      map.flyTo(coords, 10, { duration: 1 });
    };

    const handlePopupClose = () => {
      map.flyTo([20, 0], 2, { duration: 1 });
    };

    // Safely extract coordinates
    const coordinates = Array.isArray(alumnus.coordinates) && alumnus.coordinates.length >= 2
      ? alumnus.coordinates
      : [0, 0];
    
    const [lng, lat] = coordinates;

    // Process badges
    const badges = formattedAlumnus.badges.length > 0
      ? formattedAlumnus.badges.map((badge) => (
          <span key={badge} className="badge">
            {badge}
          </span>
        ))
      : null;

    return (
      <Marker
        position={[lat, lng]}
        eventHandlers={{ click: handleClick, popupclose: handlePopupClose }}
      >
        <Popup>
          <div className="popup-content">
            <h3 className="text-gray-900">
              {formattedAlumnus.displayName}
              {formattedAlumnus.isNewlyAdded && (
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  New
                </span>
              )}
            </h3>
            <p>
              <strong className="text-gray-800">Department:</strong>{" "}
              {alumnus.dept}
            </p>
            <p>
              <strong className="text-gray-800">Series:</strong>{" "}
              {alumnus.series}
            </p>
            {alumnus.optional && (
              <p>
                <strong className="text-gray-800">Details:</strong>{" "}
                {alumnus.optional}
              </p>
            )}
            <p>
              <strong className="text-gray-800">Location:</strong>{" "}
              {formattedAlumnus.displayLocation}
            </p>
            {badges && <div className="badges">{badges}</div>}
            {alumnus.linkedinurl && (
              <p>
                <Link
                  href={alumnus.linkedinurl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  LinkedIn Profile
                </Link>
              </p>
            )}
            {alumnus.isDynamic && (
              <div className="mt-2 text-xs text-gray-500">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  Database Entry
                </span>
              </div>
            )}
          </div>
        </Popup>
      </Marker>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading alumni network...</p>
        </div>
      </div>
    );
  }

  // Show error state (but still render the map with available data)
  const showError = error && allAlumniData.length === 0;

  return (
    <div>
      {showError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            <span>Unable to load dynamic alumni data. Showing static alumni only.</span>
          </div>
        </div>
      )}
      
      {/* Alumni stats bar */}
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm text-blue-800">
        <div className="flex justify-between items-center">
          <span>
            Showing {allAlumniData.length} alumni 
            {!error && allAlumniData.some(a => a.isDynamic) && (
              <span className="ml-2 text-green-700">
                (Including {allAlumniData.filter(a => a.isDynamic).length} recently added)
              </span>
            )}
          </span>
          <span className="text-xs">
            🗺️ Click markers to zoom • Close popup to zoom out
          </span>
        </div>
      </div>

      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: "calc(100vh - 48px)", width: "100%", zIndex: 0 }}
        maxBounds={[
          [-85, -180],
          [85, 180],
        ]}
        maxBoundsViscosity={1.0}
        minZoom={2}
        maxZoom={18}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {allAlumniData
          .filter(alumnus => {
            // Filter out alumni with invalid coordinates
            return Array.isArray(alumnus.coordinates) && 
                   alumnus.coordinates.length >= 2 &&
                   typeof alumnus.coordinates[0] === 'number' &&
                   typeof alumnus.coordinates[1] === 'number' &&
                   !isNaN(alumnus.coordinates[0]) &&
                   !isNaN(alumnus.coordinates[1]);
          })
          .map((alumnus) => (
            <MarkerWithEvents 
              key={alumnus.Id || alumnus.firebaseId || `${alumnus.name}-${alumnus.series}`} 
              alumnus={alumnus} 
            />
          ))
        }
      </MapContainer>
    </div>
  );
}
