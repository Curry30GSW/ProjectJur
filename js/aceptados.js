const token = sessionStorage.getItem('token');
let resultados = '';
if (!token) {
    Swal.fire({
        title: 'Sesión expirada',
        text: 'Su sesión ha finalizado. Por favor ingrese nuevamente.',
        icon: 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3085d6',
        allowOutsideClick: false,
        allowEscapeKey: false
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = '../pages/login.html';
        }
    });

    setTimeout(() => {
        window.location.href = '../pages/login.html';
    }, 5000);
}

document.addEventListener('DOMContentLoaded', () => {
    if (!sessionStorage.getItem('token')) {
        window.location.href = '../pages/login.html';
        return;
    }
    obtenerClientes();
});





async function obtenerClientes() {
    try {
        const token = sessionStorage.getItem('token');
        const url = 'http://localhost:3000/api/embargo/aceptados';

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Error en la solicitud');

        clientes = await response.json();

        if (!Array.isArray(clientes) || clientes.length === 0) {
            Swal.fire({
                title: 'Sin registros',
                text: 'No se encontraron Clientes en la base de datos.',
                icon: 'info',
                confirmButtonText: 'Entendido',
                allowOutsideClick: false,
                allowEscapeKey: false
            });
            return;
        }

        mostrar(clientes);

    } catch (error) {
        console.error('❌ Error en clientes:', error);
        Swal.fire('Error', 'No se pudo obtener la información.', 'error');
    }
}


const mostrar = (clientes) => {
    const formatearFecha = (fecha) => {
        if (!fecha) return 'NO APLICA';

        const dateObj = new Date(fecha);
        if (isNaN(dateObj)) return 'NO APLICA';

        const dia = dateObj.getDate();
        const meses = [
            'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
            'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'
        ];
        const mes = meses[dateObj.getMonth()];
        const anio = dateObj.getFullYear();

        return `${dia}/${mes}/${anio}`;
    };

    let resultados = '';

    clientes.forEach((cliente) => {
        let estadoEmbargoTexto = '';
        let estadoEmbargoClase = '';
        let botonPDF = '';

        // 🔹 Validar si cliente está retirado
        if (cliente.estado === 1) {
            estadoEmbargoTexto = 'Cliente Retirado';
            estadoEmbargoClase = 'badge badge-md bg-gradient-purple'; // badge morado

            // Botón PDF deshabilitado
            botonPDF = `
                <button class="btn btn-md btn-secondary text-white" disabled>
                    <i class="fas fa-ban"></i> Inactivo
                </button>
            `;
        } else {
            // Estados normales
            if (cliente.estado_embargo === 1) {
                estadoEmbargoTexto = 'RECHAZADO';
                estadoEmbargoClase = 'badge badge-md bg-gradient-danger blink';
            } else if (cliente.estado_embargo === 0) {
                estadoEmbargoTexto = 'ACEPTADO';
                estadoEmbargoClase = 'badge badge-md bg-gradient-success blink';
            } else {
                estadoEmbargoTexto = 'PENDIENTE';
                estadoEmbargoClase = 'badge badge-md bg-gradient-warning text-dark blink';
            }

            // Botones PDF según disponibilidad
            if (cliente.ruta_desprendible && cliente.ruta_desprendible !== '') {
                botonPDF = `
                    <a class="btn btn-md btn-info visualizar-pdf" 
                       href="http://localhost:3000/uploads/${cliente.ruta_desprendible}" 
                       target="_blank">
                        <i class="fas fa-eye"></i> Ver
                    </a>
                `;
            } else {
                botonPDF = `
                    <button class="btn btn-md btn-danger subir-pdf" 
                        data-id="${cliente.id_embargos}"
                        data-cedula="${cliente.cedula}"
                        data-nombre="${cliente.nombres} ${cliente.apellidos}">
                        <i class="fas fa-file-upload"></i> PDF
                    </button>
                `;
            }
        }

        resultados += `
            <tr>
                <td class="align-middle">
                    <div class="d-flex align-items-center px-2 py-1">
                        <div>
                            <img src="http://localhost:3000${cliente.foto_perfil}" 
                                class="avatar avatar-lg me-3 foto-cliente" 
                                alt="${cliente.nombres}"
                                data-src="http://localhost:3000${cliente.foto_perfil}">
                        </div>
                        <div class="d-flex flex-column justify-content-center">
                            <span class="text-xs font-weight-bold text-dark mb-1">${cliente.nombres} ${cliente.apellidos}</span>
                            <span class="text-xs text-secondary text-dark">${cliente.cedula}</span>
                        </div>
                    </div>
                </td>
                <td class="text-center align-middle">
                    <span class="text-sm font-weight-bold text-dark">${cliente.radicado}</span>
                </td>
                <td class="text-center align-middle">
                    <span class="${estadoEmbargoClase}">${estadoEmbargoTexto}</span>
                </td>
                <td class="text-center align-middle">
                    ${botonPDF}
                </td>
                <td class="text-center align-middle">
                    <span class="text-sm font-weight-bold text-dark">${formatearFecha(cliente.fecha_terminacion)}</span>
                </td>
            </tr>
        `;
    });

    if ($.fn.DataTable.isDataTable('#tablaClientes')) {
        $('#tablaClientes').DataTable().clear().destroy();
    }

    $("#tablaClientes tbody").html(resultados);

    $('#tablaClientes').DataTable({
        pageLength: 5,
        lengthMenu: [5, 10, 25, 50, 100],
        order: [[4, 'desc']],
        language: {
            sProcessing: "Procesando...",
            sLengthMenu: "Mostrar _MENU_ registros",
            sZeroRecords: "No se encontraron resultados",
            sEmptyTable: "Ningún dato disponible en esta tabla",
            sInfo: "Mostrando del _START_ al _END_ de _TOTAL_ registros",
            sInfoEmpty: "Mostrando 0 a 0 de 0 registros",
            sInfoFiltered: "(filtrado de un total de _MAX_ registros)",
            sSearch: "Buscar:",
            oPaginate: {
                sNext: "Siguiente",
                sPrevious: "Anterior"
            }
        }
    });
};





