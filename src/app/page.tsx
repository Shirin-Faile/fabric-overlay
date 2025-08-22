"use client";

import React, { useCallback, useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

type ComboMeta = {
  couchIndex: number;
  fabricIndex: number;
  dataUrl: string;
};

export default function Home() {
  const [couchImages, setCouchImages] = useState<string[]>([]);
  const [fabricImages, setFabricImages] = useState<string[]>([]);
  const [outputImages, setOutputImages] = useState<ComboMeta[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCouchUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setCouchImages(files.map((f) => URL.createObjectURL(f)));
  };

  const handleFabricUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setFabricImages(files.map((f) => URL.createObjectURL(f)));
  };

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const renderCombo = async (
    couchSrc: string,
    fabricSrc: string
  ): Promise<string> => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    canvas.width = 500;
    canvas.height = 500;

    const [couchImg, fabricImg] = await Promise.all([
      loadImage(couchSrc),
      loadImage(fabricSrc),
    ]);

    // Scale couch nicely into the top half (same logic you had, generalized)
    const originalWidth = couchImg.width;
    const originalHeight = couchImg.height;
    const aspectRatio = originalWidth / originalHeight;

    let newCouchWidth: number;
    let newCouchHeight: number;

    if (aspectRatio > 2) {
      // Very wide couch: fit width
      newCouchWidth = 500;
      newCouchHeight = 500 / aspectRatio;
    } else {
      // More balanced couch: fit height
      newCouchHeight = 250;
      newCouchWidth = aspectRatio * 250;
    }

    const couchX = (canvas.width - newCouchWidth) / 2;
    const couchY = (250 - newCouchHeight) / 2;

    // Clear & white background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Couch in the top half
    ctx.drawImage(couchImg, couchX, couchY, newCouchWidth, newCouchHeight);

    // Fabric fills the bottom half
    ctx.drawImage(fabricImg, 0, 250, 500, 250);

    return canvas.toDataURL("image/png");
  };

  const applyFabricOverlay = useCallback(async () => {
    if (couchImages.length === 0 || fabricImages.length === 0) return;

    setIsProcessing(true);
    setOutputImages([]);

    try {
      // Build all combinations (cartesian product)
      const tasks: Promise<ComboMeta>[] = [];
      couchImages.forEach((couchSrc, cIdx) => {
        fabricImages.forEach((fabricSrc, fIdx) => {
          const p = renderCombo(couchSrc, fabricSrc).then((dataUrl) => ({
            couchIndex: cIdx,
            fabricIndex: fIdx,
            dataUrl,
          }));
          tasks.push(p);
        });
      });

      const results = await Promise.all(tasks);
      setOutputImages(results);
    } finally {
      setIsProcessing(false);
    }
  }, [couchImages, fabricImages]);

  const downloadAllImages = () => {
    if (outputImages.length === 0) return;
    const zip = new JSZip();

    outputImages.forEach(({ couchIndex, fabricIndex, dataUrl }) => {
      const base64 = dataUrl.split(",")[1];
      const filename = `couch_${couchIndex + 1}__fabric_${fabricIndex + 1}.png`;
      zip.file(filename, base64, { base64: true });
    });

    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, "fabric_overlays.zip");
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-5">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        🛋️ Fabric Overlay App
      </h1>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Left column: multiple couches */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">Couches (select multiple)</h2>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleCouchUpload}
            className="border p-2 rounded bg-white shadow hover:shadow-md transition focus:ring-2 focus:ring-blue-400 w-full"
          />
          {couchImages.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {couchImages.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`couch-${i}`}
                  className="w-full h-24 object-cover rounded border"
                />
              ))}
            </div>
          )}
        </div>

        {/* Right column: multiple fabrics */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">Fabrics (select multiple)</h2>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFabricUpload}
            className="border p-2 rounded bg-white shadow hover:shadow-md transition focus:ring-2 focus:ring-blue-400 w-full"
          />
          {fabricImages.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {fabricImages.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`fabric-${i}`}
                  className="w-full h-24 object-cover rounded border"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={applyFabricOverlay}
        disabled={
          isProcessing || couchImages.length === 0 || fabricImages.length === 0
        }
        className={`px-6 py-2 text-white font-semibold rounded-lg transition
          ${isProcessing ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
      >
        {isProcessing ? "Processing..." : "🎨 Apply Fabrics to Couches"}
      </button>

      <div className="flex flex-wrap justify-center gap-6 mt-8">
        {outputImages.map(({ dataUrl, couchIndex, fabricIndex }, i) => (
          <div key={`${couchIndex}-${fabricIndex}-${i}`} className="bg-white p-3 rounded-lg shadow-md">
            <img
              src={dataUrl}
              alt={`couch_${couchIndex + 1}__fabric_${fabricIndex + 1}`}
              className="rounded-lg shadow-md w-[300px] h-[300px] border border-gray-300 object-cover"
            />
            <div className="text-sm text-gray-600 mt-2 text-center">
              couch {couchIndex + 1} × fabric {fabricIndex + 1}
            </div>
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

