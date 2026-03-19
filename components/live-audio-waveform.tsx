"use client"

import { Pause, Play } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"

type LiveAudioWaveformProps = {
  title: string
  src?: string
}

const BAR_COUNT = 48
const BASE_HEIGHT = 8
const MAX_BAR_HEIGHT = 26

export function LiveAudioWaveform({ title, src }: LiveAudioWaveformProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [bars, setBars] = useState<number[]>(
    Array.from({ length: BAR_COUNT }, () => BASE_HEIGHT)
  )

  const hasAudio = Boolean(src)

  const stopVisualization = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setBars(Array.from({ length: BAR_COUNT }, () => BASE_HEIGHT))
  }

  const startVisualization = () => {
    const analyser = analyserRef.current
    if (!analyser) return

    const data = new Uint8Array(analyser.frequencyBinCount)

    const draw = () => {
      analyser.getByteFrequencyData(data)
      const next = Array.from({ length: BAR_COUNT }, (_, i) => {
        const idx = Math.floor((i / BAR_COUNT) * data.length)
        const v = data[idx] ?? 0
        return Math.max(BASE_HEIGHT, Math.min(MAX_BAR_HEIGHT, Math.round((v / 255) * MAX_BAR_HEIGHT)))
      })
      setBars(next)
      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
  }

  const setupAudioGraph = () => {
    const audio = audioRef.current
    if (!audio || !hasAudio) return

    if (!audioContextRef.current) {
      const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return
      audioContextRef.current = new Ctx()
    }

    const ctx = audioContextRef.current
    if (!ctx) return

    if (!sourceRef.current) {
      sourceRef.current = ctx.createMediaElementSource(audio)
      analyserRef.current = ctx.createAnalyser()
      analyserRef.current.fftSize = 256

      sourceRef.current.connect(analyserRef.current)
      analyserRef.current.connect(ctx.destination)
    }
  }

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio || !hasAudio) return

    setupAudioGraph()

    if (audioContextRef.current?.state === "suspended") {
      await audioContextRef.current.resume()
    }

    if (audio.paused) {
      try {
        await audio.play()
        setIsPlaying(true)
        startVisualization()
      } catch {
        setIsPlaying(false)
        stopVisualization()
      }
      return
    }

    audio.pause()
    setIsPlaying(false)
    stopVisualization()
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      stopVisualization()
    }

    const handleError = () => {
      setIsPlaying(false)
      stopVisualization()
    }

    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
    }
  }, [])

  useEffect(() => {
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    stopVisualization()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [src])

  useEffect(() => {
    return () => {
      stopVisualization()
      if (audioContextRef.current) {
        void audioContextRef.current.close()
      }
    }
  }, [])

  const formatTime = (value: number) => {
    if (!value || Number.isNaN(value)) return "00:00"
    const mins = Math.floor(value / 60)
    const secs = Math.floor(value % 60)
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  return (
    <div className="rounded-[20px] border border-[#E2E2E2] p-4">
      <p className="mb-3 text-[22px] font-semibold text-black">{title}</p>
      <div className="flex items-center gap-3">
        <div className="flex h-10 flex-1 items-center gap-[2px] overflow-hidden">
          {bars.map((height, index) => (
            <span key={`${title}-${index}`} className="relative h-8 w-[3px] shrink-0">
              <span
                className="absolute left-0 top-1/2 w-full -translate-y-1/2 rounded-full bg-black/80 transition-[height] duration-75"
                style={{ height: `${height}px` }}
              />
            </span>
          ))}
        </div>
        <Button
          type="button"
          onClick={() => void togglePlay()}
          disabled={!src}
          className="h-8 w-8 rounded-full bg-[#FF7857] p-0 text-white hover:bg-[#FF7857]/90"
          aria-label={isPlaying ? `Пауза ${title}` : `Слушать ${title}`}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      </div>
          
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  )
}
