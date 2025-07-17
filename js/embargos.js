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


var dataTable;

$(document).ready(function () {
    inicializarTabla();

    obtenerClientes();

    // Configurar el buscador personalizado
    $('#searchInput').keyup(function () {
        dataTable.search($(this).val()).draw();
    });

    // Botón para refrescar
    $('#refreshTable').click(function () {
        obtenerClientes();
    });
});

function inicializarTabla() {
    dataTable = $('#tablaClientes').DataTable({
        dom: '<"top"<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>>rt<"bottom"<"row"<"col-sm-12 col-md-6"i><"col-sm-12 col-md-6"p>>><"clear">',
        language: {
            "decimal": "",
            "emptyTable": "No hay datos disponibles",
            "sInfo": "Datos del _START_ al _END_ para un total de _TOTAL_ registros",
            "sInfoEmpty": "Mostrando registros del 0 al 0 de un total de 0 registros",
            "infoFiltered": "(filtrado de _MAX_ registros totales)",
            "infoPostFix": "",
            "thousands": ",",
            "lengthMenu": "Mostrar _MENU_ registros",
            "loadingRecords": "Cargando...",
            "processing": "Procesando...",
            "search": "Buscar:",
            "zeroRecords": "No se encontraron registros coincidentes",
            "oPaginate": {
                "sNext": "Siguiente",
                "sPrevious": "Anterior"
            },
            "aria": {
                "sortAscending": ": activar para ordenar la columna ascendente",
                "sortDescending": ": activar para ordenar la columna descendente"
            }
        },
        lengthMenu: [5, 10, 25, 50, 100],
        pageLength: 5,
        responsive: true,
        order: [[2, 'desc']],
        columnDefs: [
            { orderable: false, targets: [3] },
            { className: "text-center", targets: [1, 2, 3] },
            { width: "30%", targets: [0] },
            { width: "20%", targets: [1] },
            { width: "20%", targets: [2] },
            { width: "30%", targets: [3] }
        ]
    });
}


async function obtenerClientes() {
    try {
        const token = sessionStorage.getItem('token');
        const url = 'http://localhost:3000/api/clientes-embargos';

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

        mostrarClientesEnTabla(clientes);


    } catch (error) {
        console.error('❌ Error en clientes:', error);
        Swal.fire('Error', 'No se pudo obtener la información.', 'error');
    }
}


function mostrarClientesEnTabla(clientes) {
    // Limpiar la tabla
    dataTable.clear();

    // Agregar los nuevos datos
    clientes.forEach((cliente) => {
        let estadoEmbargoTexto = '';
        let estadoEmbargoClase = '';

        if (cliente.estado_embargo === 1) {
            estadoEmbargoTexto = 'RECHAZADO';
            estadoEmbargoClase = 'blink bg-danger text-white px-2 rounded';
        } else if (cliente.estado_embargo === 0) {
            estadoEmbargoTexto = 'ACEPTADO';
            estadoEmbargoClase = 'blink bg-success text-white px-2 rounded';
        } else {
            estadoEmbargoTexto = 'PENDIENTE';
            estadoEmbargoClase = 'blink bg-warning text-dark px-2 rounded';
        }

        let fotoPerfil = cliente.foto_perfil ?
            `http://localhost:3000${cliente.foto_perfil}` :
            'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

        // Botón de ver (siempre visible)
        let botones = `
        <button class="btn btn-info btn-md me-1" onclick="verCliente(${cliente.id_embargos})">
            <i class="fas fa-eye"></i> Ver
        </button>`;

        // Solo mostrar botón editar si NO está aceptado
        if (cliente.estado_embargo !== 0) {
            botones += `
            <button class="btn btn-warning btn-md" onclick="editarCliente(${cliente.id_embargos})">
                <i class="fas fa-edit"></i> Editar
            </button>`;
        }

        dataTable.row.add([
            `<div class="d-flex align-items-center px-2 py-1">
            <div>
              <img src="${fotoPerfil}" 
                class="avatar avatar-lg me-3 foto-cliente" 
                alt="${cliente.nombres}" 
                data-src="${fotoPerfil}"
                onerror="this.src='https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'">
            </div>
            <div class="d-flex flex-column justify-content-center">
                <span class="text-xs font-weight-bold text-dark mb-1">${cliente.nombres} ${cliente.apellidos}</span>
                <span class="text-xs text-dark">${cliente.cedula}</span>
            </div>
        </div>`,
            `<span class="text-xs font-weight-bold">${cliente.radicado}</span>`,
            `<span class="text-xs font-weight-bold ${estadoEmbargoClase}">${estadoEmbargoTexto}</span>`,
            botones
        ]);
    });


    // Redibujar la tabla y ocultar loading
    dataTable.draw();
}


