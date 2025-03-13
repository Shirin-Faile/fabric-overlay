"use client"; // Next.js Client Component

import React, { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function Home() {
  const [couchImage, setCouchImage] = useState<string | null>(null);
  const [fabricImages, setFabricImages] = useState<string[]>([]);
  const [outputImages, setOutputImages] = useState<string[]>([]);

  const handleCouchUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCouchImage(URL.createObjectURL(file));
    }
  };

  const handleFabricUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFabricImages(files.map((file) => URL.createObjectURL(file)));
  };

  const applyFabricOverlay = () => {
    if (!couchImage || fabricImages.length === 0) return;
  
    setOutputImages([]); // Clear previous images
  
    fabricImages.forEach((fabricSrc) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
  
      canvas.width = 500;
      canvas.height = 500;
  
      const couchImg = new Image();
      couchImg.src = couchImage;
  
      couchImg.onload = () => {
        // Get original dimensions
        const originalWidth = couchImg.width;
        const originalHeight = couchImg.height;
        const aspectRatio = originalWidth / originalHeight;
  
        let newCouchWidth, newCouchHeight;
  
        if (aspectRatio > 2) {
          // Very wide couch: fit width
          newCouchWidth = 500;
          newCouchHeight = 500 / aspectRatio;
        } else {
          // More balanced couch: fit height
          newCouchHeight = 250;
          newCouchWidth = aspectRatio * 250;
        }
  
        const couchX = (canvas.width - newCouchWidth) / 2; // Center horizontally
        const couchY = (250 - newCouchHeight) / 2; // Center in top half
  
        const fabricImg = new Image();
        fabricImg.src = fabricSrc;
  
        fabricImg.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
  
          // Fill background white so no gaps appear
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
  
          // Draw the couch properly scaled
          ctx.drawImage(couchImg, couchX, couchY, newCouchWidth, newCouchHeight);
  
          // Draw fabric at the bottom half
          ctx.drawImage(fabricImg, 0, 250, 500, 250);
  
          const outputURL = canvas.toDataURL("image/png");
          setOutputImages((prev) => [...prev, outputURL]);
        };
      };
    });
  };  

  const downloadAllImages = () => {
    if (outputImages.length === 0) return;

    const zip = new JSZip();
    outputImages.forEach((imgSrc, index) => {
      zip.file(`fabric_overlay_${index + 1}.png`, imgSrc.split(",")[1], { base64: true });
    });

    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, "fabric_overlays.zip");
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-5">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">🛋️ Fabric Overlay App</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="file"
          accept="image/*"
          onChange={handleCouchUpload}
          className="border p-2 rounded bg-white shadow-md hover:shadow-lg transition focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFabricUpload}
          className="border p-2 rounded bg-white shadow-md hover:shadow-lg transition focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <button
        onClick={applyFabricOverlay}
        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
      >
        🎨 Apply Fabrics
      </button>

      <div className="flex flex-wrap justify-center gap-6 mt-8">
        {outputImages.map((imgSrc, index) => (
          <div key={index} className="bg-white p-3 rounded-lg shadow-md">
            <img
              src={imgSrc}
              alt={`output-${index}`}
              className="rounded-lg shadow-md w-[300px] h-[300px] border border-gray-300"
            />
          </div>
        ))}
      </div>

      {outputImages.length > 0 && (
        <button
          onClick={downloadAllImages}
          className="mt-6 px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
        >
          ⬇️ Download All
        </button>
      )}
    </div>
  );
}
