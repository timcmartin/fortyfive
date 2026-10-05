import { useEffect, useRef, useState } from "react";
import { Maximize, Minimize } from "lucide-react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

function PdfPage({ pdf, pageNumber, fitToScreen }) {
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    let renderTask;

    const renderPage = async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        if (!active) return;

        const canvas = canvasRef.current;
        const width = canvas?.parentElement?.clientWidth;
        if (!canvas || !width) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const height = fitToScreen ? Math.max(window.innerHeight - 72, 100) : Infinity;
        const scale = Math.min(width / baseViewport.width, height / baseViewport.height, 2);
        const viewport = page.getViewport({ scale });
        const outputScale = window.devicePixelRatio || 1;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Could not create a canvas for the chart page");

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${viewport.width}px`;
        renderTask = page.render({
          canvasContext: context,
          viewport,
          transform: outputScale === 1
            ? null
            : [outputScale, 0, 0, outputScale, 0, 0],
        });
        await renderTask.promise;
      } catch (renderError) {
        if (active && renderError.name !== "RenderingCancelledException") {
          setError(renderError.message);
        }
      }
    };

    renderPage();
    return () => {
      active = false;
      renderTask?.cancel();
    };
  }, [fitToScreen, pageNumber, pdf]);

  return (
    <div className="pdf-chart-page">
      {error ? (
        <p className="alert alert-error">{`Page ${pageNumber}: ${error}`}</p>
      ) : (
        <canvas
          ref={canvasRef}
          className="block h-auto max-w-full"
          role="img"
          aria-label={`Chart page ${pageNumber}`}
        />
      )}
    </div>
  );
}

export function PdfChartViewer({ url, title }) {
  const [resource, setResource] = useState({ url: null, pdf: null, error: null });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState(null);
  const viewerRef = useRef(null);
  const isLoading = resource.url !== url;
  const error = resource.url === url ? resource.error : null;
  const pdf = resource.url === url ? resource.pdf : null;

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === viewerRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    let active = true;
    const loadingTask = getDocument({ url });

    loadingTask.promise
      .then((document) => {
        if (active) setResource({ url, pdf: document, error: null });
      })
      .catch((loadError) => {
        if (active) {
          setResource({ url, pdf: null, error: loadError.message });
        }
      });

    return () => {
      active = false;
      void loadingTask.destroy();
    };
  }, [url]);

  const toggleFullscreen = async () => {
    setFullscreenError(null);
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (viewerRef.current?.requestFullscreen) {
        await viewerRef.current.requestFullscreen();
      } else {
        setFullscreenError("Fullscreen mode is not available in this browser.");
      }
    } catch (error) {
      setFullscreenError(error.message);
    }
  };

  return (
    <div ref={viewerRef} className="pdf-chart-shell">
      <div className="pdf-chart-toolbar">
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{title}</span>
        <a
          className="btn btn-sm btn-outline"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open PDF
        </a>
        <button className="btn btn-sm btn-outline" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
          {isFullscreen ? "Exit full screen" : "Full screen"}
        </button>
      </div>
      <div className="pdf-chart-viewer" aria-label={`${title} chart`}>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : error ? (
          <div className="alert alert-error">
            <div>
              <p className="font-semibold">Unable to display this chart.</p>
              <p className="text-sm">{error}</p>
              <p className="mt-1 text-sm">
                If the PDF is hosted on another domain, its server must allow requests from this app.
              </p>
            </div>
          </div>
        ) : pdf ? (
          Array.from({ length: pdf.numPages }, (_, index) => (
            <PdfPage
              key={`${url}-${index + 1}`}
              pdf={pdf}
              pageNumber={index + 1}
              fitToScreen={isFullscreen}
            />
          ))
        ) : null}
      </div>
      {fullscreenError && <p className="alert alert-warning mt-2">{fullscreenError}</p>}
    </div>
  );
}
