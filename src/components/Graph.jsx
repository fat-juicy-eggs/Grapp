import React, { useEffect, useState, useRef } from 'react';

const Graph = () => {
    const canvasRef = useRef(null);
    const [graphs, setGraphs] = useState([{ id: 1, nodes: [{ id: 1, x: window.innerWidth / 2, y: window.innerHeight / 2, color: '#0000FF' }], edges: [] }]);
    const [currentGraph, setCurrentGraph] = useState(1);
    const [draggingNode, setDraggingNode] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [edgeMode, setEdgeMode] = useState(false);
    const [history, setHistory] = useState([[{ nodes: { id: 1, x: window.innerWidth / 2, y: window.innerHeight / 2 }, edges: [] }]]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const getCurrentGraph = () => graphs.find(graph => graph.id === currentGraph);

    const updateCurrentGraph = (updatedGraph) => {
        setGraphs(graphs.map(graph => graph.id === currentGraph ? updatedGraph : graph));
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const draw = () => {
            const { nodes, edges } = getCurrentGraph();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            edges.forEach(edge => {
                const startNode = nodes.find(node => node.id === edge.start);
                const endNode = nodes.find(node => node.id === edge.end);
                if (startNode && endNode) {
                    ctx.beginPath();
                    ctx.moveTo(startNode.x, startNode.y);
                    ctx.lineTo(endNode.x, endNode.y);
                    ctx.strokeStyle = 'black';
                    ctx.stroke();
                }
            });
            nodes.forEach(node => {
                ctx.beginPath();
                ctx.arc(node.x, node.y, 10, 0, 2 * Math.PI);
                ctx.fillStyle = node.color || 'blue';
                ctx.fill();
                if (selectedNode === node.id) {
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = 'black';
                    ctx.stroke();
                }
            });
        };
        draw();
    }, [graphs, currentGraph, selectedNode]);

    const handleMouseDown = (e) => {
        const { offsetX, offsetY } = e.nativeEvent;
        const { nodes } = getCurrentGraph();
        const node = nodes.find(node => Math.hypot(node.x - offsetX, node.y - offsetY) < 20);
        if (node) {
            if (edgeMode && selectedNode !== node.id) {
                createEdge(selectedNode, node.id);
                setEdgeMode(false);
            } else {
                setDraggingNode(node.id);
                setSelectedNode(node.id);
            }
        } else {
            setSelectedNode(null);
        }
    };

    const handleMouseMove = (e) => {
        if (draggingNode !== null) {
            const { offsetX, offsetY } = e.nativeEvent;
            const { nodes, edges } = getCurrentGraph();
            const updatedNodes = nodes.map(node => node.id === draggingNode ? { ...node, x: offsetX, y: offsetY } : node);
            updateCurrentGraph({ id: currentGraph, nodes: updatedNodes, edges });
        }
    };

    const handleMouseUp = () => {
        if (draggingNode !== null) {
            setDraggingNode(null);
            const { nodes, edges } = getCurrentGraph();
            addToHistory(nodes, edges);
        }
    };

    const addToHistory = (newNodes, newEdges) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ nodes: newNodes, edges: newEdges });
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const { nodes, edges } = history[historyIndex - 1];
            updateCurrentGraph({ id: currentGraph, nodes, edges });
            setHistoryIndex(historyIndex - 1);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const { nodes, edges } = history[historyIndex + 1];
            updateCurrentGraph({ id: currentGraph, nodes, edges });
            setHistoryIndex(historyIndex + 1);
        }
    };

    const handleKeyDown = (e) => {
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            handleUndo();
        } else if (e.ctrlKey && e.key === 'Z') {
            e.preventDefault();
            handleRedo();
        } else if (e.key === "Backspace") {
            if (selectedNode !== null) {
                handleDeleteNode();
            }
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [history, historyIndex]);

    const addNode = () => {
        const { nodes, edges } = getCurrentGraph();
        const newNode = { id: nodes.length ? nodes[nodes.length - 1].id + 1 : 1, x: window.innerWidth / 2, y: window.innerHeight / 2, color: '#0000FF' };
        const newNodes = [...nodes, newNode];
        updateCurrentGraph({ id: currentGraph, nodes: newNodes, edges });
        addToHistory(newNodes, edges);
    };

    const handleDeleteNode = () => {
        if (selectedNode !== null) {
            const { nodes, edges } = getCurrentGraph();
            const newNodes = nodes.filter(node => node.id !== selectedNode);
            const newEdges = edges.filter(edge => edge.start !== selectedNode && edge.end !== selectedNode);
            updateCurrentGraph({ id: currentGraph, nodes: newNodes, edges: newEdges });
            addToHistory(newNodes, newEdges);
            setSelectedNode(null);
        }
    };

    const handleColorChange = (e) => {
        const color = e.target.value;
        const { nodes, edges } = getCurrentGraph();
        const updatedNodes = nodes.map(node => node.id === selectedNode ? { ...node, color: color } : node);
        updateCurrentGraph({ id: currentGraph, nodes: updatedNodes, edges });
        addToHistory(updatedNodes, edges);
    };

    const deleteEdge = (edgeToDelete) => {
        const { nodes, edges } = getCurrentGraph();
        const updatedEdges = edges.filter(edge => edge !== edgeToDelete);
        updateCurrentGraph({ id: currentGraph, nodes, edges: updatedEdges });
        addToHistory(nodes, updatedEdges);
    };

    const createEdge = (startNode, endNode) => {
        const { nodes, edges } = getCurrentGraph();
        const edgeExists = edges.some(edge => (edge.start === startNode && edge.end === endNode) || (edge.start === endNode && edge.end === startNode));
        if (!edgeExists) {
            const newEdge = { start: startNode, end: endNode };
            const newEdges = [...edges, newEdge];
            updateCurrentGraph({ id: currentGraph, nodes, edges: newEdges });
            addToHistory(nodes, newEdges);
        }
    };

    const enableEdgeCreationMode = () => {
        setEdgeMode(true);
    };

    const addGraph = () => {
        const newGraph = { id: graphs.length ? graphs[graphs.length - 1].id + 1 : 1, nodes: [{id: 1, x: window.innerWidth / 2, y: window.innerHeight / 2}], edges: [] };
        setGraphs([...graphs, newGraph]);
        setCurrentGraph(newGraph.id);
        setSelectedNode(null);
    };

    const switchGraph = (id) => {
        setCurrentGraph(id);
        const { nodes, edges } = graphs.find(graph => graph.id === id);
        setHistory([{ nodes, edges }]);
        setHistoryIndex(0);
    };

    const compareGraphs = (id1, id2) => {
        const graph1 = graphs.find(graph => graph.id === id1);
        const graph2 = graphs.find(graph => graph.id === id2);
        if (graph1 && graph2) {
            // Graph Comparison stuff idk man
        }
    };

    return (
        <div className="w-full h-full relative" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                onMouseDown={handleMouseDown}
            />
            <div className="absolute top-4 left-4 space-x-2">
                <button className="bg-slate-400 text-white px-4 py-2 rounded" onClick={addNode}>Add Vertex</button>
                <button className="bg-green-400 text-white px-4 py-2 rounded" onClick={addGraph}>Add Graph</button>
                {graphs.map(graph => (
                    <button key={graph.id} className={`px-4 py-2 rounded ${graph.id === currentGraph ? 'bg-blue-500' : 'bg-gray-300'}`} onClick={() => switchGraph(graph.id)}>
                        Graph {graph.id}
                    </button>
                ))}
            </div>
            {selectedNode !== null && (
                <div className='absolute top-20 left-4 bg-white p-4 rounded shadow-md'>
                    <h3>Options: Vertex {selectedNode}</h3>
                    <label className='block mt-2'>
                        Node Color:
                        <input 
                            type='color'
                            value={getCurrentGraph().nodes.find(node => node.id === selectedNode)?.color || '#0000FF'}
                            onChange={handleColorChange}
                            className='ml-2'
                        />
                    </label>
                    <button className='bg-red-400 text-white px-4 py-2 rounded mt-2' onClick={getCurrentGraph().nodes.length > 1 ? enableEdgeCreationMode : null}>Add Edge</button>
                    <button className="bg-blue-400 text-white px-4 py-2 rounded mt-2" onClick={handleDeleteNode}>Delete Vertex</button>
                    <h4 className='mt-4'>Edges</h4>
                    <ul>
                        {getCurrentGraph().edges.filter(edge => edge.start === selectedNode || edge.end === selectedNode).map((edge, index) => (
                            <li key={index} className="mt-2">
                                Edge {edge.start} - {edge.end}
                                <button 
                                    className='bg-red-400 text-white px-2 py-1 rounded ml-2'
                                    onClick={() => deleteEdge(edge)}
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Graph;