import Graph from './Graph.js';

const container = document.getElementById('network');
const nodeContextMenu = document.getElementById('nodeContextMenu');
const nodes = new vis.DataSet([]);
const edges = new vis.DataSet([]);

let isDirectedGraph = true;

const options = {
    nodes: {
        shape: 'circle',
        color: '#00E3C6',
        size: 30,
        scaling: {
            min: 30,
            max: 30,
            label: {
                enabled: false
            }
        },
        physics: false,
    },
    edges: {
        color: '#000000',
        width: 2,
        font: {
            size: 14,
            face: 'arial',
            strokeWidth: 5,
            strokeColor: '#ffffff'
        },
        smooth: {
            type: 'continuous'
        },
        arrows: {
            to: { 
                enabled: true, 
                scaleFactor: 1.5 
            },
        },
    },
    interaction: {
        hover: true,
        tooltipDelay: 0
    }
};

const data = { nodes, edges };
const network = new vis.Network(container, data, options);
const graph = new Graph(nodes, edges);

// Variables Auxiliares
const addLoopBtn = document.getElementById('addLoopBtn');
const changeLabelBtn = document.getElementById('changeLabelBtn');
const nodeColorPicker = document.getElementById('nodeColorPicker');
const deleteNodeBtn = document.getElementById('deleteNodeBtn');
const vaciarBtn = document.getElementById('vaciarBtn');
const guardarGrafo = document.getElementById('guardarGrafo');
const importarDato = document.getElementById('importarDato');
const solve_btn = document.getElementById('solve-btn'); 
const help_btn=document.getElementById('help-btn');
const edgeContextButton = document.getElementById('edgeContextButton');
const changeWeightBtn = document.getElementById('changeWeightBtn');

const addValueBtn = document.createElement('button');
addValueBtn.id = 'addValueBtn';
addValueBtn.textContent = 'Agregar valor';
nodeContextMenu.appendChild(addValueBtn);

let isCreatingEdge = false;
let sourceNodeId = null;
let selectedNodeId = null;
let selectedEdgeId = null;
let edgeButtonTimeout = null;

// Color palette for assignments
const colorPalette = [
    '#FF6B6B', // Vibrant coral-red
    '#4ECDC4', // Bright teal
    '#FFD166', // Sunny yellow
    '#06D6A0', // Emerald green
    '#118AB2', // Deep ocean blue
    '#EF476F', // Electric pink
    '#7F5AF0', // Purple-blue
    '#F77F00', // Bold orange
    '#A78BFA', // Soft lavender
    '#10B981', // Fresh green
    '#F43F5E', // Ruby red
    '#0EA5E9'  // Sky blue
];

// Modal para asignación
const modalHTML = `
<div id="assignmentModal" class="modal" style="display: none;">
    <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h3 style="color: #33FF80;">Resultado Asignación</h3>
        <div id="assignmentResults"></div>
    </div>
</div>
`;
document.body.insertAdjacentHTML('beforeend', modalHTML);

const modalStyles = `
.modal {
    position: fixed;
    bottom: 20px;
    left: 20px;
    background-color: #333;
    border-radius: 8px;
    padding: 15px;
    color: white;
    z-index: 1000;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    max-width: 300px;
}

.modal-content {
    position: relative;
}

.close-modal {
    position: absolute;
    top: -10px;
    right: -10px;
    color: white;
    font-size: 20px;
    font-weight: bold;
    cursor: pointer;
}

.close-modal:hover {
    color: #33FF80;
}

#assignmentResults {
    margin-top: 10px;
}

.assignment-item {
    margin: 5px 0;
    padding: 5px;
    border-bottom: 1px solid #444;
}

.total-cost {
    margin-top: 10px;
    font-weight: bold;
    padding-top: 5px;
    border-top: 2px solid #33FF80;
}
`;
const styleElement = document.createElement('style');
styleElement.innerHTML = modalStyles;
document.head.appendChild(styleElement);

// Event Handlers
network.on("hoverEdge", function(params) {
    selectedEdgeId = params.edge;
    const pointer = params.pointer.DOM;
    
    if (edgeButtonTimeout) {
        clearTimeout(edgeButtonTimeout);
        edgeButtonTimeout = null;
    }
    
    edgeContextButton.style.display = 'block';
    edgeContextButton.style.left = pointer.x + 'px';
    edgeContextButton.style.top = (pointer.y + 90) + 'px';
});

network.on("blurEdge", function() {
    edgeButtonTimeout = setTimeout(() => {
        edgeContextButton.style.display = 'none';
        selectedEdgeId = null;
    }, 900);
});

edgeContextButton.addEventListener('mouseenter', function() {
    if (edgeButtonTimeout) {
        clearTimeout(edgeButtonTimeout);
        edgeButtonTimeout = null;
    }
});

edgeContextButton.addEventListener('mouseleave', function() {
    edgeButtonTimeout = setTimeout(() => {
        edgeContextButton.style.display = 'none';
        selectedEdgeId = null;
    }, 300);
});

network.on("click", function(params) {
    if (!params.edges.length && !edgeContextButton.contains(params.event.target)) {
        edgeContextButton.style.display = 'none';
        selectedEdgeId = null;
    }
});

changeWeightBtn.addEventListener('click', function() {
    if (selectedEdgeId) {
        const edge = edges.get(selectedEdgeId);
        const selectedAlgorithm = document.querySelector('input[name="algorithm"]:checked').value;
        const newWeight = prompt('Ingrese nuevo peso:', edge.label || "0");
        
        if (newWeight !== null) {
            if (selectedAlgorithm === 'djikstra' && parseInt(newWeight) < 0) {
                alert("No se permiten pesos negativos en el algoritmo de Djikstra");
                return;
            }
            edges.update({
                id: selectedEdgeId,
                label: newWeight
            });
            updateAdjacencyMatrix();
        }
        edgeContextButton.style.display = 'none';
        selectedEdgeId = null;
    }
});

network.on("click", function(params) {
    if (params.nodes.length === 0 && params.edges.length === 0) {
        const pointerPosition = params.pointer.canvas;
        const newNodeId = nodes.length + 1; 
        nodes.add({
            id: newNodeId,
            label: `Nodo ${newNodeId}`,
            x: pointerPosition.x,
            y: pointerPosition.y,
            value: 0,
        });
        updateAdjacencyMatrix();
    }
});

