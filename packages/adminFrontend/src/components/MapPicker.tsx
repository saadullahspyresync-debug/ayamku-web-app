// src/components/MapPicker.jsx
import { useState, useEffect, useCallback } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "300px",
  borderRadius: "8px",
};

const defaultCenter = { lat: 4.9031, lng: 114.9398 }; // Brunei center as example

export default function MapPicker({ location, onChange, onAddressChange } : any) {
  const [marker, setMarker] = useState(location || defaultCenter);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  // Update marker from props
  useEffect(() => {
    if (location) setMarker(location);
  }, [location]);

  // Reverse geocode to get address
  const fetchAddress = useCallback(async (lat: number, lng: number) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        onAddressChange(results[0].formatted_address);
      }
    });
  }, [onAddressChange]);

  const handleClick = (e : any) => {
    const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setMarker(newPos);
    onChange(newPos);
    fetchAddress(newPos.lat, newPos.lng);
  };

  const handleDragEnd = (e : any) => {
    const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setMarker(newPos);
    onChange(newPos);
    fetchAddress(newPos.lat, newPos.lng);
  };

  if (!isLoaded) return <p>Loading map…</p>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={marker}
      zoom={14}
      onClick={handleClick}
    >
      <Marker position={marker} draggable onDragEnd={handleDragEnd} />
    </GoogleMap>
  );
}
