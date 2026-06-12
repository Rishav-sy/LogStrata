"use client"

import { useEffect, useRef, useCallback, useState, useMemo } from "react"
import createGlobe from "cobe"
import { useTheme } from "next-themes"

interface CdnMarker {
  id: string
  location: [number, number]
  region: string
  city: string
}

interface CdnArc {
  id: string
  from: [number, number]
  to: [number, number]
}

interface GlobeCdnProps {
  markers?: CdnMarker[]
  arcs?: CdnArc[]
  className?: string
  speed?: number
}

const defaultMarkers: CdnMarker[] = [
  { id: "cdn-iad", location: [38.95, -77.45], region: "iad1", city: "Virginia" },
  { id: "cdn-sfo", location: [37.62, -122.38], region: "sfo1", city: "California" },
  { id: "cdn-cdg", location: [49.01, 2.55], region: "cdg1", city: "Paris" },
  { id: "cdn-hnd", location: [35.55, 139.78], region: "hnd1", city: "Tokyo" },
  { id: "cdn-sin", location: [1.36, 103.99], region: "sin1", city: "Singapore" },
  // Secondary markers (visible when zoomed in)
  { id: "cdn-syd", location: [-33.95, 151.18], region: "syd1", city: "Sydney" },
  { id: "cdn-gru", location: [-23.43, -46.47], region: "gru1", city: "São Paulo" },
  { id: "cdn-arn", location: [59.65, 17.93], region: "arn1", city: "Stockholm" },
  { id: "cdn-dub", location: [53.43, -6.25], region: "dub1", city: "Dublin" },
  { id: "cdn-bom", location: [19.09, 72.87], region: "bom1", city: "Mumbai" },
]

const defaultArcs: CdnArc[] = [
  { id: "cdn-arc-1", from: [38.95, -77.45], to: [49.01, 2.55] }, // iad -> cdg (always)
  { id: "cdn-arc-2", from: [37.62, -122.38], to: [35.55, 139.78] }, // sfo -> hnd (always)
  { id: "cdn-arc-3", from: [49.01, 2.55], to: [1.36, 103.99] }, // cdg -> sin (always)
  
  // Secondary arcs (visible when zoomed in)
  { id: "cdn-arc-4", from: [38.95, -77.45], to: [-23.43, -46.47] }, // iad -> gru
  { id: "cdn-arc-5", from: [35.55, 139.78], to: [-33.95, 151.18] }, // hnd -> syd
  { id: "cdn-arc-6", from: [49.01, 2.55], to: [19.09, 72.87] }, // cdg -> bom
]

