"use client"

import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { useStorage, useMutation, useMyPresence, useRoom, useSelf } from '@liveblocks/react'
import { LiveList, LiveMap } from '@liveblocks/client'
import CanvasTools, { ToolMode } from './CanvasTools'
import LiveCursors from './LiveCursors'
import ImageItem, { ImageRenderData } from './ImageItem'
import SideNotes from '@/components/misc/SideNotes'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useT } from '@/lib/useT'
import { Library, Pencil, UserRound } from 'lucide-react'
import { canDraw, useRoomSettings } from '@/lib/roomSettings'
import LibraryPanel from './LibraryPanel'
import {
  BOARD_LIBRARY,
  LIBRARY_DRAG_TYPE,
  boardCategory,
  libraryItemOf,
  libraryUrl,
  tokenInitial,
  type BoardEntry,
  type LibraryUpload,
} from '@/lib/library'
import { extractUploadErrorInfo, uploadImageToCloudinary } from '@/lib/uploadImage'

/** Environ 3 Mo de dessin : largement de quoi couvrir une carte. */
const MAX_STROKE_SEGMENTS = 20000

type StrokeSegment = {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  width: number
  mode: 'draw' | 'erase'
  space?: 'world' | 'px'
}

type StoredImageData = {
  id: string
  url: string
  x: number
  y: number
  width: number
  height: number
  scale?: number
  rotation?: number
  createdAt?: number
  xRatio?: number
  yRatio?: number
  widthRatio?: number
  heightRatio?: number
  /** Carte en fond du plateau. */
  kind?: 'map'
  /** Pion d'un joueur : lui seul et le MJ le déplacent. */
  ownerId?: string
  /** Pion de couleur, dessiné par le code. */
  token?: { text: string; color: string }
}

/** Vue du LiveMap `images` sans les contraintes de types Liveblocks. */
type ImagesStore = {
  get: (key: string) => StoredImageData | undefined
  set: (key: string, value: StoredImageData) => void
  delete: (key: string) => void
  entries: () => IterableIterator<[string, StoredImageData]>
}

/** Adresses des images offertes : tout le reste vient des envois de la table. */
const STATIC_BOARD_URLS = new Set(
  BOARD_LIBRARY.flatMap((c) => c.items.map((item) => libraryUrl(c.id, item.id))),
)

type CanvasSize = { width: number; height: number }

const MIN_IMAGE_SIZE = 40
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)
const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)
const roundRatio = (v: number) => Math.round(v * 1000) / 1000

