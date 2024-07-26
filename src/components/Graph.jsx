import React, { useEffect, useState, useRef } from 'react';

const Graph = () => {
    const canvasRef = useRef(null);
    const [nodes, setNodes] = useState([{ id: 1, x: window.innerWidth / 2, y: window.innerHeight / 2, color: '#0000FF' }]);
    const [edges, setEdges] = useState([]);
    const [draggingNode, setDraggingNode] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [edgeMode, setEdgeMode] = useState(false);
    const [history, setHistory] = useState([{ nodes: [{ id: 1, x: window.innerWidth / 2, y: window.innerHeight / 2, color: '#0000FF' }], edges: [] }]);
    const [historyIndex, setHistoryIndex] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const draw = () => {
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
    }, [nodes, edges, selectedNode]);

    const handleMouseDown = (e) => {
        const { offsetX, offsetY } = e.nativeEvent;
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
            setNodes(nodes.map(node => node.id === draggingNode ? { ...node, x: offsetX, y: offsetY } : node));
        }
    };

    const handleMouseUp = () => {
        if (draggingNode !== null) {
            setDraggingNode(null);
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
            setNodes(history[historyIndex - 1].nodes);
            setEdges(history[historyIndex - 1].edges);
            setHistoryIndex(historyIndex - 1);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            setNodes(history[historyIndex + 1].nodes);
            setEdges(history[historyIndex + 1].edges);
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
        const newNode = { id: nodes.length ? nodes[nodes.length - 1].id + 1 : 1, x: window.innerWidth / 2, y: window.innerHeight / 2, color: '#0000FF' };
        const newNodes = [...nodes, newNode];
        setNodes(newNodes);
        addToHistory(newNodes, edges);
    };

    const handleDeleteNode = () => {
        if (selectedNode !== null) {
            const newNodes = nodes.filter(node => node.id !== selectedNode);
            const newEdges = edges.filter(edge => edge.start !== selectedNode && edge.end !== selectedNode);
            setNodes(newNodes);
            setEdges(newEdges);
            addToHistory(newNodes, newEdges);
            setSelectedNode(null);
        }
    };

    const handleColorChange = (e) => {
        const color = e.target.value;
        const updatedNodes = nodes.map(node => node.id === selectedNode ? { ...node, color: color } : node);
        setNodes(updatedNodes);
        addToHistory(updatedNodes, edges);
    };

    const deleteEdge = (edgeToDelete) => {
        const updatedEdges = edges.filter(edge => edge !== edgeToDelete);
        setEdges(updatedEdges);
        addToHistory(nodes, updatedEdges);
    };

    const createEdge = (startNode, endNode) => {
        const newEdge = { start: startNode, end: endNode };
        const newEdges = [...edges, newEdge];
        setEdges(newEdges);
        addToHistory(nodes, newEdges);
    };

    const enableEdgeCreationMode = () => {
        setEdgeMode(true);
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
            </div>
            {selectedNode !== null && (
                <div className='absolute top-20 left-4 bg-white p-4 rounded shadow-md'>
                    <h3>Options: Vertex {selectedNode}</h3>
                    <label className='block mt-2'>
                        Node Color:
                        <input 
                            type='color'
                            value={nodes.find(node => node.id === selectedNode)?.color || '#0000FF'}
                            onChange={handleColorChange}
                            className='ml-2'
                        />
                    </label>
                    <button className='bg-red-400 text-white px-4 py-2 rounded mt-2' onClick={enableEdgeCreationMode}>Add Edge</button>
                    <button className="bg-blue-400 text-white px-4 py-2 rounded mt-2" onClick={handleDeleteNode}>Delete Vertex</button>
                    <h4 className='mt-4'>Edges</h4>
                    <ul>
                        {edges.filter(edge => edge.start === selectedNode || edge.end === selectedNode).map((edge, index) => (
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