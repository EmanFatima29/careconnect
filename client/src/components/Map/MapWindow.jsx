"use client";
import dynamic from "next/dynamic";
import Spinner from "../Spinner";

// Dynamically import Map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import("@/components/Map/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center p-8 w-full h-full">
      <Spinner size={50} />
      <p className="mt-4 text-gray-600 dark:text-gray-300 transition-colors duration-300">
        Loading map...
      </p>
    </div>
  ),
});

const MapWindow = () => {
  return (
    <div className="flex flex-col items-center w-full h-full">
      <Map />
    </div>
  );
};

export default MapWindow;
