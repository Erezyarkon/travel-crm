import React, { useState } from 'react'
import { BedDouble, Plus, Trash2, Copy, Download, Save, Upload } from 'lucide-react'
import { Room, emptyRoom, exportRoomingList, importRoomingList } from '../lib/rooming'
import { updateGroup } from '../lib/groups'
import { useToast } from '../lib/toast'

export default function GroupRoomingPanel({ group, onSaved }: { group: any; onSaved?: (rooms: Room[], guideDriver: string) => void }) {
  const toast = useToast()
  const [rooms, setRooms] = useState<Room[]>(() => Array.isArray(group.rooming) ? group.rooming : [])
  const [guideDriver, setGuideDriver] = useState<string>(group.guide_driver || '')
  const [busy, setBusy] = useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const { rooms: imported, guideDriver: gd, error } = await importRoomingList(file)
    if (e.target) e.target.value = ''  // allow re-importing same file
    if (error) { toast.error('Could not read the file'); return }
    if (imported.length === 0) { toast.error('No rooms found in the file'); return }
    if (rooms.length > 0 && !window.confirm(`Replace the current ${rooms.length} room(s) with ${imported.length} from the file?`)) return
    setRooms(imported)
    if (gd) setGuideDriver(gd)
    toast.success(`Imported ${imported.length} rooms`)
  }

  function setRoom(i: number, patch: Partial<Room>) {
    setRooms(rs => rs.map((r, j) => j === i ? { ...r, ...patch } : r))
  }
  function addRoom() {
    setRooms(rs => [...rs, emptyRoom({
      arrival: group.start_date || '', departure: group.end_date || '',
      nationality: rs[rs.length - 1]?.nationality || '',
    })])
  }
  function dupRoom(i: number) { setRooms(rs => [...rs.slice(0, i + 1), { ...rs[i] }, ...rs.slice(i + 1)]) }
  function removeRoom(i: number) {
    if (!window.confirm('Remove this room?')) return
    setRooms(rs => rs.filter((_, j) => j !== i))
  }

  async function save() {
    setBusy(true)
    const { error } = await updateGroup(group.id, { rooming: rooms as any, guide_driver: guideDriver } as any)
    setBusy(false)
    if (error) { toast.error('Could not save rooming list'); return }
    toast.success('Rooming list saved')
    onSaved?.(rooms, guideDriver)
  }

  async function doExport() {
    try {
      await exportRoomingList({ ...group, guide_driver: guideDriver }, rooms)
      toast.success('Rooming list exported')
    } catch (e) {
      toast.error('Export failed')
    }
  }

  const totalPax = rooms.reduce((s, r) => s + (Number(r.adult) || 0) + (Number(r.junior) || 0) + (Number(r.children) || 0) + (Number(r.infant) || 0), 0)

  const inp: React.CSSProperties = { width: '100%', padding: '5px 7px', border: '0.5px solid #d8d8d8', borderRadius: 6, fontSize: 12, outline: 'none', boxSizing: 'border-box', background: '#fff' }
  const cellNum: React.CSSProperties = { ...inp, textAlign: 'center', padding: '5px 3px' }
  const th: React.CSSProperties = { fontSize: 9.5, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.3, padding: '6px 4px', textAlign: 'left', whiteSpace: 'nowrap' }

  return (
    <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: 12, padding: 18, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}>
          <BedDouble size={16} color="#185FA5" /> Rooming List
          <span style={{ fontSize: 11, color: '#999', fontWeight: 400 }}>· {rooms.length} rooms · {totalPax} pax</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleImport} style={{ display: 'none' }} />
          <button onClick={() => fileRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fff', color: '#185FA5', border: '0.5px solid #9DC3E8', borderRadius: 8, padding: '7px 13px', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
            <Upload size={13} /> Import from Excel
          </button>
          <button onClick={doExport} disabled={rooms.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 13px', cursor: rooms.length === 0 ? 'default' : 'pointer', fontWeight: 600, fontSize: 12, opacity: rooms.length === 0 ? 0.5 : 1 }}>
            <Download size={13} /> Export for Hotel
          </button>
          <button onClick={save} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 13px', cursor: busy ? 'default' : 'pointer', fontWeight: 600, fontSize: 12, opacity: busy ? 0.6 : 1 }}>
            <Save size={13} /> {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Guide / driver */}
      <div style={{ marginBottom: 12, maxWidth: 360 }}>
        <label style={{ fontSize: 10.5, color: '#888', fontWeight: 500, display: 'block', marginBottom: 3 }}>Guide / Driver Details (name + phone)</label>
        <input dir="auto" style={inp} value={guideDriver} onChange={e => setGuideDriver(e.target.value)} placeholder="e.g. Walid Hallasi 052-2600100" />
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1040 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid #eee' }}>
              <th style={th}>Last Name</th>
              <th style={th}>First Name(s)</th>
              <th style={{ ...th, textAlign: 'center' }}>Ad</th>
              <th style={{ ...th, textAlign: 'center' }}>Jr</th>
              <th style={{ ...th, textAlign: 'center' }}>Ch</th>
              <th style={{ ...th, textAlign: 'center' }}>Inf</th>
              <th style={{ ...th, textAlign: 'center' }}>Beds</th>
              <th style={th}>Nationality</th>
              <th style={th}>Passport</th>
              <th style={th}>Passport 2</th>
              <th style={th}>Comments</th>
              <th style={{ ...th, width: 50 }}></th>
            </tr>
          </thead>
          <tbody>
            {rooms.length === 0 ? (
              <tr><td colSpan={12} style={{ padding: 18, textAlign: 'center', color: '#bbb', fontSize: 12 }}>No rooms yet. Click "Add Room" to build the rooming list.</td></tr>
            ) : rooms.map((r, i) => (
              <tr key={i} style={{ borderBottom: '0.5px solid #f6f6f6' }}>
                <td style={{ padding: '4px 4px' }}><input style={{ ...inp, minWidth: 110 }} value={r.last_name} onChange={e => setRoom(i, { last_name: e.target.value })} /></td>
                <td style={{ padding: '4px 4px' }}><input style={{ ...inp, minWidth: 130 }} value={r.first_name} onChange={e => setRoom(i, { first_name: e.target.value })} placeholder="John, Jane" /></td>
                <td style={{ padding: '4px 4px' }}><input style={{ ...cellNum, width: 38 }} type="number" value={r.adult} onChange={e => setRoom(i, { adult: +e.target.value })} /></td>
                <td style={{ padding: '4px 4px' }}><input style={{ ...cellNum, width: 38 }} type="number" value={r.junior} onChange={e => setRoom(i, { junior: +e.target.value })} /></td>
                <td style={{ padding: '4px 4px' }}><input style={{ ...cellNum, width: 38 }} type="number" value={r.children} onChange={e => setRoom(i, { children: +e.target.value })} /></td>
                <td style={{ padding: '4px 4px' }}><input style={{ ...cellNum, width: 38 }} type="number" value={r.infant} onChange={e => setRoom(i, { infant: +e.target.value })} /></td>
                <td style={{ padding: '4px 4px' }}><input style={{ ...cellNum, width: 44 }} type="number" value={r.share} onChange={e => setRoom(i, { share: +e.target.value })} /></td>
                <td style={{ padding: '4px 4px' }}><input style={{ ...inp, width: 80 }} value={r.nationality} onChange={e => setRoom(i, { nationality: e.target.value })} placeholder="usa" /></td>
                <td style={{ padding: '4px 4px' }}><input style={{ ...inp, width: 100 }} value={r.passport} onChange={e => setRoom(i, { passport: e.target.value })} /></td>
                <td style={{ padding: '4px 4px' }}><input style={{ ...inp, width: 100 }} value={r.passport2} onChange={e => setRoom(i, { passport2: e.target.value })} /></td>
                <td style={{ padding: '4px 4px' }}>
                  <input style={{ ...inp, minWidth: 150 }} value={r.comments} onChange={e => setRoom(i, { comments: e.target.value })} placeholder="e.g. TWIN beds…" />
                  <div style={{ display: 'flex', gap: 3, marginTop: 3, flexWrap: 'wrap' }}>
                    {['Double bed', 'TWIN beds', 'Single room', 'Triple - 3 beds', 'Tour Leader'].map(tag => (
                      <button key={tag} onClick={() => setRoom(i, { comments: r.comments ? `${r.comments}; ${tag}` : tag })}
                        style={{ fontSize: 9, padding: '1px 6px', borderRadius: 10, border: '0.5px solid #d8d8d8', background: '#fafafa', color: '#777', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        +{tag}
                      </button>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '4px 4px', whiteSpace: 'nowrap' }}>
                  <button onClick={() => dupRoom(i)} title="Duplicate" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 2 }}><Copy size={12} /></button>
                  <button onClick={() => removeRoom(i)} title="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', padding: 2 }}><Trash2 size={12} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={addRoom} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#E6F1FB', color: '#185FA5', border: '0.5px solid #9DC3E8', borderRadius: 20, padding: '5px 13px', cursor: 'pointer', fontSize: 12, fontWeight: 600, marginTop: 10 }}>
        <Plus size={13} /> Add Room
      </button>

      <div style={{ fontSize: 10.5, color: '#888', marginTop: 10, lineHeight: 1.6, background: '#FAFAFE', border: '0.5px solid #E5E3F5', borderRadius: 8, padding: '10px 12px' }}>
        <strong style={{ color: '#534AB7' }}>"Beds" (Share) = total people in the same physical room:</strong><br />
        • <strong>Single room</strong> → one name, Adult 1, <strong>leave Beds blank</strong><br />
        • <strong>Double (couple)</strong> → both names on one row ("Charles, Elizabet"), Adult 2, <strong>Beds = 2</strong><br />
        • <strong>Twin (2 people, separate beds)</strong> → a name on each of two rows, Adult 1 each, <strong>Beds = 2</strong> on the first row · add "TWIN beds" in comments<br />
        • <strong>Triple (3 separate beds)</strong> → e.g. one person on row 1 + a couple on row 2, <strong>Beds = 3</strong> on the first row<br />
        Use the comment tags to mark bed type. "Export for Hotel" produces the exact Excel hotels require — then pick the hotel in the file's dropdown and send.
      </div>
    </div>
  )
}
