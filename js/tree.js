class Nodo {
  constructor(valor) {
    this.valor = valor;
    this.izquierdo = null;
    this.derecho = null;
  }
}

class ArbolBinario {
  constructor() {
    this.raiz = null;
    this.inorden = [];
    this.preorden = [];
    this.postorden = [];
  }

  insertar(valor) {
    const nuevoNodo = new Nodo(valor);
    
    if (this.raiz === null) {
      this.raiz = nuevoNodo;
      return;
    }
    
    this.insertarNodo(this.raiz, nuevoNodo);
  }
  
  insertarNodo(nodo, nuevoNodo) {
    if (nuevoNodo.valor < nodo.valor) {
      if (nodo.izquierdo === null) {
        nodo.izquierdo = nuevoNodo;
      } else {
        this.insertarNodo(nodo.izquierdo, nuevoNodo);
      }
    } else {
      if (nodo.derecho === null) {
        nodo.derecho = nuevoNodo;
      } else {
        this.insertarNodo(nodo.derecho, nuevoNodo);
      }
    }
  }
  
  // Recorrido en inorden (izquierda, raíz, derecha)
  recorridoInorden(nodo = this.raiz, resultado = []) {
    if (nodo !== null) {
      this.recorridoInorden(nodo.izquierdo, resultado);
      resultado.push(nodo.valor);
      this.recorridoInorden(nodo.derecho, resultado);
    }
    return resultado;
  }
  
  // Recorrido en preorden (raíz, izquierda, derecha)
  recorridoPreorden(nodo = this.raiz, resultado = []) {
    if (nodo !== null) {
      resultado.push(nodo.valor);
      this.recorridoPreorden(nodo.izquierdo, resultado);
      this.recorridoPreorden(nodo.derecho, resultado);
    }
    return resultado;
  }
  
  // Recorrido en postorden (izquierda, derecha, raíz)
  recorridoPostorden(nodo = this.raiz, resultado = []) {
    if (nodo !== null) {
      this.recorridoPostorden(nodo.izquierdo, resultado);
      this.recorridoPostorden(nodo.derecho, resultado);
      resultado.push(nodo.valor);
    }
    return resultado;
  }
  
  // Construir árbol desde recorridos inorden y preorden
  construirDesdeInordenYPreorden(inorden, preorden) {
    if (inorden.length === 0 || preorden.length === 0) return null;
    this.raiz = this.construirDesdeInPreRecursivo(inorden, preorden, 0, inorden.length - 1, 0, preorden.length - 1);
    this.actualizarRecorridos();
    return this.raiz;
  }
  construirDesdeInPreRecursivo(inorden, preorden, inInicio, inFin, preInicio, preFin) {
    if (inInicio > inFin || preInicio > preFin) return null;
    
    const valorRaiz = preorden[preInicio];
    const nuevoNodo = new Nodo(valorRaiz);
    
    // Encontrar posición de la raíz en inorden
    let posicionRaiz = inInicio;
    for (let i = inInicio; i <= inFin; i++) {
      if (inorden[i] === valorRaiz) {
        posicionRaiz = i;
        break;
      }
    }
    const tamanoIzquierdo = posicionRaiz - inInicio;
    nuevoNodo.izquierdo = this.construirDesdeInPreRecursivo(
      inorden, preorden, 
      inInicio, posicionRaiz - 1, 
      preInicio + 1, preInicio + tamanoIzquierdo
    );
    
    nuevoNodo.derecho = this.construirDesdeInPreRecursivo(
      inorden, preorden, 
      posicionRaiz + 1, inFin, 
      preInicio + tamanoIzquierdo + 1, preFin
    );
    
    return nuevoNodo;
    
  }
  
  // Construir árbol desde recorridos inorden y postorden
  construirDesdeInordenYPostorden(inorden, postorden) {
    if (inorden.length === 0 || postorden.length === 0) return null;
    this.raiz = this.construirDesdeInPostRecursivo(inorden, postorden, 0, inorden.length - 1, 0, postorden.length - 1);
    this.actualizarRecorridos();
    return this.raiz;
  }
  