$(document).on('click', '.foto-cliente', function () {
    const src = $(this).data('src');
    $('#imagen-modal').attr('src', src);

    const modal = new bootstrap.Modal(document.getElementById('modalFoto'));
    modal.show();
});


document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', function (e) {
        if (e.target.closest('.subir-pdf')) {
            const btn = e.target.closest('.subir-pdf');
            const nombre = btn.getAttribute('data-nombre');
            const cedula = btn.getAttribute('data-cedula');
            const id_embargos = btn.getAttribute('data-id');

            document.getElementById('nombreClienteModal').textContent = nombre;
            document.getElementById('cedulaClienteModal').textContent = cedula;
            document.getElementById('cedulaClienteSeleccionado').value = cedula;
            document.getElementById('idEmbargoSeleccionado').value = id_embargos;

            // Limpiar input file y vista previa
            const fileInput = document.getElementById('inputDesprendible');
            const fileNameDisplay = document.getElementById('inputDesprendibleFileNameDisplay');
            const previewFrame = document.getElementById('pdfPreview');
            const previewContainer = document.getElementById('pdfPreviewContainer');
            const uploadLabel = document.querySelector('label[for="inputDesprendible"]');

            fileInput.value = '';
            fileNameDisplay.textContent = 'Ningún archivo seleccionado';
            previewFrame.src = '';
            previewContainer.style.display = 'none';

            uploadLabel.classList.remove('has-file');
            uploadLabel.querySelector('.file-upload-text').textContent = 'Seleccionar archivo PDF';

            // Mostrar la modal
            const modal = new bootstrap.Modal(document.getElementById('modalDesprendible'));
            modal.show();
        }
    });

    // Escuchar cambios en el input de tipo file
    document.getElementById('inputDesprendible').addEventListener('change', function () {
        const file = this.files[0];
        const fileNameDisplay = document.getElementById('inputDesprendibleFileNameDisplay');
        const pdfPreview = document.getElementById('pdfPreview');
        const pdfContainer = document.getElementById('pdfPreviewContainer');
        const uploadLabel = document.querySelector('label[for="inputDesprendible"]');

        if (file) {
            fileNameDisplay.textContent = file.name;

            if (file.type === 'application/pdf') {
                const fileURL = URL.createObjectURL(file);
                pdfPreview.src = fileURL;
                pdfContainer.style.display = 'block';
            } else {
                pdfPreview.src = '';
                pdfContainer.style.display = 'none';
            }

            // Cambiar color del label y texto
            uploadLabel.classList.add('has-file');
            uploadLabel.querySelector('.file-upload-text').textContent = 'Archivo seleccionado';
        } else {
            fileNameDisplay.textContent = 'Ningún archivo seleccionado';
            pdfPreview.src = '';
            pdfContainer.style.display = 'none';

            uploadLabel.classList.remove('has-file');
            uploadLabel.querySelector('.file-upload-text').textContent = 'Seleccionar archivo PDF';
        }
    });
});