$(document).on('click', '.foto-cliente', function () {
    const src = $(this).data('src');
    $('#imagen-modal').attr('src', src);

    const modal = new bootstrap.Modal(document.getElementById('modalFoto'));
    modal.show();
});



function verCliente(id_embargos) {
    fetch(`http://localhost:3000/api/embargos/${id_embargos}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                mostrarDetallesEmbargo(data);
            } else {
                Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire('Error', 'Error al cargar los datos', 'error');
        });
}



function mostrarDetallesEmbargo(datos) {
    const modal = new bootstrap.Modal(document.getElementById('embargoModal'));
    const modalContent = document.getElementById('embargoModalContent');
    console.log("Datos ss:", datos);

    // Formatear fechas
    const formatDate = (fechaOriginal) => {
        if (!fechaOriginal || isNaN(new Date(fechaOriginal))) {
            return "No especificado";
        }

        const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
        const fecha = new Date(fechaOriginal);
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = meses[fecha.getMonth()];
        const anio = fecha.getFullYear();
        return `${dia}/${mes}/${anio}`;
    };




    // Determinar estado
    const estado = datos.embargo.estado_embargo === 0 ? 'Aceptado' : 'Rechazado';

    // Crear el contenido HTML
    modalContent.innerHTML = `
    <div class="card border-0 shadow-sm mb-4" style="border-radius: 10px; overflow: hidden;">
        <div class="card-header" style="background: linear-gradient(135deg,rgb(0, 0, 0) 0%, #157347 100%); color: white; padding: 15px 20px;">
            <div class="d-flex justify-content-between align-items-center">
                <h5 class="mb-0 text-white fw-bold" style="font-weight: 600; color: #000;">
                    <i class="fas fa-gavel me-2"></i> Detalles del Embargo
                </h5>
                <span style="font-weight: 500; font-size: 1.1rem; text-white;">Fecha Proceso: ${formatDate(datos.embargo.updated_at)}</span>
            </div>
        </div>

        <div class="card-body" style="padding: 20px;">
            <!-- Sección de información básica -->
            <div class="row mb-4">
                <!-- Información del cliente -->
                <div class="col-md-4 mb-3 mb-md-0" style="padding-right: 15px;">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; height: 100%;">
                        <div class="d-flex align-items-center mb-3" style="border-bottom: 1px solid #e9ecef; padding-bottom: 10px;">
                            <i class="fas fa-user-tie me-3" style="color: #198754; font-size: 1.2rem;"></i>
                            <h4 class="mb-0" style="font-weight: 600; color: #212529;">Información del Cliente</h4>
                        </div>
                        <div class="text-center mb-3">
                            <img src="${datos.embargo.foto_perfil ? `http://localhost:3000${datos.embargo.foto_perfil}` : '../assets/img/avatar.png'}" 
                                class="rounded-circle me-3" 
                                alt="${datos.embargo.nombres}" 
                                style="width: 120px; height: 120px; object-fit: cover; border: 3px solid #dee2e6;"
                                data-src="${datos.embargo.foto_perfil ? `http://localhost:3000${datos.embargo.foto_perfil}` : '../assets/img/avatar.png'}">
                        </div>
                       <div class="row text-center">
                        <div class="col-12 mb-2">
                            <h5 class="mb-1">${datos.embargo.nombres} ${datos.embargo.apellidos}</h5>
                            <p class="mb-2">
                                <span style="background-color: #0d6efd20; color: #0d6efd; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 1.1rem;">
                                    ID Proceso: ${datos.embargo.id_embargos}
                                </span>
                            </p>
                        </div>

                        <div class="col-6 mb-2">
                            <p style="color: rgba(25, 135, 84, 0.9); font-size: 1rem; margin-bottom: 5px; font-weight: 500;">Cédula</p>
                            <p style="color: #000; font-weight: 525; margin-bottom: 0;">${datos.embargo.cedula}</p>
                        </div>

                        <div class="col-6 mb-2">
                            <p style="color: rgba(25, 135, 84, 0.9); font-size: 1rem; margin-bottom: 5px; font-weight: 500;">Vinculación</p>
                            <p style="color: #000; font-weight: 525; margin-bottom: 0;">${formatDate(datos.embargo.fecha_vinculo)}</p>
                        </div>
                    </div>
                    </div>
                </div>
                
                <!-- Datos de contacto -->
                <div class="col-md-4 mb-3 mb-md-0" style="padding: 0 7.5px;">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; height: 100%;">
                        <div class="d-flex align-items-center mb-3" style="border-bottom: 1px solid #e9ecef; padding-bottom: 10px;">
                            <i class="fas fa-address-card me-3" style="color: #198754; font-size: 1.2rem;"></i>
                            <h4 class="mb-0" style="font-weight: 600; color: #212529;">Contacto</h4>
                        </div>
                        <div class="row">
                            <div class="col-12 mb-3">
                                <p style="color: rgba(25, 135, 84, 0.9); font-size: 1rem; margin-bottom: 5px; font-weight: 500;">
                                    <i class="fas fa-phone me-2"></i> Teléfono
                                </p>
                                <p style="color: #000; font-weight: 525; margin-bottom: 0;">${datos.embargo.telefono || 'No registrado'}</p>
                            </div>
                            <div class="col-12 mb-3">
                                <p style="color: rgba(25, 135, 84, 0.9); font-size: 1rem; margin-bottom: 5px; font-weight: 500;">
                                    <i class="fas fa-envelope me-2"></i> Correo
                                </p>
                                <p style="color: #000; font-weight: 525; margin-bottom: 0;">${datos.embargo.correo || 'No registrado'}</p>
                            </div>
                            <div class="col-12 mb-3">
                                <p style="color: rgba(25, 135, 84, 0.9); font-size: 1rem; margin-bottom: 5px; font-weight: 500;">
                                    <i class="fas fa-city me-2"></i> Ciudad
                                </p>
                                <p style="color: #000; font-weight: 525; margin-bottom: 0;">${datos.embargo.ciudad || 'No registrada'}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Datos del embargo -->
                <div class="col-md-4" style="padding-left: 15px;">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; height: 100%;">
                        <div class="d-flex align-items-center mb-3" style="border-bottom: 1px solid #e9ecef; padding-bottom: 10px;">
                            <i class="fas fa-gavel me-3" style="color: #198754; font-size: 1.2rem;"></i>
                            <h4 class="mb-0" style="font-weight: 600; color: #212529;">Detalles del Embargo</h4>
                        </div>
                        <div class="row">
                            <div class="col-6 mb-3">
                                <p style="color: rgba(25, 135, 84, 0.9); font-size: 1rem; margin-bottom: 5px; font-weight: 500;">Valor</p>
                                <p style="color: #000; font-weight: 525; margin-bottom: 0;">$${datos.embargo.valor_embargo || 'No especificado'}</p>
                            </div>
                            <div class="col-6 mb-3">
                                <p style="color: rgba(25, 135, 84, 0.9); font-size: 1rem; margin-bottom: 5px; font-weight: 500;">Porcentaje</p>
                                <p style="color: #000; font-weight: 525; margin-bottom: 0;">${datos.embargo.porcentaje_embargo || '0'}%</p>
                            </div>
                            <div class="col-6 mb-3">
                                <p style="color: rgba(25, 135, 84, 0.9); font-size: 1rem; margin-bottom: 5px; font-weight: 500;">Pagaduría</p>
                                <p style="color: #000; font-weight: 525; margin-bottom: 0;">${datos.embargo.pagaduria_embargo || 'No especificada'}</p>
                            </div>
                            <div class="col-6 mb-3">
                                <p style="color: rgba(25, 135, 84, 0.9); font-size: 1rem; margin-bottom: 5px; font-weight: 500;">Juzgado</p>
                                <p style="color: #000; font-weight: 525; margin-bottom: 0;">${datos.embargo.juzgado_embargo || 'No especificado'}</p>
                            </div>
                            <div class="col-6 mb-3">
                                <p style="color: rgba(25, 135, 84, 0.9); font-size: 1rem; margin-bottom: 5px; font-weight: 500;">Radicado</p>
                                <p style="color: #000; font-weight: 525; margin-bottom: 0;">${datos.embargo.radicado || 'No especificado'}</p>
                            </div>
                            <div class="col-6 mb-3">
                                <p style="color: rgba(25, 135, 84, 0.9); font-size: 1rem; margin-bottom: 5px; font-weight: 500;">Estado</p>
                                <p style="color: #000; font-weight: 525; margin-bottom: 0;">
                                    <span class="badge ${datos.embargo.estado_embargo === 0 ? 'bg-success' : 'bg-danger'}">
                                        ${estado}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Sección de fechas importantes -->
            <div class="d-flex align-items-center mb-3" style="border-bottom: 1px solid #e9ecef; padding-bottom: 10px;">
                <i class="fas fa-calendar-alt me-3" style="color: #198754; font-size: 1.2rem;"></i>
                <h4 class="mb-0" style="font-weight: 600; color: #212529;">Fechas Importantes</h4>
            </div>
            
            <div class="row" style="margin-left: -5px; margin-right: -5px; margin-bottom: 20px;">
                <div class="col-md-4 mb-3" style="padding: 5px;">
                    <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; height: 100%; border: 1px solid #e9ecef;">
                        <p style="color: rgba(25, 135, 84, 0.9); font-size: 1rem; margin-bottom: 10px; font-weight: 500;">Radicación</p>
                        <h5 style="color: #000; font-weight: 600; margin-bottom: 0;">${formatDate(datos.embargo.fecha_radicacion)}</h5>
                    </div>
                </div>
                <div class="col-md-4 mb-3" style="padding: 5px;">
                    <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; height: 100%; border: 1px solid #e9ecef;">
                        <p style="color: rgba(25, 135, 84, 0.9); font-size: 1rem; margin-bottom: 10px; font-weight: 500;">Solicitud Expediente</p>
                        <h5 style="color: #000; font-weight: 600; margin-bottom: 0;">${formatDate(datos.embargo.fecha_expediente)}</h5>
                    </div>
                </div>
                <div class="col-md-4 mb-3" style="padding: 5px;">
                    <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; height: 100%; border: 1px solid #e9ecef;">
                        <p style="color: rgba(25, 135, 84, 0.9); font-size: 1rem; margin-bottom: 10px; font-weight: 500;">Revisión Expediente</p>
                        <h5 style="color: #000; font-weight: 600; margin-bottom: 0;">${formatDate(datos.embargo.fecha_revision_exp)}</h5>
                    </div>
                </div>
            </div>
            
            <!-- Sección de información adicional -->
            <div class="row" style="margin-left: -5px; margin-right: -5px;">
                <div class="col-md-6 mb-3" style="padding: 5px;">
                    <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; height: 100%; border: 1px solid #e9ecef;">
                        <div class="d-flex align-items-center mb-3" style="border-bottom: 1px solid #e9ecef; padding-bottom: 10px;">
                            <i class="fas fa-balance-scale me-3" style="color: #198754; font-size: 1.2rem;"></i>
                            <h4 class="mb-0" style="font-weight: 600; color: #212529;">Red Judicial</h4>
                        </div>
                        <p style="color: #000; font-weight: 525; margin-bottom: 0;">
                            ${datos.embargo.red_judicial ?
            `<span class="badge bg-success me-2">SI</span> ${datos.embargo.red_judicial}` :
            '<span class="badge bg-danger">NO</span>'}
                        </p>
                    </div>
                </div>
                
               <div class="col-md-6 mb-3" style="padding: 5px;">
                <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; height: 100%; border: 1px solid #e9ecef;">
                    <div class="d-flex align-items-center mb-3" style="border-bottom: 1px solid #e9ecef; padding-bottom: 10px;">
                    <i class="fas fa-file-alt me-3" style="color: #198754; font-size: 1.2rem;"></i>
                    <h4 class="mb-0" style="font-weight: 600; color: #212529;">Subsanaciones</h4>
                    </div>

                    <p style="color: #000; font-weight: 525; margin-bottom: 0;">
                    ${datos.embargo.subsanaciones === 'si' ?
            '<span class="badge bg-warning text-dark">SI</span>' :
            '<span class="badge bg-secondary">NO</span>'}
                    </p>

                    ${datos.embargo.subsanaciones === 'si' && datos.embargo.observaciones_alarma ?
            `
                    <div class="mt-2">
                        <label class="form-label fw-bold mb-1 text-info">Observaciones:</label>
                        <p class="mb-0 text-dark fw-bold"><small>${datos.embargo.observaciones_alarma}</small></p>
                    </div>
                    ` : ''}
                </div>
                </div>
            </div>
            
            <!-- Asesor responsable -->
            <div class="mt-4 text-end">
                <p class="text-muted small mb-0">Asesor a cargo: <span class="fw-bold text-dark">${datos.embargo.asesor_embargo}</span></p>
            </div>
        </div>
    </div>
`;

    modal.show();
}

//FUNCIONES DE FORMATEO PARA MODAL EDITAR
function formatearFecha(fechaISO) {
    if (!fechaISO) return '---';
    const fecha = new Date(fechaISO);
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = fecha.toLocaleString('es-CO', { month: 'short' }).toUpperCase().replace('.', '');
    const año = fecha.getFullYear();
    return `${dia}/${mes}/${año}`;
}



function formatearMoneda(input) {
    let valor = input.value.replace(/\D/g, '');
    valor = new Intl.NumberFormat('es-CO').format(valor);
    input.value = valor;
}


function formatearParaInputDate(fechaISO) {
    if (!fechaISO) return '';
    const fecha = new Date(fechaISO);
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
}


document.addEventListener('DOMContentLoaded', function () {
    const fechaRadicacionInput = document.getElementById('fecha_radicacion');
    const fechaSolicitudInput = document.getElementById('fecha_expediente');
    const fechaRevisionInput = document.getElementById('fecha_revision_exp');

    // Establecer la fecha mínima como hoy
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
    const dia = hoy.getDate().toString().padStart(2, '0');
    const fechaHoy = `${anio}-${mes}-${dia}`;
    fechaRadicacionInput.min = fechaHoy;

    // Función para sumar días hábiles (lunes a viernes)
    function sumarDiasHabiles(fechaInicial, cantidadDias) {
        const fecha = new Date(fechaInicial);
        let diasSumados = 0;

        while (diasSumados < cantidadDias) {
            fecha.setDate(fecha.getDate() + 1);
            const diaSemana = fecha.getDay(); // 0 = domingo, 6 = sábado
            if (diaSemana !== 0 && diaSemana !== 6) {
                diasSumados++;
            }
        }
        return fecha;
    }

    // Escuchar cambios para calcular +15 y +30 días hábiles
    fechaRadicacionInput.addEventListener('change', function () {
        const fechaRadicacion = new Date(this.value);

        if (!isNaN(fechaRadicacion.getTime())) {
            // Calcular fechas hábiles
            const fechaSolicitud = sumarDiasHabiles(fechaRadicacion, 15);
            const fechaRevision = sumarDiasHabiles(fechaRadicacion, 30);

            // Formatear y asignar
            const formatDate = (fecha) => {
                const año = fecha.getFullYear();
                const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
                const dia = fecha.getDate().toString().padStart(2, '0');
                return `${año}-${mes}-${dia}`;
            };

            fechaSolicitudInput.value = formatDate(fechaSolicitud);
            fechaRevisionInput.value = formatDate(fechaRevision);
        } else {
            fechaSolicitudInput.value = '';
            fechaRevisionInput.value = '';
        }
    });
});


let id_embargos_actual;

async function editarCliente(id_embargos) {
    id_embargos_actual = id_embargos;
    try {
        const response = await fetch(`http://localhost:3000/api/embargos/${id_embargos}`);
        if (!response.ok) throw new Error('No se pudo obtener la información del embargo');

        const data = await response.json();


        // Llenar datos del cliente (perfil superior)
        document.getElementById('detalleFotoPerfil').src = data.embargo.foto_perfil
            ? `http://localhost:3000${data.embargo.foto_perfil}`
            : '../assets/img/avatar.png';


        const nombres = data.embargo.nombres || '';
        const apellidos = data.embargo.apellidos || '';
        const nombreCompleto = (nombres + ' ' + apellidos).trim();

        document.getElementById('detalleID').textContent = data.embargo.id_cliente || '---';
        document.getElementById('id_cliente').value = data.embargo.id_cliente || '';
        document.getElementById('detalleNombreCliente').textContent = nombreCompleto || '---';
        document.getElementById('detalleDocumento').textContent = data.embargo.cedula || '---';
        document.getElementById('detalleTelefono').textContent = data.embargo.telefono || '---';
        document.getElementById('detalleEmail').textContent = data.embargo.correo || '---';
        document.getElementById('detallePagaduria').textContent = data.embargo.pagaduria_embargo || '---';
        document.getElementById('detalleCiudad').textContent = data.embargo.ciudad || '---';
        document.getElementById('detalleVinculacion').textContent = formatearFecha(data.embargo.fecha_vinculo) || '---';
        document.getElementById('asesorNombre').textContent = data.embargo.asesor_embargo || '---';



        // Datos del embargo
        document.getElementById('valor_embargo').value = data.embargo.valor_embargo || '';
        document.getElementById('inputPagaduria').value = data.embargo.pagaduria_embargo || '';
        document.getElementById('porcentaje').value = data.embargo.porcentaje_embargo || '';
        document.getElementById('juzgado').value = data.embargo.juzgado_embargo || '';
        document.getElementById('fecha_radicacion').value = formatearParaInputDate(data.embargo.fecha_radicacion);
        document.getElementById('fecha_expediente').value = formatearParaInputDate(data.embargo.fecha_expediente);
        document.getElementById('fecha_revision_exp').value = formatearParaInputDate(data.embargo.fecha_revision_exp);



        // Información complementaria
        document.getElementById('radicado').value = data.embargo.radicado || '';

        // Red Judicial
        if (data.embargo.red_judicial && data.embargo.red_judicial !== 'no') {
            document.getElementById('red_judicial_si').checked = true;
            document.getElementById('linkRedJudicialContainer').style.display = 'flex';

            const inputLink = document.getElementById('link_red_judicial_input');
            inputLink.value = data.embargo.red_judicial; // Ahora se toma directamente de aquí
            inputLink.setAttribute("disabled", true);
        } else {
            document.getElementById('red_judicial_no').checked = true;
            document.getElementById('linkRedJudicialContainer').style.display = 'none';

            const inputLink = document.getElementById('link_red_judicial_input');
            inputLink.value = "";
            inputLink.removeAttribute("disabled");
        }



        // Subsanaciones
        if (data.embargo.subsanaciones === 'si') {
            document.getElementById('subsanaciones_si').checked = true;
            document.getElementById('detalleSubsanacionesContainer').style.display = 'block';
            document.querySelector('input[name="fecha_alarma"]').value = formatearParaInputDate(data.embargo.fecha_notificacion) || '';
            document.querySelector('textarea[name="observaciones_alarma"]').value = data.embargo.observaciones_alarma || '';
        } else {
            document.getElementById('subsanaciones_no').checked = true;
            document.getElementById('detalleSubsanacionesContainer').style.display = 'none';
        }


        // Mostrar el modal
        const modalEditar = new bootstrap.Modal(document.getElementById('modalEditarEmbargo'));
        modalEditar.show();

    } catch (error) {
        console.error('Error al cargar el embargo:', error);
        alert('Ocurrió un error al cargar los datos del proceso.');
    }
}

