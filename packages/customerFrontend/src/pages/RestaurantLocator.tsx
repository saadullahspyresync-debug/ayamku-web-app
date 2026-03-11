import React, { useEffect, useRef, useState } from "react";

import { fetchBranches } from "@/services/api";


interface Branch {
  branchId: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  services: { dineIn?: boolean; pickup?: boolean }; // e.g., ["dine-in", "pickup"]
  businessHours: {
    open: string;
    close: string;
    friday: {
      isClosed: boolean;
      open: string;
      close: string;
    };
  };
  phone: string;
}

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
let googleScriptLoadingPromise: Promise<void> | null = null;

export default function RestaurantLocator() {

  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const mapRef = useRef<google.maps.Map | null>(null);
  const mapElementRef = useRef<HTMLDivElement>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  const defaultPos = { lat: 3.139, lng: 101.6869 }; // Kuala Lumpur

 useEffect(() => {
    const start = async () => {
      await loadGoogleMapsScript();
      await initializeMap();
      await fetchBranch();
    };
    start();
  }, []);

  // Update markers when filters change
  useEffect(() => {
    refreshMarkers();
  }, [filteredBranches]);

  const loadGoogleMapsScript = (): Promise<void> => {
    // 1. If already loaded, resolve immediately
    if (window.google?.maps?.importLibrary) {
      return Promise.resolve();
    }

    // 2. If already loading, return the existing promise
    if (googleScriptLoadingPromise) {
      return googleScriptLoadingPromise;
    }

    // 3. Start loading for the first time
    googleScriptLoadingPromise = new Promise((resolve, reject) => {
      const existingScript = document.getElementById('google-maps-script');
      
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject());
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geocoding,marker&v=weekly&loading=async`;
      script.async = true;
      script.onload = () => {
        // Poll until importLibrary is actually attached to the window
        const checkInterval = setInterval(() => {
          if (window.google?.maps?.importLibrary) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 50); // Check every 50ms
      };
      script.onerror = (e) => {
        googleScriptLoadingPromise = null; // Reset so we can try again
        reject(e);
      };
      document.head.appendChild(script);
    });

    return googleScriptLoadingPromise;
  };
  const initializeMap = async () => {
    if (!mapElementRef.current || mapRef.current) return;

    try {    
      // Import required libraries
      const [{ Map, InfoWindow }] = await Promise.all([
        google.maps.importLibrary('maps') as Promise<google.maps.MapsLibrary>,
        google.maps.importLibrary('marker') as Promise<google.maps.MarkerLibrary>,
      ]);

      // Check if map already exists to prevent re-initialization 
      // which causes the "Element already defined" flicker
      if (mapRef.current) return;

      // Create map
      mapRef.current = new Map(mapElementRef.current, {
        center: defaultPos,
        zoom: 11,
        mapId: 'DEMO_MAP_ID',
        zoomControl: true,
      });

      // Initialize info window
      infoWindowRef.current = new InfoWindow();

    } catch (err) {
      console.error('Map initialization error:', err);
    }
  };

  const fetchBranch = async () => {
    try {
      const data = await fetchBranches();

      setBranches(data);
      setFilteredBranches(data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch branches", err);
    }
  };

  const refreshMarkers = async () => {
    if (!mapRef.current) return;

    // 1. Clear existing markers
    markersRef.current.forEach(m => m.map = null);
    markersRef.current = [];

    const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;

    // 2. Add new markers for filtered results
    filteredBranches.forEach(branch => {
      const marker = new AdvancedMarkerElement({
        map: mapRef.current,
        position: branch.coordinates,
        title: branch.name,
      });

      marker.addListener('gmp-click', () => {
        const content = `
          <div style="color: #333; font-family: sans-serif; padding: 10px;">
            <h3 style="margin: 0 0 5px 0; font-weight: bold; font-size: 14px;">${branch.name}</h3>
            <p style="font-size: 12px; margin: 5px 0;"><strong style="font-weight: bold">Normal Hours:</strong> ${branch.businessHours.open} - ${branch.businessHours.close}</p>
            <p style="font-size: 12px; margin: 5px 0;"><strong style="font-weight: bold">Friday Hours:</strong> ${branch.businessHours.friday.isClosed ? "Closed" : `${branch.businessHours.friday.open} - ${branch.businessHours.friday.close}`}</p>
            <div style="margin-top: 10px; display: flex; gap: 10px;">
               <a href="https://www.google.com/maps/dir/?api=1&destination=${branch.coordinates.lat},${branch.coordinates.lng}" 
                  target="_blank" 
                  style="background: #EAB308; color: white; padding: 5px 10px; border-radius: 4px; text-decoration: none; font-size: 12px;">
                  Get Directions
               </a>
               <a href="tel:${branch.phone}" style="font-size: 12px; align-self: center;">Call</a>
            </div>
          </div>
        `;
        infoWindowRef.current?.setContent(content);
        infoWindowRef.current?.open(mapRef.current, marker);
      });

      markersRef.current.push(marker);
    });
  };

  const handleFilterChange = (type: string) => {
    setFilter(type);
    if (type === "all") {
      setFilteredBranches(branches);
    } else {
      const serviceKey = (type === "dine-in" ? "dineIn" : type) as keyof Branch["services"];
      const filtered = branches.filter((b) => {
        return b.services && b.services[serviceKey] === true;
      });
    
      setFilteredBranches(filtered);
    }
  };

  return (
  <div className="max-w-6xl mx-auto p-4">
    <h1 className="text-2xl font-bold mb-4 text-gray-800">Our Locations</h1>
    
    {/* Filter Buttons */}
    <div className="flex flex-wrap gap-2 mb-4">
      {['all', 'dine-in', 'pickup'].map((t) => (
        <button
          key={t}
          onClick={() => handleFilterChange(t)}
          className={`px-4 py-1.5 rounded-full border text-sm capitalize transition-colors ${
            filter === t ? "bg-yellow-400 border-yellow-500 font-semibold" : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          {t}
        </button>
      ))}
    </div>

    {/* Main Container: Stacked on mobile, side-by-side on laptop */}
    <div className="flex flex-col md:flex-row gap-4">
      
      {/* Sidebar List: Order 2 on mobile (bottom), Order 1 on laptop (left) */}
      <div className="order-2 md:order-1 w-full md:w-1/3">
        <div 
          className="overflow-y-auto border rounded-lg p-2 space-y-2 bg-white shadow-sm
                     max-h-[300px] md:max-h-[500px] h-auto"
        >
          {loading ? (
            <p className="p-4 text-center text-gray-500">Loading branches...</p>
          ) : filteredBranches.length > 0 ? (
            filteredBranches.map(branch => (
              <div 
                key={branch.branchId}
                onClick={() => {
                   mapRef.current?.panTo(branch.coordinates);
                   mapRef.current?.setZoom(16);
                   // Scroll to map on mobile when a branch is clicked
                   if (window.innerWidth < 768) {
                     window.scrollTo({ top: 0, behavior: 'smooth' });
                   }
                }}
                className="p-3 border rounded-md hover:border-yellow-400 hover:bg-yellow-50/30 cursor-pointer transition group"
              >
                <h4 className="font-bold text-gray-800 group-hover:text-yellow-600">{branch.name}</h4>
                <p className="text-xs text-gray-500 line-clamp-2">{branch.address}</p>
              </div>
            ))
          ) : (
            <p className="p-4 text-center text-gray-500 text-sm">No branches found for this filter.</p>
          )}
        </div>
      </div>

      {/* Map Container: Order 1 on mobile (top), Order 2 on laptop (right) */}
      <div className="order-1 md:order-2 w-full md:w-2/3">
        <div 
          ref={mapElementRef} 
          className="w-full h-[350px] md:h-[500px] rounded-lg shadow-md border bg-gray-100" 
        />
      </div>
      
    </div>
  </div>
);

}