document.getElementById('btnConfirmarDesprendible').addEventListener('click', async () => {
    const fileInput = document.getElementById('inputDesprendible');
    const idEmbargos = document.getElementById('idEmbargoSeleccionado').value; // Debes tener este campo en el HTML
    const estadoEmbargo = 0; // Estado que deseas actualizar

    if (!fileInput.files[0]) {
        return Swal.fire({
            icon: 'warning',
            title: 'Archivo faltante',
            text: 'Por favor selecciona un archivo PDF.'
        });
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('id_embargos', idEmbargos);
    formData.append('estado_embargo', estadoEmbargo); // Esto actualiza el estado si lo necesitas

    try {
        const response = await fetch('http://localhost:3000/api/subir-desprendible-embargos', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalDesprendible'));
            modal.hide();

            await Swal.fire({
                icon: 'success',
                title: 'Documento Cargado Exitosamente',
                confirmButtonColor: '#198754'
            });

            // Aquí llamas tu función para actualizar la tabla
            obtenerClientes();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: result.message || 'Error al subir el archivo.'
            });
        }
    } catch (error) {
        console.error('Error en la solicitud:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error de red',
            text: 'Ocurrió un error al subir el documento.'
        });
    }
});



// Función para alternar estado de leído
function toggleLeido(id) {
    const notificacion = document.getElementById(id);
    if (!notificacion) return;

    // Determinar si actualmente está marcada como leída
    const esLeida = notificacion.classList.contains('notificacion-leida');

    // Alternar clase CSS
    notificacion.classList.toggle('notificacion-leida');

    // Actualizar el botón
    const botonLeido = notificacion.querySelector('button[onclick*="toggleLeido"]');
    if (botonLeido) {
        if (esLeida) {
            botonLeido.innerHTML = '<i class="fa fa-check me-1"></i> Marcar como leído';
            botonLeido.classList.remove('btn-outline-success');
            botonLeido.classList.add('btn-outline-secondary');
        } else {
            botonLeido.innerHTML = '<i class="fa fa-check-circle me-1"></i> Leído';
            botonLeido.classList.remove('btn-outline-secondary');
            botonLeido.classList.add('btn-outline-success');
        }
    }

    // Actualizar localStorage
    try {
        let notificacionesLeidas = JSON.parse(localStorage.getItem('notificacionesLeidas') || '[]');

        if (esLeida) {
            // Quitar de la lista si estaba marcada
            notificacionesLeidas = notificacionesLeidas.filter(item => item !== id);
        } else {
            // Agregar a la lista si no estaba marcada
            if (!notificacionesLeidas.includes(id)) {
                notificacionesLeidas.push(id);
            }
        }

        localStorage.setItem('notificacionesLeidas', JSON.stringify(notificacionesLeidas));

    } catch (e) {
        console.error('Error al actualizar localStorage:', e);
    }
}