  construirDesdeInPostRecursivo(inorden, postorden, inInicio, inFin, postInicio, postFin) {
    if (inInicio > inFin || postInicio > postFin) return null;
    
    const valorRaiz = postorden[postFin];
    const nuevoNodo = new Nodo(valorRaiz);
    
    let posicionRaiz = inInicio;
    for (let i = inInicio; i <= inFin; i++) {
      if (inorden[i] === valorRaiz) {
        posicionRaiz = i;
        break;
      }
    }
    
    const tamanoIzquierdo = posicionRaiz - inInicio;
    
    nuevoNodo.izquierdo = this.construirDesdeInPostRecursivo(
      inorden, postorden, 
      inInicio, posicionRaiz - 1, 
      postInicio, postInicio + tamanoIzquierdo - 1
    );
    
    nuevoNodo.derecho = this.construirDesdeInPostRecursivo(
      inorden, postorden, 
      posicionRaiz + 1, inFin, 
      postInicio + tamanoIzquierdo, postFin - 1
    );
    
    return nuevoNodo;
  }
  
  // Construir árbol desde recorridos preorden y postorden
  construirDesdePreordenYPostorden(preorden, postorden) {
    if (preorden.length === 0 || postorden.length === 0) return null;
    const n = preorden.length;
    if (n === 1) {
      return new Nodo(preorden[0]);
    }
    const valorRaiz = preorden[0];
    const nuevoNodo = new Nodo(valorRaiz);
    const valorIzqPreorden = preorden[1];
    let posicionIzqPostorden = -1;
    for (let i = 0; i < n; i++) {
      if (postorden[i] === valorIzqPreorden) {
        posicionIzqPostorden = i;
        break;
      }
    }
    
    const tamanoIzquierdo = posicionIzqPostorden + 1;
    const preordenIzquierdo = preorden.slice(1, tamanoIzquierdo + 1);
    const preordenDerecho = preorden.slice(tamanoIzquierdo + 1);
    const postordenIzquierdo = postorden.slice(0, tamanoIzquierdo);
    const postordenDerecho = postorden.slice(tamanoIzquierdo, n - 1);
    
    if (preordenIzquierdo.length > 0 && postordenIzquierdo.length > 0) {
      nuevoNodo.izquierdo = this.construirDesdePreordenYPostorden(preordenIzquierdo, postordenIzquierdo);
    }
    
    if (preordenDerecho.length > 0 && postordenDerecho.length > 0) {
      nuevoNodo.derecho = this.construirDesdePreordenYPostorden(preordenDerecho, postordenDerecho);
    }
    
    this.raiz = nuevoNodo;
    this.actualizarRecorridos();
    return nuevoNodo;
  }
  
  actualizarRecorridos() {
    this.inorden = this.recorridoInorden(this.raiz, []);
    this.preorden = this.recorridoPreorden(this.raiz, []);
    this.postorden = this.recorridoPostorden(this.raiz, []);
  }
  
  // Altura del árbol
  getAltura(nodo = this.raiz) {
    if (nodo === null) return 0;
    const alturaIzquierda = this.getAltura(nodo.izquierdo);
    const alturaDerecha = this.getAltura(nodo.derecho);
    return Math.max(alturaIzquierda, alturaDerecha) + 1;
  }
  
  // Convertir a formato serializable para JSON
  toJSON() {
    return {
      arbol: this.serializarArbol(this.raiz),
      recorridos: {
        inorden: this.inorden,
        preorden: this.preorden,
        postorden: this.postorden
      }
    };
  }
  
  // Serializar árbol para JSON
  serializarArbol(nodo) {
    if (nodo === null) return null;
    return {
      valor: nodo.valor,
      izquierdo: this.serializarArbol(nodo.izquierdo),
      derecho: this.serializarArbol(nodo.derecho)
    };
  }
  
  // Deserializar árbol desde JSON
  static fromJSON(jsonData) {
    const arbol = new ArbolBinario();
    arbol.raiz = ArbolBinario.deserializarArbol(jsonData.arbol);
    arbol.actualizarRecorridos();
    return arbol;
  }
  
