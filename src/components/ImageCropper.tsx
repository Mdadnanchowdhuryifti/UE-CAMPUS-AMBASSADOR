import { CSSProperties, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import { Check, Crop, RotateCcw, X, ZoomIn } from 'lucide-react';

interface ImageCropperProps {
  file: File;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}

const VIEWPORT = 320; // px, square crop viewport (display size, scales down on small screens via CSS)
const OUTPUT_SIZE = 512; // px, exported square JPEG

/**
 * Small dependency-free square cropper: loads the image, lets the user drag
 * to pan and zoom with a slider, shows a live square + avatar preview, and
 * exports a 512x512 JPEG blob via canvas.
 */
export function ImageCropper({ file, onCancel, onConfirm }: ImageCropperProps) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setImg(image);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    image.onerror = () => setLoadError('That image could not be loaded. Please choose a different file.');
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const viewportSize = () => viewportRef.current?.clientWidth || VIEWPORT;

  // Cover-fit base scale, then user zoom on top.
  const geometry = (() => {
    if (!img) return null;
    const vp = viewportSize();
    const baseScale = Math.max(vp / img.naturalWidth, vp / img.naturalHeight);
    const scale = baseScale * zoom;
    const dispW = img.naturalWidth * scale;
    const dispH = img.naturalHeight * scale;
    const maxX = Math.max(0, (dispW - vp) / 2);
    const maxY = Math.max(0, (dispH - vp) / 2);
    return { vp, scale, dispW, dispH, maxX, maxY };
  })();

  const clampedOffset = geometry
    ? {
        x: Math.max(-geometry.maxX, Math.min(geometry.maxX, offset.x)),
        y: Math.max(-geometry.maxY, Math.min(geometry.maxY, offset.y)),
      }
    : offset;

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!img) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseX: clampedOffset.x,
      baseY: clampedOffset.y,
    };
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId || !geometry) return;
    const nextX = drag.baseX + (e.clientX - drag.startX);
    const nextY = drag.baseY + (e.clientY - drag.startY);
    setOffset({
      x: Math.max(-geometry.maxX, Math.min(geometry.maxX, nextX)),
      y: Math.max(-geometry.maxY, Math.min(geometry.maxY, nextY)),
    });
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  };

  const handleConfirm = () => {
    if (!img || !geometry) return;
    setBusy(true);
    try {
      const { vp, scale } = geometry;
      const srcSize = vp / scale;
      const centerX = img.naturalWidth / 2 - clampedOffset.x / scale;
      const centerY = img.naturalHeight / 2 - clampedOffset.y / scale;
      const sx = Math.max(0, Math.min(img.naturalWidth - srcSize, centerX - srcSize / 2));
      const sy = Math.max(0, Math.min(img.naturalHeight - srcSize, centerY - srcSize / 2));

      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas is not available in this browser.');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      ctx.drawImage(img, sx, sy, srcSize, srcSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      canvas.toBlob(
        (blob) => {
          setBusy(false);
          if (blob) onConfirm(blob);
          else setLoadError('The cropped image could not be created. Please try again.');
        },
        'image/jpeg',
        0.9
      );
    } catch (err) {
      setBusy(false);
      setLoadError(err instanceof Error ? err.message : 'The cropped image could not be created.');
    }
  };

  const imgStyle: CSSProperties | undefined = geometry
    ? {
        width: geometry.dispW,
        height: geometry.dispH,
        transform: `translate(-50%, -50%) translate(${clampedOffset.x}px, ${clampedOffset.y}px)`,
      }
    : undefined;

  // Mini avatar preview uses the same transform, scaled to its own box.
  const previewScale = geometry ? 72 / geometry.vp : 1;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Crop profile photo">
      <div className="w-full max-w-md bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-2xl p-5 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-sm font-bold text-[#111318] dark:text-white">
            <Crop className="w-4 h-4 text-[#B51B27]" />
            Crop to a square
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg border border-[#E2E5EB] dark:border-[#262B35] text-[#5A6270] dark:text-slate-300 cursor-pointer"
            aria-label="Cancel cropping"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loadError && (
          <div role="alert" className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-800 dark:text-red-200">
            {loadError}
          </div>
        )}

        {!img && !loadError && (
          <div className="w-full aspect-square max-w-[320px] mx-auto rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        )}

        {img && (
          <>
            <div
              ref={viewportRef}
              className="relative w-full aspect-square max-w-[320px] mx-auto overflow-hidden rounded-xl bg-slate-900 touch-none select-none cursor-grab active:cursor-grabbing"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <img
                src={img.src}
                alt="Image being cropped"
                draggable={false}
                className="absolute left-1/2 top-1/2 max-w-none pointer-events-none"
                style={imgStyle}
              />
              <div className="absolute inset-0 border-2 border-white/70 rounded-xl pointer-events-none" />
            </div>

            <div className="flex items-center gap-4">
              <div
                className="relative w-[72px] h-[72px] shrink-0 overflow-hidden rounded-full bg-slate-900"
                aria-label="Avatar preview"
              >
                <img
                  src={img.src}
                  alt=""
                  draggable={false}
                  className="absolute left-1/2 top-1/2 max-w-none pointer-events-none"
                  style={
                    geometry
                      ? {
                          width: geometry.dispW * previewScale,
                          height: geometry.dispH * previewScale,
                          transform: `translate(-50%, -50%) translate(${clampedOffset.x * previewScale}px, ${clampedOffset.y * previewScale}px)`,
                        }
                      : undefined
                  }
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#5A6270] dark:text-slate-300">
                  <ZoomIn className="w-3.5 h-3.5 text-[#B51B27]" /> Zoom
                </label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-[#B51B27]"
                  aria-label="Zoom"
                />
                <p className="text-[11px] text-[#5A6270] dark:text-slate-400">
                  Drag the image to reposition it. The round preview is how your photo will appear.
                </p>
              </div>
            </div>
          </>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            disabled={!img || busy}
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 bg-[#B51B27] hover:bg-[#92141E] disabled:opacity-60 text-white text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            {busy ? 'Preparing...' : 'Use this photo'}
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            className="inline-flex items-center gap-1.5 border border-[#E2E5EB] dark:border-[#262B35] text-xs font-semibold px-3 py-2.5 rounded-lg text-[#111318] dark:text-slate-100 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-lg text-[#5A6270] dark:text-slate-300 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
