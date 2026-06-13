import { useCallback, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Plus, Trash2, Square, Diamond, Circle } from 'lucide-react'

// ── Custom node types ─────────────────────────────────────────────────────────

const nodeStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 10,
  color: '#e2e8f0',
  fontSize: 12,
  padding: '8px 14px',
  minWidth: 110,
  textAlign: 'center',
  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
}

const handleStyle = {
  background: '#10b981',
  border: '2px solid #065f46',
  width: 10,
  height: 10,
}

function ProcessNode({ data, selected }) {
  return (
    <div style={{
      ...nodeStyle,
      borderColor: selected ? '#10b981' : 'rgba(255,255,255,0.15)',
      boxShadow: selected ? '0 0 0 2px rgba(16,185,129,0.4)' : nodeStyle.boxShadow,
    }}>
      <Handle type="target" position={Position.Top}    style={handleStyle} />
      <span>{data.label}</span>
      <Handle type="source" position={Position.Bottom} style={handleStyle} />
      <Handle type="source" position={Position.Right}  id="r" style={{ ...handleStyle, top: '50%' }} />
      <Handle type="target" position={Position.Left}   id="l" style={{ ...handleStyle, top: '50%' }} />
    </div>
  )
}

function DecisionNode({ data, selected }) {
  return (
    <div style={{
      width: 110,
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    }}>
      <svg width="110" height="64" style={{ position: 'absolute', top: 0, left: 0 }}>
        <polygon
          points="55,4 106,32 55,60 4,32"
          fill="rgba(245,158,11,0.12)"
          stroke={selected ? '#f59e0b' : 'rgba(245,158,11,0.4)'}
          strokeWidth={selected ? 2 : 1.5}
        />
      </svg>
      <span style={{ color: '#fcd34d', fontSize: 11, zIndex: 1, textAlign: 'center', padding: '0 20px' }}>
        {data.label}
      </span>
      <Handle type="target" position={Position.Top}    style={handleStyle} />
      <Handle type="source" position={Position.Bottom} style={handleStyle} />
      <Handle type="source" position={Position.Right}  id="r" style={{ ...handleStyle, top: '50%' }} />
      <Handle type="source" position={Position.Left}   id="l" style={{ ...handleStyle, top: '50%' }} />
    </div>
  )
}

function TerminalNode({ data, selected }) {
  return (
    <div style={{
      ...nodeStyle,
      borderRadius: 999,
      borderColor: selected ? '#60a5fa' : 'rgba(96,165,250,0.4)',
      background: 'rgba(59,130,246,0.1)',
      color: '#93c5fd',
      padding: '8px 20px',
      boxShadow: selected ? '0 0 0 2px rgba(96,165,250,0.3)' : nodeStyle.boxShadow,
    }}>
      <Handle type="target" position={Position.Top}    style={{ ...handleStyle, background: '#3b82f6' }} />
      <span>{data.label}</span>
      <Handle type="source" position={Position.Bottom} style={{ ...handleStyle, background: '#3b82f6' }} />
    </div>
  )
}

const NODE_TYPES = { process: ProcessNode, decision: DecisionNode, terminal: TerminalNode }

const EDGE_DEFAULTS = {
  type: 'smoothstep',
  animated: false,
  style: { stroke: 'rgba(16,185,129,0.5)', strokeWidth: 1.5 },
  markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(16,185,129,0.7)' },
}

// ── Toolbar ───────────────────────────────────────────────────────────────────

function Toolbar({ onAdd }) {
  const btn = (type, Icon, label, color) => (
    <button
      key={type}
      onClick={() => onAdd(type)}
      title={`Add ${label}`}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:brightness-110"
      style={{ background: 'rgba(255,255,255,0.06)', color, border: '1px solid rgba(255,255,255,0.1)' }}
    >
      <Icon size={12} /> {label}
    </button>
  )
  return (
    <div className="flex items-center gap-2 p-2 flex-wrap" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      {btn('process',  Square,   'Process',  '#34d399')}
      {btn('decision', Diamond,  'Decision', '#fcd34d')}
      {btn('terminal', Circle,   'Terminal', '#93c5fd')}
      <span className="text-gray-700 text-[10px] ml-auto">Drag to move · Delete key removes selected</span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

function parse(raw) {
  if (!raw) return { nodes: [], edges: [] }
  try {
    const parsed = JSON.parse(raw)
    if (parsed.nodes) return parsed
  } catch { /* legacy Mermaid text — start fresh */ }
  return { nodes: [], edges: [] }
}

let nodeCounter = 1

export default function FlowchartEditor({ diagram, onSave }) {
  const initial = parse(diagram)
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges)
  const saveTimer = useRef(null)

  const persist = useCallback((ns, es) => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      onSave(JSON.stringify({ nodes: ns, edges: es }))
    }, 800)
  }, [onSave])

  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes)
    setNodes(ns => { persist(ns, edges); return ns })
  }, [onNodesChange, edges, persist])

  const handleEdgesChange = useCallback((changes) => {
    onEdgesChange(changes)
    setEdges(es => { persist(nodes, es); return es })
  }, [onEdgesChange, nodes, persist])

  const onConnect = useCallback((params) => {
    const edge = { ...params, ...EDGE_DEFAULTS, id: crypto.randomUUID() }
    setEdges(es => {
      const next = addEdge(edge, es)
      persist(nodes, next)
      return next
    })
  }, [nodes, persist])

  const addNode = useCallback((type) => {
    const labels = { process: 'Step', decision: 'Decision?', terminal: 'Start/End' }
    const id = crypto.randomUUID()
    const node = {
      id,
      type,
      position: { x: 120 + (nodeCounter++ % 4) * 40, y: 80 + (nodeCounter % 3) * 60 },
      data: { label: labels[type] || 'Node' },
    }
    setNodes(ns => {
      const next = [...ns, node]
      persist(next, edges)
      return next
    })
  }, [edges, persist])

  return (
    <div className="flex flex-col rounded-xl overflow-hidden" style={{ height: 420, border: '1px solid rgba(255,255,255,0.08)' }}>
      <Toolbar onAdd={addNode} />
      <div style={{ flex: 1, background: '#0a0f1a' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          nodeTypes={NODE_TYPES}
          deleteKeyCode={['Delete', 'Backspace']}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          style={{ background: 'transparent' }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="rgba(255,255,255,0.04)" gap={20} size={1} />
          <Controls
            style={{
              background: 'rgba(15,23,42,0.9)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
            }}
          />
          <MiniMap
            style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}
            nodeColor={() => 'rgba(16,185,129,0.5)'}
          />
        </ReactFlow>
      </div>
    </div>
  )
}
