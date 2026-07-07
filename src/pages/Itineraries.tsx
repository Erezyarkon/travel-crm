import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
  Map, Plus, Trash2, ChevronDown, ChevronUp, Edit2, Check,
  GripVertical, Clock, Search, Copy, CheckCircle2, AlertCircle,
} from 'lucide-react'
import {
  ItineraryTemplate, ItineraryDay,
  listTemplates, getTemplate, createTemplate, deleteTemplate,
} from '../lib/itineraries'
import { supabase } from '../lib/supabase'
import { useToast } from '../lib/toast'

// ── save indicator ────────────────────────────────────────────
type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function SaveBadge({ state }: { state: SaveState }) {
  if (state === 'idle') return null
  const cfg = {
    saving: { icon: <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', border: '2px solid #aaa', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />, label: 'Saving…', color: '#888' },
    saved:  { icon: <CheckCircle2 size={12} />, label: 'Saved', color: '#0F6E56' },
    error:  { icon: <AlertCircle size={12} />,  label: 'Error', color: '#A32D2D' },
  }[state]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: cfg.color, padding: '2px 7px', background: `${cfg.color}15`, borderRadius: 20 }}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

// ── Reorder helpers ───────────────────────────────────────────
async function reorderTemplateDays(templateId: string, orderedIds: string[]) {
  for (let i = 0; i < orderedIds.length; i++) {
    await supabase.from('itinerary_template_days').update({ day_number: i + 1 }).eq('id', orderedIds[i])
  }
}

async function renumberTemplateDays(templateId: string) {
  const { data } = await supabase.from('itinerary_template_days').select('id').eq('template_id', templateId).order('day_number')
  const ids = (data || []).map(d => d.id)
  for (let i = 0; i < ids.length; i++) {
    await supabase.from('itinerary_template_days').update({ day_number: i + 1 }).eq('id', ids[i])
  }
}