export default function InteractiveCanvas({
  toolbarExtra,
  overlay,
}: {
  /** Boutons ajoutés au bout de la barre d'outils (panneau du MJ). */
  toolbarExtra?: React.ReactNode
  /** Panneau posé sur le plateau, sous la barre d'outils. */
  overlay?: React.ReactNode
} = {}) {
  const t = useT()
  const isDev = process.env.NODE_ENV !== 'production'
  // Storage
  const imagesMap = useStorage((root) => root.images)
  const libraryStore = useStorage((root) => root.library)
  const strokesList = useStorage((root) => root.strokes) as LiveList<StrokeSegment> | null
  const allImages = useMemo(() => (imagesMap ? Array.from(imagesMap.values()) as StoredImageData[] : []), [imagesMap])
  // La carte en fond est à part : elle couvre tout le plateau et ne bouge pas.
  const mapImage = useMemo(
    () => allImages.filter((i) => i.kind === 'map').sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))[0] ?? null,
    [allImages],
  )
  const images = useMemo(() => allImages.filter((i) => i.kind !== 'map'), [allImages])
  const uploads = useMemo(
    () => (libraryStore ? (Array.from(libraryStore.values()) as LibraryUpload[]) : [])
      .sort((a, b) => a.createdAt - b.createdAt),
    [libraryStore],
  )
  // Les pions des joueurs et les pions de couleur ne sont pas à la bibliothèque.
  const libraryImages = useMemo(() => images.filter((i) => !i.ownerId && !i.token), [images])
  const onBoardUrls = useMemo(() => new Set(libraryImages.map((i) => i.url)), [libraryImages])
  const uploadUrls = useMemo(() => new Set(uploads.map((u) => u.url)), [uploads])
  // Images posées avant la bibliothèque : ni offertes, ni envoyées dedans.
  const oldImages = useMemo(
    () => libraryImages.filter((i) => !STATIC_BOARD_URLS.has(i.url) && !uploadUrls.has(i.url)),
    [libraryImages, uploadUrls],
  )
  const self = useSelf()
  const isGM = self?.info?.role === 'gm'
  const myCharacter = useSelf((me) => me.presence.character)
  const myPionId = self ? `pion-${self.id}` : null
  const myPion = images.find((i) => i.id === myPionId) ?? null
  // Le joueur ne déplace que son pion ; le MJ déplace tout.
  const canMove = (img: { ownerId?: string }) => isGM || (!!img.ownerId && img.ownerId === self?.id)
  const { settings } = useRoomSettings()
  const drawAllowed = canDraw(settings, { id: self?.id, gm: isGM })
  const strokes = useMemo<StrokeSegment[]>(() => {
    if (!strokesList) return []
    const anyList = strokesList as unknown as { toArray?: () => unknown; get?: (i: number) => unknown; length?: number }
    try {
      if (typeof anyList.toArray === 'function') {
        return (anyList.toArray() as unknown as StrokeSegment[]) || []
      }
    } catch {}
    const out: StrokeSegment[] = []
    if (typeof anyList.get === 'function' && typeof anyList.length === 'number') {
      for (let i = 0; i < (anyList.length ?? 0); i += 1) {
        const entry = anyList.get(i) as StrokeSegment | undefined
        if (entry) out.push(entry)
      }
      return out
    }
    if (Array.isArray(strokesList)) return strokesList as unknown as StrokeSegment[]
    return []
  }, [strokesList])
  const strokesRef = useRef<StrokeSegment[]>([])
  useEffect(() => { strokesRef.current = strokes }, [strokes])

  // Presence
  const [, updateMyPresence] = useMyPresence()
  useEffect(() => () => { updateMyPresence({ cursor: null }) }, [updateMyPresence])

  // Local state
  const canvasRef = useRef<HTMLDivElement>(null)
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const canvasSizeRef = useRef<CanvasSize>({ width: 0, height: 0 })
  const [chosenMode, setDrawMode] = useState<ToolMode>('images')
  // Le MJ peut retirer le dessin : on repasse alors au déplacement des pions.
  const drawMode: ToolMode = drawAllowed ? chosenMode : 'images'
  const [color, setColor] = useState('#ffffff')
  const [penSize, setPenSize] = useState(6)
  const [eraserSize, setEraserSize] = useState(24)
  const brushSize = drawMode === 'erase' ? eraserSize : penSize
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isDrawing, setIsDrawing] = useState(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  // Palette de dessin : l'ouvrir passe au crayon, la fermer rend la main aux pions.
  const [toolsOpen, setToolsVisible] = useState(false)
  const toolsVisible = toolsOpen && drawAllowed
  const toggleTools = () => {
    setDrawMode(toolsVisible ? 'images' : 'draw')
    setToolsVisible(!toolsVisible)
  }
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [uploading, setUploading] = useState<Record<string, number>>({})
  const [toDelete, setToDelete] = useState<LibraryUpload | null>(null)

  // Images helpers
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)
  const [uploadDebug, setUploadDebug] = useState<string | null>(null)
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 0, height: 0 })
  const [renderVersion, setRenderVersion] = useState(0)
  const renderRaf = useRef<number | null>(null)
  const scheduleRender = useCallback(() => {
    if (renderRaf.current !== null) return
    renderRaf.current = requestAnimationFrame(() => {
      renderRaf.current = null
      setRenderVersion((v) => v + 1)
    })
  }, [])
  const localTransforms = useRef(new Map<string, Partial<ImageRenderData>>())
  useEffect(() => () => { if (renderRaf.current !== null) cancelAnimationFrame(renderRaf.current) }, [])

  const resolveSize = useCallback((size?: CanvasSize) => {
    const current = size ?? canvasSizeRef.current
    return {
      width: current.width || canvasSize.width,
      height: current.height || canvasSize.height,
    }
  }, [canvasSize])
  const getMinDim = useCallback((size?: CanvasSize) => {
    const { width, height } = resolveSize(size)
    return Math.max(1, Math.min(width, height))
  }, [resolveSize])
  const screenToWorldPoint = useCallback((x: number, y: number, size?: CanvasSize) => {
    const { width, height } = resolveSize(size)
    return {
      x: width ? clamp01(x / width) : 0,
      y: height ? clamp01(y / height) : 0,
    }
  }, [resolveSize])
  const worldToScreenPoint = useCallback((x: number, y: number, size?: CanvasSize) => {
    const { width, height } = resolveSize(size)
    return {
      x: x * width,
      y: y * height,
    }
  }, [resolveSize])
  const screenToWorldSize = useCallback((w: number, h: number, size?: CanvasSize) => {
    const { width, height } = resolveSize(size)
    return {
      w: width ? w / width : 0,
      h: height ? h / height : 0,
    }
  }, [resolveSize])
  const worldToScreenSize = useCallback((w: number, h: number, size?: CanvasSize) => {
    const { width, height } = resolveSize(size)
    return {
      w: w * width,
      h: h * height,
    }
  }, [resolveSize])
  const screenToWorldStroke = useCallback((w: number, size?: CanvasSize) => w / getMinDim(size), [getMinDim])
  const resolveImageWorld = useCallback((img: StoredImageData, size?: CanvasSize) => {
    const hasWorld =
      Number.isFinite(img.x) &&
      Number.isFinite(img.y) &&
      Number.isFinite(img.width) &&
      Number.isFinite(img.height) &&
      img.x >= 0 &&
      img.y >= 0 &&
      img.width >= 0 &&
      img.height >= 0 &&
      img.x <= 1 &&
      img.y <= 1 &&
      img.width <= 1 &&
      img.height <= 1
    if (hasWorld) {
      return { x: img.x, y: img.y, width: img.width, height: img.height }
    }
    const hasRatio =
      Number.isFinite(img.xRatio) &&
      Number.isFinite(img.yRatio) &&
      Number.isFinite(img.widthRatio) &&
      Number.isFinite(img.heightRatio)
    if (hasRatio) {
      return {
        x: clamp01(img.xRatio ?? 0),
        y: clamp01(img.yRatio ?? 0),
        width: clamp01(img.widthRatio ?? 0),
        height: clamp01(img.heightRatio ?? 0),
      }
    }
    const { width, height } = resolveSize(size)
    const safeX = Number.isFinite(img.x) ? img.x : 0
    const safeY = Number.isFinite(img.y) ? img.y : 0
    const safeW = Number.isFinite(img.width) ? img.width : 0
    const safeH = Number.isFinite(img.height) ? img.height : 0
    return {
      x: width ? clamp01(safeX / width) : 0,
      y: height ? clamp01(safeY / height) : 0,
      width: width ? clamp01(safeW / width) : 0,
      height: height ? clamp01(safeH / height) : 0,
    }
  }, [resolveSize])

  // Lit la taille et les déplacements en cours gardés dans des refs (mis à jour à chaque image
  // pendant un glisser) ; `renderVersion` déclenche le recalcul.
  const imagesToRender = useMemo<ImageRenderData[]>(() => {
    void renderVersion
    const size = resolveSize()
    const minWorldW = size.width ? MIN_IMAGE_SIZE / size.width : 0
    const minWorldH = size.height ? MIN_IMAGE_SIZE / size.height : 0
    // eslint-disable-next-line react-hooks/refs -- lecture voulue, voir plus haut
    return images.map((img) => {
      const key = String(img.id)
      const world = resolveImageWorld(img, size)
      const wWorld = clamp(world.width, minWorldW, 1)
      const hWorld = clamp(world.height, minWorldH, 1)
      const xWorld = clamp(world.x, 0, Math.max(0, 1 - wWorld))
      const yWorld = clamp(world.y, 0, Math.max(0, 1 - hWorld))
      let { w, h } = worldToScreenSize(wWorld, hWorld, size)
      let { x, y } = worldToScreenPoint(xWorld, yWorld, size)
      const overrides = localTransforms.current.get(key)
      if (overrides) {
        x = overrides.x ?? x
        y = overrides.y ?? y
        w = overrides.width ?? w
        h = overrides.height ?? h
      }
      if (size.width || size.height) {
        w = clamp(w, MIN_IMAGE_SIZE, size.width || w)
        h = clamp(h, MIN_IMAGE_SIZE, size.height || h)
        x = clamp(x, 0, Math.max(0, (size.width || x + w) - w))
        y = clamp(y, 0, Math.max(0, (size.height || y + h) - h))
      }
      return {
        ...img,
        x,
        y,
        width: w,
        height: h,
      }
    })
  }, [images, renderVersion, resolveSize, resolveImageWorld, worldToScreenSize, worldToScreenPoint])

  const renderedImageMap = useMemo(() => {
    const map = new Map<string, ImageRenderData>()
    imagesToRender.forEach((img) => map.set(String(img.id), img))
    return map
  }, [imagesToRender])

  // Keep transforms map in sync
  useEffect(() => {
    const ids = new Set(images.map((i) => String(i.id)))
    const transforms = localTransforms.current
    let changed = false
    for (const key of Array.from(transforms.keys())) {
      if (!ids.has(key)) { transforms.delete(key); changed = true }
    }
    if (changed) scheduleRender()
  }, [images, scheduleRender])

  // Mutations
  const updateImageTransform = useMutation(({ storage }, id: string, patch: Partial<StoredImageData>) => {
    const map = storage.get('images') as unknown as {
      get: (key: string) => StoredImageData | undefined
      set: (key: string, value: StoredImageData) => void
    }
    const prev = map.get(id)
    if (!prev) return
    map.set(id, { ...prev, ...patch })
  }, [])
  const removeBoardImage = useMutation(({ storage }, id: string) => {
    const map = storage.get('images') as unknown as ImagesStore
    const url = map.get(id)?.url
    map.delete(id)
    return url
  }, [])
  // Un clic dans la bibliothèque : la carte remplace celle en fond (ou part si
  // c'était elle) ; un pion se pose, ou s'en va s'il était déjà sur le plateau.
  // Un glisser-déposer pose toujours.
  const placeOnBoard = useMutation(({ storage }, entry: BoardEntry, placed: StoredImageData, toggle: boolean) => {
    const map = storage.get('images') as unknown as ImagesStore
    const entries = Array.from(map.entries())
    if (placed.kind === 'map') {
      const maps = entries.filter(([, img]) => img.kind === 'map')
      const wasActive = maps.some(([, img]) => img.url === entry.url)
      maps.forEach(([key]) => map.delete(key))
      if (!(toggle && wasActive)) map.set(placed.id, placed)
      return
    }
    const same = entries.filter(([, img]) => img.kind !== 'map' && !img.ownerId && !img.token && img.url === entry.url)
    if (toggle && same.length > 0) same.forEach(([key]) => map.delete(key))
    else map.set(placed.id, placed)
  }, [])
  const setBoardImage = useMutation(({ storage }, image: StoredImageData) => {
    ;(storage.get('images') as unknown as ImagesStore).set(image.id, image)
  }, [])
  const addLibraryUpload = useMutation(({ storage }, upload: LibraryUpload) => {
    // Les tables créées avant la bibliothèque n'ont pas encore ce dossier.
    if (!storage.get('library')) storage.set('library', new LiveMap())
    storage.get('library').set(upload.id, upload)
  }, [])
  const deleteLibraryUpload = useMutation(({ storage }, upload: LibraryUpload) => {
    const map = storage.get('images') as unknown as ImagesStore
    Array.from(map.entries())
      .filter(([, img]) => img.url === upload.url)
      .forEach(([key]) => map.delete(key))
    storage.get('library')?.delete(upload.id)
  }, [])
  // Retirer une image du plateau ne l'efface jamais : seules la suppression
  // d'un envoi et le retrait d'une ancienne image l'effacent chez Cloudinary.
  // Le serveur vérifie qu'elle n'est plus ni sur la table ni dans sa bibliothèque.
  const room = useRoom()
  const eraseFromCloudinary = useCallback((url: string | undefined) => {
    if (!url?.startsWith('https://res.cloudinary.com/')) return
    fetch('/api/cloudinary/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: room.id, url }),
      keepalive: true,
    }).catch(() => {})
  }, [room])
  const addStrokeSegments = useMutation(({ storage }, segments: StrokeSegment[]) => {
    let list = storage.get('strokes') as unknown
    const hasPush = !!(list && typeof (list as { push?: unknown }).push === 'function')
    const hasInsert = !!(list && typeof (list as { insert?: unknown }).insert === 'function')
    if (!list || (!hasPush && !hasInsert)) {
      storage.set('strokes', new LiveList<StrokeSegment>([]))
      list = storage.get('strokes') as unknown
    }
    for (const segment of segments) {
      if (typeof (list as { push?: (v: StrokeSegment) => void }).push === 'function') {
        ;(list as { push: (v: StrokeSegment) => void }).push(segment)
      } else if (typeof (list as { insert?: (i: number, v: StrokeSegment) => void; length?: number }).insert === 'function') {
        const helper = list as { insert: (i: number, v: StrokeSegment) => void; length?: number }
        helper.insert((helper.length ?? 0) as number, segment)
      }
    }
    // Au-delà, les plus anciens segments partent : une table dessinée pendant
    // des mois finissait par alourdir chaque chargement pour tout le monde.
    const sized = list as { length?: number; delete?: (idx: number) => void }
    if (typeof sized.delete === 'function') {
      const overflow = (sized.length ?? 0) - MAX_STROKE_SEGMENTS
      for (let i = 0; i < overflow; i += 1) sized.delete(0)
    }
  }, [])
  // Le trait s'affiche tout de suite en local, mais les segments ne partent
  // vers Liveblocks qu'une fois par image (requestAnimationFrame) : un dessin
  // rapide produit des dizaines de pointermove par seconde, et chacun coûtait
  // un envoi réseau et un redessin complet du canevas chez tous les joueurs.
  const pendingStrokes = useRef<StrokeSegment[]>([])
  const strokeFlushRaf = useRef<number | null>(null)
  const flushStrokes = useCallback(() => {
    if (strokeFlushRaf.current !== null) {
      cancelAnimationFrame(strokeFlushRaf.current)
      strokeFlushRaf.current = null
    }
    if (pendingStrokes.current.length === 0) return
    const batch = pendingStrokes.current
    pendingStrokes.current = []
    addStrokeSegments(batch)
  }, [addStrokeSegments])
  const queueStrokeSegment = useCallback((segment: StrokeSegment) => {
    pendingStrokes.current.push(segment)
    if (strokeFlushRaf.current === null) {
      strokeFlushRaf.current = requestAnimationFrame(() => {
        strokeFlushRaf.current = null
        flushStrokes()
      })
    }
  }, [flushStrokes])
  useEffect(() => () => flushStrokes(), [flushStrokes])
  const clearStrokes = useMutation(({ storage }) => {
    const list = storage.get('strokes') as unknown
    if (!list) return
    if (typeof (list as { clear?: () => void }).clear === 'function') {
      ;(list as { clear: () => void }).clear()
      return
    }
    if (typeof (list as { delete?: (idx: number) => void; length?: number }).delete === 'function') {
      const helper = list as { delete: (idx: number) => void; length?: number }
      for (let i = (helper.length ?? 0) - 1; i >= 0; i -= 1) helper.delete(i)
      return
    }
    // As a fallback, reset the list
    storage.set('strokes', new LiveList<StrokeSegment>([]))
  }, [])
  // Drawing handlers
  const drawStrokeSegment = useCallback(
    (ctx: CanvasRenderingContext2D, s: StrokeSegment, sizeOverride?: CanvasSize) => {
      const size = sizeOverride ?? canvasSizeRef.current
      if (!size.width || !size.height) return
      const isWorld =
        s.space === 'world' ||
        (s.x1 >= 0 && s.x1 <= 1 && s.y1 >= 0 && s.y1 <= 1 && s.x2 >= 0 && s.x2 <= 1 && s.y2 >= 0 && s.y2 <= 1)
      const x1 = isWorld ? s.x1 * size.width : s.x1
      const y1 = isWorld ? s.y1 * size.height : s.y1
      const x2 = isWorld ? s.x2 * size.width : s.x2
      const y2 = isWorld ? s.y2 * size.height : s.y2
      const minDim = Math.max(1, Math.min(size.width, size.height))
      const lineWidth = isWorld ? s.width * minDim : s.width
      ctx.save()
      ctx.strokeStyle = s.mode === 'erase' ? 'rgba(0,0,0,1)' : s.color
      ctx.lineWidth = lineWidth
      ctx.globalCompositeOperation = s.mode === 'erase' ? 'destination-out' : 'source-over'
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      ctx.restore()
    },
    [],
  )
  const resizeCanvas = useCallback(() => {
    const rect = drawingCanvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const ratio = window.devicePixelRatio || 1
    const canvas = drawingCanvasRef.current!
    canvas.width = Math.max(1, Math.floor(rect.width * ratio))
    canvas.height = Math.max(1, Math.floor(rect.height * ratio))
    const nextSize = { width: rect.width, height: rect.height }
    canvasSizeRef.current = nextSize
    setCanvasSize(nextSize)
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctxRef.current = ctx
    ctx.clearRect(0, 0, rect.width, rect.height)
    strokesRef.current.forEach((s) => drawStrokeSegment(ctx, s, nextSize))
  }, [drawStrokeSegment])

  useEffect(() => {
    resizeCanvas()
    const onResize = () => resizeCanvas()
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => resizeCanvas()) : null
    if (observer && canvasRef.current) observer.observe(canvasRef.current)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
      if (observer) observer.disconnect()
    }
  }, [resizeCanvas])

  useEffect(() => {
    const ctx = ctxRef.current
    const size = canvasSizeRef.current
    if (!ctx || !size.width || !size.height) return
    ctx.clearRect(0, 0, size.width, size.height)
    strokes.forEach((s) => drawStrokeSegment(ctx, s, size))
  }, [strokes, drawStrokeSegment])
  const handlePointerDown = (e: React.PointerEvent, id?: string, type?: 'move' | 'resize') => {
    e.preventDefault()
    const rect = drawingCanvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const world = screenToWorldPoint(x, y, { width: rect.width, height: rect.height })
    if ((drawMode === 'draw' || drawMode === 'erase') && !id) {
      setIsDrawing(true)
      setMousePos({ x, y })
      lastPointRef.current = world
      const ctx = ctxRef.current
      if (ctx) { ctx.strokeStyle = drawMode === 'erase' ? 'rgba(0,0,0,1)' : color; ctx.lineWidth = brushSize; ctx.globalCompositeOperation = drawMode === 'erase' ? 'destination-out' : 'source-over'; ctx.beginPath(); ctx.moveTo(x, y) }
      return
    }
    if (drawMode === 'images' && id && type) {
      const key = String(id)
      const img = renderedImageMap.get(key)
      if (!img || !canMove(img)) return
      dragState.current = { id: key, type, offsetX: x - img.x, offsetY: y - img.y }
      localTransforms.current.set(key, { x: img.x, y: img.y, width: img.width, height: img.height })
      scheduleRender()
    }
  }
  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = drawingCanvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const world = screenToWorldPoint(x, y, { width: rect.width, height: rect.height })
    const pos = { x, y }
    if (drawMode === 'draw' || drawMode === 'erase') setMousePos(pos)
    updateMyPresence({ cursor: world })
    if ((drawMode === 'draw' || drawMode === 'erase') && isDrawing && lastPointRef.current) {
      const prev = lastPointRef.current
      const seg: StrokeSegment = {
        id: crypto.randomUUID(),
        x1: prev.x,
        y1: prev.y,
        x2: world.x,
        y2: world.y,
        color,
        width: screenToWorldStroke(brushSize, { width: rect.width, height: rect.height }),
        mode: drawMode,
        space: 'world',
      }
      const ctx = ctxRef.current
      if (ctx) drawStrokeSegment(ctx, seg, { width: rect.width, height: rect.height })
      queueStrokeSegment(seg)
      lastPointRef.current = world
    }
    if (drawMode === 'images' && dragState.current.id) {
      const key = dragState.current.id
      const img = localTransforms.current.get(key)
      if (!img) return
      if (dragState.current.type === 'move') {
        const nx = clamp(x - dragState.current.offsetX, 0, Math.max(0, canvasSize.width - (img.width ?? 0)))
        const ny = clamp(y - dragState.current.offsetY, 0, Math.max(0, canvasSize.height - (img.height ?? 0)))
        localTransforms.current.set(key, { ...img, x: nx, y: ny })
      } else {
        const w = clamp(x - (img.x ?? 0), MIN_IMAGE_SIZE, canvasSize.width)
        const h = clamp(y - (img.y ?? 0), MIN_IMAGE_SIZE, canvasSize.height)
        localTransforms.current.set(key, { ...img, width: w, height: h })
      }
      scheduleRender()
    }
  }
  const handlePointerUp = () => {
    if ((drawMode === 'draw' || drawMode === 'erase') && isDrawing) { setIsDrawing(false); lastPointRef.current = null; flushStrokes() }
    if (drawMode === 'images' && dragState.current.id) {
      const key = dragState.current.id
      const img = localTransforms.current.get(key)
      localTransforms.current.delete(key)
      scheduleRender()
      dragState.current = { id: null, type: null, offsetX: 0, offsetY: 0 }
      if (img) {
        const size = resolveSize()
        const minWorldW = size.width ? MIN_IMAGE_SIZE / size.width : 0
        const minWorldH = size.height ? MIN_IMAGE_SIZE / size.height : 0
        const rawWorldX = size.width ? img.x! / size.width : 0
        const rawWorldY = size.height ? img.y! / size.height : 0
        const rawWorldW = size.width ? img.width! / size.width : 0
        const rawWorldH = size.height ? img.height! / size.height : 0
        const widthWorld = clamp(rawWorldW, minWorldW, 1)
        const heightWorld = clamp(rawWorldH, minWorldH, 1)
        const xWorld = clamp(rawWorldX, 0, Math.max(0, 1 - widthWorld))
        const yWorld = clamp(rawWorldY, 0, Math.max(0, 1 - heightWorld))
        const patch: Partial<StoredImageData> = {
          x: roundRatio(xWorld),
          y: roundRatio(yWorld),
          width: roundRatio(widthWorld),
          height: roundRatio(heightWorld),
        }
        updateImageTransform(key, patch)
      }
    }
  }
  const handlePointerLeave = () => {
    updateMyPresence({ cursor: null })
    if (isDrawing || dragState.current.id) handlePointerUp()
  }
  const [confirmClear, setConfirmClear] = useState(false)

  const resetUploadFeedback = useCallback(() => {
    setUploadMessage(null)
    setUploadDebug(null)
  }, [])
  const handleUploadError = useCallback(
    (error: unknown) => {
      const info = extractUploadErrorInfo(error)
      setUploadMessage(info.userMessage)
      const debugParts: string[] = []
      if (info.step) debugParts.push(info.step)
      if (info.code) debugParts.push(info.code)
      const debugMessage = debugParts.length ? debugParts.join(' | ') : null
      setUploadDebug(isDev ? debugMessage : null)
      if (isDev) {
        console.error('Image upload failed', error, info.details ?? info)
      }
    },
    [isDev],
  )
  useEffect(() => {
    if (!uploadMessage) return
    const timer = setTimeout(resetUploadFeedback, 8000)
    return () => clearTimeout(timer)
  }, [uploadMessage, resetUploadFeedback])

  // Envoi d'une image dans la bibliothèque de la table, pour tous ses joueurs.
  async function uploadToLibrary(categoryId: string, file: File) {
    resetUploadFeedback()
    if (!self?.info?.signedIn) {
      setUploadMessage(t('portraitUploadSignIn'))
      return
    }
    const bump = (d: number) => setUploading((prev) => ({ ...prev, [categoryId]: Math.max(0, (prev[categoryId] ?? 0) + d) }))
    bump(1)
    try {
      const result = await uploadImageToCloudinary(file)
      addLibraryUpload({
        id: newId(),
        url: result.deliveryUrl ?? result.url,
        category: categoryId,
        width: result.width ?? 0,
        height: result.height ?? 0,
        ownerId: self.id,
        ownerName: self.info.pseudo,
        createdAt: Date.now(),
      })
    } catch (error) {
      handleUploadError(error)
    } finally {
      bump(-1)
    }
  }

  // Place et taille d'une image à son arrivée, selon sa catégorie.
  function placement(entry: BoardEntry, rect: CanvasSize, dropX = rect.width / 2, dropY = rect.height / 2): StoredImageData | null {
    const category = boardCategory(entry.categoryId)
    if (!category || !rect.width || !rect.height) return null
    if (category.map) {
      return { id: newId(), url: entry.url, kind: 'map', x: 0, y: 0, width: 1, height: 1, createdAt: Date.now() }
    }
    const naturalW = entry.width || 400
    const naturalH = entry.height || 400
    const fit = Math.min(1, (rect.width * category.share) / naturalW, (rect.height * category.share) / naturalH)
    const size = screenToWorldSize(naturalW * fit, naturalH * fit, rect)
    const w = clamp(size.w, MIN_IMAGE_SIZE / rect.width, 1)
    const h = clamp(size.h, MIN_IMAGE_SIZE / rect.height, 1)
    const at = screenToWorldPoint(dropX, dropY, rect)
    return {
      id: newId(),
      url: entry.url,
      x: clamp(at.x - w / 2, 0, Math.max(0, 1 - w)),
      y: clamp(at.y - h / 2, 0, Math.max(0, 1 - h)),
      width: w,
      height: h,
      createdAt: Date.now(),
    }
  }
  function toggleEntry(entry: BoardEntry) {
    const rect = drawingCanvasRef.current?.getBoundingClientRect()
    const placed = rect && placement(entry, rect)
    if (placed) placeOnBoard(entry, placed, true)
  }
  // Pion de couleur posé par le MJ, au centre du plateau.
  function placeToken(text: string, color: string) {
    const rect = drawingCanvasRef.current?.getBoundingClientRect()
    const placed = rect && placement({ url: '', categoryId: 'pions', width: 200, height: 200 }, rect)
    if (placed) setBoardImage({ ...placed, token: { text, color } })
  }
  // Le pion du personnage : l'image choisie dans la fiche, sinon son initiale
  // dans la couleur du joueur.
  const myPionLook = useMemo(() => {
    const url = myCharacter?.pion
    if (url) return { url, token: undefined }
    return { url: '', token: { text: tokenInitial(myCharacter?.nom), color: self?.info?.color ?? '#9ca3af' } }
  }, [myCharacter?.pion, myCharacter?.nom, self?.info?.color])
  function toggleMyPion() {
    if (!myPionId || !self) return
    if (myPion) { removeBoardImage(myPionId); return }
    const rect = drawingCanvasRef.current?.getBoundingClientRect()
    const item = libraryItemOf(myPionLook.url)
    const size = item ? BOARD_LIBRARY.find((c) => c.id === item.categoryId)?.items.find((i) => i.id === item.itemId) : null
    const placed = rect && placement(
      { url: myPionLook.url, categoryId: 'pions', width: size?.width ?? (myPionLook.token ? 200 : 400), height: size?.height ?? (myPionLook.token ? 200 : 400) },
      rect,
    )
    if (placed) setBoardImage({ ...placed, id: myPionId, ownerId: self.id, ...(myPionLook.token ? { token: myPionLook.token } : {}) })
  }
  // Un pion déjà posé suit les changements de la fiche (image, nom, couleur).
  useEffect(() => {
    if (!myPion || !myPionId) return
    const sameToken = myPion.token?.text === myPionLook.token?.text && myPion.token?.color === myPionLook.token?.color
    if (myPion.url === myPionLook.url && sameToken) return
    // Réécrit en entier : Liveblocks ne garde pas un champ laissé à `undefined`.
    const { token: _old, ...rest } = myPion
    void _old
    setBoardImage({ ...rest, url: myPionLook.url, ...(myPionLook.token ? { token: myPionLook.token } : {}) })
  }, [myPion, myPionId, myPionLook, setBoardImage])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const rect = drawingCanvasRef.current?.getBoundingClientRect()
    const data = e.dataTransfer.getData(LIBRARY_DRAG_TYPE)
    if (!rect || !data) return
    try {
      const entry = JSON.parse(data) as BoardEntry
      if (typeof entry.url !== 'string' || typeof entry.categoryId !== 'string') return
      const placed = placement(entry, rect, e.clientX - rect.left, e.clientY - rect.top)
      if (placed) placeOnBoard(entry, placed, false)
    } catch { /* donnée de glisser illisible : on ignore */ }
  }

  // Drag state
  const dragState = useRef({ id: null as string | null, type: null as 'move' | 'resize' | null, offsetX: 0, offsetY: 0 })

  // Canvas interactivity (les tailles de pinceau sont bornées par les curseurs de CanvasTools)
  useEffect(() => {
    const canvas = drawingCanvasRef.current
    if (canvas) { canvas.style.zIndex = '2'; canvas.style.pointerEvents = drawMode === 'images' ? 'none' : 'auto' }
  }, [drawMode])

  return (
    <>
      <div className="relative w-full h-full select-none">
        {/* Outils : le bouton, puis la barre quand elle est ouverte */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-start gap-2 pointer-events-none">
          {drawAllowed && <button
            onClick={toggleTools}
            aria-expanded={toolsVisible}
            className={`pointer-events-auto ui-btn shadow-lg !min-h-9 ${toolsVisible ? 'ui-btn-primary' : '!bg-[var(--c-panel-head)]'}`}
          >
            <Pencil size={14} />
            {t('draw')}
          </button>}
          {/* La bibliothèque est l'outil du MJ ; le joueur pose seulement son pion. */}
          {/* Rien tant que la session n'a pas dit qui on est : pas de « Mon pion » éclair chez le MJ. */}
          {!self ? null : isGM ? (
            <button
              onClick={() => setLibraryOpen(!libraryOpen)}
              aria-expanded={libraryOpen}
              className={`pointer-events-auto ui-btn shadow-lg !min-h-9 ${libraryOpen ? 'ui-btn-primary' : '!bg-[var(--c-panel-head)]'}`}
            >
              <Library size={14} />
              {t('library')}
            </button>
          ) : (
            <button
              onClick={toggleMyPion}
              aria-pressed={!!myPion}
              title={t('myPionHint')}
              className={`pointer-events-auto ui-btn shadow-lg !min-h-9 ${myPion ? 'ui-btn-primary' : '!bg-[var(--c-panel-head)]'}`}
            >
              <UserRound size={14} />
              {t('myPion')}
            </button>
          )}
          {toolsVisible && (
            <div className="pointer-events-auto min-w-0">
              <CanvasTools drawMode={drawMode} setDrawMode={setDrawMode} color={color} setColor={setColor} brushSize={brushSize} setPenSize={setPenSize} setEraserSize={setEraserSize} clearCanvas={() => setConfirmClear(true)} />
            </div>
          )}
          {toolbarExtra && <div className="pointer-events-auto ml-auto shrink-0">{toolbarExtra}</div>}
        </div>
        {overlay}
        {libraryOpen && isGM && (
          <div
            className="pointer-events-none absolute top-14 left-3 right-3 bottom-3 z-30 flex items-start"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <LibraryPanel
              uploads={uploads}
              onBoard={onBoardUrls}
              mapUrl={mapImage?.url ?? null}
              oldImages={oldImages}
              uploading={uploading}
              canDelete={(u) => isGM || u.ownerId === self?.id}
              onToggle={toggleEntry}
              onPlaceToken={placeToken}
              onUpload={uploadToLibrary}
              onDelete={setToDelete}
              onRemoveOld={(id) => {
                const url = removeBoardImage(id)
                if (url && !uploadUrls.has(url)) eraseFromCloudinary(url)
              }}
              onClose={() => setLibraryOpen(false)}
            />
          </div>
        )}
        {uploadMessage && (
          <div role="status" className="absolute top-14 right-3 z-40 max-w-sm pointer-events-auto ui-panel !backdrop-blur-md px-4 py-3 shadow-lg">
            <p className="text-sm font-semibold leading-snug">{uploadMessage}</p>
            {isDev && uploadDebug && (
              <p className="mt-1 text-xs text-amber-100/80">[{uploadDebug}]</p>
            )}
          </div>
        )}
        {/* Surface */}
        <div ref={canvasRef} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerLeave} className="w-full h-full relative overflow-hidden z-0 touch-none" style={{ background: 'none', border: 'none', borderRadius: 0 }}>
          {mapImage && (
            <img
              src={mapImage.url}
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover pointer-events-none select-none"
              style={{ zIndex: 0 }}
            />
          )}
          <canvas ref={drawingCanvasRef} className="absolute top-0 left-0 w-full h-full" />
          {imagesToRender.map((img) => (
            <ImageItem
              key={img.id}
              img={img}
              drawMode={drawMode}
              movable={canMove(img)}
              onRemove={() => removeBoardImage(img.id)}
              onPointerDown={handlePointerDown}
            />
          ))}
          {(drawMode === 'draw' || drawMode === 'erase') && (
            <div className="absolute rounded-full border border-accent pointer-events-none" style={{ top: mousePos.y - brushSize / 2, left: mousePos.x - brushSize / 2, width: brushSize, height: brushSize, zIndex: 2 }} />
          )}
          <LiveCursors canvasSize={canvasSize} />
          <SideNotes />
        </div>
      </div>
      <ConfirmDialog
        open={confirmClear}
        message={t('clearAllConfirm')}
        confirmLabel={t('clearAll')}
        danger
        onConfirm={() => { setConfirmClear(false); clearStrokes() }}
        onCancel={() => setConfirmClear(false)}
      />
      <ConfirmDialog
        open={toDelete !== null}
        message={t('libraryDeleteConfirm')}
        confirmLabel={t('libraryDelete')}
        danger
        onConfirm={() => {
          if (toDelete) {
            deleteLibraryUpload(toDelete)
            eraseFromCloudinary(toDelete.url)
          }
          setToDelete(null)
        }}
        onCancel={() => setToDelete(null)}
      />
    </>
  )
}
