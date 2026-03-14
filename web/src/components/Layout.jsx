import { useState, useEffect, useRef, useCallback } from 'react'
import { LogOut, Filter, X, ChevronDown, Package, Globe, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getPacks, getAllComponents, createPack, deletePack } from '../store'
import Canvas from '../pages/Canvas'

export default function Layout() {
  const { user, logout } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [filterPack, setFilterPack] = useState(null)
  const [filterSite, setFilterSite] = useState(null)
  const [packs, setPacks] = useState([])
  const [sites, setSites] = useState([])
  const [creatingPack, setCreatingPack] = useState(false)
  const [newPackName, setNewPackName] = useState('')
  const dropdownRef = useRef(null)
  const filterRef = useRef(null)
  const newPackInputRef = useRef(null)
  const packListRef = useRef(null)
  const siteListRef = useRef(null)
  const [sliderStyle, setSliderStyle] = useState({ opacity: 0 })
  const [siteSliderStyle, setSiteSliderStyle] = useState({ opacity: 0 })

  useEffect(() => {
    if (!user) return
    async function load() {
      const [p, comps] = await Promise.all([
        getPacks(user.uid),
        getAllComponents(user.uid),
      ])
      setPacks(p)

      // Extract unique hostnames
      const hostSet = new Set()
      comps.forEach((c) => {
        try {
          const host = new URL(c.sourceUrl || '').hostname.replace('www.', '')
          if (host) hostSet.add(host)
        } catch { /* */ }
      })
      setSites([...hostSet].sort())
    }
    load()
  }, [user])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilter(false)
        setCreatingPack(false)
        setNewPackName('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const calcSlider = useCallback((el, containerRef) => {
    if (!el || !containerRef.current) return null
    const container = containerRef.current.getBoundingClientRect()
    const rect = el.getBoundingClientRect()
    return {
      top: rect.top - container.top,
      left: rect.left - container.left,
      width: rect.width,
      height: rect.height,
      opacity: 1,
    }
  }, [])

  const updateSlider = useCallback((el) => {
    setSliderStyle(calcSlider(el, packListRef) || ((s) => ({ ...s, opacity: 0 })))
  }, [calcSlider])

  const updateSiteSlider = useCallback((el) => {
    setSiteSliderStyle(calcSlider(el, siteListRef) || ((s) => ({ ...s, opacity: 0 })))
  }, [calcSlider])

  // Update slider positions when filters change
  useEffect(() => {
    if (!packListRef.current) return
    const active = packListRef.current.querySelector('[data-pack-active="true"]')
    updateSlider(active)
  }, [filterPack, packs, showFilter, updateSlider])

  useEffect(() => {
    if (!siteListRef.current) return
    const active = siteListRef.current.querySelector('[data-site-active="true"]')
    updateSiteSlider(active)
  }, [filterSite, sites, showFilter, updateSiteSlider])

  const handleCreatePack = async () => {
    const name = newPackName.trim()
    if (!name || !user) return
    const pack = await createPack(user.uid, name)
    setPacks((prev) => [pack, ...prev])
    setFilterPack(pack.id)
    setNewPackName('')
    setCreatingPack(false)
  }

  const handleDeletePack = async (packId) => {
    if (!user) return
    await deletePack(user.uid, packId)
    setPacks((prev) => prev.filter((p) => p.id !== packId))
    if (filterPack === packId) setFilterPack(null)
  }

  useEffect(() => {
    if (creatingPack && newPackInputRef.current) {
      newPackInputRef.current.focus()
    }
  }, [creatingPack])

  const hasActiveFilter = filterPack || filterSite
  const activePackName = packs.find((p) => p.id === filterPack)?.name

  return (
    <div className="min-h-screen bg-background">
      <Canvas filterPack={filterPack} filterSite={filterSite} />

      {/* Top-left: Logo */}
      <div className="fixed top-6 left-6 z-50 pointer-events-none">
        <img src="/logo.svg" alt="" className="h-10 drop-shadow-lg" />
      </div>

      {/* Top-right: User dropdown */}
      <div className="fixed top-6 right-6 z-50 pointer-events-none" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer border border-border bg-foreground/80 backdrop-blur-md p-2 pr-3 rounded-xl shadow-lg shadow-black/20 pointer-events-auto"
        >
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              className="w-7 h-7 rounded-lg"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              {user?.displayName?.[0] || '?'}
            </div>
          )}
          <ChevronDown
            size={14}
            className={`text-copy-lighter transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-foreground border border-border rounded-xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 pointer-events-auto">
            <div className="px-4 py-3 bg-linear-to-b from-background/50 to-transparent flex items-center gap-3">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  className="w-8 h-8 rounded-lg shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {user?.displayName?.[0] || '?'}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-copy truncate">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-[11px] text-copy-lighter truncate -mt-0.5">
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="px-2 py-1.5 border-t border-border">
              <button
                onClick={() => {
                  logout()
                  setIsDropdownOpen(false)
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-[13px] text-copy-light hover:text-error hover:bg-error/5 flex items-center gap-2.5 transition-colors border-none bg-transparent cursor-pointer"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom-right: Filter */}
      <div className="fixed bottom-6 right-6 z-50 pointer-events-none" ref={filterRef}>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer border transition-all shadow-lg shadow-black/20 backdrop-blur-md pointer-events-auto ${hasActiveFilter
            ? 'bg-primary/90 text-primary-content border-primary/50'
            : 'bg-foreground/80 text-copy-light border-border hover:text-copy'
            }`}
        >
          <Filter size={15} />
          {hasActiveFilter
            ? (activePackName || filterSite || 'Filtered')
            : 'Filter'}
          {hasActiveFilter && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setFilterPack(null)
                setFilterSite(null)
              }}
              className="ml-0.5 p-0.5 rounded-md hover:bg-white/20 cursor-pointer bg-transparent border-none text-primary-content"
            >
              <X size={12} />
            </button>
          )}
        </button>

        {showFilter && (
          <div className="absolute bottom-full right-0 mb-2 w-60 bg-foreground border border-border rounded-xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150 pointer-events-auto">
            {/* Packs */}
            <div className="px-2 pt-3 pb-2">
              <div className="flex items-center justify-between px-2 mb-2">
                <p className="text-[10px] font-semibold text-copy-lighter">Packs</p>
                <button
                  onClick={() => { setCreatingPack(!creatingPack); setNewPackName('') }}
                  className="flex items-center gap-1 text-[10px] font-semibold text-copy-lighter hover:text-copy cursor-pointer bg-transparent border-none transition-colors"
                >
                  {creatingPack ? <X size={10} /> : <><Plus size={10} /> New</>}
                </button>
              </div>

              {creatingPack && (
                <div className="flex gap-1.5 mb-1.5 px-0.5">
                  <input
                    ref={newPackInputRef}
                    type="text"
                    value={newPackName}
                    onChange={(e) => setNewPackName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreatePack()
                      if (e.key === 'Escape') { setCreatingPack(false); setNewPackName('') }
                    }}
                    placeholder="Pack name..."
                    className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg text-[12px] bg-background border border-border text-copy outline-none focus:border-copy-lighter"
                  />
                  <button
                    onClick={handleCreatePack}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-primary text-primary-content border-none cursor-pointer hover:bg-primary-dark"
                  >
                    Add
                  </button>
                </div>
              )}

              <div className="relative" ref={packListRef}>
                <div
                  className="absolute rounded-lg bg-primary/10 pointer-events-none transition-all duration-200 ease-out"
                  style={sliderStyle}
                />
                <div className="relative">
                  <button
                    data-pack-active={!filterPack}
                    onClick={() => setFilterPack(null)}
                    onMouseEnter={(e) => updateSlider(e.currentTarget)}
                    onMouseLeave={() => {
                      const active = packListRef.current?.querySelector('[data-pack-active="true"]')
                      updateSlider(active)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[12px] cursor-pointer border-none bg-transparent transition-colors ${!filterPack ? 'text-primary font-semibold' : 'text-copy-light'}`}
                  >
                    All Packs
                  </button>
                  {packs.map((pack) => (
                    <div
                      key={pack.id}
                      data-pack-active={filterPack === pack.id}
                      onClick={() => setFilterPack(pack.id === filterPack ? null : pack.id)}
                      onMouseEnter={(e) => updateSlider(e.currentTarget)}
                      onMouseLeave={() => {
                        const active = packListRef.current?.querySelector('[data-pack-active="true"]')
                        updateSlider(active)
                      }}
                      className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg text-[12px] cursor-pointer transition-colors ${filterPack === pack.id ? 'text-primary font-semibold' : 'text-copy-light'}`}
                    >
                      <span className="truncate">{pack.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeletePack(pack.id)
                        }}
                        className="opacity-0 group-hover:opacity-60 hover:opacity-100! hover:text-error! p-0.5 bg-transparent border-none cursor-pointer transition-opacity text-copy-lighter shrink-0 ml-2"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {sites.length > 0 && (
              <>
                <div className="border-t border-border px-2" />
                <div className="px-2 pt-2 pb-3">
                  <p className="text-[10px] font-semibold text-copy-lighter px-2 mb-2">Websites</p>
                  <div className="relative max-h-44 overflow-auto" ref={siteListRef}>
                    <div
                      className="absolute rounded-lg bg-primary/10 pointer-events-none transition-all duration-200 ease-out"
                      style={siteSliderStyle}
                    />
                    <div className="relative">
                      <button
                        data-site-active={!filterSite}
                        onClick={() => setFilterSite(null)}
                        onMouseEnter={(e) => updateSiteSlider(e.currentTarget)}
                        onMouseLeave={() => {
                          const active = siteListRef.current?.querySelector('[data-site-active="true"]')
                          updateSiteSlider(active)
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-[12px] cursor-pointer border-none bg-transparent transition-colors ${!filterSite ? 'text-primary font-semibold' : 'text-copy-light'}`}
                      >
                        All Sites
                      </button>
                      {sites.map((site) => (
                        <button
                          key={site}
                          data-site-active={filterSite === site}
                          onClick={() => setFilterSite(site === filterSite ? null : site)}
                          onMouseEnter={(e) => updateSiteSlider(e.currentTarget)}
                          onMouseLeave={() => {
                            const active = siteListRef.current?.querySelector('[data-site-active="true"]')
                            updateSiteSlider(active)
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-[12px] cursor-pointer border-none bg-transparent transition-colors truncate ${filterSite === site ? 'text-primary font-semibold' : 'text-copy-light'}`}
                        >
                          {site}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
