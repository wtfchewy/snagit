import { useState, useEffect, useRef, useCallback } from 'react'
import { LogOut, Filter, X, ChevronDown, Plus, Trash2, Search, ArrowRight, Check } from 'lucide-react'
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
  const filterPanelRef = useRef(null)
  const filterInputRef = useRef(null)
  const newPackInputRef = useRef(null)
  const [filterQuery, setFilterQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

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
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter popup: close on click outside, Escape, and Cmd+F toggle
  useEffect(() => {
    if (!showFilter) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowFilter(false)
        setCreatingPack(false)
        setNewPackName('')
      }
    }

    const handleClickOutside = (e) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target)) {
        setShowFilter(false)
        setCreatingPack(false)
        setNewPackName('')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFilter])

  // Reset state when filter popup opens
  useEffect(() => {
    if (showFilter) {
      setFilterQuery('')
      setSelectedIndex(0)
      setCreatingPack(false)
      setNewPackName('')
      setTimeout(() => filterInputRef.current?.focus(), 0)
    }
  }, [showFilter])

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

  // Build filtered items for the popup
  const filteredPacks = packs.filter((p) =>
    !filterQuery.trim() || p.name.toLowerCase().includes(filterQuery.toLowerCase())
  )
  const filteredSites = sites.filter((s) =>
    !filterQuery.trim() || s.toLowerCase().includes(filterQuery.toLowerCase())
  )

  const totalItems = filteredPacks.length + filteredSites.length

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [totalItems])

  const handleFilterSelect = (type, value) => {
    if (type === 'pack') {
      setFilterPack(value === filterPack ? null : value)
    } else {
      setFilterSite(value === filterSite ? null : value)
    }
    setShowFilter(false)
  }

  const handleFilterInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, totalItems - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && totalItems > 0) {
      e.preventDefault()
      if (selectedIndex < filteredPacks.length) {
        handleFilterSelect('pack', filteredPacks[selectedIndex].id)
      } else {
        handleFilterSelect('site', filteredSites[selectedIndex - filteredPacks.length])
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Canvas filterPack={filterPack} filterSite={filterSite} />

      {/* Top-left: Logo */}
      <div className="fixed top-6 left-6 z-50">
        <img src="/dark.svg" alt="" className="h-10 drop-shadow-lg cursor-pointer hover:drop-shadow-2xl hover:-rotate-5 hover:scale-105 transition-all duration-300" />
      </div>

      {/* Top-right: User dropdown */}
      <div className="fixed top-6 right-6 z-50 pointer-events-none" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center hover:opacity-80 transition-opacity cursor-pointer border border-border bg-foreground/80 backdrop-blur-md rounded-xl shadow-lg shadow-black/20 pointer-events-auto"
        >
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              className="w-9 h-9 rounded-lg"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              {user?.displayName?.[0] || '?'}
            </div>
          )}
          <div className='px-3'>
            <ChevronDown
              size={16}
              className={`text-copy-lighter transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
            />
          </div>
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

      {/* Bottom-right: Filter trigger */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer border transition-all shadow-lg shadow-black/20 backdrop-blur-md ${hasActiveFilter
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
      </div>

      {/* Filter popup overlay */}
      {showFilter && (
        <div className="bg-black/50 w-full h-screen flex items-start justify-center pt-[20vh] z-9999 fixed inset-0">
          <div ref={filterPanelRef} className="bg-foreground border border-border w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden">
            {/* Search input */}
            <div className="relative border-b border-border">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-copy-lighter" />
              <input
                ref={filterInputRef}
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                onKeyDown={handleFilterInputKeyDown}
                placeholder="Search packs and sites..."
                className="w-full h-11 bg-transparent px-2 pl-10 pr-14 text-sm text-copy placeholder:text-copy-lighter focus:outline-none"
              />
              {hasActiveFilter && (
                <button
                  onClick={() => { setFilterPack(null); setFilterSite(null) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-copy-lighter hover:text-copy bg-transparent border-none cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-[500px] overflow-y-auto">
              {totalItems > 0 || creatingPack ? (
                <div className="p-2">
                  {/* Packs section */}
                  {(filteredPacks.length > 0 || creatingPack) && (
                    <>
                      <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
                        <span className="text-[13px] font-semibold text-copy-lighter">Packs</span>
                        <button
                          onClick={() => { setCreatingPack(!creatingPack); setNewPackName('') }}
                          className="flex items-center gap-1 text-[11px] font-medium text-copy-lighter hover:text-copy cursor-pointer bg-transparent border-none transition-colors"
                        >
                          {creatingPack ? <X size={10} /> : <><Plus size={10} /> New</>}
                        </button>
                      </div>

                      {creatingPack && (
                        <div className="flex gap-1.5 mb-1 mx-1">
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

                      {filteredPacks.map((pack, idx) => {
                        const isActive = filterPack === pack.id
                        const isSelected = idx === selectedIndex
                        return (
                          <button
                            key={pack.id}
                            onClick={() => handleFilterSelect('pack', pack.id)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`group rounded-xl w-full flex items-center gap-3 px-3 py-2 text-[15px] text-left cursor-pointer ${isSelected ? 'bg-primary text-primary-content' : isActive ? 'bg-primary text-primary-content' : 'text-copy hover:bg-border'}`}
                          >
                            <span className={`truncate font-medium ${isSelected || isActive ? 'text-primary-content' : 'text-copy-light'}`}>{pack.name}</span>
                            <div className="ml-auto flex items-center gap-2">
                              {isActive && (
                                <Check size={16} className={isSelected || isActive ? 'text-primary-content' : 'text-primary'} />
                              )}
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${isSelected ? 'bg-primary-content/20' : ''}`}>{isSelected ? (isActive ? 'Remove' : 'Apply') : ''}</span>
                              <ArrowRight size={18} className={`rounded-md p-0.5 shrink-0 ${isSelected || isActive ? 'bg-primary-content text-primary' : 'bg-copy-light text-foreground'}`} />
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeletePack(pack.id)
                              }}
                              className={`opacity-0 group-hover:opacity-60 hover:opacity-100! p-1 bg-transparent border-none cursor-pointer shrink-0 ${isSelected || isActive ? 'text-primary-content hover:text-primary-content!' : 'text-copy-lighter hover:text-error!'}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </button>
                        )
                      })}
                    </>
                  )}

                  {/* Sites section */}
                  {filteredSites.length > 0 && (
                    <>
                      {filteredPacks.length > 0 && <div className="mx-3 my-1.5 border-t border-border" />}
                      <div className="px-4 pt-3 pb-1.5 text-[13px] font-semibold text-copy-lighter">Websites</div>
                      {filteredSites.map((site, idx) => {
                        const globalIdx = filteredPacks.length + idx
                        const isActive = filterSite === site
                        const isSelected = globalIdx === selectedIndex
                        return (
                          <button
                            key={site}
                            onClick={() => handleFilterSelect('site', site)}
                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                            className={`rounded-xl w-full flex items-center gap-3 px-3 py-2 text-[15px] text-left cursor-pointer ${isSelected ? 'bg-primary text-primary-content' : isActive ? 'bg-primary text-primary-content' : 'text-copy hover:bg-border'}`}
                          >
                            <span className={`truncate font-medium ${isSelected || isActive ? 'text-primary-content' : 'text-copy-light'}`}>{site}</span>
                            <div className="ml-auto flex items-center gap-2">
                              {isActive && (
                                <Check size={16} className={isSelected || isActive ? 'text-primary-content' : 'text-primary'} />
                              )}
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${isSelected ? 'bg-primary-content/20' : ''}`}>{isSelected ? (isActive ? 'Remove' : 'Apply') : ''}</span>
                              <ArrowRight size={18} className={`rounded-md p-0.5 shrink-0 ${isSelected || isActive ? 'bg-primary-content text-primary' : 'bg-copy-light text-foreground'}`} />
                            </div>
                          </button>
                        )
                      })}
                    </>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-copy-lighter">
                  {filterQuery ? 'No results found' : 'No packs or sites yet'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
