"use client";

import React, { useCallback, useState } from "react";
import Image from "next/image";
import JSZip from "jszip";
import { saveAs } from "file-saver";

type ComboMeta = {
  couchIndex: number;
  fabricIndex: number;
  couchName: string;
  fabricName: string;
  dataUrl: string;
};

type UploadedImage = {
  name: string;
  url: string;
};

export default function Home() {
  const [couchImages, setCouchImages] = useState<UploadedImage[]>([]);
  const [fabricImages, setFabricImages] = useState<UploadedImage[]>([]);
  const [outputImages, setOutputImages] = useState<ComboMeta[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCouchUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setCouchImages(
      files.map((f) => ({
        name: f.name.replace(/\.[^/.]+$/, ""), // remove file extension
        url: URL.createObjectURL(f),
      }))
    );
  };

  const handleFabricUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setFabricImages(
      files.map((f) => ({
        name: f.name.replace(/\.[^/.]+$/, ""), // remove file extension
        url: URL.createObjectURL(f),
      }))
    );
  };

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const renderCombo = useCallback(
    async (couchSrc: string, fabricSrc: string): Promise<string> => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return "";

      canvas.width = 500;
      canvas.height = 500;

      const [couchImg, fabricImg] = await Promise.all([
        loadImage(couchSrc),
        loadImage(fabricSrc),
      ]);

      const originalWidth = couchImg.width;
      const originalHeight = couchImg.height;
      const aspectRatio = originalWidth / originalHeight;

      let newCouchWidth: number;
      let newCouchHeight: number;

      if (aspectRatio > 2) {
        newCouchWidth = 500;
        newCouchHeight = 500 / aspectRatio;
      } else {
        newCouchHeight = 250;
        newCouchWidth = aspectRatio * 250;
      }

      const couchX = (canvas.width - newCouchWidth) / 2;
      const couchY = (250 - newCouchHeight) / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(couchImg, couchX, couchY, newCouchWidth, newCouchHeight);
      ctx.drawImage(fabricImg, 0, 250, 500, 250);

      return canvas.toDataURL("image/png");
    },
    [] // ✅ no dependencies, stable forever
  );

  const applyFabricOverlay = useCallback(async () => {
    if (couchImages.length === 0 || fabricImages.length === 0) return;

    setIsProcessing(true);
    setOutputImages([]);

    try {
      const tasks: Promise<ComboMeta>[] = [];
      couchImages.forEach((couch, cIdx) => {
        fabricImages.forEach((fabric, fIdx) => {
          const p = renderCombo(couch.url, fabric.url).then((dataUrl) => ({
            couchIndex: cIdx,
            fabricIndex: fIdx,
            couchName: couch.name,
            fabricName: fabric.name,
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
  }, [couchImages, fabricImages, renderCombo]);

  const downloadAllImages = () => {
    if (outputImages.length === 0) return;
    const zip = new JSZip();

    outputImages.forEach(({ couchName, fabricName, dataUrl }) => {
      const base64 = dataUrl.split(",")[1];
      const safeCouch = couchName.replace(/[^a-z0-9-]/gi, "-");
      const safeFabric = fabricName.replace(/[^a-z0-9-]/gi, "-");
      const filename = `${safeCouch}-${safeFabric}.png`;
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
          <h2 className="text-lg font-semibold mb-2">
            Couches (select multiple)
          </h2>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleCouchUpload}
            className="border p-2 rounded bg-white shadow hover:shadow-md transition focus:ring-2 focus:ring-blue-400 w-full"
          />
          {couchImages.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {couchImages.map((img, i) => (
                <div key={i}>
                  <Image
                    src={img.url}
                    alt={`couch-${i}`}
                    width={200}
                    height={200}
                    unoptimized
                    className="w-full h-24 object-cover rounded border"
                  />
                  <div className="text-xs text-gray-600 text-center mt-1">
                    {img.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: multiple fabrics */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">
            Fabrics (select multiple)
          </h2>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFabricUpload}
            className="border p-2 rounded bg-white shadow hover:shadow-md transition focus:ring-2 focus:ring-blue-400 w-full"
          />
          {fabricImages.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {fabricImages.map((img, i) => (
                <div key={i}>
                  <Image
                    src={img.url}
                    alt={`fabric-${i}`}
                    width={200}
                    height={200}
                    unoptimized
                    className="w-full h-24 object-cover rounded border"
                  />
                  <div className="text-xs text-gray-600 text-center mt-1">
                    {img.name}
                  </div>
                </div>
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
          ${
            isProcessing
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
      >
        {isProcessing ? "Processing..." : "🎨 Apply Fabrics to Couches"}
      </button>

      <div className="flex flex-wrap justify-center gap-6 mt-8">
        {outputImages.map(({ dataUrl, couchName, fabricName }, i) => (
          <div
            key={i}
            className="bg-white p-3 rounded-lg shadow-md text-center"
          >
            <Image
              src={dataUrl}
              alt={`${couchName}-${fabricName}`}
              width={300}
              height={300}
              unoptimized
              className="rounded-lg shadow-md w-[300px] h-[300px] border border-gray-300 object-cover"
            />
            <div className="text-sm text-gray-600 mt-2">
              {couchName} × {fabricName}
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