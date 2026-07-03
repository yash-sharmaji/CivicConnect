import React, { useState, useEffect, useRef } from 'react';
import { getStoredIssues } from '@/lib/mockData';
import { Compass, Navigation } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#050508" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#050508" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#747474" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#c4c4c4" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8c8c8c" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#081c15" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#95a5a6" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#121216" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f1f24" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#1f1f2e" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#2d2d3f" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b7280" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#090918" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4b5563" }],
  },
];

const loadGoogleMapsScript = (callback) => {
  if (window.google) {
    callback();
    return;
  }

  const existingScript = document.getElementById('google-maps-script');
  if (existingScript) {
    existingScript.addEventListener('load', callback);
    return;
  }

  const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const script = document.createElement('script');
  script.id = 'google-maps-script';
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
  script.addEventListener('load', callback);
};

export const InteractiveMap = ({
  interactive = true,
  onLocationSelect,
  selectedLat,
  selectedLng,
  highlightIssueId,
  filterCategory = 'All',
  filterStatus = 'All',
  filterSeverity = 'All',
  searchQuery = ''
}) => {
  const { user, triggerGuestRestriction } = useAuth();
  const [issues, setIssues] = useState([]);
  const [userPin, setUserPin] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const tempMarkerRef = useRef(null);
  const userLocationMarkerRef = useRef(null);
  const infoWindowRef = useRef(null);

  useEffect(() => {
    getStoredIssues().then(setIssues);
    if (selectedLat && selectedLng) {
      setUserPin({ lat: selectedLat, lng: selectedLng });
    }
  }, [selectedLat, selectedLng]);

  // Initialize Map
  useEffect(() => {
    loadGoogleMapsScript(() => {
      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      const defaultCenter = { lat: 37.7749, lng: -122.4194 }; // San Francisco defaults

      const mapOptions = {
        zoom: 13,
        center: defaultCenter,
        styles: darkMapStyle,
        disableDefaultUI: false,
        mapTypeControl: false,
        streetViewControl: false,
      };

      const mapInstance = new google.maps.Map(mapContainerRef.current, mapOptions);
      mapInstanceRef.current = mapInstance;
      infoWindowRef.current = new google.maps.InfoWindow();

      // Geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLoc = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            mapInstance.setCenter(userLoc);

            userLocationMarkerRef.current = new google.maps.Marker({
              position: userLoc,
              map: mapInstance,
              title: "Your Location",
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#3b82f6",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2
              }
            });
          },
          (error) => {
            console.warn("Geolocation permission denied or failed:", error);
          }
        );
      }

      // Map Click logic
      if (interactive && onLocationSelect) {
        mapInstance.addListener('click', (e) => {
          if (!user) {
            triggerGuestRestriction("An account is required to select map coordinates and file reports. Please sign in or register.");
            return;
          }
          const clickedLatLng = e.latLng;
          const lat = clickedLatLng.lat();
          const lng = clickedLatLng.lng();

          if (tempMarkerRef.current) {
            tempMarkerRef.current.setPosition(clickedLatLng);
          } else {
            tempMarkerRef.current = new google.maps.Marker({
              position: clickedLatLng,
              map: mapInstance,
              title: "Selected Location",
              icon: {
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                scale: 5,
                fillColor: "#6366f1",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 1
              }
            });
          }

          setUserPin({ lat, lng });

          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            if (status === 'OK' && results[0]) {
              address = results[0].formatted_address;
            }
            onLocationSelect({ address, lat, lng });
          });
        });
      }
    });

    return () => {
      if (markersRef.current) {
        markersRef.current.forEach((m) => m.setMap(null));
      }
      if (tempMarkerRef.current) {
        tempMarkerRef.current.setMap(null);
      }
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.setMap(null);
      }
    };
  }, [interactive, onLocationSelect]);

  // Center on explicitly selected coordinates
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedLat || !selectedLng) return;

    const targetCoords = { lat: selectedLat, lng: selectedLng };
    mapInstanceRef.current.setCenter(targetCoords);
    mapInstanceRef.current.setZoom(15);

    if (tempMarkerRef.current) {
      tempMarkerRef.current.setPosition(targetCoords);
    } else {
      tempMarkerRef.current = new google.maps.Marker({
        position: targetCoords,
        map: mapInstanceRef.current,
        title: "Selected Location",
        icon: {
          path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 5,
          fillColor: "#6366f1",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 1
        }
      });
    }
  }, [selectedLat, selectedLng]);

  // Filter logic
  const filteredIssues = issues.filter(issue => {
    if (filterCategory !== 'All' && issue.category !== filterCategory) return false;
    if (filterStatus !== 'All' && issue.status !== filterStatus) return false;
    if (filterSeverity !== 'All' && issue.severity !== filterSeverity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        issue.title.toLowerCase().includes(q) ||
        issue.description.toLowerCase().includes(q) ||
        issue.location.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getMarkerColor = (severity, status) => {
    if (status === 'resolved') return '#10b981';
    if (severity === 'critical') return '#ef4444';
    if (severity === 'high') return '#f59e0b';
    return '#6366f1';
  };

  // Render issue markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    filteredIssues.forEach((issue) => {
      if (!issue.location || !issue.location.lat || !issue.location.lng) return;

      const marker = new google.maps.Marker({
        position: { lat: issue.location.lat, lng: issue.location.lng },
        map: mapInstanceRef.current,
        title: issue.title,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: getMarkerColor(issue.severity, issue.status),
          fillOpacity: 1,
          strokeColor: '#000000',
          strokeWeight: 1,
        }
      });

      const getStatusColorHex = (status) => {
        switch (status) {
          case 'reported': return '#f59e0b';
          case 'verified': return '#6366f1';
          case 'in-progress': return '#3b82f6';
          case 'resolved': return '#10b981';
          default: return '#9ca3af';
        }
      };

      const getSeverityColorHex = (severity) => {
        switch (severity) {
          case 'low': return '#9ca3af';
          case 'medium': return '#f59e0b';
          case 'high': return '#f97316';
          case 'critical': return '#ef4444';
          default: return '#9ca3af';
        }
      };

      marker.addListener('click', () => {
        if (!infoWindowRef.current) return;

        const contentString = `
          <div style="background-color: #0b0b0e; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px; max-width: 240px; color: #fff; font-family: sans-serif; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
            ${issue.imageUrl ? `<img src="${issue.imageUrl}" alt="${issue.title}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />` : ''}
            <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: ${getStatusColorHex(issue.status)}; margin-bottom: 4px;">
              ${issue.status.replace('-', ' ')}
            </div>
            <h4 style="font-size: 14px; font-weight: bold; margin: 0 0 4px 0; color: #fff;">${issue.title}</h4>
            <div style="font-size: 11px; color: #9ca3af; margin-bottom: 6px;">${issue.category}</div>
            <div style="display: flex; align-items: center; gap: 4px; font-size: 11px; color: #d1d5db; margin-bottom: 8px;">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background-color: ${getSeverityColorHex(issue.severity)}"></span>
              <span style="text-transform: capitalize;">${issue.severity} Severity</span>
            </div>
            <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; text-align: right;">
              <a href="/issues/${issue.id}" style="color: #6366f1; text-decoration: none; font-size: 11px; font-weight: bold; display: inline-block;">View Details →</a>
            </div>
          </div>
        `;

        infoWindowRef.current.setContent(contentString);
        infoWindowRef.current.open(mapInstanceRef.current, marker);
      });

      markersRef.current.push(marker);
    });
  }, [filteredIssues]);

  // Center on highlighted issue
  useEffect(() => {
    if (!mapInstanceRef.current || !highlightIssueId) return;

    const matchingIssue = filteredIssues.find((i) => i.id === highlightIssueId);
    if (matchingIssue && matchingIssue.location) {
      const coords = { lat: matchingIssue.location.lat, lng: matchingIssue.location.lng };
      mapInstanceRef.current.setCenter(coords);
      mapInstanceRef.current.setZoom(15);
    }
  }, [highlightIssueId, filteredIssues]);

  return (
    <div className="relative w-full h-full bg-[#050508] border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col select-none">
      {/* Top Banner Control bar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 p-2 bg-[#09090c]/85 border border-white/10 rounded-xl backdrop-blur-md">
        <Compass className="w-4 h-4 text-indigo-400 animate-spin-slow" />
        <span className="text-xs font-semibold text-white tracking-wide uppercase">Metro Core Grid</span>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] text-emerald-400 font-medium">Live Feed Connected</span>
      </div>

      {/* Google Maps Container */}
      <div ref={mapContainerRef} className="w-full flex-1 min-h-[300px]" />

      {/* Instruction footer in report mode */}
      {onLocationSelect && !userPin && (
        <div className="absolute bottom-4 left-4 right-4 z-20 p-2.5 bg-indigo-950/40 border border-indigo-500/20 rounded-xl backdrop-blur-md flex items-center gap-2 justify-center text-xs text-indigo-300 pointer-events-none">
          <Navigation className="w-3.5 h-3.5 animate-bounce" />
          <span>Click anywhere on the core grid map to select issue location</span>
        </div>
      )}
    </div>
  );
};
