import Graph from './Graph2.js';

const container = document.getElementById('network');
const nodeContextMenu = document.getElementById('nodeContextMenu');

const nodes = new vis.DataSet([
    
]);

const edges = new vis.DataSet([]);

let isDirectedGraph = true;
const width = container.offsetWidth;
const height = container.offsetHeight;

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
                enabled: false, 
                scaleFactor: 1.5 
            },
        },
    },
    interaction: {
        hover: true,
        tooltipDelay: 0,
        zoomView: false, // Desactiva el zoom con el scroll o los dedos
        dragView: false ,
        dragNodes:false

    },
    
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
    edgeContextButton.style.left = pointer.x + 200+'px';
    edgeContextButton.style.top = (pointer.y + 100) + 'px';
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


let aereopuertos=0;
const cLaPaz=document.getElementById('checkLP')
cLaPaz.addEventListener('change',()=>{
    if(cLaPaz.checked){
         nodes.add({
            id: 1,
            label: `La Paz`,
            x: width/-4.5,
            y: height/14,
            value: 0,
            
        }
    );
    aereopuertos++;
    }else{
        nodes.remove(1);
        aereopuertos--;
    }
    updateAdjacencyMatrix();
});

const cSC=document.getElementById('checkSC')
cSC.addEventListener('change',()=>{
    if(cSC.checked){
         nodes.add({
            id: 2,
            label: `Santa Cruz`,
            x: width/35,
            y: height/13,
            value: 0,
            
        });
        aereopuertos++;
    }else{
        nodes.remove(2);
        aereopuertos--;
    }
    updateAdjacencyMatrix();
});

const cCBBA=document.getElementById('checkCbba')
cCBBA.addEventListener('change',()=>{
    if(cCBBA.checked){
         nodes.add({
            id: 3,
            label: `Cochabamba`,
            x: width/-8.7,
            y: height/11.5,
            value: 0,
            
        }
    );
    aereopuertos++;
    }else{
        nodes.remove(3);
        aereopuertos--;
    }
    updateAdjacencyMatrix();
});

const cTJ=document.getElementById('checkTj')
cTJ.addEventListener('change',()=>{
    if(cTJ.checked){
         nodes.add({
            id: 4,
            label: `Tarija`,
            x: width/-32,
            y: height/2.7,
            value: 0,
            
        }
    );
    aereopuertos++;
    
    }else{
        nodes.remove(4);
        aereopuertos--;
    }
    updateAdjacencyMatrix();
});
const cTDD=document.getElementById('checkTdd')
cTDD.addEventListener('change',()=>{
    if(cTDD.checked){
        nodes.add({
            id: 5,
            label: `Trinidad`,
            x: width/-35,
            y: height/-12,
            value: 0,
            
        }
    );
    aereopuertos++;
    }else{
        nodes.remove(5);
        aereopuertos--;
    }
    updateAdjacencyMatrix();
});
const cSCR=document.getElementById('checkScr')
cSCR.addEventListener('change',()=>{
    if(cSCR.checked){
        nodes.add({
            id: 6,
            label: `Sucre`,
            x: width/-23,
            y: height/4.5,
            value: 0,
            
        }
    );
    aereopuertos++;
    
    }else{
        nodes.remove(6);
        aereopuertos--;
    }
    updateAdjacencyMatrix();
});
const ccbj=document.getElementById('checkCbj')
ccbj.addEventListener('change',()=>{
    if(ccbj.checked){
        nodes.add({
            id: 7,
            label: `Cobija`,
            x: width/-3.35,
            y: height/-2.8,
            value: 0,
            
        }
    );
    aereopuertos++;
    }else{
        nodes.remove(7);
        aereopuertos--;
    }
    updateAdjacencyMatrix();
});

const cOrr=document.getElementById('checkOruro')
cOrr.addEventListener('change',()=>{
    if(cOrr.checked){
      
    nodes.add({
            id: 8,
            label: `Oruro`,
            x: width/-5.6,
            y: height/7,
            value: 0,
            
        }
    );
    aereopuertos++;
    }else{
        nodes.remove(8);
        aereopuertos--;
    }
    updateAdjacencyMatrix();
});

