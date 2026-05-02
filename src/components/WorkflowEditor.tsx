import { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Play, Plus, Trash2 } from 'lucide-react';

interface NodeData { label: string; description?: string; }

const TriggerNode = ({ data }: { data: NodeData }) => (
  <div className="workflow-node node-trigger">
    <Handle type="source" position={Position.Right} />
    <div className="workflow-node-type">Trigger</div>
    <div className="workflow-node-label">{data.label}</div>
    {data.description && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{data.description}</div>}
  </div>
);

const LLMNode = ({ data }: { data: NodeData }) => (
  <div className="workflow-node node-llm">
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
    <div className="workflow-node-type">LLM</div>
    <div className="workflow-node-label">{data.label}</div>
    {data.description && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{data.description}</div>}
  </div>
);

const ToolNode = ({ data }: { data: NodeData }) => (
  <div className="workflow-node node-tool">
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
    <div className="workflow-node-type">Tool</div>
    <div className="workflow-node-label">{data.label}</div>
    {data.description && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{data.description}</div>}
  </div>
);

const OutputNode = ({ data }: { data: NodeData }) => (
  <div className="workflow-node node-output">
    <Handle type="target" position={Position.Left} />
    <div className="workflow-node-type">Output</div>
    <div className="workflow-node-label">{data.label}</div>
    {data.description && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{data.description}</div>}
  </div>
);

const nodeTypes = { trigger: TriggerNode, llm: LLMNode, tool: ToolNode, output: OutputNode };

const initialNodes: Node[] = [
  { id: '1', type: 'trigger', position: { x: 60, y: 120 }, data: { label: 'User Input', description: 'Receives user prompt' } },
  { id: '2', type: 'llm', position: { x: 260, y: 80 }, data: { label: 'Plan Task', description: 'GPT-4o breaks down task' } },
  { id: '3', type: 'tool', position: { x: 460, y: 40 }, data: { label: 'Read Files', description: 'fs.readFile tool' } },
  { id: '4', type: 'llm', position: { x: 460, y: 160 }, data: { label: 'Generate Code', description: 'Write implementation' } },
  { id: '5', type: 'tool', position: { x: 660, y: 100 }, data: { label: 'Write File', description: 'fs.writeFile tool' } },
  { id: '6', type: 'output', position: { x: 840, y: 100 }, data: { label: 'Done', description: 'Return result to user' } },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: 'var(--text-muted)' } },
  { id: 'e2-3', source: '2', target: '3', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: 'var(--text-muted)' } },
  { id: 'e2-4', source: '2', target: '4', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: 'var(--text-muted)' } },
  { id: 'e3-5', source: '3', target: '5', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: 'var(--text-muted)' } },
  { id: 'e4-5', source: '4', target: '5', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: 'var(--text-muted)' } },
  { id: 'e5-6', source: '5', target: '6', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: 'var(--text-muted)' } },
];

type NodeType = 'trigger' | 'llm' | 'tool' | 'output';

export default function WorkflowEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedType, setSelectedType] = useState<NodeType>('llm');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<string | null>(null);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: 'var(--text-muted)' } }, eds)
      ),
    [setEdges]
  );

  const addNode = () => {
    const id = `${Date.now()}`;
    const labels: Record<NodeType, string> = { trigger: 'New Trigger', llm: 'New LLM', tool: 'New Tool', output: 'New Output' };
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: selectedType,
        position: { x: 150 + Math.random() * 300, y: 80 + Math.random() * 200 },
        data: { label: labels[selectedType] },
      },
    ]);
  };

  const runWorkflow = async () => {
    setRunning(true);
    setResults(null);
    await new Promise((r) => setTimeout(r, 1200));
    const log = nodes
      .map((n, i) => `[${i + 1}] ${n.type?.toUpperCase()} "${n.data.label}" → executed successfully`)
      .join('\n');
    setResults(`Workflow completed!\n\n${log}\n\nTotal nodes: ${nodes.length} | Edges: ${edges.length}`);
    setRunning(false);
  };

  return (
    <div className="workflow-container">
      <div className="workflow-toolbar">
        <button className="workflow-run-btn" onClick={runWorkflow} disabled={running}>
          <Play size={13} />
          {running ? 'Running...' : 'Run Workflow'}
        </button>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as NodeType)}
            style={{ fontSize: 11, padding: '3px 6px' }}
          >
            <option value="trigger">Trigger</option>
            <option value="llm">LLM</option>
            <option value="tool">Tool</option>
            <option value="output">Output</option>
          </select>
          <button onClick={addNode} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
            <Plus size={13} /> Add Node
          </button>
        </div>
        {nodes.length > 0 && (
          <button
            onClick={() => { setNodes([]); setEdges([]); setResults(null); }}
            style={{ background: 'transparent', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
          >
            <Trash2 size={12} color="var(--text-muted)" /> Clear
          </button>
        )}
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {nodes.length} nodes · {edges.length} edges
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
          defaultEdgeOptions={{ style: { stroke: 'var(--text-muted)' } }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border-color)" />
          <Controls />
        </ReactFlow>
      </div>

      {results && (
        <div
          style={{
            borderTop: '1px solid var(--border-color)',
            padding: '10px 14px',
            background: 'var(--bg-tertiary)',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: 'var(--success)',
            whiteSpace: 'pre',
            maxHeight: 120,
            overflow: 'auto',
            flexShrink: 0,
          }}
        >
          {results}
        </div>
      )}
    </div>
  );
}
