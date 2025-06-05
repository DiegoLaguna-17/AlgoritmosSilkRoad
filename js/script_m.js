let fuzzyVariables = [];
let fuzzyTarget = null;
let membershipPlots = [];
let draggedPoint = null;
let currentLabelNames = ['Malo', 'Normal', 'Bueno', 'Muy Malo', 'Excelente'];

document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('laplace_input');
    const resultArea = document.getElementById('laplace_result');
    const calculateBtn = document.getElementById('calculate-btn');
    const clearBtn = document.getElementById('clear-btn');
    const deleteBtn = document.getElementById('delete-btn');

    let cursorPos = 0;

    const modal = document.getElementById('error-modal');
    const errorMessage = document.getElementById('error-message');
    const closeBtn = document.querySelector('.close');

    function showError(message) {
        errorMessage.textContent = message;
        modal.style.display = 'block';
    }

    function hideError() {
        modal.style.display = 'none';
    }

    closeBtn.addEventListener('click', hideError);
    window.addEventListener('click', (e) => {
        if (e.target === modal) hideError();
    });
    
    function updateCursorPosition() {
        cursorPos = inputField.selectionStart;
        inputField.focus();
    }
    
    inputField.addEventListener('click', updateCursorPosition);
    inputField.addEventListener('keyup', updateCursorPosition);

    document.querySelectorAll('.math-btn').forEach(button => {
        button.addEventListener('click', () => {
            const value = button.getAttribute('data-value');
            insertAtCursor(value);
            calculateBtn.disabled = !inputField.value.trim();
        });
    });

    function insertAtCursor(text) {
        const currentValue = inputField.value;
        inputField.value = 
            currentValue.substring(0, cursorPos) + 
            text + 
            currentValue.substring(cursorPos);
        
        cursorPos += text.length;
        inputField.setSelectionRange(cursorPos, cursorPos);
        inputField.focus();
    }

    clearBtn.addEventListener('click', () => {
        inputField.value = '';
        resultArea.value = '';
        calculateBtn.disabled = true;
        cursorPos = 0;
        inputField.focus();
    });

    deleteBtn.addEventListener('click', () => {
        if (inputField.value.length > 0 && cursorPos > 0) {
            const currentValue = inputField.value;
            inputField.value = 
                currentValue.substring(0, cursorPos - 1) + 
                currentValue.substring(cursorPos);
            
            cursorPos = Math.max(0, cursorPos - 1);
            inputField.setSelectionRange(cursorPos, cursorPos);
            inputField.focus();
            calculateBtn.disabled = !inputField.value.trim();
        }
    });

    calculateBtn.addEventListener('click', async () => {
        const input = inputField.value.trim();
        
        try {
            const response = await fetch('https://algoritmos-silk-backend.onrender.com/laplace', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expression: input })
            });

            const data = await response.json();
            
            if (data.error) {
                if (data.unsupported) {
                    showError("La transformada de LaPlace no puede resolver esta expresión, debido a: Operaciones no lineales en el dominio del tiempo • Combinaciones trigonométricas complejas • Algunas funciones especiales.");
                } else {
                    resultArea.value = `Error: ${data.error}`;
                }
            } else {
                resultArea.value = data.result;
            }
        } catch (error) {
            showError(`Network error: ${error.message}`);
        }
    });

    const calculateIlaplaceBtn = document.getElementById('calculate-ilaplace-btn');

    calculateIlaplaceBtn.addEventListener('click', async () => {
        const input = inputField.value.trim();
        
        try {
            const response = await fetch('https://algoritmos-silk-backend.onrender.com/ilaplace', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expression: input })
            });

            const data = await response.json();
            
            if (data.error) {
                if (data.unsupported) {
                    showError("La transformada inversa de LaPlace no puede resolver esta expresión, debido a: Expresiones no racionales • Polos complejos no simples • Funciones especiales no soportadas.");
                } else {
                    resultArea.value = `Error: ${data.error}`;
                }
            } else {
                resultArea.value = data.result;
            }
        } catch (error) {
            showError(`Network error: ${error.message}`);
        }
    });

    const numVariablesInput = document.getElementById('num-variables');
    const numLabelsInput = document.getElementById('num-labels');
    const setupFuzzyBtn = document.getElementById('setup-fuzzy');
    const variablesContainer = document.getElementById('variables-container');
    const targetContainer = document.getElementById('target-container');
    const calculateFuzzyBtn = document.getElementById('calculate-fuzzy');
    const fuzzyResults = document.getElementById('fuzzy-results');
    const fuzzyOutput = document.getElementById('fuzzy-output');
    const fuzzyResultPlot = document.getElementById('fuzzy-result-plot');
    
    const fuzzySurfacePlotControls = document.getElementById('fuzzy-surface-plot-controls');
    const plotVar1Select = document.getElementById('plot-var-1');
    const plotVar2Select = document.getElementById('plot-var-2');
    const referenceValuesContainer = document.getElementById('reference-values-container');
    const generateSurfacePlotBtn = document.getElementById('generate-surface-plot-btn');

    const labelNamesContainer = document.getElementById('label-names-container');
    const labelInputsDiv = document.getElementById('label-inputs');
    const applyLabelNamesBtn = document.getElementById('apply-label-names-btn');


    setupFuzzyBtn.addEventListener('click', setupFuzzySystem);
    calculateFuzzyBtn.addEventListener('click', calculateFuzzySystem);
    generateSurfacePlotBtn.addEventListener('click', plotFuzzySurface); 
    applyLabelNamesBtn.addEventListener('click', updateAllPlotLabels);

    function setupFuzzySystem() {
        const numVariables = parseInt(numVariablesInput.value);
        const numLabels = parseInt(numLabelsInput.value);
        
        variablesContainer.innerHTML = '';
        fuzzyVariables = [];
        membershipPlots = [];
        draggedPoint = null;
        
        plotVar1Select.innerHTML = '';
        plotVar2Select.innerHTML = '';
        referenceValuesContainer.innerHTML = '';
        fuzzySurfacePlotControls.style.display = 'none';

        setupLabelNameInputs(numLabels);
        labelNamesContainer.style.display = 'block';

        for (let i = 0; i < numVariables; i++) {
            const variableWrapper = document.createElement('div');
            variableWrapper.className = 'variable-wrapper';
            variableWrapper.innerHTML = `
                <h2>Variable ${i + 1}</h2>
                <div class="plot-wrapper">
                    <div class="plot-area" id="variable-plot-${i}"></div>
                    <div class="plot-controls">
                        <input type="text" id="variable-title-${i}" placeholder="Título de la variable" value="Variable ${i + 1}">
                    </div>
                </div>
            `;
            variablesContainer.appendChild(variableWrapper);
            
            initializePlot(`variable-plot-${i}`, numLabels);
        }
        
        targetContainer.style.display = 'block';
        const targetTitleInput = document.getElementById('target-title');
        if (targetTitleInput) {
            targetTitleInput.value = 'Output';
        }
        initializePlot('target-plot', numLabels);
        
        calculateFuzzyBtn.style.display = 'block';
        
        fuzzyResults.style.display = 'none';

        populateSurfacePlotControls(numVariables);
    }
    
    function initializePlot(containerId, numLabels) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        const canvas = document.createElement('canvas');
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        container.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        
        const datasets = [];
        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9933', '#66FF66'];
        
        for (let i = 0; i < numLabels; i++) {
            const segment = 100 / (numLabels + 1);
            const a = i * segment;
            const b = a + segment;
            const c = b + segment;
            const d = c + segment;

            const labelName = currentLabelNames[i] || `Label ${i + 1}`;

            datasets.push({
                label: labelName,
                data: [
                    {x: Math.max(0, a), y: 0},
                    {x: Math.max(0, b), y: 1},
                    {x: Math.min(100, c), y: 1},
                    {x: Math.min(100, d), y: 0}
                ],
                borderColor: colors[i % colors.length],
                backgroundColor: colors[i % colors.length] + '40',
                borderWidth: 2,
                fill: true,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: colors[i % colors.length],
                tension: 0
            });
        }
        
        const chart = new Chart(ctx, {
            type: 'line',
            data: { datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: 0,
                        max: 100,
                        ticks: {
                            stepSize: 10
                        },
                        title: {
                            display: true,
                            text: 'Valor'
                        }
                    },
                    y: {
                        min: 0,
                        max: 1.1,
                        title: {
                            display: true,
                            text: 'Pertenencia'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: (${context.parsed.x.toFixed(2)}, ${context.parsed.y.toFixed(2)})`;
                            }
                        }
                    },
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
        
        const plotObj = {
            containerId: containerId,
            chart: chart,
            canvas: canvas
        };
        membershipPlots.push(plotObj);
        
        setupDragEvents(plotObj);
    }
    
    function setupDragEvents(plotObj) {
        const { chart, canvas } = plotObj;
        let isDragging = false;
        let activePoint = null;
        
        function getActivePoint(event) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            for (let datasetIndex = 0; datasetIndex < chart.data.datasets.length; datasetIndex++) {
                const dataset = chart.data.datasets[datasetIndex];
                const meta = chart.getDatasetMeta(datasetIndex);
                
                for (let pointIndex = 0; pointIndex < dataset.data.length; pointIndex++) {
                    const pointData = dataset.data[pointIndex];
                    if (pointData.y === 0 || pointData.y === 1) { 
                        const point = meta.data[pointIndex];
                        if (point) {
                            const distance = Math.sqrt(
                                Math.pow(x - point.x, 2) + 
                                Math.pow(y - point.y, 2)
                            );
                            
                            if (distance < 10) {
                                return {
                                    datasetIndex,
                                    pointIndex,
                                    element: point
                                };
                            }
                        }
                    }
                }
            }
            return null;
        }
        
        canvas.addEventListener('mousedown', (event) => {
            activePoint = getActivePoint(event);
            if (activePoint) {
                isDragging = true;
                canvas.style.cursor = 'grabbing';
            }
        });
        
        canvas.addEventListener('mousemove', (event) => {
            if (!isDragging || !activePoint) {
                canvas.style.cursor = getActivePoint(event) ? 'grab' : '';
                return;
            }
            
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const xValue = chart.scales.x.getValueForPixel(x);
            
            const newX = Math.max(0, Math.min(100, xValue));
            const dataset = chart.data.datasets[activePoint.datasetIndex];
            const points = dataset.data;
            
            points[activePoint.pointIndex].x = newX;

            if (activePoint.pointIndex === 0) {
                points[0].x = Math.min(points[0].x, points[1].x);
            } else if (activePoint.pointIndex === 1) {
                points[1].x = Math.max(points[0].x, Math.min(points[1].x, points[2].x));
            } else if (activePoint.pointIndex === 2) {
                points[2].x = Math.max(points[1].x, Math.min(points[2].x, points[3].x));
            } else if (activePoint.pointIndex === 3) { 
                points[3].x = Math.max(points[2].x, points[3].x);
            }
            
            chart.update();
        });
        
        canvas.addEventListener('mouseup', () => {
            isDragging = false;
            activePoint = null;
            canvas.style.cursor = '';
        });
        
        canvas.addEventListener('mouseleave', () => {
            isDragging = false;
            activePoint = null;
            canvas.style.cursor = '';
        });
    }

    function setupLabelNameInputs(numLabels) {
        labelInputsDiv.innerHTML = '';
        while (currentLabelNames.length < numLabels) {
            currentLabelNames.push(`Label ${currentLabelNames.length + 1}`);
        }

        for (let i = 0; i < numLabels; i++) {
            const div = document.createElement('div');
            div.className = 'label-input-group';
            div.innerHTML = `
                <label for="label-name-${i}">Etiqueta ${i + 1}:</label>
                <input type="text" id="label-name-${i}" value="${currentLabelNames[i] || `Label ${i + 1}`}">
            `;
            labelInputsDiv.appendChild(div);
        }
    }

    function updateAllPlotLabels() {
        const numLabels = parseInt(numLabelsInput.value);
        const newLabelNames = [];
        for (let i = 0; i < numLabels; i++) {
            const input = document.getElementById(`label-name-${i}`);
            newLabelNames.push(input.value || `Label ${i + 1}`);
        }
        currentLabelNames = newLabelNames;

        membershipPlots.forEach(plotObj => {
            plotObj.chart.data.datasets.forEach((dataset, i) => {
                dataset.label = currentLabelNames[i] || `Label ${i + 1}`;
            });
            plotObj.chart.update();
        });
        showError("¡Nombres de etiquetas aplicados a todos los gráficos!");
    }


    function populateSurfacePlotControls(numVariables) {
        plotVar1Select.innerHTML = '';
        plotVar2Select.innerHTML = '';
        referenceValuesContainer.innerHTML = '';

        if (numVariables < 2) {
            fuzzySurfacePlotControls.style.display = 'none';
            return;
        }

        fuzzySurfacePlotControls.style.display = 'block';

        const variableTitles = [];
        for (let i = 0; i < numVariables; i++) {
            const title = document.getElementById(`variable-title-${i}`).value || `Variable ${i + 1}`;
            variableTitles.push(title);

            const option1 = document.createElement('option');
            option1.value = i;
            option1.textContent = title;
            plotVar1Select.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = i;
            option2.textContent = title;
            plotVar2Select.appendChild(option2);
        }

        if (numVariables >= 1) plotVar1Select.value = 0;
        if (numVariables >= 2) plotVar2Select.value = 1;

        updateReferenceValueInputs(plotVar1Select.value, plotVar2Select.value, variableTitles);

        plotVar1Select.addEventListener('change', () => {
            updateReferenceValueInputs(plotVar1Select.value, plotVar2Select.value, variableTitles);
        });
        plotVar2Select.addEventListener('change', () => {
            updateReferenceValueInputs(plotVar1Select.value, plotVar2Select.value, variableTitles);
        });
    }

    function updateReferenceValueInputs(plotVar1Idx, plotVar2Idx, variableTitles) {
        referenceValuesContainer.innerHTML = '';
        const numVariables = variableTitles.length;

        for (let i = 0; i < numVariables; i++) {
            if (i === parseInt(plotVar1Idx) || i === parseInt(plotVar2Idx)) {
                continue;
            }

            const varTitle = variableTitles[i];
            const div = document.createElement('div');
            div.className = 'reference-input-group';
            div.innerHTML = `
                <label for="ref-value-${i}">${varTitle} (Valor de referencia):</label>
                <input type="number" id="ref-value-${i}" data-var-index="${i}" data-var-title="${varTitle}" value="50" min="0" max="100" step="1">
            `;
            referenceValuesContainer.appendChild(div);
        }
    }
    
    async function calculateFuzzySystem() {
        try {
            fuzzyOutput.textContent = "Configurando sistema difuso...";
            fuzzyResults.style.display = 'block';
            
            const numVariables = parseInt(numVariablesInput.value);
            const variablesData = [];
            
            for (let i = 0; i < numVariables; i++) {
                const title = document.getElementById(`variable-title-${i}`).value || `Variable ${i + 1}`;
                const plotData = membershipPlots.find(p => p.containerId === `variable-plot-${i}`).chart.data;
                
                variablesData.push({
                    title: title,
                    labels: currentLabelNames.slice(0, plotData.datasets.length), 
                    points: plotData.datasets.map(ds => ds.data.map(p => ({x: p.x, y: p.y})))
                });
            }
            
            const targetTitle = document.getElementById('target-title').value || 'Output';
            const targetPlotData = membershipPlots.find(p => p.containerId === 'target-plot').chart.data;
            
            const targetData = {
                title: targetTitle,
                labels: currentLabelNames.slice(0, targetPlotData.datasets.length),
                points: targetPlotData.datasets.map(ds => ds.data.map(p => ({x: p.x, y: p.y})))
            };
            
            fuzzyVariables = variablesData;
            fuzzyTarget = targetData;

            const response = await fetch('https://algoritmos-silk-backend.onrender.com/fuzzy/calculate', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    variables: variablesData,
                    target: targetData
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                fuzzyOutput.textContent = `Error: ${result.error}`;
            } else {
                fuzzyOutput.textContent = `Sistema difuso configurado. Selecciona variables para graficar la superficie.`;
                fuzzyResultPlot.src = '';
            }
        } catch (error) {
            console.error('Error calculating fuzzy system:', error);
            fuzzyOutput.textContent = `Error: ${error.message}`;
        }
    }

    async function plotFuzzySurface() {
        if (!fuzzyVariables || fuzzyVariables.length < 2) {
            showError("Necesitas al menos 2 variables de entrada para generar una superficie de control.");
            return;
        }

        const plotVar1Idx = parseInt(plotVar1Select.value);
        const plotVar2Idx = parseInt(plotVar2Select.value);

        if (plotVar1Idx === plotVar2Idx) {
            showError("Por favor, selecciona dos variables diferentes para graficar.");
            return;
        }
        
        const referenceValues = {};
        document.querySelectorAll('#reference-values-container input').forEach(input => {
            const varTitle = input.dataset.varTitle;
            const value = parseFloat(input.value);
            if (!isNaN(value)) {
                referenceValues[varTitle] = value;
            }
        });

        try {
            fuzzyOutput.textContent = "Generando superficie de control...";
            fuzzyResults.style.display = 'block';

            const response = await fetch('https://algoritmos-silk-backend.onrender.com/fuzzy/plot_surface', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    variables: fuzzyVariables,
                    target: fuzzyTarget,
                    plot_input_indices: [plotVar1Idx, plotVar2Idx],
                    reference_values: referenceValues
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.error) {
                fuzzyOutput.textContent = `Error al generar superficie: ${result.error}`;
            } else {
                fuzzyOutput.textContent = `Superficie de control generada exitosamente.`;
                fuzzyResultPlot.src = `data:image/png;base64,${result.plot}`;
            }

        } catch (error) {
            console.error('Error generando el grafico:', error);
            fuzzyOutput.textContent = `Error: ${error.message}`;
        }
    }
});
