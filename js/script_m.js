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
            const response = await fetch('http://localhost:5001/laplace', {
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

});