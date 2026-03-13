// Configuración de Datos del Anexo 3
const servicios = [
    { id: 1, nombre: "Intermediación laboral y tercerización", porcentaje: 12 },
    { id: 2, nombre: "Arrendamiento de bienes", porcentaje: 10 },
    { id: 3, nombre: "Mantenimiento y reparación de bienes muebles", porcentaje: 12 },
    { id: 4, nombre: "Movimiento de carga", porcentaje: 10 },
    { id: 5, nombre: "Otros servicios empresariales", porcentaje: 12 },
    { id: 6, nombre: "Comisión mercantil", porcentaje: 10 },
    { id: 7, nombre: "Fabricación de bienes por encargo", porcentaje: 10 },
    { id: 8, nombre: "Servicio de transporte de personas", porcentaje: 12 },
    { id: 9, nombre: "Contratos de construcción", porcentaje: 4 },
    { id: 10, nombre: "Demás servicios gravados con el IGV", porcentaje: 12 }
];

// Variables globales para los elementos del DOM
let selectServicio, selectMoneda, inputMonto, inputTC, inputFecha, contTC, simboloMoneda;
let displayTasa, displayDetraccion, displayNeto, alertaMonto, resumenValores;

/**
 * Inicialización de la aplicación
 * Configura los elementos del DOM, carga datos y asigna eventos.
 */
function init() {
    // Vincular elementos del DOM por su ID (deben coincidir con el index.html)
    selectServicio = document.getElementById('tipoServicio');
    selectMoneda = document.getElementById('moneda');
    inputMonto = document.getElementById('montoTotal');
    inputTC = document.getElementById('tipoCambio');
    inputFecha = document.getElementById('fechaEmision');
    contTC = document.getElementById('contenedorTC');
    simboloMoneda = document.getElementById('simboloMoneda');

    displayTasa = document.getElementById('tasaTexto');
    displayDetraccion = document.getElementById('montoDetraccion');
    displayNeto = document.getElementById('montoNeto');
    alertaMonto = document.getElementById('alertaMontoMinimo');
    resumenValores = document.getElementById('resumenValores');

    // Validación crítica: Si no existen los elementos, detenemos el script
    if (!selectServicio || !inputMonto) {
        console.error("Error: Elementos del DOM no encontrados. Verifica los IDs en tu index.html");
        return;
    }

    // Poblar el selector de servicios dinámicamente
    selectServicio.innerHTML = '';
    servicios.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.nombre} (${s.porcentaje}%)`;
        selectServicio.appendChild(opt);
    });

    // Establecer la fecha predeterminada como el día de hoy (Formato YYYY-MM-DD)
    const hoy = new Date().toISOString().split('T')[0];
    inputFecha.value = hoy;

    // Registrar eventos para cálculo en tiempo real (input y change)
    const interactivos = [selectServicio, selectMoneda, inputMonto, inputTC, inputFecha];
    interactivos.forEach(el => {
        if (el) {
            el.addEventListener('input', calcular);
            el.addEventListener('change', calcular);
        }
    });

    // Inicialización de Iconos Lucide (compatibilidad con carga externa)
    try {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    } catch (e) {
        console.warn("Lucide Icons no se pudo cargar inmediatamente.");
    }

    // Ejecutar el cálculo inicial por si el navegador recuerda valores anteriores
    calcular();
}

/**
 * Lógica principal para procesar las detracciones
 */
function calcular() {
    if (!selectServicio || !inputMonto) return;

    // Obtener valores actuales de la interfaz
    const srvId = parseInt(selectServicio.value);
    const srv = servicios.find(s => s.id === srvId) || servicios[0];
    const montoFactura = parseFloat(inputMonto.value) || 0;
    const monedaSeleccionada = selectMoneda.value;
    const tcIngresado = parseFloat(inputTC.value) || 0;

    // Gestión visual según la moneda
    if (monedaSeleccionada === 'USD') {
        if (contTC) contTC.classList.remove('hidden');
        if (simboloMoneda) simboloMoneda.textContent = '$';
    } else {
        if (contTC) contTC.classList.add('hidden');
        if (simboloMoneda) simboloMoneda.textContent = 'S/';
    }

    // Conversión a Soles (Base para validación de tope SUNAT)
    // Nota: Si es USD y el TC no se ha ingresado, se asume 0 para no forzar cálculos erróneos
    const tcParaCalculo = (monedaSeleccionada === 'USD') ? tcIngresado : 1;
    const importeEnSoles = montoFactura * tcParaCalculo;
    
    // SUNAT Anexo 3: Aplica detracción si el monto supera los S/ 700.00
    const superaMontoMinimo = importeEnSoles > 700;

    // Control de alertas visuales
    if (montoFactura > 0) {
        if (superaMontoMinimo) {
            if (alertaMonto) alertaMonto.classList.add('hidden');
            if (resumenValores) resumenValores.classList.remove('hidden');
        } else {
            if (alertaMonto) alertaMonto.classList.remove('hidden');
            if (resumenValores) resumenValores.classList.add('hidden');
        }
    } else {
        if (alertaMonto) alertaMonto.classList.add('hidden');
        if (resumenValores) resumenValores.classList.add('hidden');
    }

    // Cálculo del importe de detracción: Siempre se deposita en Soles y se redondea sin decimales
    const detraccionSoles = Math.round(importeEnSoles * (srv.porcentaje / 100));
    
    // Cálculo del Neto a pagar al proveedor (Monto factura menos el descuento de detracción)
    let montoNetoPagar;
    if (monedaSeleccionada === 'PEN') {
        montoNetoPagar = montoFactura - detraccionSoles;
    } else {
        // En dólares, descontamos el equivalente de la detracción soles usando el TC
        const detraccionEnDolares = (tcIngresado > 0) ? detraccionSoles / tcIngresado : 0;
        montoNetoPagar = montoFactura - detraccionEnDolares;
    }

    // Formatear y mostrar resultados en la interfaz
    if (displayTasa) displayTasa.textContent = `${srv.porcentaje}%`;
    
    if (displayDetraccion) {
        displayDetraccion.textContent = new Intl.NumberFormat('es-PE', { 
            style: 'currency', 
            currency: 'PEN',
            maximumFractionDigits: 0 
        }).format(detraccionSoles);
    }

    if (displayNeto) {
        displayNeto.textContent = new Intl.NumberFormat('es-PE', { 
            style: 'currency', 
            currency: monedaSeleccionada 
        }).format(montoNetoPagar > 0 ? montoNetoPagar : 0);
    }
}

// Ejecución segura tras la carga completa del documento
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
