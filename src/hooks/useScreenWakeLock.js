import { useEffect, useRef, useState } from "react";

export function useScreenWakeLock() {
  const wakeLockRef = useRef(null);
  const wakeLockRequestRef = useRef(null);
  const [status, setStatus] = useState(() =>
    typeof navigator !== "undefined" && "wakeLock" in navigator
      ? "requesting"
      : "unsupported",
  );
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const requestWakeLock = async () => {
      if (
        !active ||
        document.visibilityState !== "visible" ||
        (wakeLockRef.current && !wakeLockRef.current.released)
      ) {
        return;
      }
      if (wakeLockRequestRef.current) return;

      let request;
      try {
        request = navigator.wakeLock.request("screen");
        wakeLockRequestRef.current = request;
        const wakeLock = await request;
        if (!active) {
          await wakeLock.release();
          return;
        }
        wakeLockRef.current = wakeLock;
        setStatus("active");
        setError(null);
        wakeLock.addEventListener("release", () => {
          if (wakeLockRef.current === wakeLock) {
            wakeLockRef.current = null;
            if (active) setStatus("requesting");
          }
        });
      } catch (requestError) {
        if (active) {
          setStatus("unavailable");
          setError(
            requestError instanceof Error
              ? requestError.message
              : String(requestError),
          );
        }
      } finally {
        if (wakeLockRequestRef.current === request) {
          wakeLockRequestRef.current = null;
        }
      }
    };

    void requestWakeLock();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      const wakeLock = wakeLockRef.current;
      wakeLockRef.current = null;
      if (wakeLock && !wakeLock.released) void wakeLock.release();
    };
  }, []);

  return { status, error };
}