network.on('doubleClick', function(params) {
    if (params.nodes.length === 1) {
        if (!isCreatingEdge) {
            sourceNodeId = params.nodes[0];
            isCreatingEdge = true;
        } else {
            const destinationNodeId = params.nodes[0];
            
            if (sourceNodeId !== destinationNodeId) {
                if (!allowsCycles() && edgeExists(sourceNodeId, destinationNodeId)) {
                    alert('No se permiten múltiples aristas entre nodos en este modo de algoritmo');
                } else {
                    edges.add({
                        from: sourceNodeId,
                        to: destinationNodeId,
                        label: "0",
                        arrows: isDirectedGraph ? 'to' : { enabled: false } // Modified this line
                    });
                    updateAdjacencyMatrix();
                }
            } else {
                if (allowsCycles()) {
                    edges.add({
                        from: sourceNodeId,
                        to: destinationNodeId,
                        label: '0',
                        arrows: isDirectedGraph ? 'to' : { enabled: false } // Modified this line
                    });
                    updateAdjacencyMatrix();
                } else {
                    alert('No se permiten bucles en este modo de algoritmo');
                }
            }
            isCreatingEdge = false;
            sourceNodeId = null;
        }
    }
});

network.on('oncontext', function(params) {
    params.event.preventDefault();

    if (params.nodes.length === 0) {
        nodeContextMenu.style.display = 'none';
        return;
    }

    selectedNodeId = params.nodes[0];
    const pointer = {
        x: params.pointer.DOM.x,
        y: params.pointer.DOM.y
    };

    nodeContextMenu.style.display = 'block';
    nodeContextMenu.style.left = pointer.x + 'px';
    nodeContextMenu.style.top = pointer.y + 'px';
    updateContextMenuVisibility();
});

addLoopBtn.addEventListener('click', function() {
    if (selectedNodeId) {
        if (allowsCycles()) {
            edges.add({
                from: selectedNodeId,
                to: selectedNodeId,
                label: '0',
                arrows: isDirectedGraph ? 'to' : { enabled: false } 
            });
            updateAdjacencyMatrix();
        } else {
            alert('No se permiten bucles en este modo de algoritmo');
        }
        nodeContextMenu.style.display = 'none';
    }
});

changeLabelBtn.addEventListener('click', function() {
    if (selectedNodeId) {
        const newLabel = prompt('Ingresar nuevo nombre:', graph.getNode(selectedNodeId).label);
        if (newLabel !== null) {
            graph.updateNode(selectedNodeId, { label: newLabel });
        }
        nodeContextMenu.style.display = 'none';
        updateAdjacencyMatrix();
    }
});

nodeColorPicker.addEventListener('input', function(e) {
    if (selectedNodeId) {
        graph.updateNode(selectedNodeId, { color: e.target.value });
    }
});

deleteNodeBtn.addEventListener('click', function() {
    if (selectedNodeId) {
        graph.removeNode(selectedNodeId);
        nodeContextMenu.style.display = 'none';
        updateAdjacencyMatrix();
    }
});

vaciarBtn.addEventListener('click', function() {
    graph.clear();
    updateAdjacencyMatrix();
});

guardarGrafo.addEventListener('click', function() {
    // Create a copy of nodes with original colors
    const originalNodes = nodes.get().map(node => {
        // Keep start/end node colors (#33FF80), reset others to default (#00E3C6)
        const isStartEnd = node.label?.includes('(inicio)') || node.label?.includes('(final)');
        return {
            ...node,
            color: isStartEnd ? '#33FF80' : '#00E3C6'
        };
    });

    // Create a copy of edges with original colors
    const originalEdges = edges.get().map(edge => ({
        ...edge,
        color: '#000000',
        width: 2
    }));

    const graphData = {
        nodes: originalNodes,
        edges: originalEdges.map(edge => {
            return {
                from: edge.from,
                to: edge.to,
                label: edge.label,
                arrows: edge.arrows
            };
        })
    };
    
    const dataStr = JSON.stringify(graphData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(dataBlob);
    const fileName = prompt("Nombre del archivo:", "graph");
    downloadLink.download = (fileName || 'graph') + '.json';
    
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
});

importarDato.addEventListener('click', function() {
    document.getElementById('archivo').click();
});

document.getElementById('archivo').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const graphData = JSON.parse(e.target.result);
            
            if (!graphData.nodes || !graphData.edges) {
                throw new Error("Invalid graph file format");
            }
            
            if (!allowsCycles()) {
                const edgeMap = new Map();
                for (const edge of graphData.edges) {
                    const key = [edge.from, edge.to].sort().join('-');
                    if (edge.from === edge.to) {
                        throw new Error("El grafo importado contiene bucles, pero el algoritmo actual no los permite");
                    }
                    if (edgeMap.has(key)) {
                        throw new Error("El grafo importado contiene múltiples aristas entre nodos, pero el algoritmo actual no las permite");
                    }
                    edgeMap.set(key, true);
                }
            }
            
            graph.clear();
            nodes.add(graphData.nodes);
            edges.add(graphData.edges.map(edge => ({
                from: edge.from,
                to: edge.to,
                label: edge.label || "0",
                arrows: isDirectedGraph ? (edge.arrows || 'to') : { enabled: false } 
            })));
            updateAdjacencyMatrix();

        } catch (error) {
            console.error('Error:', error);
            alert('Error: ' + error.message);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
});

