import React, { useEffect, useState, useRef } from 'react'
import {
  Map, Plus, Trash2, Copy, GripVertical, ChevronDown, ChevronUp, X,
  Clock, Library, Sparkles, Printer,
} from 'lucide-react'
import {
  ClientItinerary, ItineraryDay, ItineraryTemplate,
  getItineraryForGroup, listTemplates, applyTemplateToGroup, createBlankItinerary,
  addDay, deleteDay, duplicateDay, updateDay, reorderDays, updateItineraryMeta, dayDate,
} from '../lib/itineraries'
import { useToast } from '../lib/toast'
import { getCachedSettings } from '../lib/companySettings'

interface Props {
  groupId: string
  groupName: string
}

export default function GroupItineraryPanel({ groupId, groupName }: Props) {
  const toast = useToast()
  const [itinerary, setItinerary] = useState<ClientItinerary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [showPrint, setShowPrint] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const dragIdx = useRef<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    const it = await getItineraryForGroup(groupId)
    setItinerary(it)
    setLoading(false)
  }
  useEffect(() => { load() }, [groupId])

  async function handlePickTemplate(templateId: string) {
    const { error } = await applyTemplateToGroup(templateId, groupId)
    if (error) { toast.error(error); return }
    toast.success('Itinerary applied — now fully editable')
    setShowTemplatePicker(false)
    await load()
  }

  async function handleBlank() {
    const { error } = await createBlankItinerary(groupId, `${groupName} — Itinerary`)
    if (error) { toast.error(error); return }
    setShowTemplatePicker(false)
    await load()
  }

  async function handleAddDay() {
    if (!itinerary) return
    const lastDayNum = itinerary.days && itinerary.days.length > 0 ? itinerary.days[itinerary.days.length - 1].day_number : 0
    const { error } = await addDay(itinerary.id, lastDayNum)
    if (error) { toast.error(error); return }
    await load()
  }

  async function handleDeleteDay(dayId: string) {
    if (!itinerary) return
    if (!window.confirm('Remove this day? Remaining days will renumber automatically.')) return
    const { error } = await deleteDay(itinerary.id, dayId)
    if (error) { toast.error(error); return }
    await load()
  }

  async function handleDuplicateDay(dayId: string) {
    if (!itinerary) return
    const { error } = await duplicateDay(itinerary.id, dayId)
    if (error) { toast.error(error); return }
    await load()
  }

  async function handleDayBlur(dayId: string, patch: Partial<ItineraryDay>) {
    await updateDay(dayId, patch)
  }

  // ---- Drag and drop reordering ----
  function onDragStart(idx: number) { dragIdx.current = idx }
  function onDragOver(e: React.DragEvent, idx: number) { e.preventDefault(); setDragOverIdx(idx) }
  async function onDrop(idx: number) {
    if (!itinerary?.days || dragIdx.current === null || dragIdx.current === idx) { setDragOverIdx(null); return }
    const days = [...itinerary.days]
    const [moved] = days.splice(dragIdx.current, 1)
    days.splice(idx, 0, moved)
    setItinerary({ ...itinerary, days })
    dragIdx.current = null
    setDragOverIdx(null)
    await reorderDays(itinerary.id, days.map(d => d.id))
    await load()
  }

  if (loading) return <div style={{ padding: 16, color: '#aaa', fontSize: 13 }}>Loading itinerary…</div>

  return (
    <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: '12px 16px', borderBottom: expanded ? '0.5px solid #f0f0f0' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}>
        <span style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
          <Map size={15} color="#534AB7" /> Itinerary
          {itinerary?.days && <span style={{ fontSize: 11, color: '#aaa', fontWeight: 400 }}>({itinerary.days.length} days)</span>}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {itinerary && (
            <button onClick={e => { e.stopPropagation(); setShowPrint(true) }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f0f4f8', color: '#1a2a3a', border: 'none', borderRadius: 7, padding: '6px 11px', cursor: 'pointer', fontSize: 11.5, fontWeight: 600 }}>
              <Printer size={12} /> Print / Share
            </button>
          )}
          {expanded ? <ChevronUp size={16} color="#999" /> : <ChevronDown size={16} color="#999" />}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: 16 }}>
          {!itinerary ? (
            <div style={{ textAlign: 'center', padding: '28px 16px' }}>
              <Sparkles size={26} color="#cdcdcd" style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 13, color: '#888', marginBottom: 14 }}>No itinerary yet for this group.</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button onClick={() => setShowTemplatePicker(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#534AB7', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 12.5 }}>
                  <Library size={14} /> Choose from Library
                </button>
                <button onClick={handleBlank}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#555', border: '0.5px solid #d0d0d0', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontWeight: 500, fontSize: 12.5 }}>
                  <Plus size={14} /> Start Blank
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Itinerary meta */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
                <input defaultValue={itinerary.title} onBlur={e => updateItineraryMeta(itinerary.id, { title: e.target.value })}
                  style={{ flex: 1, fontSize: 14, fontWeight: 600, border: 'none', borderBottom: '1px solid transparent', padding: '4px 2px', outline: 'none' }}
                  onFocus={e => e.target.style.borderBottomColor = '#ddd'} onBlurCapture={e => e.target.style.borderBottomColor = 'transparent'} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 11, color: '#999' }}>Start date</span>
                  <input type="date" defaultValue={itinerary.start_date || ''} onBlur={e => updateItineraryMeta(itinerary.id, { start_date: e.target.value || null })}
                    style={{ fontSize: 12, border: '0.5px solid #ddd', borderRadius: 6, padding: '5px 7px', outline: 'none' }} />
                </div>
              </div>

              {/* Days list — drag to reorder */}
              <div>
                {(itinerary.days || []).map((day, idx) => {
                  const computedDate = dayDate(itinerary.start_date, day.day_number)
                  const isDragOver = dragOverIdx === idx
                  return (
                    <div key={day.id}
                      draggable
                      onDragStart={() => onDragStart(idx)}
                      onDragOver={e => onDragOver(e, idx)}
                      onDrop={() => onDrop(idx)}
                      style={{
                        border: `1px solid ${isDragOver ? '#534AB7' : '#eee'}`,
                        borderRadius: 10, padding: '12px 14px', marginBottom: 8,
                        background: isDragOver ? '#F8F7FE' : '#fafafa',
                        transition: 'background 0.15s, border-color 0.15s',
                      }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ cursor: 'grab', color: '#ccc', paddingTop: 6 }}><GripVertical size={15} /></div>
                        <div style={{ background: '#534AB7', color: '#fff', borderRadius: 7, minWidth: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
                          {day.day_number}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                            <input defaultValue={day.title} onBlur={e => handleDayBlur(day.id, { title: e.target.value })}
                              placeholder="Day title"
                              style={{ flex: 1, minWidth: 160, fontSize: 13.5, fontWeight: 600, border: 'none', background: 'transparent', outline: 'none', padding: '2px 0' }} />
                            {computedDate && (
                              <span style={{ fontSize: 10.5, color: '#888', background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 5, padding: '2px 6px' }}>
                                {new Date(computedDate).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}
                              </span>
                            )}
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={11} color="#bbb" />
                              <input defaultValue={day.depart_time || ''} onBlur={e => handleDayBlur(day.id, { depart_time: e.target.value })}
                                placeholder="08:00" style={{ width: 52, fontSize: 11, border: '0.5px solid #e5e5e5', borderRadius: 5, padding: '3px 5px', outline: 'none' }} />
                              <span style={{ fontSize: 10, color: '#ccc' }}>→</span>
                              <input defaultValue={day.return_time || ''} onBlur={e => handleDayBlur(day.id, { return_time: e.target.value })}
                                placeholder="17:30" style={{ width: 52, fontSize: 11, border: '0.5px solid #e5e5e5', borderRadius: 5, padding: '3px 5px', outline: 'none' }} />
                            </span>
                          </div>
                          <textarea defaultValue={day.content} onBlur={e => handleDayBlur(day.id, { content: e.target.value })}
                            placeholder="Describe the day — sites, meals, notes…"
                            rows={3}
                            style={{ width: '100%', fontSize: 12.5, color: '#444', border: '0.5px solid #e8e8e8', borderRadius: 7, padding: '8px 10px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box', background: '#fff' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <button onClick={() => handleDuplicateDay(day.id)} title="Duplicate day"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: 3 }}>
                            <Copy size={14} />
                          </button>
                          <button onClick={() => handleDeleteDay(day.id)} title="Delete day"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e0a0a0', padding: 3 }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <button onClick={handleAddDay}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#534AB7', border: '1px dashed #c8c4ee', borderRadius: 8, padding: '9px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 12.5, width: '100%', justifyContent: 'center', marginTop: 4 }}>
                <Plus size={14} /> Add Day
              </button>
            </>
          )}
        </div>
      )}

      {showTemplatePicker && <TemplatePickerModal onPick={handlePickTemplate} onBlank={handleBlank} onClose={() => setShowTemplatePicker(false)} />}
      {showPrint && itinerary && <ItineraryPrintModal itinerary={itinerary} groupName={groupName} onClose={() => setShowPrint(false)} />}
    </div>
  )
}

