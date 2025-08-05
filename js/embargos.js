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
    // Verifica si la tabla ya tiene DataTable inicializado
    if ($.fn.DataTable.isDataTable('#tablaClientes')) {
        $('#tablaClientes').DataTable().clear().destroy();
    }

    // Limpiar el tbody
    $("#tablaClientes tbody").html('');

    let resultados = '';

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
            estadoEmbargoTexto = 'EN PROCESO';
            estadoEmbargoClase = 'blink bg-warning text-dark px-2 rounded';
        }

        let fotoPerfil = cliente.foto_perfil ?
            `http://localhost:3000${cliente.foto_perfil}` :
            'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

        let botones = `
            <button class="btn btn-info btn-md me-1 text-white" onclick="verCliente(${cliente.id_embargos})">
                <i class="fas fa-eye"></i> Ver
            </button>`;

        if (cliente.estado_embargo !== 0) {
            botones += `
            <button class="btn btn-warning btn-md" onclick="editarCliente(${cliente.id_embargos})">
                <i class="fas fa-edit"></i> Editar
            </button>`;
        }

        resultados += `
        <tr>
            <td>
                <div class="d-flex align-items-center px-2 py-1">
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
                </div>
            </td>
            <td class="text-center">
                <span class="text-xs font-weight-bold">${cliente.radicado}</span>
            </td>
            <td class="text-center">
                <span class="text-xs font-weight-bold ${estadoEmbargoClase}">${estadoEmbargoTexto}</span>
            </td>
            <td class="text-center">
                ${botones}
            </td>
        </tr>`;
    });

    $('#tablaClientes tbody').html(resultados);

    // Inicializar DataTable
    $('#tablaClientes').DataTable({
        pageLength: 8,
        lengthMenu: [8, 16, 25, 50, 100],
        order: [[2, 'desc']],
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
        <div class="expediente-embargo">
            <!-- Encabezado estilo documento oficial -->
            <div class="encabezado-documento">
                <div class="membrete">
                    <div class="titulo-documento">
                        <h3>EXPEDIENTE DE EMBARGO</h3>
                        <p class="numero-expediente">No. Radicado: ${datos.embargo.radicado || 'S/N'}</p>
                    </div>
                    <div class="sello">
                        <div class="sello-content 
                        ${datos.embargo.estado_embargo === 0 ? 'sello-aprobado' :
            datos.embargo.estado_embargo === 1 ? 'sello-rechazado' :
                'sello-proceso'}">
                        <span>
                            ${datos.embargo.estado_embargo === 0 ? 'APROBADO' :
            datos.embargo.estado_embargo === 1 ? 'RECHAZADO' :
                'EN PROCESO'}
                        </span>
                    </div> 
                    </div>
                </div>
       

            <div class="datos-encabezado">
                <div class="fecha-radicacion">
                        <span>Fecha último proceso: ${formatDate(datos.embargo.updated_at)}</span>
                    </div>
                    <div class="fecha-radicacion">
                        <span>Asesor responsable: ${datos.embargo.asesor_embargo || 'No asignado'}</span>
                    </div>
                </div>
            </div>

            <!-- Cuerpo principal del expediente -->
            <div class="cuerpo-expediente">
                <!-- Sección de información del cliente -->
                <div class="seccion-expediente">
                    <h4 class="titulo-seccion"><i class="fas fa-user-tie"></i> INFORMACIÓN DEL CLIENTE</h4>
                    <div class="grid-datos">
                        <div class="dato-legal">
                            <span class="etiqueta">Nombre completo:</span>
                            <span class="valor">${datos.embargo.nombres} ${datos.embargo.apellidos}</span>
                        </div>
                        <div class="dato-legal">
                            <span class="etiqueta">Identificación:</span>
                            <span class="valor">${datos.embargo.cedula}</span>
                        </div>
                        <div class="dato-legal">
                            <span class="etiqueta">Fecha vinculación:</span>
                            <span class="valor">${formatDate(datos.embargo.fecha_vinculo)}</span>
                        </div>
                        <div class="dato-legal">
                            <span class="etiqueta">Pagaduría:</span>
                            <span class="valor">${datos.embargo.pagaduria_embargo || 'No especificada'}</span>
                        </div>
                    </div>
                    
                    <div class="foto-perfil-container">
                        <img src="${datos.embargo.foto_perfil ? `http://localhost:3000${datos.embargo.foto_perfil}` : '../assets/img/avatar.png'}" 
                            class="foto-perfil" 
                            alt="Foto perfil">
                        <div class="contacto-cliente">
                            <p><i class="fas fa-phone"></i> ${datos.embargo.telefono || 'No registrado'}</p>
                            <p><i class="fas fa-envelope"></i> ${datos.embargo.correo || 'No registrado'}</p>
                            <p><i class="fas fa-map-marker-alt"></i> ${datos.embargo.ciudad || 'No registrada'}</p>
                        </div>
                    </div>
                </div>

                <!-- Sección de detalles del embargo -->
                <div class="seccion-expediente">
                    <h4 class="titulo-seccion"><i class="fas fa-gavel"></i> DETALLES DEL EMBARGO</h4>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="dato-legal">
                                <span class="etiqueta">Valor:</span>
                                <span class="valor">$${datos.embargo.valor_embargo || '0'}</span>
                            </div>
                            <div class="dato-legal">
                                <span class="etiqueta">Porcentaje:</span>
                                <span class="valor">${datos.embargo.porcentaje_embargo || '0'}%</span>
                            </div>
                            <div class="dato-legal">
                                <span class="etiqueta">Juzgado:</span>
                                <span class="valor">${datos.embargo.juzgado_embargo || 'No especificado'}</span>
                            </div>
                        </div>
                        <div class="col-md-6">
                        <div class="dato-legal">
                                <span class="etiqueta">Red Judicial:</span>
                                <span class="valor">
                                    ${datos.embargo.red_judicial ?
            `<span class="badge bg-success">SI</span> 
                                    <a href="${datos.embargo.red_judicial}" target="_blank" class="ms-2 text-primary fw-bold text-decoration-underline">
                                        ${datos.embargo.red_judicial}
                                    </a>` :
            '<span class="badge bg-danger">NO</span>'}
                                </span>
                        </div>
                            <div class="dato-legal">
                                <span class="etiqueta">Subsanaciones:</span>
                                <span class="valor">
                                    ${datos.embargo.subsanaciones === 'si' ?
            '<span class="badge bg-warning text-dark">SI</span>' :
            '<span class="badge bg-secondary">NO</span>'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Sección de fechas importantes -->
                <div class="seccion-expediente">
                    <h4 class="titulo-seccion"><i class="fas fa-calendar-alt"></i> CRONOLOGÍA DEL PROCESO</h4>
                    <div class="timeline">
                        <div class="evento-timeline ${datos.embargo.fecha_radicacion ? 'completado' : ''}">
                            <div class="fecha-evento">${formatDate(datos.embargo.fecha_radicacion) || 'Pendiente'}</div>
                            <div class="icono-evento"><i class="fas fa-file-import"></i></div>
                            <div class="detalle-evento">
                                <span class="titulo-evento">Radicación</span>
                                <span class="descripcion-evento">Inicio del proceso de embargo</span>
                            </div>
                        </div>
                        
                        <div class="evento-timeline ${datos.embargo.fecha_expediente ? 'completado' : ''}">
                            <div class="fecha-evento">${formatDate(datos.embargo.fecha_expediente) || 'Pendiente'}</div>
                            <div class="icono-evento"><i class="fas fa-folder-open"></i></div>
                            <div class="detalle-evento">
                                <span class="titulo-evento">Solicitud expediente</span>
                                <span class="descripcion-evento">Requerimiento de documentación</span>
                            </div>
                        </div>
                        
                        <div class="evento-timeline ${datos.embargo.fecha_revision_exp ? 'completado' : ''}">
                            <div class="fecha-evento">${formatDate(datos.embargo.fecha_revision_exp) || 'Pendiente'}</div>
                            <div class="icono-evento"><i class="fas fa-search"></i></div>
                            <div class="detalle-evento">
                                <span class="titulo-evento">Revisión expediente</span>
                                <span class="descripcion-evento">Análisis documental</span>
                            </div>
                        </div>
                        
                        <div class="evento-timeline ${datos.embargo.updated_at ? 'completado' : ''}">
                            <div class="fecha-evento">${formatDate(datos.embargo.updated_at)}</div>
                            <div class="icono-evento"><i class="fas fa-clipboard-check"></i></div>
                            <div class="detalle-evento">
                                <span class="titulo-evento">Resolución final</span>
                                <span class="descripcion-evento">Proceso ${datos.embargo.estado_embargo === 0 ? 'aprobado' : 'rechazado'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Sección de observaciones -->
                ${datos.embargo.observaciones_alarma ? `
                <div class="seccion-expediente">
                    <h4 class="titulo-seccion"><i class="fas fa-exclamation-circle"></i> OBSERVACIONES</h4>
                    <div class="observaciones-content">
                        <p>${datos.embargo.observaciones_alarma}</p>
                        ${datos.embargo.fecha_notificacion ? `
                        <div class="fecha-observacion">
                            <i class="fas fa-clock"></i> Notificado el ${formatDate(datos.embargo.fecha_notificacion)}
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>`;

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
    const estadoNumerico = estado === 'rechazado' ? 1 : estado === 'proceso' ? 2 : 0;
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
    // if (!datos.valor_embargo || datos.valor_embargo <= 0) {
    //     return Swal.fire('Campo obligatorio', 'El valor del embargo debe ser mayor a cero.', 'warning');
    // }

    // if (!datos.pagaduria_embargo) {
    //     return Swal.fire('Campo obligatorio', 'La pagaduría no puede estar vacía.', 'warning');
    // }

    // if (!datos.porcentaje_embargo) {
    //     return Swal.fire('Campo obligatorio', 'Debes ingresar el porcentaje del embargo.', 'warning');
    // }

    // if (!datos.juzgado_embargo) {
    //     return Swal.fire('Campo obligatorio', 'El campo Juzgado no puede estar vacío.', 'warning');
    // }

    // if (!datos.fecha_radicacion) {
    //     return Swal.fire('Campo obligatorio', 'Debes ingresar la fecha de radicación.', 'warning');
    // }

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

        // if (fechaNotificacion < hoy) {
        //     return Swal.fire(
        //         'Fecha inválida',
        //         'La fecha de notificación no puede ser menor que hoy.',
        //         'warning'
        //     );
        // }
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