  // Deserializar nodo desde JSON
  static deserializarArbol(nodoJSON) {
    if (nodoJSON === null) return null;
    
    const nodo = new Nodo(nodoJSON.valor);
    nodo.izquierdo = ArbolBinario.deserializarArbol(nodoJSON.izquierdo);
    nodo.derecho = ArbolBinario.deserializarArbol(nodoJSON.derecho);
    
    return nodo;
  }
}

// Variables globales
let arbol = new ArbolBinario(); 
const canvas = document.getElementById('treeCanvas');
const ctx = canvas.getContext('2d');

// Función para dibujar el árbol
function dibujarArbol() {
  const input = document.getElementById('inputNumeros').value;
  const numerosOriginales = input
    .split(',')
    .map(num => parseInt(num.trim()))
    .filter(num => !isNaN(num));

  if (numerosOriginales.length === 0) {
    alert("Por favor ingrese números válidos separados por comas.");
    return;
  }

  const numeros = numerosOriginales.filter((num, index) => numerosOriginales.indexOf(num) === index);
  arbol = new ArbolBinario();
  numeros.forEach(num => arbol.insertar(num));
  arbol.actualizarRecorridos();
  dibujarArbolEnCanvas();
  mostrarRecorridos();
}
// Función para vaciar el árbol en el canvas
function vaciarArbolEnCanvas() {
  const canvas = document.getElementById('treeCanvas');
  const ctx = canvas.getContext('2d');
  document.getElementById('btn-Vaciar').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    console.log("Canvas limpiado!"); 
  });
}
vaciarArbolEnCanvas();
// Función para dibujar el árbol en el canvas
function dibujarArbolEnCanvas() {
  // Limpiar canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (!arbol || !arbol.raiz) {
    console.error("No hay árbol para dibujar");
    return;
  }
  
  console.log("Dibujando árbol con raíz:", arbol.raiz.valor);
  
  const altura = arbol.getAltura();
  console.log("Altura del árbol:", altura);
  
  // Ajustar propiedades para el dibujo
  const anchuraNodo = 40;
  const alturaNodo = 40;
  const espacioVertical = 70;
  
  // Punto inicial de dibujo (centro superior)
  const x0 = canvas.width / 2;
  const y0 = 50;
  
  // El offset inicial se ajusta según el tamaño del árbol
  const offsetInicial = Math.min(canvas.width / 4, 200);
  
  dibujarNodo(arbol.raiz, x0, y0, offsetInicial, altura, anchuraNodo, alturaNodo, espacioVertical);
}
// Función para dibujar un nodo
function dibujarNodo(nodo, x, y, offset, nivel, anchuraNodo, alturaNodo, espacioVertical) {
  if (nodo === null) return;
  
  // Dibujar círculo para el nodo
  ctx.beginPath();
  ctx.arc(x, y, anchuraNodo / 2, 0, 2 * Math.PI);
  ctx.fillStyle = '#00969C';
  ctx.fill();
  ctx.strokeStyle = '#00E3C6';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Dibujar texto del valor
  ctx.fillStyle = 'white';
  ctx.font = '16px Rajdhani';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(nodo.valor, x, y);
  
  // Calcular offset para el próximo nivel
  const nuevoOffset = offset / 2;
  const nuevoY = y + espacioVertical;
  
  // Dibujar líneas a los hijos
  if (nodo.izquierdo !== null) {
    const xIzquierdo = x - nuevoOffset;
    ctx.beginPath();
    ctx.moveTo(x, y + alturaNodo / 2);
    ctx.lineTo(xIzquierdo, nuevoY - alturaNodo / 2);
    ctx.strokeStyle = '#00E3C6';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    dibujarNodo(nodo.izquierdo, xIzquierdo, nuevoY, nuevoOffset, nivel - 1, anchuraNodo, alturaNodo, espacioVertical);
  }
  
  if (nodo.derecho !== null) {
    const xDerecho = x + nuevoOffset;
    ctx.beginPath();
    ctx.moveTo(x, y + alturaNodo / 2);
    ctx.lineTo(xDerecho, nuevoY - alturaNodo / 2);
    ctx.strokeStyle = '#00E3C6';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    dibujarNodo(nodo.derecho, xDerecho, nuevoY, nuevoOffset, nivel - 1, anchuraNodo, alturaNodo, espacioVertical);
  }
}

