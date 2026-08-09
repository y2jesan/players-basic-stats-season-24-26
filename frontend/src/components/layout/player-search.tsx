import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { Loader2, Search as SearchIcon, SearchX } from "lucide-react"
import { type KeyboardEvent, useEffect, useRef, useState } from "react"

import { PositionBadge } from "@/components/player/position-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { apiGet } from "@/lib/api"
import { formatSeasonLabel } from "@/lib/football-query"
import { getInitials, initialsTileStyle } from "@/lib/initials-color"
import { cn } from "@/lib/utils"
import type { PlayerSearchResult } from "@/types/football"

const MIN_QUERY_LENGTH = 2
const RESULT_LIMIT = 8

function usePlayerSearch(query: string) {
  const [debounced, setDebounced] = useState(query)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 250)
    return () => clearTimeout(id)
  }, [query])

  const trimmed = debounced.trim()
  const active = trimmed.length >= MIN_QUERY_LENGTH

  const { data, isFetching } = useQuery({
    queryKey: ["player-search", trimmed],
    queryFn: () => apiGet<PlayerSearchResult[]>(`/api/football/players/search?q=${encodeURIComponent(trimmed)}&limit=${RESULT_LIMIT}`),
    enabled: active,
  })

  return { results: active ? (data ?? []) : [], isLoading: active && isFetching, trimmed }
}

function PlayerSearchRow({
  player,
  active,
  onSelect,
}: {
  player: PlayerSearchResult
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseDown={(e) => e.preventDefault()}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors",
        active ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <div
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-[0.65rem] font-semibold text-white"
        style={initialsTileStyle(player.name)}
      >
        {getInitials(player.name)}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{player.name}</span>
        <span className="text-muted-foreground truncate text-xs">{player.team_name}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {player.positions.slice(0, 1).map((pos) => (
          <PositionBadge key={pos} position={pos} />
        ))}
        <Badge variant="outline" className="text-[0.65rem]">
          {formatSeasonLabel(player.season)}
        </Badge>
      </div>
    </button>
  )
}

function PlayerSearchResultsList({
  query,
  results,
  isLoading,
  activeIndex,
  onSelect,
}: {
  query: string
  results: PlayerSearchResult[]
  isLoading: boolean
  activeIndex: number
  onSelect: (player: PlayerSearchResult) => void
}) {
  if (query.length < MIN_QUERY_LENGTH) {
    return <p className="text-muted-foreground px-2 py-6 text-center text-sm">Type at least 2 characters to search players.</p>
  }
  if (isLoading && results.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 px-2 py-6 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Searching...
      </div>
    )
  }
  if (results.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-1.5 px-2 py-6 text-center text-sm">
        <SearchX className="size-5" />
        No players found for &ldquo;{query}&rdquo;
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-0.5">
      {results.map((player, index) => (
        <PlayerSearchRow key={player.player_id} player={player} active={index === activeIndex} onSelect={() => onSelect(player)} />
      ))}
    </div>
  )
}

/** Inline search box + dropdown for the desktop navbar (hidden below `md`). */
export function PlayerSearchBar({ className }: { className?: string }) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { results, isLoading, trimmed } = usePlayerSearch(query)

  useEffect(() => setActiveIndex(0), [results])

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [])

  function selectPlayer(player: PlayerSearchResult) {
    setOpen(false)
    setQuery("")
    navigate({ to: "/players/$playerId", params: { playerId: player.player_id }, search: { season: player.season } })
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const player = results[activeIndex]
      if (player) selectPlayer(player)
    } else if (e.key === "Escape") {
      setOpen(false)
      e.currentTarget.blur()
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search players..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => query && setOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </InputGroup>
      {open && (
        <div className="bg-popover text-popover-foreground ring-foreground/10 absolute top-full left-0 z-50 mt-1.5 w-full min-w-72 overflow-hidden rounded-lg p-1.5 shadow-md ring-1">
          <div className="max-h-80 overflow-y-auto">
            <PlayerSearchResultsList query={trimmed} results={results} isLoading={isLoading} activeIndex={activeIndex} onSelect={selectPlayer} />
          </div>
        </div>
      )}
    </div>
  )
}

/** Icon-triggered search sheet for narrow viewports (visible only below `md`). */
export function PlayerSearchMobile({ className }: { className?: string }) {
  const [openSheet, setOpenSheet] = useState(false)
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const navigate = useNavigate()
  const { results, isLoading, trimmed } = usePlayerSearch(query)

  useEffect(() => setActiveIndex(0), [results])
  useEffect(() => {
    if (!openSheet) setQuery("")
  }, [openSheet])

  function selectPlayer(player: PlayerSearchResult) {
    setOpenSheet(false)
    navigate({ to: "/players/$playerId", params: { playerId: player.player_id }, search: { season: player.season } })
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const player = results[activeIndex]
      if (player) selectPlayer(player)
    }
  }

  return (
    <Sheet open={openSheet} onOpenChange={setOpenSheet}>
      <SheetTrigger render={<Button variant="ghost" size="icon-sm" className={className} />}>
        <SearchIcon className="size-4" />
        <span className="sr-only">Search players</span>
      </SheetTrigger>
      <SheetContent side="top" className="h-auto max-h-[85svh] gap-0 p-0">
        <SheetHeader className="pb-2">
          <SheetTitle>Search Players</SheetTitle>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-2 px-4 pb-4">
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              autoFocus
              placeholder="Search players..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </InputGroup>
          <div className="max-h-[60svh] overflow-y-auto">
            <PlayerSearchResultsList query={trimmed} results={results} isLoading={isLoading} activeIndex={activeIndex} onSelect={selectPlayer} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