// ── Main page ─────────────────────────────────────────────────
export default function Itineraries() {
  const toast = useToast()
  const [templates, setTemplates] = useState<ItineraryTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activeTemplate, setActiveTemplate] = useState<ItineraryTemplate | null>(null)
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const list = await listTemplates()
    setTemplates(list)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = templates.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.destination || '').toLowerCase().includes(search.toLowerCase())
  )

  async function handleExpand(id: string) {
    if (expandedId === id) { setExpandedId(null); setActiveTemplate(null); return }
    setExpandedId(id)
    setLoadingTemplate(true)
    const tpl = await getTemplate(id)
    setActiveTemplate(tpl)
    setLoadingTemplate(false)
  }

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Remove "${title}" from the library? Groups that already use a copy will not be affected.`)) return
    const { error } = await deleteTemplate(id)
    if (error) { toast.error(error); return }
    toast.success('Template removed')
    if (expandedId === id) { setExpandedId(null); setActiveTemplate(null) }
    await load()
  }

  async function refreshActive() {
    if (!activeTemplate?.id) return
    const tpl = await getTemplate(activeTemplate.id)
    setActiveTemplate(tpl)
  }

  async function handleAddDay() {
    if (!activeTemplate?.id) return
    const lastNum = (activeTemplate.days?.length || 0)
    const { error } = await supabase.from('itinerary_template_days').insert({
      template_id: activeTemplate.id,
      day_number: lastNum + 1,
      title: 'New Day',
      content: '',
    })
    if (error) { toast.error(error.message); return }
    await refreshActive()
  }

  async function handleDuplicateDay(day: ItineraryDay) {
    if (!activeTemplate?.id) return
    const lastNum = (activeTemplate.days?.length || 0)
    await supabase.from('itinerary_template_days').insert({
      template_id: activeTemplate.id,
      day_number: lastNum + 1,
      title: `${day.title} (Copy)`,
      content: day.content,
      depart_time: day.depart_time,
      return_time: day.return_time,
    })
    await refreshActive()
  }

  async function handleDeleteDay(dayId: string) {
    if (!activeTemplate) return
    if (!window.confirm('Remove this day?')) return
    await supabase.from('itinerary_template_days').delete().eq('id', dayId)
    await renumberTemplateDays(activeTemplate.id)
    await refreshActive()
  }

  async function handleDayReorder(fromIdx: number, toIdx: number) {
    if (!activeTemplate?.days || fromIdx === toIdx) return
    const days = [...activeTemplate.days]
    const [moved] = days.splice(fromIdx, 1)
    days.splice(toIdx, 0, moved)
    setActiveTemplate({ ...activeTemplate, days })
    await reorderTemplateDays(activeTemplate.id, days.map(d => d.id))
    await refreshActive()
  }

  return (
    <div style={{ padding: 24, background: '#f7f8fa', minHeight: '100vh' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 9 }}>
            <Map size={22} color="#534AB7" /> Itinerary Templates
          </h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 3 }}>
            {templates.length} template{templates.length !== 1 ? 's' : ''} · apply to any group or client in one click
          </p>
        </div>
        <button onClick={() => setShowNewForm(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#534AB7', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          <Plus size={15} /> New Template
        </button>
      </div>

      {/* Search */}
      {templates.length > 2 && (
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates…"
            style={{ width: '100%', padding: '9px 12px 9px 32px', border: '0.5px solid #e0e0e0', borderRadius: 9, fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
        </div>
      )}

      {/* New template form */}
      {showNewForm && (
        <NewTemplateForm
          onSaved={async () => { setShowNewForm(false); await load() }}
          onCancel={() => setShowNewForm(false)}
        />
      )}

      {/* Template list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#aaa', fontSize: 13 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#aaa', fontSize: 13 }}>
          {search ? `No templates match "${search}"` : 'No templates yet. Click "New Template" to create one.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(t => {
            const isExpanded = expandedId === t.id
            return (
              <div key={t.id} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${isExpanded ? '#534AB7' : '#e5e5e5'}`, overflow: 'hidden', transition: 'border-color 0.15s' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer' }}
                  onClick={() => handleExpand(t.id)}>
                  <div style={{ background: '#EEEDFE', borderRadius: 8, padding: 8, flexShrink: 0 }}>
                    <Map size={16} color="#534AB7" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{t.title}</div>
                    <div style={{ fontSize: 11.5, color: '#888', marginTop: 2 }}>
                      {[t.destination, t.duration_label].filter(Boolean).join(' · ')}
                      {t.description && ` · ${t.description.slice(0, 70)}${t.description.length > 70 ? '…' : ''}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, background: '#EEEDFE', color: '#534AB7', borderRadius: 20, padding: '3px 10px', fontWeight: 600 }}>
                      {t.duration_label || '—'}
                    </span>
                    <button onClick={e => { e.stopPropagation(); handleDelete(t.id, t.title) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e0a0a0', padding: '4px 6px', borderRadius: 6 }}>
                      <Trash2 size={14} />
                    </button>
                    {isExpanded ? <ChevronUp size={16} color="#534AB7" /> : <ChevronDown size={16} color="#999" />}
                  </div>
                </div>

                {/* Editor */}
                {isExpanded && (
                  <div style={{ borderTop: '0.5px solid #f0f0f0', padding: 16 }}>
                    {loadingTemplate ? (
                      <div style={{ padding: 20, textAlign: 'center', color: '#aaa', fontSize: 13 }}>Loading…</div>
                    ) : (
                      <>
                        <TemplateMeta template={activeTemplate!} onSave={async patch => {
                          await supabase.from('itinerary_templates').update(patch).eq('id', t.id)
                          await load()
                          const tpl = await getTemplate(t.id)
                          setActiveTemplate(tpl)
                        }} />
                        <div style={{ marginTop: 14 }}>
                          {(activeTemplate?.days || []).map((day, idx) => (
                            <DayRow
                              key={day.id}
                              day={day}
                              idx={idx}
                              total={(activeTemplate?.days || []).length}
                              onReorder={handleDayReorder}
                              onDelete={() => handleDeleteDay(day.id)}
                              onDuplicate={() => handleDuplicateDay(day)}
                              onSave={async patch => {
                                const { error } = await supabase.from('itinerary_template_days').update(patch).eq('id', day.id)
                                return error ? error.message : null
                              }}
                            />
                          ))}
                        </div>
                        <button onClick={handleAddDay}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#534AB7', border: '1px dashed #c8c4ee', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 12.5, width: '100%', justifyContent: 'center', marginTop: 8 }}>
                          <Plus size={13} /> Add Day
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── DayRow — with drag handle, auto-save, duplicate ──────────
function DayRow({ day, idx, total, onReorder, onDelete, onDuplicate, onSave }: {
  day: ItineraryDay
  idx: number
  total: number
  onReorder: (from: number, to: number) => void
  onDelete: () => void
  onDuplicate: () => void
  onSave: (patch: Partial<ItineraryDay>) => Promise<string | null>
}) {
  const dragRef = useRef<boolean>(false)
  const [dragOver, setDragOver] = useState(false)
  const [save, setSave] = useState<SaveState>('idle')

  async function autosave(patch: Partial<ItineraryDay>) {
    setSave('saving')
    const err = await onSave(patch)
    setSave(err ? 'error' : 'saved')
    setTimeout(() => setSave('idle'), 2000)
  }

  return (
    <div
      draggable
      onDragStart={() => { dragRef.current = true }}
      onDragEnd={() => { dragRef.current = false }}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); if (dragRef.current) return }}
      style={{
        border: `1px solid ${dragOver ? '#534AB7' : '#eee'}`,
        borderRadius: 10, padding: '11px 13px', marginBottom: 7,
        background: dragOver ? '#F8F7FE' : '#fafafa',
        transition: 'background 0.15s, border-color 0.15s',
      }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>

        {/* Drag handle */}
        <div
          style={{ cursor: 'grab', color: '#ccc', paddingTop: 6, flexShrink: 0 }}
          onMouseDown={e => { e.stopPropagation() }}>
          <GripVertical size={14} />
        </div>

        {/* Day number badge */}
        <div style={{ background: '#534AB7', color: '#fff', borderRadius: 6, minWidth: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
          {day.day_number}
        </div>

        {/* Fields */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
            <input
              key={`title-${day.id}`}
              defaultValue={day.title}
              onBlur={e => autosave({ title: e.target.value })}
              placeholder="Day title"
              style={{ flex: 1, minWidth: 160, fontSize: 13, fontWeight: 600, border: 'none', background: 'transparent', outline: 'none', padding: '2px 0' }}
            />
            <SaveBadge state={save} />
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
              <Clock size={10} color="#bbb" />
              <input
                key={`depart-${day.id}`}
                defaultValue={day.depart_time || ''}
                onBlur={e => autosave({ depart_time: e.target.value || null })}
                placeholder="08:00"
                style={{ width: 50, fontSize: 11, border: '0.5px solid #e5e5e5', borderRadius: 5, padding: '2px 5px', outline: 'none' }}
              />
              <span style={{ fontSize: 10, color: '#ccc' }}>→</span>
              <input
                key={`return-${day.id}`}
                defaultValue={day.return_time || ''}
                onBlur={e => autosave({ return_time: e.target.value || null })}
                placeholder="17:30"
                style={{ width: 50, fontSize: 11, border: '0.5px solid #e5e5e5', borderRadius: 5, padding: '2px 5px', outline: 'none' }}
              />
            </span>
          </div>
          <textarea
            key={`content-${day.id}`}
            defaultValue={day.content}
            onBlur={e => autosave({ content: e.target.value })}
            placeholder="Describe the day — sites, meals, notes…"
            rows={3}
            style={{ width: '100%', fontSize: 12.5, color: '#444', border: '0.5px solid #e8e8e8', borderRadius: 7, padding: '7px 9px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box', background: '#fff' }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
          <button onClick={onDuplicate} title="Duplicate day"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: 3 }}>
            <Copy size={13} />
          </button>
          <button onClick={onDelete} title="Delete day"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e0a0a0', padding: 3 }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Template meta editor ──────────────────────────────────────
function TemplateMeta({ template, onSave }: { template: ItineraryTemplate; onSave: (patch: any) => void }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(template.title)
  const [destination, setDestination] = useState(template.destination || '')
  const [duration, setDuration] = useState(template.duration_label || '')
  const [description, setDescription] = useState(template.description || '')

  function save() { onSave({ title, destination, duration_label: duration, description }); setEditing(false) }

  if (!editing) return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#f7f8fa', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{template.title}</div>
        <div style={{ fontSize: 11.5, color: '#888', marginTop: 2 }}>
          {[template.destination, template.duration_label].filter(Boolean).join(' · ')}
        </div>
        {template.description && <div style={{ fontSize: 11.5, color: '#666', marginTop: 4 }}>{template.description}</div>}
      </div>
      <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#534AB7', padding: 4, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
        <Edit2 size={13} /> Edit details
      </button>
    </div>
  )

  return (
    <div style={{ background: '#f7f8fa', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title"
        style={{ fontSize: 13, fontWeight: 600, border: '0.5px solid #ddd', borderRadius: 6, padding: '6px 9px', outline: 'none' }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Destination"
          style={{ flex: 1, fontSize: 12, border: '0.5px solid #ddd', borderRadius: 6, padding: '6px 9px', outline: 'none' }} />
        <input value={duration} onChange={e => setDuration(e.target.value)} placeholder="Duration (e.g. 12 Days)"
          style={{ width: 120, fontSize: 12, border: '0.5px solid #ddd', borderRadius: 6, padding: '6px 9px', outline: 'none' }} />
      </div>
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description"
        rows={2} style={{ fontSize: 12, border: '0.5px solid #ddd', borderRadius: 6, padding: '6px 9px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={save} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#534AB7', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
          <Check size={13} /> Save
        </button>
        <button onClick={() => setEditing(false)} style={{ background: '#fff', color: '#888', border: '0.5px solid #ddd', borderRadius: 7, padding: '7px 12px', cursor: 'pointer', fontSize: 12 }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── New template form ─────────────────────────────────────────
function NewTemplateForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [destination, setDestination] = useState('')
  const [duration, setDuration] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!title.trim()) { toast.error('Title is required'); return }
    setSaving(true)
    const { error } = await createTemplate({ title, destination, duration_label: duration, description, days: [] })
    setSaving(false)
    if (error) { toast.error(error); return }
    toast.success('Template created — open it to add days')
    onSaved()
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #534AB7', padding: 20, marginBottom: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#534AB7', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
        <Plus size={15} /> New Template
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (required)" autoFocus
          style={{ fontSize: 13, border: '0.5px solid #ddd', borderRadius: 7, padding: '8px 11px', outline: 'none' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Destination (e.g. Holy Land)"
            style={{ flex: 1, fontSize: 12, border: '0.5px solid #ddd', borderRadius: 7, padding: '8px 11px', outline: 'none' }} />
          <input value={duration} onChange={e => setDuration(e.target.value)} placeholder="Duration (e.g. 12 Days)"
            style={{ width: 150, fontSize: 12, border: '0.5px solid #ddd', borderRadius: 7, padding: '8px 11px', outline: 'none' }} />
        </div>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description (optional)"
          rows={2} style={{ fontSize: 12, border: '0.5px solid #ddd', borderRadius: 7, padding: '8px 11px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={save} disabled={saving}
            style={{ background: '#534AB7', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', cursor: saving ? 'default' : 'pointer', fontWeight: 600, fontSize: 13, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Creating…' : 'Create Template'}
          </button>
          <button onClick={onCancel}
            style={{ background: '#fff', color: '#888', border: '0.5px solid #ddd', borderRadius: 8, padding: '9px 14px', cursor: 'pointer', fontSize: 13 }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