// ============================================================
// Template picker
// ============================================================
function TemplatePickerModal({ onPick, onBlank, onClose }: { onPick: (id: string) => void; onBlank: () => void; onClose: () => void }) {
  const [templates, setTemplates] = useState<ItineraryTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listTemplates().then(t => { setTemplates(t); setLoading(false) })
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 14, width: 720, maxWidth: '92vw', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}><Library size={16} color="#534AB7" /> Itinerary Library</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa' }}><X size={18} /></button>
        </div>
        <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#aaa', fontSize: 13 }}>Loading…</div>
          ) : templates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#aaa', fontSize: 13 }}>No templates yet.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {templates.map(t => (
                <div key={t.id} onClick={() => onPick(t.id)}
                  style={{ border: '1px solid #eee', borderRadius: 10, padding: 14, cursor: 'pointer', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#534AB7')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#eee')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700 }}>{t.title}</span>
                    <span style={{ fontSize: 10, background: '#EEEDFE', color: '#534AB7', borderRadius: 20, padding: '2px 8px', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 8 }}>{t.duration_label}</span>
                  </div>
                  {t.destination && <div style={{ fontSize: 11, color: '#999', marginBottom: 6 }}>{t.destination}</div>}
                  {t.description && <div style={{ fontSize: 11.5, color: '#666', lineHeight: 1.4 }}>{t.description}</div>}
                  {t.highlights && t.highlights.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                      {t.highlights.slice(0, 3).map((h, i) => (
                        <span key={i} style={{ fontSize: 9.5, background: '#f5f5f5', color: '#777', borderRadius: 10, padding: '2px 7px' }}>{h}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '0.5px solid #eee' }}>
          <button onClick={onBlank} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#555', border: '0.5px solid #d0d0d0', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 500, fontSize: 12.5 }}>
            <Plus size={14} /> Or start from a blank itinerary
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Print / share modal
// ============================================================
function ItineraryPrintModal({ itinerary, groupName, onClose }: { itinerary: ClientItinerary; groupName: string; onClose: () => void }) {
  const company = getCachedSettings()
  const [showPrices, setShowPrices] = useState(false) // itineraries don't carry prices themselves, but kept for future per-day cost rows

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '30px 16px' }}>
      <div style={{ background: '#fff', borderRadius: 8, width: 800, maxWidth: '100%' }}>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '0.5px solid #eee' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555', cursor: 'pointer' }}>
            <input type="checkbox" checked={showPrices} onChange={e => setShowPrices(e.target.checked)} />
            Include prices
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => window.print()} style={{ padding: '8px 16px', background: '#f5c842', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>🖨 Print / Save PDF</button>
            <button onClick={onClose} style={{ padding: '8px 14px', background: '#fff', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>✕ Close</button>
          </div>
        </div>

        <div style={{ direction: 'ltr', padding: '36px 44px', fontFamily: 'Georgia, serif' }}>
          <div style={{ textAlign: 'center', marginBottom: 26, borderBottom: `2px solid ${company.company_name ? '#1a2a3a' : '#1a2a3a'}`, paddingBottom: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1a2a3a', letterSpacing: 0.5 }}>{itinerary.title}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{groupName} · {company.company_name}</div>
          </div>
          {(itinerary.days || []).map(day => {
            const date = dayDate(itinerary.start_date, day.day_number)
            return (
              <div key={day.id} style={{ marginBottom: 20, pageBreakInside: 'avoid' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                  <span style={{ background: '#1a2a3a', color: '#f5c842', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>DAY {day.day_number}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#1a2a3a' }}>{day.title}</span>
                  {date && <span style={{ fontSize: 11, color: '#999' }}>{new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</span>}
                </div>
                {(day.depart_time || day.return_time) && (
                  <div style={{ fontSize: 11, color: '#854F0B', marginBottom: 6, fontWeight: 600 }}>
                    {day.depart_time && `Depart ${day.depart_time}`}{day.depart_time && day.return_time ? ' — ' : ''}{day.return_time && `Return ${day.return_time}`}
                  </div>
                )}
                <div style={{ fontSize: 12.5, color: '#333', lineHeight: 1.7 }}>{day.content}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