// Algorithm Implementations
function calculateCriticalPath() {
    const nodeIds = nodes.getIds().sort((a, b) => a - b);
    const edgesList = edges.get();
    
    const forwardPass = {};
    const backwardPass = {};
    const slack = {};
    const criticalPath = [];
    
    nodeIds.forEach(id => {
        forwardPass[id] = 0;
        backwardPass[id] = Infinity;
    });
    
    const sortedNodes = topologicalSort(nodeIds, edgesList);
    sortedNodes.forEach(nodeId => {
        edgesList
            .filter(edge => edge.from === nodeId)
            .forEach(edge => {
                const weight = parseInt(edge.label) || 0;
                forwardPass[edge.to] = Math.max(
                    forwardPass[edge.to], 
                    forwardPass[nodeId] + weight
                );
            });
    });
    
    const lastNode = sortedNodes[sortedNodes.length - 1];
    backwardPass[lastNode] = forwardPass[lastNode];
    
    [...sortedNodes].reverse().forEach(nodeId => {
        edgesList
            .filter(edge => edge.to === nodeId)
            .forEach(edge => {
                const weight = parseInt(edge.label) || 0;
                backwardPass[edge.from] = Math.min(
                    backwardPass[edge.from],
                    backwardPass[nodeId] - weight
                );
            });
    });
    
    edgesList.forEach(edge => {
        const weight = parseInt(edge.label) || 0;
        slack[edge.id] = backwardPass[edge.to] - forwardPass[edge.from] - weight;
        
        if (slack[edge.id] === 0) {
            criticalPath.push(edge.id);
        }
    });
    
    return {
        forwardPass,
        backwardPass,
        slack,
        criticalPath
    };
}

function topologicalSort(nodeIds, edgesList) {
    const visited = new Set();
    const temp = new Set();
    const result = [];
    
    function visit(nodeId) {
        if (temp.has(nodeId)) throw new Error("Graph has cycles");
        if (visited.has(nodeId)) return;
        
        temp.add(nodeId);
        
        edgesList
            .filter(edge => edge.from === nodeId)
            .forEach(edge => visit(edge.to));
            
        temp.delete(nodeId);
        visited.add(nodeId);
        result.unshift(nodeId);
    }
    
    nodeIds.forEach(id => {
        if (!visited.has(id)) visit(id);
    });
    
    return result;
}

// Modal para Johnson
const criticalPathModalHTML = `
<div id="criticalPathModal" class="modal" style="display: none; bottom: 20px; left: 20px; cursor: pointer;">
    <div class="modal-content">
        <span class="close-critical-path-modal">&times;</span>
        <h3 style="color: yellow;">Solución</h3>
        <div id="criticalPathNodes"></div>
    </div>
</div>
`;
document.body.insertAdjacentHTML('beforeend', criticalPathModalHTML);

function visualizeCriticalPath(results) {
    const { forwardPass, backwardPass, slack, criticalPath } = results;
    
    const criticalNodes = new Set();
    const nodeOrder = [];
    
    const criticalEdges = edges.get(criticalPath);
    
    let currentNode = null;
    for (const edge of criticalEdges) {
        const isStartNode = !criticalEdges.some(e => e.to === edge.from);
        if (isStartNode) {
            currentNode = edge.from;
            break;
        }
    }
    
    if (!currentNode && criticalEdges.length > 0) {
        currentNode = criticalEdges[0].from;
    }
    
    const pathNodes = [];
    if (currentNode) {
        pathNodes.push(currentNode);
        criticalNodes.add(currentNode);
        
        while (true) {
            const nextEdge = criticalEdges.find(e => e.from === currentNode);
            if (!nextEdge) break;
            
            currentNode = nextEdge.to;
            pathNodes.push(currentNode);
            criticalNodes.add(currentNode);
        }
    }
    
    nodes.get().forEach(node => {
        const isCritical = criticalNodes.has(node.id);
        nodes.update({
            id: node.id,
            color: isCritical ? '#E8FF00' : '#00E3C6',
            label: `${node.label}\n${forwardPass[node.id]} | ${backwardPass[node.id]}`
        });
    });
    
    edges.get().forEach(edge => {
        const weight = edge.label || "0";
        edges.update({
            id: edge.id,
            label: `${weight} | h = ${slack[edge.id]}`
        });
    });
    
    edges.get().forEach(edge => {
        const isCritical = criticalPath.includes(edge.id);
        edges.update({
            id: edge.id,
            color: isCritical ? '#E8FF00' : '#000000',
            width: isCritical ? 3 : 2
        });
    });
    
    const modal = document.getElementById('criticalPathModal');
    const pathDiv = document.getElementById('criticalPathNodes');
    
    const pathText = pathNodes.map(id => {
        const node = nodes.get(id);
        return node.label ? node.label.split('\n')[0] : `Node ${id}`;
    }).join(' → ');
    
    pathDiv.textContent = pathText;
    modal.style.display = 'block';
    
    document.querySelector('.close-critical-path-modal').onclick = function() {
        modal.style.display = 'none';
    };
}

function hungarianAlgorithm(isMaximization) {
    const nodeIds = nodes.getIds().sort((a, b) => a - b);
    const matrix = graph.getAdjacencyMatrix();
    
    if (nodeIds.length === 0) {
        throw new Error("No hay nodos en el grafo");
    }

    const half = Math.ceil(nodeIds.length / 2);
    const origins = nodeIds.slice(0, half);
    const destinations = nodeIds.slice(half);
    
    const costMatrix = destinations.map(toId => {
        const toIndex = nodeIds.indexOf(toId);
        return origins.map(fromId => {
            const fromIndex = nodeIds.indexOf(fromId);
            const cost = parseInt(matrix[fromIndex][toIndex]) || 0;
            return isMaximization ? -cost : cost;
        });
    });
    
    console.log("Matriz de costos original:", costMatrix);

    const maxSize = Math.max(origins.length, destinations.length);
    const paddedMatrix = [];
    
    for (let i = 0; i < maxSize; i++) {
        const row = [];
        for (let j = 0; j < maxSize; j++) {
            if (i < costMatrix.length && j < costMatrix[0].length) {
                row.push(costMatrix[i][j]);
            } else {
                row.push(0);
            }
        }
        paddedMatrix.push(row);
    }

    for (let i = 0; i < paddedMatrix.length; i++) {
        const min = Math.min(...paddedMatrix[i]);
        for (let j = 0; j < paddedMatrix[i].length; j++) {
            paddedMatrix[i][j] -= min;
        }
    }

    for (let j = 0; j < paddedMatrix[0].length; j++) {
        let min = Infinity;
        for (let i = 0; i < paddedMatrix.length; i++) {
            if (paddedMatrix[i][j] < min) {
                min = paddedMatrix[i][j];
            }
        }
        for (let i = 0; i < paddedMatrix.length; i++) {
            paddedMatrix[i][j] -= min;
        }
    }

    const assignment = hungarianAssignment(paddedMatrix);

    const assignments = [];
    let totalCost = 0;

    for (let destIndex = 0; destIndex < destinations.length; destIndex++) {
        const originIndex = assignment[destIndex];
        if (originIndex === undefined || originIndex >= origins.length) continue;

        const fromId = origins[originIndex];
        const toId = destinations[destIndex];
        const fromNode = nodes.get(fromId);
        const toNode = nodes.get(toId);
        
        const fromIndex = nodeIds.indexOf(fromId);
        const toIndex = nodeIds.indexOf(toId);
        const originalCost = parseInt(matrix[fromIndex][toIndex]) || 0;

        assignments.push({
            from: fromId,
            fromLabel: fromNode.label,
            to: toId,
            toLabel: toNode.label,
            cost: originalCost
        });

        totalCost += originalCost;
    }

    return { assignments, totalCost };
}

