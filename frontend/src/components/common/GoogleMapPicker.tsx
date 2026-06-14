import React, { useEffect, useRef, useState } from 'react';
import Spinner from './Spinner';
import { MapPin, Navigation, AlertCircle, Search } from 'lucide-react';

interface GoogleMapPickerProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number, addressDetails?: {
    street?: string;
    area?: string;
    city?: string;
    state?: string;
    pincode?: string;
  }) => void;
}

declare global {
  interface Window {
    google: any;
    googleMapsLoaded?: boolean;
    googleMapsLoading?: boolean;
  }
}

const GoogleMapPicker: React.FC<GoogleMapPickerProps> = ({ latitude, longitude, onChange }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  
  const [apiKey] = useState(() => import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [loadingScript, setLoadingScript] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const googleMapObj = useRef<any>(null);
  const markerObj = useRef<any>(null);

  // Script Loader
  useEffect(() => {
    if (!apiKey) {
      setScriptError(true);
      return;
    }

    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    if (window.googleMapsLoading) {
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkLoaded);
          setMapLoaded(true);
        }
      }, 300);
      return () => clearInterval(checkLoaded);
    }

    window.googleMapsLoading = true;
    setLoadingScript(true);

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      window.googleMapsLoaded = true;
      window.googleMapsLoading = false;
      setLoadingScript(false);
      setMapLoaded(true);
    };

    script.onerror = () => {
      window.googleMapsLoading = false;
      setLoadingScript(false);
      setScriptError(true);
    };

    document.head.appendChild(script);
  }, [apiKey]);

  // Map Initialization
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.google || !window.google.maps) return;

    const google = window.google;
    const center = { lat: latitude, lng: longitude };

    // Create Map
    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: 'administrative.land_parcel',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'poi',
          elementType: 'labels.text',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });
    googleMapObj.current = map;

    // Create Draggable Marker
    const marker = new google.maps.Marker({
      position: center,
      map,
      draggable: true,
      animation: google.maps.Animation.DROP,
    });
    markerObj.current = marker;

    // Drag events
    google.maps.event.addListener(marker, 'dragend', () => {
      const pos = marker.getPosition();
      const lat = pos.lat();
      const lng = pos.lng();
      handleLocationChange(lat, lng);
    });

    // Map click events
    google.maps.event.addListener(map, 'click', (e: any) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      marker.setPosition({ lat, lng });
      handleLocationChange(lat, lng);
    });

    // Setup Autocomplete Input
    if (autocompleteInputRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(autocompleteInputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'IN' }
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) return;

        const loc = place.geometry.location;
        const lat = loc.lat();
        const lng = loc.lng();

        map.setCenter({ lat, lng });
        map.setZoom(17);
        marker.setPosition({ lat, lng });

        // Parse address details
        const details: any = {};
        if (place.address_components) {
          place.address_components.forEach((c: any) => {
            const types = c.types;
            if (types.includes('sublocality_level_1') || types.includes('route')) {
              details.street = c.long_name;
            }
            if (types.includes('sublocality_level_2') || types.includes('neighborhood')) {
              details.area = c.long_name;
            }
            if (types.includes('locality')) {
              details.city = c.long_name;
            }
            if (types.includes('administrative_area_level_1')) {
              details.state = c.long_name;
            }
            if (types.includes('postal_code')) {
              details.pincode = c.long_name;
            }
          });
        }

        onChange(lat, lng, details);
      });
    }
  }, [mapLoaded]);

  // Update marker position if latitude/longitude change from props
  useEffect(() => {
    if (!googleMapObj.current || !markerObj.current || !window.google) return;
    const center = { lat: latitude, lng: longitude };
    markerObj.current.setPosition(center);
    googleMapObj.current.setCenter(center);
  }, [latitude, longitude]);

  const handleLocationChange = (lat: number, lng: number) => {
    // Attempt reverse geocoding if maps loaded
    if (window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          const place = results[0];
          const details: any = {};
          place.address_components.forEach((c: any) => {
            const types = c.types;
            if (types.includes('sublocality_level_1') || types.includes('route')) {
              details.street = c.long_name;
            }
            if (types.includes('sublocality_level_2') || types.includes('neighborhood') || types.includes('sublocality')) {
              details.area = c.long_name;
            }
            if (types.includes('locality')) {
              details.city = c.long_name;
            }
            if (types.includes('administrative_area_level_1')) {
              details.state = c.long_name;
            }
            if (types.includes('postal_code')) {
              details.pincode = c.long_name;
            }
          });
          onChange(lat, lng, details);
        } else {
          onChange(lat, lng);
        }
      });
    } else {
      onChange(lat, lng);
    }
  };

  // Browser Geolocation
  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        onChange(lat, lng);
        setDetecting(false);
      },
      (error) => {
        console.error('Geolocation detection failed', error);
        alert('Could not retrieve your location. Make sure GPS/location services are enabled.');
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Autocomplete */}
      {mapLoaded && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={autocompleteInputRef}
            type="text"
            placeholder="Search address using Google Maps..."
            className="input-premium pl-9 py-2 text-xs w-full"
          />
        </div>
      )}

      {/* Map Container */}
      <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900 h-48 flex items-center justify-center">
        {loadingScript && (
          <div className="flex flex-col items-center gap-2">
            <Spinner size="sm" />
            <span className="text-[10px] text-slate-400 font-semibold">Loading Map Engine...</span>
          </div>
        )}

        {scriptError && (
          <div className="p-4 text-center space-y-2 max-w-xs">
            <AlertCircle className="w-6 h-6 mx-auto text-amber-500" />
            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
              Google Maps API billing is inactive or no VITE_GOOGLE_MAPS_API_KEY is found in variables.
            </p>
            <p className="text-[9px] text-slate-400 leading-relaxed">
              Manual coordinate entry and browser GPS location are fully enabled.
            </p>
          </div>
        )}

        {/* Map Canvas */}
        <div
          ref={mapRef}
          className={`w-full h-full absolute inset-0 transition-opacity duration-300 ${
            mapLoaded ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />
      </div>

      {/* Geolocation trigger */}
      <button
        type="button"
        onClick={detectLocation}
        disabled={detecting}
        className="w-full py-2 border border-slate-250 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors flex items-center justify-center gap-1.5 active:scale-95"
      >
        <Navigation className={`w-3.5 h-3.5 text-blue-500 ${detecting ? 'animate-pulse' : ''}`} />
        {detecting ? 'Locating...' : 'Use My GPS Current Location'}
      </button>
    </div>
  );
};

export default GoogleMapPicker;