async function seleccionarEstadoFinal(estado, id_embargos) {
    if (!id_embargos) {
        console.error('ID de embargos no definido');
        return;
    }

    const estadoNumerico = estado === 'rechazado' ? 1 : 0;
    document.getElementById('estado_embargo').value = estado;

    const asesorEmbargo = sessionStorage.getItem('nombreUsuario') || 'SIN NOMBRE';

    const datos = {
        estado_embargo: estadoNumerico,
        valor_embargo: document.getElementById('valor_embargo').value.trim(),
        pagaduria_embargo: document.getElementById('inputPagaduria').value.trim(),
        porcentaje_embargo: document.getElementById('porcentaje').value.trim(),
        juzgado_embargo: document.getElementById('juzgado').value.trim(),
        fecha_radicacion: document.getElementById('fecha_radicacion').value,
        fecha_expediente: document.getElementById('fecha_expediente').value,
        fecha_revision_exp: document.getElementById('fecha_revision_exp').value,
        radicado: document.getElementById('radicado').value.trim(),
        red_judicial: document.getElementById('red_judicial_si').checked
            ? 'https://www.redjudicial.com/nuevo/'
            : 'no',
        subsanaciones: document.getElementById('subsanaciones_si').checked ? 'si' : 'no',
        fecha_notificacion: document.querySelector('input[name="fecha_alarma"]').value,
        observaciones_alarma: document.querySelector('textarea[name="observaciones_alarma"]').value.trim(),
        asesor_embargo: asesorEmbargo
    };

    // Fecha de hoy
    const hoy = new Date().toISOString().split('T')[0];

    // VALIDACIONES GENERALES
    if (!datos.valor_embargo || datos.valor_embargo <= 0) {
        return Swal.fire('Campo obligatorio', 'El valor del embargo debe ser mayor a cero.', 'warning');
    }

    if (!datos.pagaduria_embargo) {
        return Swal.fire('Campo obligatorio', 'La pagaduría no puede estar vacía.', 'warning');
    }

    if (!datos.porcentaje_embargo) {
        return Swal.fire('Campo obligatorio', 'Debes ingresar el porcentaje del embargo.', 'warning');
    }

    if (!datos.juzgado_embargo) {
        return Swal.fire('Campo obligatorio', 'El campo Juzgado no puede estar vacío.', 'warning');
    }

    if (!datos.fecha_radicacion) {
        return Swal.fire('Campo obligatorio', 'Debes ingresar la fecha de radicación.', 'warning');
    }

    if (datos.fecha_radicacion < hoy) {
        return Swal.fire('Fecha inválida', 'La fecha de radicación debe ser igual o posterior a hoy.', 'warning');
    }

    // VALIDACIONES SOLO SI HAY SUBSANACIONES
    if (datos.subsanaciones === 'si') {
        if (!datos.fecha_notificacion || !datos.observaciones_alarma || !datos.asesor_embargo) {
            return Swal.fire(
                'Campos requeridos',
                'Debes completar la fecha de notificación, observaciones y asesor.',
                'warning'
            );
        }
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const fechaNotificacion = new Date(datos.fecha_notificacion);
        fechaNotificacion.setHours(0, 0, 0, 0);

        if (fechaNotificacion < hoy) {
            return Swal.fire(
                'Fecha inválida',
                'La fecha de notificación no puede ser menor que hoy.',
                'warning'
            );
        }
    }


    // Enviar datos si pasó validaciones
    try {
        const response = await fetch(`http://localhost:3000/api/embargo/${id_embargos}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });

        if (response.ok) {
            // Notificación si aplica
            if (datos.subsanaciones === 'si') {
                const datosNotificacion = {
                    fecha_notificacion: datos.fecha_notificacion,
                    observaciones: datos.observaciones_alarma,
                    asesor_notificacion: datos.asesor_embargo,
                    id_embargos: id_embargos
                };

                try {
                    const notificacionResponse = await fetch('http://localhost:3000/api/notificaciones-embargos', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(datosNotificacion)
                    });

                    const notificacionResultado = await notificacionResponse.json();
                    if (!notificacionResultado.success) {
                        return Swal.fire('Error', notificacionResultado.message || 'Error en la notificación.', 'error');
                    }
                } catch (err) {
                    console.error('Error al enviar notificación:', err);
                    return Swal.fire('Error de conexión', 'No se pudo enviar la notificación.', 'error');
                }
            }

            // Éxito total
            Swal.fire({
                title: 'Éxito',
                text: 'Embargo actualizado correctamente.',
                icon: 'success',
                confirmButtonText: 'Aceptar'
            }).then((result) => {
                if (result.isConfirmed) {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarEmbargo'));
                    if (modal) modal.hide();
                    location.reload();
                }
            });

        } else {
            Swal.fire('Error', 'No se pudo actualizar el embargo.', 'error');
        }

    } catch (error) {
        console.error('Error en la solicitud:', error);
        Swal.fire('Error', 'Hubo un problema al enviar los datos.', 'error');
    }
}




function mostrarDetalleSubsanaciones(mostrar) {
    const contenedor = document.getElementById('detalleSubsanacionesContainer');
    contenedor.style.display = mostrar ? 'block' : 'none';
}


document.getElementById('red_judicial_si').addEventListener('change', function () {
    const inputLink = document.getElementById('link_red_judicial_input');
    document.getElementById('linkRedJudicialContainer').style.display = 'flex';
    inputLink.value = "https://www.redjudicial.com/nuevo/";
    inputLink.setAttribute("disabled", true);
});

document.getElementById('red_judicial_no').addEventListener('change', function () {
    const inputLink = document.getElementById('link_red_judicial_input');
    document.getElementById('linkRedJudicialContainer').style.display = 'none';
    inputLink.value = "";
    inputLink.removeAttribute("disabled");
});