// Implementación completa del algoritmo húngaro para asignación
function hungarianAssignment(costMatrix) {
    const n = costMatrix.length;
    const m = costMatrix[0].length;
    
    // Inicializar matrices de seguimiento
    const u = new Array(n + 1).fill(0);
    const v = new Array(m + 1).fill(0);
    const p = new Array(m + 1).fill(0);
    const way = new Array(m + 1).fill(0);
    
    for (let i = 1; i <= n; i++) {
        p[0] = i;
        let j0 = 0;
        const minv = new Array(m + 1).fill(Infinity);
        const used = new Array(m + 1).fill(false);
        
        do {
            used[j0] = true;
            const i0 = p[j0];
            let delta = Infinity;
            let j1 = 0;
            
            for (let j = 1; j <= m; j++) {
                if (!used[j]) {
                    const cur = costMatrix[i0 - 1][j - 1] - u[i0] - v[j];
                    if (cur < minv[j]) {
                        minv[j] = cur;
                        way[j] = j0;
                    }
                    if (minv[j] < delta) {
                        delta = minv[j];
                        j1 = j;
                    }
                }
            }
            
            for (let j = 0; j <= m; j++) {
                if (used[j]) {
                    u[p[j]] += delta;
                    v[j] -= delta;
                } else {
                    minv[j] -= delta;
                }
            }
            
            j0 = j1;
        } while (p[j0] !== 0);
        
        do {
            const j1 = way[j0];
            p[j0] = p[j1];
            j0 = j1;
        } while (j0 !== 0);
    }
    
    // Construir la asignación
    const assignment = new Array(n).fill(-1);
    for (let j = 1; j <= m; j++) {
        if (p[j] > 0) {
            assignment[p[j] - 1] = j - 1;
        }
    }
    
    return assignment;
}

function visualizeAssignments(results) {
    const { assignments, totalCost } = results;
    
    nodes.get().forEach(node => {
        nodes.update({
            id: node.id,
            color: '#00E3C6'
        });
    });

    assignments.forEach((pair, index) => {
        const color = colorPalette[index % colorPalette.length];
        nodes.update([
            { id: pair.from, color: color },
            { id: pair.to, color: color }
        ]);
    });

    const modal = document.getElementById('assignmentModal');
    const resultsDiv = document.getElementById('assignmentResults');
    
    resultsDiv.innerHTML = assignments.map(pair => {
        return `
            <div class="assignment-item">
                ${pair.fromLabel} → ${pair.toLabel} = ${pair.cost}
            </div>
        `;
    }).join('') + `
        <div class="total-cost">
            Costo Total = ${isNaN(totalCost) ? 0 : totalCost}
        </div>
    `;
    
    modal.style.display = 'block';
    
    document.querySelector('.close-modal').onclick = function() {
        modal.style.display = 'none';
    };
}

// Modal Noroeste
const northwestModalHTML = `
<div id="northwestModal" class="modal" style="display: none; cursor: pointer; max-width: 700px;">
    <div class="modal-content">
        <span class="close-northwest-modal">&times;</span>
        <h3 style="color: #33FF80;">Resultado Noroeste</h3>
        <div id="northwestResults">
            <p>Iteraciones: <span id="iterationCount">0</span></p>
            <p>Costo total = <span id="northwestTotalCost">0</span></p>
        </div>
    </div>
</div>
`;
document.body.insertAdjacentHTML('beforeend', northwestModalHTML);

