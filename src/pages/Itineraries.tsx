import React, { useEffect, useState } from 'react'
import {
  Map, Plus, Trash2, ChevronDown, ChevronUp, Edit2, Check, X,
  GripVertical, Copy, Clock, Globe,
} from 'lucide-react'
import {
  ItineraryTemplate, ItineraryDay,
  listTemplates, getTemplate, createTemplate, deleteTemplate,
  addDay, deleteDay, duplicateDay, updateDay, reorderDays,
} from '../lib/itineraries'
import { supabase } from '../lib/supabase'
import { useToast } from '../lib/toast'

export default function Itineraries() {
  const toast = useToast()
  const [templates, setTemplates] = useState<ItineraryTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activeTemplate, setActiveTemplate] = useState<ItineraryTemplate | null>(null)
  const [loadingTemplate, setLoadingTemplate] = useState(false)

  async function load() {
    setLoading(true)
    const list = await listTemplates()
    setTemplates(list)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleExpand(id: string) {
    if (expandedId === id) { setExpandedId(null); setActiveTemplate(null); return }
    setExpandedId(id)
    setLoadingTemplate(true)
    const tpl = await getTemplate(id)
    setActiveTemplate(tpl)
    setLoadingTemplate(false)
  }

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Remove "${title}" from the library? Groups that already use a copy of it will not be affected.`)) return
    const { error } = await deleteTemplate(id)
    if (error) { toast.error(error); return }
    toast.success('Template removed')
    if (expandedId === id) { setExpandedId(null); setActiveTemplate(null) }
    await load()
  }

  async function handleAddDay() {
    if (!activeTemplate?.id) return
    const lastNum = (activeTemplate.days?.length || 0)
    const { error } = await addDay(activeTemplate.id + '_TPL', lastNum)
    if (error) {
      // template days have template_id, not itinerary_id — use direct insert
      const { error: e2 } = await supabase.from('itinerary_template_days').insert({
        template_id: activeTemplate.id,
        day_number: lastNum + 1,
        title: 'New Day',
        content: '',
      })
      if (e2) { toast.error(e2.message); return }
    }
    const tpl = await getTemplate(activeTemplate.id)
    setActiveTemplate(tpl)
  }

  async function handleDeleteDay(dayId: string) {
    if (!activeTemplate) return
    if (!window.confirm('Remove this day?')) return
    await supabase.from('itinerary_template_days').delete().eq('id', dayId)
    // renumber
    const { data: days } = await supabase.from('itinerary_template_days').select('id,day_number').eq('template_id', activeTemplate.id).order('day_number')
    for (let i = 0; i < (days || []).length; i++) {
      if ((days![i].day_number) !== i + 1) {
        await supabase.from('itinerary_template_days').update({ day_number: i + 1 }).eq('id', days![i].id)
      }
    }
    const tpl = await getTemplate(activeTemplate.id)
    setActiveTemplate(tpl)
  }

  async function handleDayBlur(dayId: string, patch: Partial<ItineraryDay>) {
    await supabase.from('itinerary_template_days').update(patch).eq('id', dayId)
  }

  async function handleReorder(fromIdx: number, toIdx: number) {
    if (!activeTemplate?.days || fromIdx === toIdx) return
    const days = [...activeTemplate.days]
    const [moved] = days.splice(fromIdx, 1)
    days.splice(toIdx, 0, moved)
    setActiveTemplate({ ...activeTemplate, days })
    for (let i = 0; i < days.length; i++) {
      await supabase.from('itinerary_template_days').update({ day_number: i + 1 }).eq('id', days[i].id)
    }
    const tpl = await getTemplate(activeTemplate.id)
    setActiveTemplate(tpl)
  }

  const dragIdx = React.useRef<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  return (
    <div style={{ padding: 24, background: '#f7f8fa', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 9 }}>
            <Map size={22} color="#534AB7" /> Itinerary Templates
          </h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 3 }}>
            Reusable day-by-day trip plans — apply to any group or client in one click
          </p>
        </div>
        <button onClick={() => setShowNewForm(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#534AB7', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          <Plus size={15} /> New Template
        </button>
      </div>

      {/* New template form */}
      {showNewForm && <NewTemplateForm onSaved={async () => { setShowNewForm(false); await load() }} onCancel={() => setShowNewForm(false)} />}

      {/* Template list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#aaa', fontSize: 13 }}>Loading…</div>
      ) : templates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#aaa', fontSize: 13 }}>
          No templates yet. Click "New Template" to create one.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {templates.map(t => {
            const isExpanded = expandedId === t.id
            return (
              <div key={t.id} style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e5', overflow: 'hidden' }}>
                {/* Template header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer' }}
                  onClick={() => handleExpand(t.id)}>
                  <div style={{ background: '#EEEDFE', borderRadius: 8, padding: 8, flexShrink: 0 }}>
                    <Map size={16} color="#534AB7" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{t.title}</div>
                    <div style={{ fontSize: 11.5, color: '#888', marginTop: 2 }}>
                      {[t.destination, t.duration_label].filter(Boolean).join(' · ')}
                      {t.description && ` — ${t.description.slice(0, 80)}${t.description.length > 80 ? '…' : ''}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, background: '#EEEDFE', color: '#534AB7', borderRadius: 20, padding: '3px 10px', fontWeight: 600 }}>
                      {t.duration_label || '—'}
                    </span>
                    <button onClick={e => { e.stopPropagation(); handleDelete(t.id, t.title) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e0a0a0', padding: '4px 6px', borderRadius: 6 }}
                      title="Remove template">
                      <Trash2 size={14} />
                    </button>
                    {isExpanded ? <ChevronUp size={16} color="#999" /> : <ChevronDown size={16} color="#999" />}
                  </div>
                </div>

                {/* Expanded day editor */}
                {isExpanded && (
                  <div style={{ borderTop: '0.5px solid #f0f0f0', padding: 16 }}>
                    {loadingTemplate ? (
                      <div style={{ padding: 20, textAlign: 'center', color: '#aaa', fontSize: 13 }}>Loading days…</div>
                    ) : (
                      <>
                        {/* Meta fields */}
                        <TemplateMeta template={activeTemplate!} onSave={async patch => {
                          await supabase.from('itinerary_templates').update(patch).eq('id', t.id)
                          await load()
                          const tpl = await getTemplate(t.id)
                          setActiveTemplate(tpl)
                        }} />

                        {/* Days */}
                        <div style={{ marginTop: 14 }}>
                          {(activeTemplate?.days || []).map((day, idx) => (
                            <div key={day.id}
                              draggable
                              onDragStart={() => { dragIdx.current = idx }}
                              onDragOver={e => { e.preventDefault(); setDragOverIdx(idx) }}
                              onDrop={() => { handleReorder(dragIdx.current!, idx); dragIdx.current = null; setDragOverIdx(null) }}
                              style={{
                                border: `1px solid ${dragOverIdx === idx ? '#534AB7' : '#eee'}`,
                                borderRadius: 10, padding: '11px 13px', marginBottom: 7,
                                background: dragOverIdx === idx ? '#F8F7FE' : '#fafafa',
                              }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                                <div style={{ cursor: 'grab', color: '#ccc', paddingTop: 5 }}><GripVertical size={14} /></div>
                                <div style={{ background: '#534AB7', color: '#fff', borderRadius: 6, minWidth: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                                  {day.day_number}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                                    <input defaultValue={day.title} onBlur={e => handleDayBlur(day.id, { title: e.target.value })}
                                      placeholder="Day title"
                                      style={{ flex: 1, minWidth: 160, fontSize: 13, fontWeight: 600, border: 'none', background: 'transparent', outline: 'none' }} />
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                      <Clock size={10} color="#bbb" />
                                      <input defaultValue={day.depart_time || ''} onBlur={e => handleDayBlur(day.id, { depart_time: e.target.value })}
                                        placeholder="08:00" style={{ width: 50, fontSize: 11, border: '0.5px solid #e5e5e5', borderRadius: 5, padding: '2px 5px', outline: 'none' }} />
                                      <span style={{ fontSize: 10, color: '#ccc' }}>→</span>
                                      <input defaultValue={day.return_time || ''} onBlur={e => handleDayBlur(day.id, { return_time: e.target.value })}
                                        placeholder="17:30" style={{ width: 50, fontSize: 11, border: '0.5px solid #e5e5e5', borderRadius: 5, padding: '2px 5px', outline: 'none' }} />
                                    </span>
                                  </div>
                                  <textarea defaultValue={day.content} onBlur={e => handleDayBlur(day.id, { content: e.target.value })}
                                    placeholder="Describe the day…" rows={3}
                                    style={{ width: '100%', fontSize: 12.5, border: '0.5px solid #e8e8e8', borderRadius: 7, padding: '7px 9px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box', background: '#fff' }} />
                                </div>
                                <button onClick={() => handleDeleteDay(day.id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e0a0a0', padding: 3, flexShrink: 0 }}>
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button onClick={handleAddDay}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#534AB7', border: '1px dashed #c8c4ee', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 12.5, width: '100%', justifyContent: 'center', marginTop: 4 }}>
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

// ── Template meta inline editor ──
function TemplateMeta({ template, onSave }: { template: ItineraryTemplate; onSave: (patch: any) => void }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(template.title)
  const [destination, setDestination] = useState(template.destination || '')
  const [duration, setDuration] = useState(template.duration_label || '')
  const [description, setDescription] = useState(template.description || '')

  function save() {
    onSave({ title, destination, duration_label: duration, description })
    setEditing(false)
  }

  if (!editing) return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#f7f8fa', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{template.title}</div>
        <div style={{ fontSize: 11.5, color: '#888', marginTop: 2 }}>{[template.destination, template.duration_label].filter(Boolean).join(' · ')}</div>
        {template.description && <div style={{ fontSize: 11.5, color: '#666', marginTop: 4 }}>{template.description}</div>}
      </div>
      <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 4 }}>
        <Edit2 size={14} />
      </button>
    </div>
  )

  return (
    <div style={{ background: '#f7f8fa', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title"
        style={{ fontSize: 13, fontWeight: 600, border: '0.5px solid #ddd', borderRadius: 6, padding: '6px 9px', outline: 'none' }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Destination (e.g. Holy Land)"
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

// ── New template form ──
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
    toast.success('Template created')
    onSaved()
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #534AB7', padding: 20, marginBottom: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#534AB7', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
        <Plus size={15} /> New Template
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (required)"
          style={{ fontSize: 13, border: '0.5px solid #ddd', borderRadius: 7, padding: '8px 11px', outline: 'none' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Destination"
            style={{ flex: 1, fontSize: 12, border: '0.5px solid #ddd', borderRadius: 7, padding: '8px 11px', outline: 'none' }} />
          <input value={duration} onChange={e => setDuration(e.target.value)} placeholder="Duration (e.g. 10 Days)"
            style={{ width: 140, fontSize: 12, border: '0.5px solid #ddd', borderRadius: 7, padding: '8px 11px', outline: 'none' }} />
        </div>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description (optional)"
          rows={2} style={{ fontSize: 12, border: '0.5px solid #ddd', borderRadius: 7, padding: '8px 11px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
        <div style={{ fontSize: 11, color: '#aaa' }}>After saving, open the template to add days.</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={save} disabled={saving}
            style={{ background: '#534AB7', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            {saving ? 'Saving…' : 'Create Template'}
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