function mostrarInput() {
  const inputContainer = document.getElementById('inputContainer');
  inputContainer.style.display = inputContainer.style.display === 'none' ? 'block' : 'none';
}

function toggleOpciones() {
  const opcionesOrden = document.getElementById('opcionesOrden');
  opcionesOrden.style.display = opcionesOrden.style.display === 'none' ? 'block' : 'none';
  
  if (opcionesOrden.style.display === 'none') {
    document.getElementById('inputsOrden').style.display = 'none';
  }
}

function verificarSeleccion() {
  const checkboxes = document.querySelectorAll('#opcionesOrden input[type="checkbox"]');
  const inputsOrden = document.getElementById('inputsOrden');
  let seleccionados = 0;
  checkboxes.forEach(checkbox => {
    if (checkbox.checked) seleccionados++;
  });
  inputsOrden.style.display = seleccionados >= 2 ? 'block' : 'none';
  document.getElementById('inordenInput').style.display = 
    document.querySelector('input[value="inorden"]').checked ? 'block' : 'none';
  document.getElementById('preordenInput').style.display = 
    document.querySelector('input[value="preorden"]').checked ? 'block' : 'none';
  document.getElementById('postordenInput').style.display = 
    document.querySelector('input[value="postorden"]').checked ? 'block' : 'none';
}
// Para mandar el arbol al canvas a partir de 2 ordenamientos
function reconstruirYMostrar() {
  const inordenCheck = document.querySelector('input[value="inorden"]').checked;
  const preordenCheck = document.querySelector('input[value="preorden"]').checked;
  const postordenCheck = document.querySelector('input[value="postorden"]').checked;
  
  let inordenValores = inordenCheck ? 
    document.getElementById('inordenTxt').value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n)) : [];
  let preordenValores = preordenCheck ? 
    document.getElementById('preordenTxt').value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n)) : [];
  let postordenValores = postordenCheck ? 
    document.getElementById('postordenTxt').value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n)) : [];

  // Verificación de 2 recorridos seleccionados
  const selectedCount = [inordenCheck, preordenCheck, postordenCheck].filter(Boolean).length;
  if (selectedCount !== 2) {
    alert("Debe seleccionar exactamente 2 tipos de recorrido para reconstruir el árbol.");
    return;
  }

  try {
    arbol = new ArbolBinario();
    if (inordenCheck && inordenValores.length === 0 || 
        (preordenCheck && preordenValores.length === 0) || 
        (postordenCheck && postordenValores.length === 0)) {
      alert("Por favor ingresa valores válidos en los recorridos seleccionados.");
      return;
    }
    
    // Verificar que los arrays seleccionados tengan la misma longitud
    let longitud1, longitud2;
    if (inordenCheck && preordenCheck) {
      longitud1 = inordenValores.length;
      longitud2 = preordenValores.length;
    } else if (inordenCheck && postordenCheck) {
      longitud1 = inordenValores.length;
      longitud2 = postordenValores.length;
    } else if (preordenCheck && postordenCheck) {
      longitud1 = preordenValores.length;
      longitud2 = postordenValores.length;
    }
    
    if (longitud1 !== longitud2) {
      alert("Los recorridos seleccionados deben tener el mismo número de elementos.");
      return;
    }
    
    // Verificar que los arrays seleccionados tengan los mismos valores
    let array1, array2;
    if (inordenCheck && preordenCheck) {
      array1 = [...inordenValores].sort();
      array2 = [...preordenValores].sort();
    } else if (inordenCheck && postordenCheck) {
      array1 = [...inordenValores].sort();
      array2 = [...postordenValores].sort();
    } else if (preordenCheck && postordenCheck) {
      array1 = [...preordenValores].sort();
      array2 = [...postordenValores].sort();
    }
    
    let valoresCoinciden = true;
    for (let i = 0; i < array1.length; i++) {
      if (array1[i] !== array2[i]) {
        valoresCoinciden = false;
        break;
      }
    }

    // Si los valores no coinciden, mostramos el mensaje de error
    if (!valoresCoinciden) {
      alert('Los valores no coinciden entre los recorridos seleccionados');
      return;
    }
    
    if (inordenCheck && preordenCheck) {
      arbol.construirDesdeInordenYPreorden(inordenValores, preordenValores);
      console.log("Árbol construido desde inorden y preorden");
      document.getElementById('postordenTxt').value = arbol.postorden.join(', ');
    } else if (inordenCheck && postordenCheck) {
      arbol.construirDesdeInordenYPostorden(inordenValores, postordenValores);
      console.log("Árbol construido desde inorden y postorden");
      document.getElementById('preordenTxt').value = arbol.preorden.join(', ');
    } else if (preordenCheck && postordenCheck) {
      alert('No se puede generar el arbol a partir de los recorridos preorden y post orden');
      return;
    }
    arbol.actualizarRecorridos();
    console.log("Árbol reconstruido:", arbol);
    console.log("Raíz:", arbol.raiz);
    console.log("Altura:", arbol.getAltura());
    console.log("Recorridos:", {
      inorden: arbol.inorden,
      preorden: arbol.preorden,
      postorden: arbol.postorden
    });
    dibujarArbolEnCanvas();
    mostrarResultado();
  } catch (error) {
    console.error("Error al reconstruir el árbol:", error);
    alert("Error al reconstruir el árbol: " + error.message);
  }
}
function mostrarResultado() {
  const inordenCheck = document.querySelector('input[value="inorden"]').checked;
  const preordenCheck = document.querySelector('input[value="preorden"]').checked;
  const postordenCheck = document.querySelector('input[value="postorden"]').checked;
  
  let resultado = "";
  
  if (!inordenCheck) {
    resultado = "InOrden: " + arbol.inorden.join(", ");
  } else if (!preordenCheck) {
    resultado = "PreOrden: " + arbol.preorden.join(", ");
  } else if (!postordenCheck) {
    resultado = "PostOrden: " + arbol.postorden.join(", ");
  }
  
  document.getElementById('resultadoTexto').textContent = resultado;
  document.getElementById('modalResultado').style.display = 'block';
}