function northwestCornerAlgorithm(isMaximization) {
    const nodeIds = nodes.getIds().sort((a, b) => a - b);
    const matrix = graph.getAdjacencyMatrix();
    
    if (nodeIds.length === 0) {
        throw new Error("No hay nodos en el grafo");
    }

    const origins = new Set();
    const destinations = new Set();
    
    edges.get().forEach(edge => {
        origins.add(edge.from);
        destinations.add(edge.to);
    });

    let supplyNodes = Array.from(origins);
    let demandNodes = Array.from(destinations);

    let originalSupplies = supplyNodes.map(id => parseInt(graph.getSupplyDemandValue(id)) || 0);
    let originalDemands = demandNodes.map(id => parseInt(graph.getSupplyDemandValue(id)) || 0);

    let supplies = [...originalSupplies];
    let demands = [...originalDemands];

    const totalSupply = supplies.reduce((a, b) => a + b, 0);
    const totalDemand = demands.reduce((a, b) => a + b, 0);

    let wildcardAdded = false;
    if (totalSupply !== totalDemand) {
        wildcardAdded = true;
        if (totalSupply > totalDemand) {

            const wildcardValue = totalSupply - totalDemand;
            const wildcardId = Math.max(...nodeIds) + 1;
            
            demandNodes.push(wildcardId);
            demands.push(wildcardValue);
            originalDemands.push(wildcardValue);
            
            supplyNodes.forEach(fromId => {
                edges.add({
                    from: fromId,
                    to: wildcardId,
                    label: "0",
                    arrows: 'to'
                });
            });
            
            nodes.add({
                id: wildcardId,
                label: `Nodo ${wildcardId}\nd:${wildcardValue}`,
                color: '#FFA500'
            });
        } else {

            const wildcardValue = totalDemand - totalSupply;
            const wildcardId = Math.max(...nodeIds) + 1;
            
            supplyNodes.push(wildcardId);
            supplies.push(wildcardValue);
            originalSupplies.push(wildcardValue);
            
            demandNodes.forEach(toId => {
                edges.add({
                    from: wildcardId,
                    to: toId,
                    label: "0",
                    arrows: 'to'
                });
            });
            
            nodes.add({
                id: wildcardId,
                label: `Nodo ${wildcardId}\ns:${wildcardValue}`,
                color: '#FFA500'
            });
        }
        updateAdjacencyMatrix();
    }

    const costMatrix = supplyNodes.map((fromId, i) => {
        const fromIndex = nodeIds.indexOf(fromId);
        return demandNodes.map((toId, j) => {
            const toIndex = nodeIds.indexOf(toId);
            const edge = edges.get().find(e => e.from === fromId && e.to === toId);
            const cost = edge ? parseInt(edge.label) || 0 : 0;
            return cost;
        });
    });

    const allocations = Array(supplyNodes.length).fill().map(() => Array(demandNodes.length).fill(0));
    let totalCost = 0;
    let iterations = 0;
    let i = 0, j = 0;

    while (i < supplyNodes.length && j < demandNodes.length) {
        iterations++;
        const supply = supplies[i];
        const demand = demands[j];
        
        if (supply <= 0 || demand <= 0) {
            if (supply <= 0) i++;
            if (demand <= 0) j++;
            continue;
        }
        
        const allocation = Math.min(supply, demand);
        allocations[i][j] = allocation;
        
        supplies[i] -= allocation;
        demands[j] -= allocation;
        
        totalCost += allocation * costMatrix[i][j];
        
        if (supplies[i] === 0) i++;
        if (demands[j] === 0) j++;
    }

    return {
        totalCost,
        iterations,
        allocations,
        supplyNodes,
        demandNodes,
        originalSupplies,
        originalDemands,
        wildcardAdded
    };
}

function visualizeNorthwestResults(results) {
    const { 
        totalCost, 
        iterations, 
        allocations, 
        supplyNodes, 
        demandNodes,
        originalSupplies,
        originalDemands,
        wildcardAdded
    } = results;
    
    nodes.get().forEach(node => {
        const isSupply = supplyNodes.includes(node.id);
        const isDemand = demandNodes.includes(node.id);
        
        nodes.update({
            id: node.id,
            color: isSupply ? '#33FF80' : (isDemand ? '#FF5733' : '#00E3C6')
        });
    });

    edges.get().forEach(edge => {
        const fromIndex = supplyNodes.indexOf(edge.from);
        const toIndex = demandNodes.indexOf(edge.to);
        
        if (fromIndex !== -1 && toIndex !== -1 && allocations[fromIndex][toIndex] > 0) {
            edges.update({
                id: edge.id,
                color: '#FFD700',
                width: 3,
                label: `${edge.label} (${allocations[fromIndex][toIndex]})`
            });
        }
    });

    const modal = document.getElementById('northwestModal');
    const resultsDiv = document.getElementById('northwestResults');
    
    const costMatrix = supplyNodes.map(fromId => {
        return demandNodes.map(toId => {
            const edge = edges.get().find(e => e.from === fromId && e.to === toId);
            return edge ? parseInt(edge.label) || 0 : 0;
        });
    });

    const totalSupply = originalSupplies.reduce((a, b) => a + b, 0);
    const totalDemand = originalDemands.reduce((a, b) => a + b, 0);
    
    let costTable = '<table border="1" style="width:100%; border-collapse: collapse; margin-top: 10px;">';
    costTable += '<caption style="margin-bottom: 5px; font-weight: bold;">Matriz de Costos Inicial</caption>';
    costTable += '<tr><th></th>';
    
    demandNodes.forEach(id => {
        const node = nodes.get(id);
        costTable += `<th>${node.label.split('\n')[0]}</th>`;
    });
    costTable += '<th>Oferta</th></tr>';
    
    supplyNodes.forEach((id, i) => {
        const node = nodes.get(id);
        costTable += `<tr><td>${node.label.split('\n')[0]}</td>`;
        
        demandNodes.forEach((_, j) => {
            costTable += `<td>${costMatrix[i][j]}</td>`;
        });
        
        costTable += `<td>${originalSupplies[i]}</td></tr>`;
    });
    
    costTable += '<tr><td>Demanda</td>';
    demandNodes.forEach((_, j) => {
        costTable += `<td>${originalDemands[j]}</td>`;
    });

    costTable += `<td><strong>${totalSupply}</strong></td></tr>`;
    
    costTable += '</table>';

    let allocationTable = '<table border="1" style="width:100%; border-collapse: collapse; margin-top: 20px;">';
    allocationTable += '<caption style="margin-bottom: 5px; font-weight: bold;">Asignaciones</caption>';
    allocationTable += '<tr><th></th>';
    
    demandNodes.forEach(id => {
        const node = nodes.get(id);
        allocationTable += `<th>${node.label.split('\n')[0]}</th>`;
    });
    allocationTable += '<th>Oferta</th></tr>';
    
    supplyNodes.forEach((id, i) => {
        const node = nodes.get(id);
        allocationTable += `<tr><td>${node.label.split('\n')[0]}</td>`;
        
        demandNodes.forEach((_, j) => {
            const alloc = allocations[i][j] || 0;
            allocationTable += `<td>${alloc > 0 ? alloc : '-'}</td>`;
        });
        
        const remainingSupply = originalSupplies[i] - allocations[i].reduce((a, b) => a + b, 0);
        allocationTable += `<td>${remainingSupply}</td></tr>`;
    });
    
    allocationTable += '<tr><td>Demanda</td>';
    demandNodes.forEach((_, j) => {
        const remainingDemand = originalDemands[j] - allocations.reduce((a, b) => a + b[j], 0);
        allocationTable += `<td>${remainingDemand}</td>`;
    });
    allocationTable += '<td></td></tr>';
    
    if (wildcardAdded) {
        allocationTable += '<tr><td colspan="' + (demandNodes.length + 2) + '" style="text-align: center; color: orange;">* Se aplicó balanceo automático</td></tr>';
    }
    
    allocationTable += '</table>';
    
    resultsDiv.innerHTML = `
        <p>Iteraciones: <span id="iterationCount">${iterations}</span></p>
        ${costTable}
        ${allocationTable}
        <p style="margin-top: 10px;">Costo total = <span id="northwestTotalCost">${totalCost}</span></p>
    `;
    
    modal.style.display = 'block';
    
    document.querySelector('.close-northwest-modal').onclick = function() {
        modal.style.display = 'none';
    };
}

