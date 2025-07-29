"use client"; // Mark as client component.

import dynamic from "next/dynamic";
import { useEffect } from "react";
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

// Import alumni data
import { alumniData } from "./alumnidata";

export function Leafletmap() {
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

  // Custom component to handle map instance and marker events
  const MarkerWithEvents = ({ alumnus }) => {
    const map = useMap(); // Safely access the map instance

    const handleClick = () => {
      map.flyTo(alumnus.coordinates.reverse(), 10, { duration: 1 });
    };

    const handlePopupClose = () => {
      map.flyTo([20, 0], 2, { duration: 1 });
    };

    const [lng, lat] = alumnus.coordinates;
    const badges = alumnus.badges
      ? alumnus.badges.split(",").map((badge) => (
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
            <h3 className="text-gray-900">{alumnus.name}</h3>
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
              <strong className="text-gray-800">Address:</strong>{" "}
              {alumnus.address}
            </p>
            <p>
              <strong className="text-gray-800">Country:</strong>{" "}
              {alumnus.country}
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
          </div>
        </Popup>
      </Marker>
    );
  };

  return (
    <div>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: "100vh", width: "100%",zIndex: 0 }}
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
        {alumniData.map((alumnus) => (
          <MarkerWithEvents key={alumnus.Id} alumnus={alumnus} />
        ))}
      </MapContainer>
    </div>
  );
}
