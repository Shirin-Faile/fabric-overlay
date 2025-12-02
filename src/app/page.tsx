"use client";

import React, { useCallback, useState, useEffect, useRef } from "react";
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

type CurtainComboMeta = {
  curtainIndex: number;
  fabricIndex: number;
  curtainName: string;
  fabricName: string;
  dataUrl: string;
};

type UploadedImage = {
  name: string;
  url: string;
};

export default function Home() {
  // Dark mode state
  const [darkMode, setDarkMode] = useState(false);

  // Load dark mode preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      setDarkMode(JSON.parse(saved));
    }
  }, []);

  // Save dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Couch state
  const [couchImages, setCouchImages] = useState<UploadedImage[]>([]);
  const [fabricImages, setFabricImages] = useState<UploadedImage[]>([]);
  const [outputImages, setOutputImages] = useState<ComboMeta[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Curtain state
  const [curtainImages, setCurtainImages] = useState<UploadedImage[]>([]);
  const [curtainFabricImages, setCurtainFabricImages] = useState<UploadedImage[]>([]);
  const [curtainOutputImages, setCurtainOutputImages] = useState<CurtainComboMeta[]>([]);
  const [isCurtainProcessing, setIsCurtainProcessing] = useState(false);

  // File input refs (needed to reset the inputs after clearing)
  const couchInputRef = useRef<HTMLInputElement>(null);
  const fabricInputRef = useRef<HTMLInputElement>(null);
  const curtainInputRef = useRef<HTMLInputElement>(null);
  const curtainFabricInputRef = useRef<HTMLInputElement>(null);

  // Reset functions
  const resetCouchSection = () => {
    // Revoke object URLs to free memory
    couchImages.forEach(img => URL.revokeObjectURL(img.url));
    fabricImages.forEach(img => URL.revokeObjectURL(img.url));
    setCouchImages([]);
    setFabricImages([]);
    setOutputImages([]);
    // Reset file inputs so the same files can be selected again
    if (couchInputRef.current) couchInputRef.current.value = '';
    if (fabricInputRef.current) fabricInputRef.current.value = '';
  };

  const resetCurtainSection = () => {
    // Revoke object URLs to free memory
    curtainImages.forEach(img => URL.revokeObjectURL(img.url));
    curtainFabricImages.forEach(img => URL.revokeObjectURL(img.url));
    setCurtainImages([]);
    setCurtainFabricImages([]);
    setCurtainOutputImages([]);
    // Reset file inputs so the same files can be selected again
    if (curtainInputRef.current) curtainInputRef.current.value = '';
    if (curtainFabricInputRef.current) curtainFabricInputRef.current.value = '';
  };

  // Couch handlers
  const handleCouchUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setCouchImages(
      files.map((f) => ({
        name: f.name.replace(/\.[^/.]+$/, ""),
        url: URL.createObjectURL(f),
      }))
    );
  };

  const handleFabricUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setFabricImages(
      files.map((f) => ({
        name: f.name.replace(/\.[^/.]+$/, ""),
        url: URL.createObjectURL(f),
      }))
    );
  };

  // Curtain handlers
  const handleCurtainUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setCurtainImages(
      files.map((f) => ({
        name: f.name.replace(/\.[^/.]+$/, ""),
        url: URL.createObjectURL(f),
      }))
    );
  };

  const handleCurtainFabricUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setCurtainFabricImages(
      files.map((f) => ({
        name: f.name.replace(/\.[^/.]+$/, ""),
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

  // Couch render function
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
    []
  );

  // Curtain render function - lifestyle curtain on LEFT, fabric curtain on RIGHT
  const renderCurtainCombo = useCallback(
    async (curtainSrc: string, fabricSrc: string): Promise<string> => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return "";

      canvas.width = 800;
      canvas.height = 500;

      const [curtainImg, fabricImg] = await Promise.all([
        loadImage(curtainSrc),
        loadImage(fabricSrc),
      ]);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Left side - lifestyle/room curtain image (400x500 area)
      const leftWidth = 400;
      const leftHeight = 500;
      const curtainAspect = curtainImg.width / curtainImg.height;
      
      let newCurtainWidth: number;
      let newCurtainHeight: number;
      
      if (curtainAspect > leftWidth / leftHeight) {
        newCurtainWidth = leftWidth;
        newCurtainHeight = leftWidth / curtainAspect;
      } else {
        newCurtainHeight = leftHeight;
        newCurtainWidth = leftHeight * curtainAspect;
      }
      
      const curtainX = (leftWidth - newCurtainWidth) / 2;
      const curtainY = (leftHeight - newCurtainHeight) / 2;
      
      ctx.drawImage(curtainImg, curtainX, curtainY, newCurtainWidth, newCurtainHeight);

      // Right side - fabric curtain image (400x500 area)
      const rightWidth = 400;
      const rightHeight = 500;
      const fabricAspect = fabricImg.width / fabricImg.height;
      
      let newFabricWidth: number;
      let newFabricHeight: number;
      
      if (fabricAspect > rightWidth / rightHeight) {
        newFabricWidth = rightWidth;
        newFabricHeight = rightWidth / fabricAspect;
      } else {
        newFabricHeight = rightHeight;
        newFabricWidth = rightHeight * fabricAspect;
      }
      
      const fabricX = 400 + (rightWidth - newFabricWidth) / 2;
      const fabricY = (rightHeight - newFabricHeight) / 2;
      
      ctx.drawImage(fabricImg, fabricX, fabricY, newFabricWidth, newFabricHeight);

      return canvas.toDataURL("image/png");
    },
    []
  );

  // Couch apply function
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

  // Curtain apply function
  const applyCurtainFabricOverlay = useCallback(async () => {
    if (curtainImages.length === 0 || curtainFabricImages.length === 0) return;

    setIsCurtainProcessing(true);
    setCurtainOutputImages([]);

    try {
      const tasks: Promise<CurtainComboMeta>[] = [];
      curtainImages.forEach((curtain, cIdx) => {
        curtainFabricImages.forEach((fabric, fIdx) => {
          const p = renderCurtainCombo(curtain.url, fabric.url).then((dataUrl) => ({
            curtainIndex: cIdx,
            fabricIndex: fIdx,
            curtainName: curtain.name,
            fabricName: fabric.name,
            dataUrl,
          }));
          tasks.push(p);
        });
      });

      const results = await Promise.all(tasks);
      setCurtainOutputImages(results);
    } finally {
      setIsCurtainProcessing(false);
    }
  }, [curtainImages, curtainFabricImages, renderCurtainCombo]);

  // Download functions
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
      saveAs(content, "couch_fabric_overlays.zip");
    });
  };

  const downloadAllCurtainImages = () => {
    if (curtainOutputImages.length === 0) return;
    const zip = new JSZip();

    curtainOutputImages.forEach(({ curtainName, fabricName, dataUrl }) => {
      const base64 = dataUrl.split(",")[1];
      const safeCurtain = curtainName.replace(/[^a-z0-9-]/gi, "-");
      const safeFabric = fabricName.replace(/[^a-z0-9-]/gi, "-");
      const filename = `${safeCurtain}-${safeFabric}.png`;
      zip.file(filename, base64, { base64: true });
    });

    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, "curtain_fabric_overlays.zip");
    });
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 to-slate-100'}`}>
      {/* Header */}
      <div className={`border-b shadow-sm transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
                Fabric Overlay App
              </span>
            </h1>
            <p className={`mt-1 transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
              Generate product images with fabric combinations
            </p>
          </div>
          
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 rounded-xl transition-all duration-300 ${
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* ==================== COUCH SECTION ==================== */}
        <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
          {/* Section Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                🛋️ Couch Section
              </h2>
              <p className="text-blue-100 text-sm mt-1">Upload couch images and fabric swatches to generate combinations</p>
            </div>
            {/* Reset Button */}
            {(couchImages.length > 0 || fabricImages.length > 0 || outputImages.length > 0) && (
              <button
                onClick={resetCouchSection}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </button>
            )}
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Left column: multiple couches */}
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                  Couch Images
                </label>
                <div className="relative">
                  <input
                    ref={couchInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleCouchUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
                    darkMode 
                      ? 'border-gray-600 hover:border-blue-400 hover:bg-blue-900/20' 
                      : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${darkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className={`font-medium ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>Drop couch images here</p>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>or click to browse</p>
                  </div>
                </div>
                {couchImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {couchImages.map((img, i) => (
                      <div key={i} className="group relative">
                        <Image
                          src={img.url}
                          alt={`couch-${i}`}
                          width={200}
                          height={200}
                          unoptimized
                          className={`w-full h-24 object-cover rounded-lg border-2 group-hover:border-blue-400 transition-all ${darkMode ? 'border-gray-600' : 'border-slate-200'}`}
                        />
                        <div className={`text-xs text-center mt-1.5 truncate px-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                          {img.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right column: multiple fabrics */}
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                  Fabric Swatches
                </label>
                <div className="relative">
                  <input
                    ref={fabricInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFabricUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
                    darkMode 
                      ? 'border-gray-600 hover:border-blue-400 hover:bg-blue-900/20' 
                      : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${darkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                    </div>
                    <p className={`font-medium ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>Drop fabric images here</p>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>or click to browse</p>
                  </div>
                </div>
                {fabricImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {fabricImages.map((img, i) => (
                      <div key={i} className="group relative">
                        <Image
                          src={img.url}
                          alt={`fabric-${i}`}
                          width={200}
                          height={200}
                          unoptimized
                          className={`w-full h-24 object-cover rounded-lg border-2 group-hover:border-blue-400 transition-all ${darkMode ? 'border-gray-600' : 'border-slate-200'}`}
                        />
                        <div className={`text-xs text-center mt-1.5 truncate px-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                          {img.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={`flex justify-center pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-slate-100'}`}>
              <button
                onClick={applyFabricOverlay}
                disabled={isProcessing || couchImages.length === 0 || fabricImages.length === 0}
                className={`px-8 py-3 text-white font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-500/25
                  ${isProcessing || couchImages.length === 0 || fabricImages.length === 0
                    ? "bg-slate-300 cursor-not-allowed shadow-none"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
                  }`}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <span>🎨</span>
                    Generate Couch Combinations
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Output Images */}
          {outputImages.length > 0 && (
            <div className={`border-t p-6 ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>Generated Images ({outputImages.length})</h3>
                <button
                  onClick={downloadAllImages}
                  className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-md shadow-emerald-500/20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download All
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {outputImages.map(({ dataUrl, couchName, fabricName }, i) => (
                  <div key={i} className={`rounded-xl overflow-hidden shadow-sm border hover:shadow-md transition-shadow ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                    <Image
                      src={dataUrl}
                      alt={`${couchName}-${fabricName}`}
                      width={300}
                      height={300}
                      unoptimized
                      className={`w-full h-48 object-contain ${darkMode ? 'bg-gray-700' : 'bg-slate-100'}`}
                    />
                    <div className={`p-3 border-t ${darkMode ? 'border-gray-700' : 'border-slate-100'}`}>
                      <p className={`text-sm truncate ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                        <span className="font-medium">{couchName}</span>
                        <span className={`mx-2 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>×</span>
                        <span>{fabricName}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ==================== CURTAIN SECTION ==================== */}
        <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
          {/* Section Header */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                🪟 Curtain Section
              </h2>
              <p className="text-purple-100 text-sm mt-1">Upload curtain images and fabric styles to generate combinations</p>
            </div>
            {/* Reset Button */}
            {(curtainImages.length > 0 || curtainFabricImages.length > 0 || curtainOutputImages.length > 0) && (
              <button
                onClick={resetCurtainSection}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </button>
            )}
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Left column: multiple curtains */}
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                  Curtain Images
                </label>
                <div className="relative">
                  <input
                    ref={curtainInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleCurtainUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
                    darkMode 
                      ? 'border-gray-600 hover:border-purple-400 hover:bg-purple-900/20' 
                      : 'border-slate-300 hover:border-purple-400 hover:bg-purple-50'
                  }`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${darkMode ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
                      <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className={`font-medium ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>Drop curtain images here</p>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>or click to browse</p>
                  </div>
                </div>
                {curtainImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {curtainImages.map((img, i) => (
                      <div key={i} className="group relative">
                        <Image
                          src={img.url}
                          alt={`curtain-${i}`}
                          width={200}
                          height={200}
                          unoptimized
                          className={`w-full h-24 object-cover rounded-lg border-2 group-hover:border-purple-400 transition-all ${darkMode ? 'border-gray-600' : 'border-slate-200'}`}
                        />
                        <div className={`text-xs text-center mt-1.5 truncate px-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                          {img.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right column: multiple fabrics for curtains */}
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                  Fabric Styles
                </label>
                <div className="relative">
                  <input
                    ref={curtainFabricInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleCurtainFabricUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
                    darkMode 
                      ? 'border-gray-600 hover:border-purple-400 hover:bg-purple-900/20' 
                      : 'border-slate-300 hover:border-purple-400 hover:bg-purple-50'
                  }`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${darkMode ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
                      <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                    </div>
                    <p className={`font-medium ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>Drop fabric images here</p>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>or click to browse</p>
                  </div>
                </div>
                {curtainFabricImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {curtainFabricImages.map((img, i) => (
                      <div key={i} className="group relative">
                        <Image
                          src={img.url}
                          alt={`curtain-fabric-${i}`}
                          width={200}
                          height={200}
                          unoptimized
                          className={`w-full h-24 object-cover rounded-lg border-2 group-hover:border-purple-400 transition-all ${darkMode ? 'border-gray-600' : 'border-slate-200'}`}
                        />
                        <div className={`text-xs text-center mt-1.5 truncate px-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                          {img.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={`flex justify-center pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-slate-100'}`}>
              <button
                onClick={applyCurtainFabricOverlay}
                disabled={isCurtainProcessing || curtainImages.length === 0 || curtainFabricImages.length === 0}
                className={`px-8 py-3 text-white font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-purple-500/25
                  ${isCurtainProcessing || curtainImages.length === 0 || curtainFabricImages.length === 0
                    ? "bg-slate-300 cursor-not-allowed shadow-none"
                    : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5"
                  }`}
              >
                {isCurtainProcessing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <span>🎨</span>
                    Generate Curtain Combinations
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Output Images */}
          {curtainOutputImages.length > 0 && (
            <div className={`border-t p-6 ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>Generated Images ({curtainOutputImages.length})</h3>
                <button
                  onClick={downloadAllCurtainImages}
                  className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-md shadow-emerald-500/20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download All
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {curtainOutputImages.map(({ dataUrl, curtainName, fabricName }, i) => (
                  <div key={i} className={`rounded-xl overflow-hidden shadow-sm border hover:shadow-md transition-shadow ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                    <Image
                      src={dataUrl}
                      alt={`${curtainName}-${fabricName}`}
                      width={300}
                      height={300}
                      unoptimized
                      className={`w-full h-48 object-contain ${darkMode ? 'bg-gray-700' : 'bg-slate-100'}`}
                    />
                    <div className={`p-3 border-t ${darkMode ? 'border-gray-700' : 'border-slate-100'}`}>
                      <p className={`text-sm truncate ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                        <span className="font-medium">{curtainName}</span>
                        <span className={`mx-2 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>×</span>
                        <span>{fabricName}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}