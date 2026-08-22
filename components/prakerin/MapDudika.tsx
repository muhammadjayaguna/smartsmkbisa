'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Building, Navigation } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Fix for default Leaflet marker icons in Next.js
const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export interface Dudika {
  id: string;
  nama_perusahaan: string;
  alamat: string;
  lokasi_lat: number;
  lokasi_lng: number;
  jurusan: string;
  status: string;
}

interface MapDudikaProps {
  dudikas: Dudika[];
  selectedDudikaId?: string | null;
}

// Component to handle map center changes dynamically
const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

// Component to handle flyTo when a marker is clicked in the list
const MapController = ({ dudikas, selectedId, markerRefs }: { dudikas: Dudika[], selectedId?: string | null, markerRefs: React.MutableRefObject<{ [id: string]: L.Marker | null }> }) => {
  const map = useMap();
  
  useEffect(() => {
    if (selectedId) {
      const selected = dudikas.find(d => d.id === selectedId);
      if (selected) {
        map.flyTo([selected.lokasi_lat, selected.lokasi_lng], 16, {
          duration: 1.5,
          animate: true
        });
        
        // Open the popup after a small delay to allow map to move
        setTimeout(() => {
          const marker = markerRefs.current[selectedId];
          if (marker) {
            marker.openPopup();
          }
        }, 500);
      }
    }
  }, [selectedId, dudikas, map, markerRefs]);
  
  return null;
};

const MapDudika: React.FC<MapDudikaProps> = ({ dudikas, selectedDudikaId }) => {
  const [center, setCenter] = useState<[number, number]>([-3.316694, 114.590111]); // Default to Banjarmasin
  const [isClient, setIsClient] = useState(false);
  const markerRefs = React.useRef<{ [id: string]: L.Marker | null }>({});

  useEffect(() => {
    setIsClient(true);
    if (dudikas.length > 0 && !selectedDudikaId) {
      // Calculate average lat/lng or just center to the first one
      const sumLat = dudikas.reduce((acc, curr) => acc + curr.lokasi_lat, 0);
      const sumLng = dudikas.reduce((acc, curr) => acc + curr.lokasi_lng, 0);
      setCenter([sumLat / dudikas.length, sumLng / dudikas.length]);
    }
  }, [dudikas, selectedDudikaId]);

  if (!isClient) return <div className="h-full w-full bg-slate-100 animate-pulse rounded-2xl border border-slate-200"></div>;

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg border border-slate-200/60 z-0">
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={true} 
        className="w-full h-full"
        attributionControl={false}
      >
        <ChangeView center={center} zoom={13} />
        <MapController dudikas={dudikas} selectedId={selectedDudikaId} markerRefs={markerRefs} />
        
        {/* Cool custom map tiles (CartoDB Positron for modern look) */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {dudikas.map((dudika) => (
          <Marker 
            key={dudika.id} 
            position={[dudika.lokasi_lat, dudika.lokasi_lng]}
            icon={customMarkerIcon}
            ref={(r) => { if (r) markerRefs.current[dudika.id] = r; }}
          >
            <Popup className="dudika-popup">
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-slate-100">
                  <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                    <Building className="h-4 w-4" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">{dudika.nama_perusahaan}</h3>
                </div>
                
                <div className="space-y-2 mb-3">
                  <p className="text-xs text-slate-600 flex items-start">
                    <MapPin className="h-3.5 w-3.5 mr-1.5 mt-0.5 shrink-0 text-slate-400" />
                    <span>{dudika.alamat}</span>
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Jurusan: </span> 
                    {dudika.jurusan}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant={dudika.status === 'Aktif' ? 'default' : 'secondary'} className="text-[10px]">
                    {dudika.status}
                  </Badge>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-xs px-2 gap-1 rounded-full text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${dudika.lokasi_lat},${dudika.lokasi_lng}`, '_blank')}
                  >
                    <Navigation className="h-3 w-3" />
                    Rute
                  </Button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Custom styles for Leaflet popups to make them look modern */}
      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(226, 232, 240, 0.8);
        }
        .leaflet-popup-content {
          margin: 12px;
        }
        .leaflet-container a.leaflet-popup-close-button {
          padding: 6px;
          color: #94a3b8;
        }
        .leaflet-container a.leaflet-popup-close-button:hover {
          color: #475569;
        }
      `}</style>
    </div>
  );
};

export default MapDudika;
