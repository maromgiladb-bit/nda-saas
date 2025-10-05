"use client";
import React, { useEffect, useRef } from "react";
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";

GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.worker.min.js`;

export default function PDFViewer({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!url || !containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = "";
    (async () => {
  const loadingTask = getDocument(url);
      const pdf = await loadingTask.promise;
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.2 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;
  await page.render({ canvasContext: context!, viewport, canvas }).promise;
        container.appendChild(canvas);
      }
    })();
  }, [url]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", minHeight: "600px", background: "#f8f8f8", overflow: "auto" }}
      className="border rounded shadow"
    />
  );
}