help_btn.addEventListener('click', function() {
    const selectedAlgorithm = document.querySelector('input[name="algorithm"]:checked').value;
    let filePath = '';

    switch (selectedAlgorithm) {
        case 'cpm':
            filePath = 'helps/johnson.pdf';
            break;
        case 'Asignacion':
            filePath = 'helps/asignacion.pdf';
            break;
        case 'noroeste':
            filePath = 'helps/noroeste.pdf';
            break;
        case 'kruskal':
            filePath = 'helps/kruskal.pdf';
            break;
        case 'djikstra':
            filePath = 'helps/djikstra.pdf';
            break;
        default:
            filePath = 'helps/grafos.pdf'
    }

    window.open(filePath, '_blank'); 
});


solve_btn.addEventListener('click', function() {
    const selectedAlgorithm = document.querySelector('input[name="algorithm"]:checked').value;
    
    if (selectedAlgorithm === 'cpm') {
        try {
            const results = calculateCriticalPath();
            visualizeCriticalPath(results);
        } catch (error) {
            alert("Error calculating critical path: " + error.message);
        }
    } else if (selectedAlgorithm === 'Asignacion') {
        try {
            const isMaximization = document.querySelector('input[name="check"]:checked').value === 'true';
            const results = hungarianAlgorithm(isMaximization);
            visualizeAssignments(results);
        } catch (error) {
            alert("Error in assignment algorithm: " + error.message);
        }
    } else if (selectedAlgorithm === 'noroeste') {
        try {
            const isMaximization = document.querySelector('input[name="check"]:checked').value === 'true';
            const results = northwestCornerAlgorithm(isMaximization);
            visualizeNorthwestResults(results);
        } catch (error) {
            alert("Error in Northwest algorithm: " + error.message);
        }
    } else if (selectedAlgorithm === 'kruskal') {
        try {
            const isMaximization = document.querySelector('input[name="kruskalMode"]:checked').value === 'max';
            const results = kruskalAlgorithm(isMaximization);
            visualizeKruskalResults(results);
        } catch (error) {
            alert("Error in Kruskal algorithm: " + error.message);
        }
    } else if (selectedAlgorithm === 'grafo') {
        nodes.get().forEach(node => {
            nodes.update({
                id: node.id,
                color: '#00E3C6',
                label: node.label.split('\n')[0]
            });
        });
        
        edges.get().forEach(edge => {
            edges.update({
                id: edge.id,
                color: '#000000',
                width: 2,
                label: edge.label.split(' | ')[0]
            });
        });
        
        document.getElementById('criticalPathModal').style.display = 'none';
        document.getElementById('assignmentModal').style.display = 'none';
        document.getElementById('northwestModal').style.display = 'none';
    } else if (selectedAlgorithm === 'djikstra') {
        try {
            const isShortest = document.querySelector('input[name="dijkstraMode"]:checked').value === 'shortest';
            const results = dijkstraAlgorithm(isShortest);
            visualizeDijkstraResults(results);
        } catch (error) {
            alert("Error in Dijkstra algorithm: " + error.message);
        }
    }
});

// Add these buttons to the context menu
const setStartBtn = document.createElement('button');
setStartBtn.id = 'setStartBtn';
setStartBtn.textContent = 'Asignar Inicio';
nodeContextMenu.appendChild(setStartBtn);

const setEndBtn = document.createElement('button');
setEndBtn.id = 'setEndBtn';
setEndBtn.textContent = 'Asignar Final';
nodeContextMenu.appendChild(setEndBtn);

// Add event handlers
setStartBtn.addEventListener('click', function() {
    if (selectedNodeId) {
        // Reset previous start node
        nodes.get().forEach(node => {
            if (node.label?.includes('(inicio)')) {
                const newLabel = node.label.replace('(inicio)', '').trim();
                nodes.update({
                    id: node.id,
                    label: newLabel,
                    color: '#00E3C6'
                });
            }
        });
        
        // Set new start node
        const node = nodes.get(selectedNodeId);
        const newLabel = node.label ? `${node.label} (inicio)` : `Node ${selectedNodeId} (inicio)`;
        nodes.update({
            id: selectedNodeId,
            label: newLabel,
            color: '#33FF80'
        });
        
        nodeContextMenu.style.display = 'none';
    }
});

setEndBtn.addEventListener('click', function() {
    if (selectedNodeId) {
        // Reset previous end node
        nodes.get().forEach(node => {
            if (node.label?.includes('(final)')) {
                const newLabel = node.label.replace('(final)', '').trim();
                nodes.update({
                    id: node.id,
                    label: newLabel,
                    color: '#00E3C6'
                });
            }
        });
        
        // Set new end node
        const node = nodes.get(selectedNodeId);
        const newLabel = node.label ? `${node.label} (final)` : `Node ${selectedNodeId} (final)`;
        nodes.update({
            id: selectedNodeId,
            label: newLabel,
            color: '#33FF80'
        });
        
        nodeContextMenu.style.display = 'none';
    }
});

// Helper Functions
function updateAdjacencyMatrix() {
    const matrix = graph.getAdjacencyMatrix();
    const nodeIds = nodes.getIds().sort((a, b) => a - b);
    const table = document.getElementById('tablaMatriz');
    
    table.innerHTML = '';
    
    const headerRow = document.createElement('tr');
    const cornerCell = document.createElement('th');
    cornerCell.className = 'empty-corner';
    headerRow.appendChild(cornerCell);
    
    nodeIds.forEach(id => {
        const node = nodes.get(id);
        const th = document.createElement('th');
        th.textContent = node.label || `Nodo ${id}`;
        headerRow.appendChild(th);
    });
    
    table.appendChild(headerRow);
    
    nodeIds.forEach((id, rowIndex) => {
        const row = document.createElement('tr');
        const node = nodes.get(id);
        
        const rowHeader = document.createElement('th');
        rowHeader.textContent = node.label || `Nodo ${id}`;
        row.appendChild(rowHeader);
        
        nodeIds.forEach((_, colIndex) => {
            const td = document.createElement('td');
            td.textContent = matrix[rowIndex][colIndex];
            row.appendChild(td);
        });
        
        table.appendChild(row);
    });
}