export function GlobeCdn({
  markers = defaultMarkers,
  arcs = defaultArcs,
  className = "",
  speed = 0.003,
}: GlobeCdnProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null)
  const isPausedRef = useRef(false)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // Persistent refs for phi and theta rotation to prevent resets/snappings
  const phiRef = useRef(0)
  const thetaRef = useRef(0.2)
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null)
  
  // Zoom level state (1.0 to 2.2)
  const [zoom, setZoom] = useState(1.0)
  const [traffic, setTraffic] = useState(() =>
    defaultArcs.map((a, i) => ({ id: a.id, value: [420, 380, 290, 185, 156, 134][i] || 100 }))
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"

  // Zoom threshold boundary for detailed elements
  const isZoomed = zoom >= 1.4

  const filteredMarkers = useMemo(() => {
    return isZoomed
      ? markers
      : markers.filter((m) => ["cdn-iad", "cdn-sfo", "cdn-cdg", "cdn-hnd", "cdn-sin"].includes(m.id))
  }, [isZoomed, markers])

  const filteredArcs = useMemo(() => {
    return isZoomed
      ? arcs
      : arcs.filter((a) => ["cdn-arc-1", "cdn-arc-2", "cdn-arc-3"].includes(a.id))
  }, [isZoomed, arcs])

  // Prevent default scroll on container and handle wheel zoom
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheelZoom = (e: WheelEvent) => {
      e.preventDefault()
      setZoom((prev) => Math.min(Math.max(prev - e.deltaY * 0.0015, 1.0), 2.2))
    }

    container.addEventListener("wheel", handleWheelZoom, { passive: false })
    return () => {
      container.removeEventListener("wheel", handleWheelZoom)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setTraffic((data) =>
        data.map((t) => ({
          ...t,
          value: Math.max(50, t.value + Math.floor(Math.random() * 21) - 10),
        }))
      )
    }, 250)
    return () => clearInterval(interval)
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY }
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing"
    isPausedRef.current = true
  }, [])

  const handlePointerUp = useCallback(() => {
    pointerInteracting.current = null
    if (canvasRef.current) canvasRef.current.style.cursor = "grab"
    isPausedRef.current = false
  }, [])

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        const deltaX = e.clientX - pointerInteracting.current.x
        const deltaY = e.clientY - pointerInteracting.current.y
        pointerInteracting.current = { x: e.clientX, y: e.clientY }
        
        phiRef.current += deltaX / 120
        // Clamp vertical angle to [-1.4, 1.4] so we can see Antarctica without maps flipping upside down
        thetaRef.current = Math.max(-1.4, Math.min(1.4, thetaRef.current + deltaY / 400))
      }
    }
    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    window.addEventListener("pointerup", handlePointerUp, { passive: true })
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [handlePointerUp])

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    let globe: ReturnType<typeof createGlobe> | null = null
    let animationId: number

    function init() {
      const width = canvas.offsetWidth
      if (width === 0) return

      // Dynamic variables for light/dark compatibility
      const globeDarkVal = isDark ? 1 : 0
      const baseColor: [number, number, number] = isDark ? [0.07, 0.07, 0.08] : [1, 1, 1]
      const markerColor: [number, number, number] = isDark ? [0.31, 0.89, 0.76] : [0.1, 0.1, 0.1]
      const glowColor: [number, number, number] = isDark ? [0.12, 0.12, 0.15] : [0.94, 0.93, 0.91]
      const arcColor: [number, number, number] = isDark ? [0.31, 0.89, 0.76] : [0.2, 0.2, 0.2]

      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width,
        height: width,
        phi: phiRef.current,
        theta: thetaRef.current,
        dark: globeDarkVal,
        diffuse: 1.5,
        mapSamples: 16000,
        mapBrightness: 10,
        baseColor,
        markerColor,
        glowColor,
        markerElevation: 0.02,
        markers: filteredMarkers.map((m) => ({ location: m.location, size: 0.012, id: m.id })),
        arcs: filteredArcs.map((a) => ({ from: a.from, to: a.to, id: a.id })),
        arcColor,
        arcWidth: 0.5,
        arcHeight: 0.25,
        opacity: 0.7,
      })

      globeRef.current = globe

      function animate() {
        if (!isPausedRef.current) {
          phiRef.current += speed
        }
        if (globe) {
          globe.update({
            phi: phiRef.current,
            theta: thetaRef.current,
          })
        }
        animationId = requestAnimationFrame(animate)
      }
      animate()
      setTimeout(() => canvas && (canvas.style.opacity = "1"))
    }

    if (canvas.offsetWidth > 0) {
      init()
    } else {
      const ro = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) {
          ro.disconnect()
          init()
        }
      })
      ro.observe(canvas)
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
      if (globe) {
        globe.destroy()
        globeRef.current = null
      }
    }
  }, [])

  // Update globe dynamically when dependencies change without recreating the WebGL context
  useEffect(() => {
    if (!globeRef.current) return

    const globeDarkVal = isDark ? 1 : 0
    const baseColor: [number, number, number] = isDark ? [0.07, 0.07, 0.08] : [1, 1, 1]
    const markerColor: [number, number, number] = isDark ? [0.31, 0.89, 0.76] : [0.1, 0.1, 0.1]
    const glowColor: [number, number, number] = isDark ? [0.12, 0.12, 0.15] : [0.94, 0.93, 0.91]
    const arcColor: [number, number, number] = isDark ? [0.31, 0.89, 0.76] : [0.2, 0.2, 0.2]

    globeRef.current.update({
      dark: globeDarkVal,
      baseColor,
      markerColor,
      glowColor,
      arcColor,
      markers: filteredMarkers.map((m) => ({ location: m.location, size: 0.012, id: m.id })),
      arcs: filteredArcs.map((a) => ({ from: a.from, to: a.to, id: a.id })),
    })
  }, [isDark, filteredMarkers, filteredArcs])

  const pyramidFaceStyle = (nth: number): React.CSSProperties => {
    const transforms = [
      "rotateY(0deg) translateZ(4px) rotateX(19.5deg)",
      "rotateY(120deg) translateZ(4px) rotateX(19.5deg)",
      "rotateY(240deg) translateZ(4px) rotateX(19.5deg)",
      "rotateX(-90deg) rotateZ(60deg) translateY(4px)",
    ]
    const colors = isDark 
      ? ["#50e3c2", "#10b981", "#7928ca", "#262626"] 
      : ["#111", "#333", "#555", "#222"]
    return {
      position: "absolute", left: -0.5, top: 0,
      width: 0, height: 0,
      borderLeft: "6.5px solid transparent",
      borderRight: "6.5px solid transparent",
      borderBottom: `13px solid ${colors[nth]}`,
      transformOrigin: "center bottom",
      transform: transforms[nth],
    }
  }

  return (
    <div 
      ref={containerRef}
      className={`relative aspect-square select-none overflow-hidden rounded-xl bg-canvas-soft/5 ${className}`}
    >
      <style>{`
        @keyframes pyramid-spin {
          0% { transform: rotateX(20deg) rotateY(0deg); }
          100% { transform: rotateX(20deg) rotateY(360deg); }
        }
      `}</style>

      {/* Floating Zoom Controls Panel */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1.5 bg-canvas/80 dark:bg-canvas-soft/80 backdrop-blur border border-hairline p-1 rounded-lg">
        <button
          onClick={() => setZoom((prev) => Math.min(prev + 0.2, 2.2))}
          disabled={zoom >= 2.2}
          className="h-6 w-6 rounded flex items-center justify-center text-xs font-bold bg-canvas hover:bg-canvas-soft-2 border border-hairline hover:border-hairline-strong transition-all cursor-pointer text-ink disabled:opacity-40 select-none"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => setZoom((prev) => Math.max(prev - 0.2, 1.0))}
          disabled={zoom <= 1.0}
          className="h-6 w-6 rounded flex items-center justify-center text-xs font-bold bg-canvas hover:bg-canvas-soft-2 border border-hairline hover:border-hairline-strong transition-all cursor-pointer text-ink disabled:opacity-40 select-none"
          title="Zoom Out"
        >
          -
        </button>
      </div>

      {/* Zoom Level Indicator */}
      <div className="absolute top-4 left-4 z-20 bg-canvas/70 dark:bg-canvas-soft/75 backdrop-blur px-2.5 py-1 rounded border border-hairline font-mono text-[9px] text-mute select-none">
        ZOOM: {zoom.toFixed(1)}x {isZoomed && " (DETAILED MODE)"}
      </div>

      {/* Centered scaling wrapper for WebGL globe and DOM anchors */}
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) scale(${zoom})`,
          transformOrigin: "center center",
          transition: "transform 0.3s ease-out",
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          style={{
            width: "100%", 
            height: "100%", 
            cursor: "grab", 
            opacity: 0,
            transition: "opacity 1.2s ease", 
            borderRadius: "50%", 
            touchAction: "none",
          }}
        />

        {filteredMarkers.map((m) => (
          <div
            key={m.id}
            style={{
              position: "absolute",
              positionAnchor: `--cobe-${m.id}`,
              bottom: "anchor(top)",
              left: "anchor(center)",
              translate: "-50% 0",
              // Scale down markers dynamically as we zoom in, and reduce size for out-of-focus edge markers
              scale: `calc(var(--cobe-visible-${m.id}, 0) * ${1.0 / Math.sqrt(zoom)})`,
              display: "flex",
              flexDirection: "column" as const,
              alignItems: "center",
              gap: 4,
              pointerEvents: "none" as const,
              opacity: `var(--cobe-visible-${m.id}, 0)`,
              filter: `blur(calc((1 - var(--cobe-visible-${m.id}, 0)) * 4px))`,
              transformOrigin: "center bottom",
              transition: "opacity 0.3s, filter 0.3s, scale 0.2s ease-out",
            }}
          >
            {/* Float text label on top */}
            <span style={{
              fontFamily: "monospace", fontSize: "0.55rem", 
              color: isDark ? "#fff" : "#000",
              background: isDark ? "#121212" : "#fff", 
              border: isDark ? "1px solid #262626" : "none",
              padding: "2px 6px", borderRadius: 3,
              letterSpacing: "0.05em", whiteSpace: "nowrap" as const,
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              marginBottom: 2,
            }}>
              {isZoomed ? `${m.region} (${m.city})` : m.region}
            </span>
            
            {/* Pyramid sits at the bottom, touching the ground anchor dot */}
            <div style={{
              width: 12, height: 12, position: "relative",
              transformStyle: "preserve-3d" as const,
              animation: "pyramid-spin 4s linear infinite",
            }}>
              {[0, 1, 2, 3].map((n) => (
                <div key={n} style={pyramidFaceStyle(n)} />
              ))}
            </div>
          </div>
        ))}

        {filteredArcs.map((a) => {
          const t = traffic.find((x) => x.id === a.id) || { id: a.id, value: 100 }
          return (
            <div
              key={t.id}
              style={{
                position: "absolute",
                positionAnchor: `--cobe-arc-${t.id}`,
                bottom: "anchor(top)",
                left: "anchor(center)",
                translate: "-50% 0",
                scale: `calc(var(--cobe-visible-arc-${t.id}, 0) * ${0.85 / Math.sqrt(zoom)})`,
                fontFamily: "monospace",
                fontSize: "0.5rem",
                color: isDark ? "#000" : "#fff",
                background: isDark ? "#50e3c2" : "#000",
                padding: "3px 8px",
                borderRadius: 4,
                whiteSpace: "nowrap" as const,
                pointerEvents: "none" as const,
                opacity: `var(--cobe-visible-arc-${t.id}, 0)`,
                filter: `blur(calc((1 - var(--cobe-visible-arc-${t.id}, 0)) * 4px))`,
                transformOrigin: "center bottom",
                transition: "opacity 0.3s, filter 0.3s, scale 0.2s ease-out",
              }}
            >
              {t.value}k req/s
            </div>
          )
        })}
      </div>
    </div>
  )
}