function mostrarRecorridos() {
  document.getElementById('resultadoInOrder').textContent = "InOrden: " + arbol.inorden.join(", ");
  document.getElementById('resultadoPreOrder').textContent = "PreOrden: " + arbol.preorden.join(", ");
  document.getElementById('resultadoPostOrder').textContent = "PostOrden: " + arbol.postorden.join(", ");
  document.getElementById('modalMostrarRecorrido').style.display = 'block';
}

function cerrarModal() {
  document.getElementById('modalResultado').style.display = 'none';
}

function cerrarModal2() {
  document.getElementById('modalMostrarRecorrido').style.display = 'none';
}

// Funciones para importar y exportar el árbol en formato JSON
document.getElementById('btn-Import').addEventListener('click', importarArbol);
document.getElementById('btn-Export').addEventListener('click', exportarArbol);

function importarArbol() {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);
  
  fileInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) {
      document.body.removeChild(fileInput);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const jsonData = JSON.parse(e.target.result);
        arbol = ArbolBinario.fromJSON(jsonData);
        dibujarArbolEnCanvas();
        mostrarRecorridos();
        document.body.removeChild(fileInput);
      } catch (error) {
        alert("Error al importar el árbol: " + error.message);
        document.body.removeChild(fileInput);
      }
    };
    
    reader.readAsText(file);
  });
  
  // Simular clic en el input de archivo
  fileInput.click();
}

function exportarArbol() {
  if (!arbol || !arbol.raiz) {
    alert("No hay un árbol para exportar. Por favor, genere un árbol primero.");
    return;
  }
  const nombreArchivo = prompt("Ingrese el nombre del archivo para guardar (sin extensión):", "arbol_binario");
  if (!nombreArchivo) return; 
  
  const jsonData = JSON.stringify(arbol.toJSON(), null, 2);
  
  const blob = new Blob([jsonData], { type: 'application/json' });
  
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo + '.json';
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}
//help
document.getElementById('btn-Help').addEventListener('click', mostrarAyuda);
function mostrarAyuda() {
  const rutaPDF = 'helps/arboleshelp.pdf';
  window.open(rutaPDF, '_blank');
}