// Función para verificar notificaciones (actualizada)
async function verificarNotificacionesTerminacion() {
    try {
        const token = sessionStorage.getItem('token');
        const url = 'http://localhost:3000/api/embargo/aceptados';
        const contenedor = document.getElementById("notificaciones-contenedor");

        // Mostrar estado de carga
        contenedor.innerHTML = '<div class="text-center py-3"><i class="fas fa-spinner fa-spin"></i> Cargando notificaciones...</div>';
        contenedor.classList.remove('scroll-active');

        // Obtener datos del endpoint
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Error en la solicitud');

        const clientes = await response.json();

        if (!Array.isArray(clientes) || clientes.length === 0) {
            contenedor.innerHTML = `
                <div class="alerta-toast alerta-vacia">
                    <h4>✅ No hay clientes con embargos aceptados.</h4>
                </div>`;
            return;
        }

        // Filtrar clientes con fecha de terminación hoy
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const clientesHoy = clientes.filter(cliente => {
            if (!cliente.fecha_terminacion) return false;
            const fechaTerminacion = new Date(cliente.fecha_terminacion);
            fechaTerminacion.setHours(0, 0, 0, 0);
            return fechaTerminacion.getTime() === hoy.getTime();
        });

        // Limpiar contenedor
        contenedor.innerHTML = '';

        // Cargar notificaciones leídas desde localStorage
        const notificacionesLeidas = JSON.parse(localStorage.getItem('notificacionesLeidas') || '[]');

        // Mostrar notificaciones
        clientesHoy.forEach((cliente, index) => {
            const id = `notificacion-terminacion-${index}`;
            const fechaFormateada = formatDate(cliente.fecha_terminacion);
            const esLeida = notificacionesLeidas.includes(id);

            const notificacionHTML = `
            <div class="ios-toast shadow-sm p-2 mb-2 rounded position-relative d-flex gap-2 align-items-start ${esLeida ? 'notificacion-leida' : ''}" 
                 id="${id}" style="font-size: 0.85rem;">
                <div class="flex-grow-1">
                    <h6 class="mb-1 fw-semibold text-dark" style="font-size: 0.95rem;">
                        <i class="fas fa-calendar-check text-primary me-1"></i> 
                        Terminación pendiente – ${cliente.nombres} ${cliente.apellidos}
                    </h6>
                    <p class="mb-1 text-muted small">
                        C.C. <strong>${cliente.cedula || 'N/D'}</strong> – Radicado: <strong>${cliente.radicado || 'N/D'}</strong>
                    </p>
                    <div class="alert alert-light border rounded px-2 py-1 mb-2" style="font-size: 0.8rem;">
                        <i class="fas fa-clock text-warning me-1"></i>
                        Fecha de terminación: ${fechaFormateada || 'N/D'}
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn ${esLeida ? 'btn-outline-success' : 'btn-outline-secondary'} rounded-pill btn-sm py-0 px-2" 
                                onclick="toggleLeido('${id}')">
                            <i class="fa ${esLeida ? 'fa-check-circle' : 'fa-check'} me-1"></i> 
                            ${esLeida ? 'Leído' : 'Marcar como leído'}
                        </button>
                    </div>
                </div>
                <span class="position-absolute end-0 bottom-0 me-2 mb-1 text-muted small">Hoy</span>
            </div>`;

            contenedor.insertAdjacentHTML("beforeend", notificacionHTML);
        });

        if (clientesHoy.length === 0) {
            contenedor.innerHTML = `
                <div class="alerta-toast alerta-vacia">
                    <h4>✅ No hay terminaciones pendientes para hoy.</h4>
                </div>`;
        } else {
            if (clientesHoy.length > 3) {
                contenedor.classList.add('scroll-active');
            }

            if (clientesHoy.length > 0) {
                Swal.fire({
                    title: 'Terminaciones pendientes',
                    text: `Tienes ${clientesHoy.length} terminación(es) que vencen hoy`,
                    icon: 'warning',
                    timer: 5000,
                    timerProgressBar: true,
                    showConfirmButton: true
                });
            }
        }

    } catch (error) {
        console.error('Error al verificar notificaciones:', error);
        const contenedor = document.getElementById("notificaciones-contenedor");
        contenedor.innerHTML = `
            <div class="alert alert-danger">
                Error al cargar notificaciones. Recargue la página.
            </div>`;
    }
}

// Función para limpiar todas las notificaciones leídas
function limpiarNotificacionesLeidas() {
    localStorage.removeItem('notificacionesLeidas');
    verificarNotificacionesTerminacion();
    Swal.fire({
        title: 'Notificaciones reiniciadas',
        text: 'Todas las notificaciones se han marcado como no leídas',
        icon: 'success',
        timer: 2000
    });
}

// Función para formatear fecha
function formatDate(dateString) {
    if (!dateString) return 'N/D';
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('es-CO', options);
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    verificarNotificacionesTerminacion();
    setInterval(verificarNotificacionesTerminacion, 3600000); // Actualizar cada hora
});