function edgeExists(from, to) {
    return edges.get().some(edge => 
        (edge.from === from && edge.to === to) || 
        (edge.from === to && edge.to === from)
    );
}

function allowsCycles() {
    const selectedAlgorithm = document.querySelector('input[name="algorithm"]:checked').value;
    return selectedAlgorithm === 'grafo';
}

function dijkstraAlgorithm(isShortest) {
    const nodeIds = nodes.getIds().sort((a, b) => a - b);
    const edgesList = edges.get();
    
    // Check for disconnected nodes
    const connectedNodes = new Set();
    edgesList.forEach(edge => {
        connectedNodes.add(edge.from);
        connectedNodes.add(edge.to);
    });
    
    const disconnectedNodes = nodeIds.filter(id => !connectedNodes.has(id));
    if (disconnectedNodes.length > 0) {
        throw new Error(`El grafo tiene nodos no conectados: ${disconnectedNodes.join(', ')}`);
    }

    // Find start and end nodes
    const startNode = nodes.get().find(node => node.color === '#33FF80' && node.label?.includes('(inicio)'));
    const endNode = nodes.get().find(node => node.color === '#33FF80' && node.label?.includes('(final)'));
    
    if (!startNode || !endNode) {
        throw new Error("Por favor asigne nodos de inicio y final");
    }
    
    const startId = startNode.id;
    const endId = endNode.id;
    
    // Initialize distances
    const distances = {};
    const previous = {};
    const visited = new Set();
    const unvisited = new Set(nodeIds);
    
    nodeIds.forEach(id => {
        distances[id] = id === startId ? 0 : (isShortest ? Infinity : -Infinity);
        previous[id] = null;
    });
    
    while (unvisited.size > 0) {
        // Find unvisited node with smallest/largest distance
        let currentId = null;
        unvisited.forEach(id => {
            if (currentId === null || 
                (isShortest && distances[id] < distances[currentId]) || 
                (!isShortest && distances[id] > distances[currentId])) {
                currentId = id;
            }
        });
        
        if (currentId === null || 
            (isShortest && distances[currentId] === Infinity) || 
            (!isShortest && distances[currentId] === -Infinity)) {
            break; // No path exists
        }
        
        if (currentId === endId) {
            break; // Reached destination
        }
        
        unvisited.delete(currentId);
        visited.add(currentId);
        
        // Update distances to neighbors
        edgesList
            .filter(edge => edge.from === currentId || (!isDirectedGraph && edge.to === currentId))
            .forEach(edge => {
                const neighborId = edge.from === currentId ? edge.to : edge.from;
                if (visited.has(neighborId)) return;
                
                const weight = parseInt(edge.label) || 0;
                if (weight < 0) {
                    throw new Error("Negative weights are not allowed for Dijkstra's algorithm");
                }
                
                const alt = isShortest ? 
                    distances[currentId] + weight : 
                    distances[currentId] + weight;
                
                if ((isShortest && alt < distances[neighborId]) || 
                    (!isShortest && alt > distances[neighborId])) {
                    distances[neighborId] = alt;
                    previous[neighborId] = currentId;
                }
            });
    }
    
    // Reconstruct path
    const path = [];
    let current = endId;
    
    while (current !== null) {
        path.unshift(current);
        current = previous[current];
    }
    
    if (path.length === 1 && path[0] !== startId) {
        throw new Error("No path exists between start and end nodes");
    }
    
    return {
        path,
        totalDistance: distances[endId],
        distances,
        previous
    };
}

function visualizeDijkstraResults(results) {
    const { path, totalDistance } = results;
    
    // First reset all nodes and edges to their original state
    nodes.get().forEach(node => {
        // Keep start/end nodes green, others default color
        const isStartEnd = node.label?.includes('(inicio)') || node.label?.includes('(final)');
        nodes.update({
            id: node.id,
            color: isStartEnd ? '#33FF80' : '#00E3C6'
        });
    });
    
    edges.get().forEach(edge => {
        edges.update({
            id: edge.id,
            color: '#000000',
            width: 2
        });
    });
    
    // Now highlight the current solution path
    for (let i = 0; i < path.length - 1; i++) {
        const fromId = path[i];
        const toId = path[i+1];
        
        const edge = edges.get().find(e => 
            (e.from === fromId && e.to === toId) || 
            (!isDirectedGraph && e.from === toId && e.to === fromId)
        );
        
        if (edge) {
            edges.update({
                id: edge.id,
                color: '#33FF80',
                width: 4
            });
        }
        
        nodes.update({
            id: fromId,
            color: '#33FF80'
        });
    }
    
    // Highlight the end node
    nodes.update({
        id: path[path.length - 1],
        color: '#33FF80'
    });
    
    // Show results modal
    const modal = document.getElementById('criticalPathModal');
    const resultsDiv = document.getElementById('criticalPathNodes');
    
    resultsDiv.innerHTML = `
        <p style="color:#33FF80;">Algoritmo de Dijkstra (${document.querySelector('input[name="dijkstraMode"]:checked').value === 'shortest' ? 'Más Corto' : 'Más Largo'})</p>
        <p>Distancia Total: ${totalDistance}</p>
        <p>Camino: ${path.map(id => {
            const node = nodes.get(id);
            return node.label ? node.label.split('\n')[0] : `Nodo ${id}`;
        }).join(' → ')}</p>
    `;
    
    modal.style.display = 'block';
    
    document.querySelector('.close-critical-path-modal').onclick = function() {
        modal.style.display = 'none';
    };
}
function handleAlgorithmChange() {
    const selectedAlgorithm = document.querySelector('input[name="algorithm"]:checked').value;
    document.getElementById('currentAlgorithm').textContent = `Actual: ${
        selectedAlgorithm === 'grafo' ? 'Grafo' :
        selectedAlgorithm === 'cpm' ? 'Johnson' :
        selectedAlgorithm === 'Asignacion' ? 'Asignación' :
        selectedAlgorithm === 'noroeste' ? 'Noroeste' :
        selectedAlgorithm === 'kruskal' ? 'Kruskal' :
        selectedAlgorithm === 'djikstra' ? 'Dijkstra' :
        'Johnson'
    }`;
    
    graph.clear();
    updateAdjacencyMatrix();
    
    isDirectedGraph = selectedAlgorithm !== 'kruskal' && selectedAlgorithm !== 'djikstra';
    
    network.setOptions({
        edges: {
            arrows: {
                to: { enabled: isDirectedGraph }
            }
        }
    });
    
    const checkboxGroup1 = document.getElementById('checkboxGroup1');
    const checkboxGroupKruskal = document.getElementById('checkboxGroupKruskal');
    
    if (selectedAlgorithm === 'Asignacion') {
        checkboxGroup1.classList.remove('hidden');
        checkboxGroupKruskal.classList.add('hidden');
    } else if (selectedAlgorithm === 'kruskal') {
        checkboxGroup1.classList.add('hidden');
        checkboxGroupKruskal.classList.remove('hidden');
    } else {
        checkboxGroup1.classList.add('hidden');
        checkboxGroupKruskal.classList.add('hidden');
    }


    const checkboxGroupDijkstra = document.getElementById('checkboxGroupDijkstra');

    if (selectedAlgorithm === 'djikstra') {
        checkboxGroup1.classList.add('hidden');
        checkboxGroupKruskal.classList.add('hidden');
        checkboxGroupDijkstra.classList.remove('hidden');
    } else {
        checkboxGroupDijkstra.classList.add('hidden');
    }
}

