import React, { useEffect, useRef, useState } from "react";


interface MapPickerProps {
  initialAddress?: string;
  initialCoords?: { lat: number; lng: number };
  onLocationSelect: (loc: { address: string; lat: number; lng: number; placeId: string }) => void;
}

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
let googleScriptLoadingPromise: Promise<void> | null = null;

export default function MapPicker({ initialAddress, initialCoords, onLocationSelect }: MapPickerProps) {
  
  // const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for Google Maps objects
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const autocompleteContainerRef = useRef<HTMLDivElement>(null);
  const mapElementRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null); // Your simple input field
  // const autocompleteRef = useRef<any>(null);

  const defaultPos = initialCoords?.lat ? initialCoords : { lat: 4.8903, lng: 114.9404 };

  // Load Google Maps script
  useEffect(() => {
    const setup = async () => {
      try {
        await loadGoogleMapsScript(); // Wait for script to exist
        await initializeMap();        // Then build the map
      } catch (err) {
        setError("Google Maps failed to load.");
      }
    };
    setup();
  }, []);

  // Sync input field when initialAddress changes (Crucial for Edit mode)
  useEffect(() => {
    if (inputRef.current && initialAddress) {
      inputRef.current.value = initialAddress;
    }
  }, [initialAddress]);

  // Sync Map and Marker when initialCoords change
  useEffect(() => {
    if (mapRef.current && markerRef.current && initialCoords) {
      const newPos = { lat: initialCoords.lat, lng: initialCoords.lng };
      mapRef.current.setCenter(newPos);
      markerRef.current.position = newPos;
    }
  }, [initialCoords]);

  const loadGoogleMapsScript = (): Promise<void> => {
    // 1. If already loaded, resolve immediately
    if ((window.google?.maps as any)?.importLibrary) {
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
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geocoding,marker&v=weekly&loading=async&language=en`;
      script.async = true;
      script.onload = () => {
        // Poll until importLibrary is actually attached to the window
        const checkInterval = setInterval(() => {
          if ((window.google?.maps as any)?.importLibrary) {
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
    if (!mapElementRef.current || !window.google?.maps?.importLibrary) return;

    try {
      interface ModernPlacesLibrary extends google.maps.PlacesLibrary {
        PlaceAutocompleteElement: any; // We use any because it's a Custom Element constructor
      }

      // Import required libraries
      const [{ Map, InfoWindow }, { AdvancedMarkerElement }, { Geocoder }, placesLib] = await Promise.all([
        google.maps.importLibrary('maps') as Promise<google.maps.MapsLibrary>,
        google.maps.importLibrary('marker') as Promise<google.maps.MarkerLibrary>,
        google.maps.importLibrary('geocoding') as Promise<google.maps.GeocodingLibrary>,
        google.maps.importLibrary('places') as Promise<google.maps.PlacesLibrary> as Promise<ModernPlacesLibrary>,
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

      // Initialize geocoder
      geocoderRef.current = new Geocoder();

      // Initialize info window
      infoWindowRef.current = new InfoWindow();

      // Create draggable marker
      markerRef.current = new AdvancedMarkerElement({
          map: mapRef.current,
          position: defaultPos,
          gmpDraggable: true,
          title: 'Drag me to select location'
      });

      // Add marker drag event
      markerRef.current.addListener('dragend', async () => {
        const position = markerRef.current?.position;
        if (!position) return;

        // Extract the numbers by checking if the property is a function or a number
        const lat: number = typeof position.lat === 'function' ? position.lat() : position.lat;
        const lng: number = typeof position.lng === 'function' ? position.lng() : position.lng;

        await handleReverseGeocode(lat, lng);

        if (infoWindowRef.current && markerRef.current) {
          infoWindowRef.current.close();
          infoWindowRef.current.setContent(`
            <div style="padding: 10px;">
              <strong>Selected Location</strong><br>
              Lat: ${lat.toFixed(6)}<br>
              Lng: ${lng.toFixed(6)}
            </div>
          `);
          infoWindowRef.current.open(markerRef.current.map, markerRef.current);
        }
      });

      // Add map click listener
      mapRef.current.addListener('click', async (event: google.maps.MapMouseEvent) => {
        if (!markerRef.current || !event.latLng) return;
        
        markerRef.current.position = event.latLng;
        await handleReverseGeocode(event.latLng.lat(), event.latLng.lng());
      });

      // Initialize Place Autocomplete (Restrict to Malaysia)
      const autocompleteElement = new placesLib.PlaceAutocompleteElement({
          includedRegionCodes: ['MY', 'SG', 'TH', 'ID']  // ISO 3166-1 alpha-2 country code
      });

      // Add autocomplete to container
      if (autocompleteContainerRef.current) {
        autocompleteContainerRef.current.innerHTML = '';
        autocompleteContainerRef.current.appendChild(autocompleteElement);
      }

      // Listen for place selection (using gmp-select, not gmp-placeselect) searching purpose
      // autocompleteElement.addEventListener('gmp-select', async (event: any) => {
      //   const placePrediction = event.placePrediction;

      //   if (!placePrediction) return;

      //   // Convert prediction to place
      //   const place = placePrediction.toPlace();

      //   // Fetch place details
      //   await place.fetchFields({
      //       fields: ['addressComponents', 'formattedAddress', 'location']
      //   });

      //   if (!place.location) return;      

      //   const location = place.location;
      //   if (mapRef.current && markerRef.current) {
      //     mapRef.current.setCenter(location);
      //     mapRef.current.setZoom(15);
      //     markerRef.current.position = location;
      //   }

      //   // SYNC PARENT ON AUTOCOMPLETE
      //     onLocationSelect({
      //       address: place.formattedAddress || "",
      //       lat: place.location.lat(),
      //       lng: place.location.lng(),
      //       placeId: place.id || "",
      //     });

      //   // populateFormFromPlace(place);
      // });
      } catch (err:any) {
        setError(err.message);
        setTimeout(() => {
          setError(null);
        }, 3000);
      }
  };

  const handleReverseGeocode = async (lat: number, lng: number) => {
    if (!geocoderRef.current) return;

    try {
      const { results } = await geocoderRef.current.geocode({
        location: { lat, lng }
      });

      if (results && results[0]) {
        populateFormFromGeocode(results[0], lat, lng);
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    }
  };

  
  const populateFormFromGeocode = (result: google.maps.GeocoderResult, lat: number, lng: number) => {
    const addressComponents = result.address_components || [];
    // const parsed = parseAddressComponents(addressComponents);    
    
    onLocationSelect({
      address: result.formatted_address,
      lat: lat,
      lng: lng,
      placeId: result.place_id,
    });
    
  };

  return (
    <div className="space-y-3">
      {error && <div className="text-red-500 text-xs">{error}</div>}

      {/* Address */}
      <input
        ref={inputRef}
        defaultValue={initialAddress}
        placeholder="Search for your branch location..."
        className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-yellow-400 outline-none"
      />

      {/* Map Display */}
      <div ref={mapElementRef} className="w-full h-64 rounded-md border shadow-inner bg-gray-100" />
      
      <p className="text-[10px] text-gray-400 italic">
        Drag the marker or click map to fine-tune location.
      </p>
    </div>
  );
}
