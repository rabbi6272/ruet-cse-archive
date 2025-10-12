'use client';

import { useState, useEffect } from "react";
import { ResourceCard } from "./resource-card-optimized";
import { getResourcesData, resourcesData } from "@/components/resources/resources-data";

// Dynamic resources grid that fetches from Firebase
export function ResourcesGridOptimized() {
  const [resources, setResources] = useState(resourcesData); // Start with static data
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const dynamicResources = await getResourcesData();
        setResources(dynamicResources);
      } catch (error) {
        console.error('Failed to fetch resources:', error);
        // Keep static data as fallback
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  if (loading) {
    return (
      <div className="w-full px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-sm border animate-pulse"
            >
              <div className="h-48 bg-gray-200 rounded-t-2xl"></div>
              <div className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 animate-fade-in">
        {resources.map((item, index) => (
          <div
            key={item.id}
            className="opacity-0 animate-slide-up"
            style={{
              animationDelay: `${index * 100}ms`,
              animationFillMode: "forwards",
            }}
          >
            <ResourceCard
              id={item.id}
              title={item.title}
              description={item.description}
              image={item.image}
              links={item.links}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