function kruskalAlgorithm(isMaximization) {
    const nodeIds = nodes.getIds().sort((a, b) => a - b);
    const edgesList = edges.get();
    
    if (nodeIds.length === 0) {
        throw new Error("No hay nodos en el grafo");
    }
    
    const undirectedEdges = [];
    const edgeMap = new Map();
    
    edgesList.forEach(edge => {
        const key = [edge.from, edge.to].sort().join('-');
        if (!edgeMap.has(key)) {
            undirectedEdges.push({
                from: Math.min(edge.from, edge.to),
                to: Math.max(edge.from, edge.to),
                weight: parseInt(edge.label) || 0,
                originalId: edge.id
            });
            edgeMap.set(key, true);
        }
    });
    
    undirectedEdges.sort((a, b) => isMaximization ? b.weight - a.weight : a.weight - b.weight);
    
    const parent = {};
    nodeIds.forEach(id => {
        parent[id] = id;
    });
    
    function find(u) {
        if (parent[u] !== u) {
            parent[u] = find(parent[u]); 
        }
        return parent[u];
    }
    
    function union(u, v) {
        const rootU = find(u);
        const rootV = find(v);
        if (rootU !== rootV) {
            parent[rootV] = rootU;
            return true;
        }
        return false;
    }
    
    const mstEdges = [];
    let totalWeight = 0;
    
    for (const edge of undirectedEdges) {
        if (union(edge.from, edge.to)) {
            mstEdges.push(edge.originalId);
            totalWeight += edge.weight;
            

            if (mstEdges.length === nodeIds.length - 1) {
                break;
            }
        }
    }
    
    if (mstEdges.length !== nodeIds.length - 1) {
        throw new Error("El grafo no es conexo, no se puede aplicar Kruskal");
    }

    return {
        mstEdges,
        totalWeight
    };
}

function visualizeKruskalResults(results) {
    const { mstEdges, totalWeight } = results;
    const isMaximization = document.querySelector('input[name="kruskalMode"]:checked').value === 'max';
    
    edges.get().forEach(edge => {
        edges.update({
            id: edge.id,
            color: '#000000',
            width: 2
        });
    });
    
    mstEdges.forEach(edgeId => {
        edges.update({
            id: edgeId,
            color: '#33FF80', 
            width: 4
        });
    });
    
    const modal = document.getElementById('criticalPathModal');
    const resultsDiv = document.getElementById('criticalPathNodes');
    
    resultsDiv.innerHTML = `
        <p style="color:#33FF80;">Algoritmo de Kruskal (${isMaximization ? 'Maximización' : 'Minimización'})</p>
        <p>⚖️Peso Total: ${totalWeight}</p>
        <p>#️⃣Número de arcos: ${mstEdges.length}</p>
    `;
    
    modal.style.display = 'block';
    
    document.querySelector('.close-critical-path-modal').onclick = function() {
        modal.style.display = 'none';
    };
}

document.querySelectorAll('input[name="algorithm"]').forEach(radio => {
    radio.addEventListener('change', handleAlgorithmChange);
});

handleAlgorithmChange();

container.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

document.addEventListener('click', function(e) {
    if (e.button !== 2) { 
        nodeContextMenu.style.display = 'none';
    }
});

addValueBtn.addEventListener('click', function() {
    if (selectedNodeId) {
        const currentValue = graph.getSupplyDemandValue(selectedNodeId);
        const newValue = prompt('Ingrese valor de oferta/demanda:', currentValue);
        if (newValue !== null) {
            graph.setSupplyDemandValue(selectedNodeId, newValue);
            
            const node = nodes.get(selectedNodeId);
            const isSupply = edges.get().some(edge => edge.from === selectedNodeId);
            const prefix = isSupply ? 's:' : 'd:';
            nodes.update({
                id: selectedNodeId,
                label: `Nodo ${selectedNodeId}\n${prefix}${newValue}`
            });
        }
        nodeContextMenu.style.display = 'none';
    }
});

function updateContextMenuVisibility() {
    const selectedAlgorithm = document.querySelector('input[name="algorithm"]:checked').value;
    addValueBtn.style.display = selectedAlgorithm === 'noroeste' ? 'block' : 'none';
}

document.querySelectorAll('input[name="algorithm"]').forEach(radio => {
    radio.addEventListener('change', updateContextMenuVisibility);
});