const cUyuni=document.getElementById('checkUyuni')
cUyuni.addEventListener('change',()=>{
    if(cUyuni.checked){
        nodes.add({
            id: 9,
            label: `Uyuni`,
            x: width/-6.7,
            y: height/3.1,
            value: 0,
            
        });
        aereopuertos++;
    }else{
        nodes.remove(9);
        aereopuertos--;
    }
    updateAdjacencyMatrix();
});
let desastres=9;
network.on("click", function(params) {
    if (params.nodes.length === 0 && params.edges.length === 0) {
        const pointerPosition = params.pointer.canvas;
        
        const newNodeId = desastres + 1;
        desastres++; 
        nodes.add({
            id: newNodeId,
            label: `Nodo ${newNodeId}`,
            x: pointerPosition.x,
            y: pointerPosition.y,
            value: 0,
            
        });
        
        console.log('aeropuertos en uso'+aereopuertos)
        if (newNodeId > 9) {
            for (let i = 1; i <= 9; i++) {
                edges.add({
                    from: i,
                    to: newNodeId,
                    label: "0",
                    arrows: isDirectedGraph ? 'to' : { enabled: false }
                });
                
            }
        }
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
        x: params.pointer.DOM.x + 20,  // Añadimos un desplazamiento de 20px a la derecha
        y: params.pointer.DOM.y - 40   // Ajustamos verticalmente para que no cubra el nodo
    };

    // Asegurarnos que no se salga de la pantalla por el lado derecho
    const menuWidth = nodeContextMenu.offsetWidth;
    if (pointer.x + menuWidth > window.innerWidth) {
        pointer.x = window.innerWidth - menuWidth - 10;
    }

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
    if (selectedNodeId>9) {
        graph.removeNode(selectedNodeId);
        nodeContextMenu.style.display = 'none';
        updateAdjacencyMatrix();
    }
});

vaciarBtn.addEventListener('click', function() {
    

    for(let i=10;i<=desastres;i++){
        graph.removeNode(i);
    }
        
        updateAdjacencyMatrix;
    
    
    
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

    const assignment = hungarianAssignment(paddedMatrix,isMaximization,matrix);

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
    const suminis=document.getElementById('suministros').value;
    obtenerDatos(matrix,assignments,isMaximization,totalCost,suminis);
    return { assignments, totalCost };
}

// Implementación completa del algoritmo húngaro para asignación
function hungarianAssignment(costMatrix,maxmin,matrix) {
    const n = costMatrix.length;
    const m = costMatrix[0].length;
    console.log(matrix)
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
async function obtenerDatos(matriz,asign, min,total,suminis) {
  const m = min ? 'Maximizar' : 'Minimizar';
    
  const data = {
    matriz:matriz,
    asignaciones: asign,
    minmax: m,
    total:total,
    suministros:suminis
  };

  try {
    const res = await fetch('https://api-asignacion-f25l.vercel.app/describir_asignacion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    console.log("✅ Respuesta de la API:", result.respuesta); // ✅ Esto ya funcionará

    const respuestaEl = document.getElementById('respuesta');
    if (respuestaEl) {
      respuestaEl.textContent = result.respuesta || 'No se recibió una respuesta válida.';
    } else {
      console.warn("No se encontró el elemento con ID 'respuesta'");
    }

  } catch (err) {
    console.error('Error al conectar con la API:', err);
  }
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
    const sum=document.getElementById('suministros').value;
    const resultadosAi='';
    resultsDiv.innerHTML = assignments.map(pair => {
        return `
            <div class="assignment-item">
                ${pair.fromLabel} → ${pair.toLabel} = ${pair.cost}
            </div>
        `;
        
    }).join('') + `
        <div class="total-cost">
            ${sum} = ${isNaN(totalCost) ? 0 : totalCost}
        </div>
    `;
    
    
    modal.style.display = 'block';
    
    document.querySelector('.close-modal').onclick = function() {
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

function updateContextMenuVisibility() {
    const selectedAlgorithm = document.querySelector('input[name="algorithm"]:checked').value;
    addValueBtn.style.display = selectedAlgorithm === 'noroeste' ? 'block' : 'none';
}

document.querySelectorAll('input[name="algorithm"]').forEach(radio => {
    radio.addEventListener('change', updateContextMenuVisibility);
});