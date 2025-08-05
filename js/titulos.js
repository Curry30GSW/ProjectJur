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
        const url = 'http://localhost:3000/api/titulos';

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Error en la solicitud');

        titulos = await response.json();

        if (!Array.isArray(titulos) || titulos.length === 0) {
            Swal.fire({
                title: 'Sin registros',
                text: 'No se encontraron Títulos en la base de datos.',
                icon: 'info',
                confirmButtonText: 'Entendido',
                allowOutsideClick: false,
                allowEscapeKey: false
            });
            return;
        }

        mostrar(titulos);

    } catch (error) {
        console.error('❌ Error en titulos:', error);
        Swal.fire('Error', 'No se pudo obtener la información.', 'error');
    }
}



const mostrar = (titulos) => {
    let resultados = '';

    titulos.forEach((titulo) => {
        const botonCrearTitulo = `
            <button class="btn btn-success btn-md me-1" title="Crear título"
                onclick="crearTitulo(
                    '${titulo.id_embargos}',
                    '${titulo.foto_perfil}',
                    '${titulo.nombres}',
                    '${titulo.apellidos}',
                    '${titulo.cedula}',
                    '${titulo.radicado}',
                    '${titulo.telefono}',
                    '${titulo.correo}',
                    '${titulo.ciudad}'
                )"
                ${titulo.creado_titulo == 1 ? 'disabled' : ''}>
                <i class="fas fa-plus me-1"></i> Crear título
            </button>
        `;

        resultados += `
            <tr>
                <td class="text-center align-middle">
                    <span class="text-md font-weight-bold text-dark">#${titulo.id_embargos}</span>
                </td>
                <td class="align-middle">
                    <div class="d-flex align-items-center px-2 py-1">
                        <div>
                            <img src="http://localhost:3000${titulo.foto_perfil}" 
                                class="avatar avatar-lg me-3 foto-cliente" 
                                alt="${titulo.nombres}"
                                data-src="http://localhost:3000${titulo.foto_perfil}">
                        </div>
                        <div class="d-flex flex-column justify-content-center">
                            <span class="text-md font-weight-bold text-dark mb-1">${titulo.nombres} ${titulo.apellidos}</span>
                            <span class="text-md text-secondary text-dark">${titulo.cedula}</span>
                        </div>
                    </div>
                </td>
                <td class="text-center align-middle">
                    <span class="text-md font-weight-bold text-dark">${titulo.radicado}</span>
                </td>
                <td class="text-center align-middle">
                    ${botonCrearTitulo}
                    <button class="btn btn-warning btn-md me-1" title="Editar título"
                        onclick="editarTitulo(${titulo.id_embargos})">
                        <i class="fas fa-edit me-1"></i> Editar título
                    </button>

                    <button class="btn btn-info btn-md" title="Ver título"
                        onclick="verTitulo(${titulo.id_embargos})">
                        <i class="fas fa-eye me-1"></i> Ver título
                    </button>
                </td>
            </tr>
        `;
    });

    if ($.fn.DataTable.isDataTable('#tablaClientes')) {
        $('#tablaClientes').DataTable().clear().destroy();
    }

    $("#tablaClientes tbody").html(resultados);

    $('#tablaClientes').DataTable({
        pageLength: 8,
        lengthMenu: [8, 16, 25, 50, 100],
        order: [[3, 'desc']],
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



function crearTitulo(id, foto_perfil, nombres, apellidos, cedula, radicado, telefono, correo, ciudad) {
    limpiarModalCrearTitulo();
    const modal = new bootstrap.Modal(document.getElementById('modalCrearTitulo'));
    modal.show();

    document.getElementById('fotoperfilModal').src = `http://localhost:3000${foto_perfil}`;
    document.getElementById('idModal').textContent = id;
    document.getElementById('inputIdCliente').value = id;
    document.getElementById('detalleNombreCliente').textContent = `${nombres} ${apellidos}`;
    document.getElementById('detalleTipoDocumento').textContent = `Cédula: ${cedula}`;

    // Otros datos
    document.getElementById('telefonoModal').textContent = `${telefono}`;
    document.getElementById('emailModal').textContent = `${correo}`;
    document.getElementById('radicadoModal').textContent = `${radicado}`;
    document.getElementById('ciudadModal').textContent = `${ciudad}`;

}


// Función auxiliar para formatear fecha
document.getElementById("terminacionOficina").addEventListener("change", function () {
    const fechaTerminacion = this.value;

    if (fechaTerminacion) {
        const fechaAceptacion = sumarDiasHabiles(fechaTerminacion, 15);
        const fechaSolicitud = sumarDiasHabiles(fechaAceptacion, 15);

        document.getElementById("fechaAceptacionJuzgado").value = fechaAceptacion;
        document.getElementById("fechaSolicitudTitulos").value = fechaSolicitud;
    } else {
        document.getElementById("fechaAceptacionJuzgado").value = "";
        document.getElementById("fechaSolicitudTitulos").value = "";
    }
});


function sumarDiasHabiles(fechaInicial, diasHabiles) {
    let fecha = new Date(fechaInicial);
    let suma = 0;

    while (suma < diasHabiles) {
        fecha.setDate(fecha.getDate() + 1);
        const dia = fecha.getDay();
        // 0: domingo, 6: sábado
        if (dia !== 0 && dia !== 6) {
            suma++;
        }
    }

    return fecha.toISOString().split('T')[0]; // formato yyyy-mm-dd
}



document.addEventListener('DOMContentLoaded', function () {
    function configurarPrevisualizacionArchivo(inputId, labelSelector, displaySelector) {
        const inputArchivo = document.getElementById(inputId);
        const labelArchivo = document.querySelector(labelSelector);
        const nombreArchivo = document.getElementById(displaySelector);

        inputArchivo.addEventListener('change', () => {
            if (inputArchivo.files.length > 0) {
                const archivo = inputArchivo.files[0];
                // Cambiar clase visual
                labelArchivo.classList.add('has-file');
                // Mostrar nombre del archivo
                nombreArchivo.innerHTML = `<i class="fas fa-file-pdf me-1"></i> ${archivo.name}`;
            } else {
                labelArchivo.classList.remove('has-file');
                nombreArchivo.innerHTML = `<i class="fas fa-info-circle me-1"></i> Ningún archivo seleccionado`;
            }
        });
    }

    // Llamar la función para cada input
    configurarPrevisualizacionArchivo('inputPdfTerminacion', 'label[for="inputPdfTerminacion"]', 'nombreArchivoTerminacion');
    configurarPrevisualizacionArchivo('inputAceptacion', 'label[for="inputAceptacion"]', 'nombreArchivoAceptacion');
    configurarPrevisualizacionArchivo('inputOrdenPagado', 'label[for="inputOrdenPagado"]', 'nombreArchivoOrdenPagado');
    configurarPrevisualizacionArchivo('inputPdfTerminacionEdit', 'label[for="inputPdfTerminacionEdit"]', 'nombreArchivoTerminacionEdit');
    configurarPrevisualizacionArchivo('inputAceptacionEdit', 'label[for="inputAceptacionEdit"]', 'nombreArchivoAceptacionEdit');
    configurarPrevisualizacionArchivo('inputOrdenPagadoEdit', 'label[for="inputOrdenPagadoEdit"]', 'nombreArchivoOrdenPagadoEdit');
});


function limpiarModalCrearTitulo() {
    document.getElementById('fotoperfilModal').src = '../assets/img/avatar.png';
    document.getElementById('idModal').textContent = '---';
    document.getElementById('inputIdCliente').value = '';
    document.getElementById('detalleNombreCliente').textContent = '[Nombre del Cliente]';
    document.getElementById('detalleTipoDocumento').textContent = '[Tipo de Documento]';
    document.getElementById('telefonoModal').textContent = '---';
    document.getElementById('emailModal').textContent = '---';
    document.getElementById('radicadoModal').textContent = '---';
    document.getElementById('ciudadModal').textContent = '---';
    document.getElementById('terminacionOficina').value = '';
    document.getElementById('fechaAceptacionJuzgado').value = '';
    document.getElementById('fechaSolicitudTitulos').value = '';
    document.getElementById('fechaOrdenPagado').value = '';

    document.getElementById('inputAceptacion').value = '';
    document.getElementById('inputOrdenPagado').value = '';
    document.getElementById('inputPdfTerminacion').value = '';

    document.getElementById('nombreArchivoAceptacion').innerHTML = '<i class="fas fa-info-circle me-1"></i> Ningún archivo seleccionado';
    document.getElementById('nombreArchivoOrdenPagado').innerHTML = '<i class="fas fa-info-circle me-1"></i> Ningún archivo seleccionado';
    document.getElementById('nombreArchivoTerminacion').innerHTML = '<i class="fas fa-info-circle me-1"></i> Ningún archivo seleccionado';

    document.querySelector("label[for='inputAceptacion']").classList.remove("has-file");
    document.querySelector("label[for='inputOrdenPagado']").classList.remove("has-file");
    document.querySelector("label[for='inputPdfTerminacion']").classList.remove("has-file");
}



// Función para enviar los datos al backend
document.getElementById("btnGuardarTitulo").addEventListener("click", async () => {

    const asesor_titulos = sessionStorage.getItem('nombreUsuario') || 'Asesor no identificado';

    // Capturar valores del formulario
    const terminacion_ofic = document.getElementById("terminacionOficina").value;
    const terminacion_juzg = document.getElementById("fechaAceptacionJuzgado").value;
    const solicitud_titulos = document.getElementById("fechaSolicitudTitulos").value;
    const orden_pago = document.getElementById("fechaOrdenPagado").value;
    const id_embargos = document.getElementById("idModal").textContent;
    const id_cliente = document.getElementById("inputIdCliente").value;

    // Capturar archivos PDF
    const inputPdfTerminacion = document.getElementById("inputPdfTerminacion");
    const inputAceptacion = document.getElementById("inputAceptacion");
    const inputOrdenPagado = document.getElementById("inputOrdenPagado");


    // Mostrar indicador de carga
    const btnGuardar = document.getElementById("btnGuardarTitulo");
    const originalText = btnGuardar.innerHTML;
    btnGuardar.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...';
    btnGuardar.disabled = true;

    try {
        // Crear FormData para enviar archivos
        const formData = new FormData();
        formData.append("terminacion_ofic", terminacion_ofic);
        formData.append("terminacion_juzg", terminacion_juzg);
        formData.append("solicitud_titulos", solicitud_titulos);
        formData.append("orden_pago", orden_pago);
        formData.append("id_embargos", id_embargos);
        formData.append("id_cliente", id_cliente);
        formData.append("asesor_titulos", asesor_titulos);

        // Agregar archivos
        formData.append("terminacion_pdf", inputPdfTerminacion.files[0]);
        if (inputAceptacion.files[0]) {
            formData.append("aceptacion_pdf", inputAceptacion.files[0]);
        }
        formData.append("orden_pago_pdf", inputOrdenPagado.files[0]);

        // Enviar datos al backend
        const respuesta = await fetch("http://localhost:3000/api/insert-titulos", {
            method: "POST",
            body: formData
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.message || 'Error al registrar título');
        }

        // Mostrar mensaje de éxito
        Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'Título registrado correctamente',
            timer: 2000,
            showConfirmButton: false
        }).then(() => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalCrearTitulo'));
            modal.hide();
            location.reload();
        });

    } catch (error) {
        console.error("Error al enviar datos:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Ocurrió un error al registrar el título'
        });
    } finally {
        btnGuardar.innerHTML = originalText;
        btnGuardar.disabled = false;
    }
});



function verTitulo(id_embargos) {
    console.log("Ver título activado con ID:", id_embargos);
    fetch(`http://localhost:3000/api/titulos/${id_embargos}`)
        .then(res => res.json())
        .then(data => {
            console.log("Datos recibidos del backend:", data);
            if (!data) {
                alert('No se encontró información del título.');
                return;
            }



            const formatDate = (fecha) => {
                if (!fecha) return 'No registrada';

                const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                const date = new Date(fecha);

                const dia = date.getDate().toString().padStart(2, '0');
                const mes = meses[date.getMonth()];
                const año = date.getFullYear();

                return `${dia}/${mes}/${año}`;
            };

            const contenido = `
                <div class="modal-content border-0" style="box-shadow: 0 5px 20px rgba(0,0,0,0.2); border-radius: 10px; overflow: hidden;">
                    <!-- Encabezado -->
                    <div class="modal-header py-3" style="background: linear-gradient(135deg, #1B3C53 0%, #2c3e50 100%); border-bottom: 2px solid #157347;">
                        <div class="d-flex align-items-center w-100">
                            <i class="fas fa-gavel text-white fs-3 me-3"></i>
                            <div>
                                <h5 class="modal-title text-white fw-bold mb-0" style="letter-spacing: 1px;">
                                    TÍTULO JUDICIAL
                                </h5>
                            </div>
                        </div>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>

                    <!-- Cuerpo del modal -->
                    <div class="modal-body p-0">
                        <!-- Datos del cliente -->
                        <div class="p-4" style="background-color: #f8f9fa; border-bottom: 1px solid #dee2e6;">
                            <div class="row align-items-center">
                                <div class="col-md-2 text-center">
                                    <div class="position-relative d-inline-block">
                                        <img src="${data.foto_perfil ? `http://localhost:3000${data.foto_perfil}` : '../assets/img/avatar.png'}" 
                                            alt="Foto perfil"
                                            class="rounded-circle shadow-sm"
                                            style="width: 90px; height: 90px; object-fit: cover; border: 3px solid #1B3C53;">
                                    </div>
                                    <div class="mt-2">
                                        <span class="badge text-white py-2 px-3" style="background-color: #1B3C53; font-size: 0.8rem;">
                                            EXP. No. ${id_embargos}
                                        </span>
                                    </div>
                                </div>

                                <div class="col-md-10">
                                    <div class="card border-0 shadow-none">
                                        <div class="card-body p-2">
                                            <div class="row">
                                                <div class="col-md-4 border-end pe-3">
                                                    <h5 class="fw-bold text-dark mb-2" style="font-size: 1.1rem;">
                                                        ${data.nombres || ''} ${data.apellidos || ''}</h5>
                                                    <p class="fw-bold text-dark mb-2" style="font-size: 0.9rem;">
                                                        <i class="fas fa-id-card me-2 text-muted"></i> ${data.cedula || 'No registrada'}
                                                    </p>
                                                </div>
                                                <div class="col-md-4 border-end pe-3">
                                                    <p class="mb-2"><span class="fw-bold text-dark">Teléfono:</span>
                                                        <span class="text-dark">${data.telefono || '---'}</span>
                                                    </p>
                                                    <p class="mb-2"><span class="fw-bold text-dark">Email:</span>
                                                        <span class="text-dark">${data.correo || '---'}</span>
                                                    </p>
                                                </div>
                                                <div class="col-md-4">
                                                    <p class="mb-2"><span class="fw-bold text-dark">Radicado:</span>
                                                        <span class="text-dark">${data.radicado || '---'}</span>
                                                    </p>
                                                    <p class="mb-2"><span class="fw-bold text-dark">Ciudad:</span>
                                                        <span class="text-dark">${data.ciudad || '---'}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Documentos del título -->
                        <div class="p-4">
                            <h5 class="fw-bold mb-4" style="color: #1B3C53;"><i class="fas fa-file-contract me-2"></i> DOCUMENTOS DEL TÍTULO</h5>
                            
                            <!-- Terminación Oficina -->
                            <div class="card mb-3 border-0 shadow-sm">
                                <div class="card-body">
                                    <div class="row align-items-center">
                                        <div class="col-md-3 d-flex align-items-center">
                                            <i class="fas fa-file-signature fs-4 me-3" style="color: #1B3C53;"></i>
                                            <div>
                                                <h6 class="mb-0 fw-bold">Terminación Oficina</h6>
                                                <small class="text-dark fw-bold">${formatDate(data.terminacion_ofic)}</small>
                                            </div>
                                        </div>
                                        <div class="col-md-9">
                                            ${data.terminacion_oficpdf ? `
                                            <div class="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <i class="fas fa-file-pdf text-danger me-2"></i>
                                                    <span class="text-dark">Documento de terminación</span>
                                                </div>
                                                <a href="http://localhost:3000/uploads/${data.terminacion_oficpdf}" 
                                                   target="_blank" 
                                                   class="btn btn-md btn-info">
                                                    <i class="fas fa-eye me-1"></i> Ver PDF
                                                </a>
                                            </div>
                                            ` : '<span class="text-dark">No hay documento cargado</span>'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Aceptación Juzgado -->
                            <div class="card mb-3 border-0 shadow-sm">
                                <div class="card-body">
                                    <div class="row align-items-center">
                                        <div class="col-md-3 d-flex align-items-center">
                                            <i class="fas fa-stamp fs-4 me-3" style="color: #1B3C53;"></i>
                                            <div>
                                                <h6 class="mb-0 fw-bold">Aceptación Juzgado</h6>
                                                <small class="text-dark fw-bold">${formatDate(data.terminacion_juzg)}</small>
                                            </div>
                                        </div>
                                        <div class="col-md-9">
                                            ${data.terminacion_juzgpdf ? `
                                            <div class="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <i class="fas fa-file-pdf text-danger me-2"></i>
                                                    <span class="text-dark">Documento de aceptación</span>
                                                </div>
                                                <a href="http://localhost:3000/uploads/${data.terminacion_juzgpdf}" 
                                                   target="_blank" 
                                                   class="btn btn-md btn-info">
                                                    <i class="fas fa-eye me-1"></i> Ver PDF
                                                </a>
                                            </div>
                                            ` : '<span class="text-dark">No hay documento cargado</span>'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- Solicitud de Títulos - Versión compacta -->
                                <div class="card mb-3 border-0 shadow-sm">
                                    <div class="card-body p-3">  <!-- Reducido el padding -->
                                        <div class="d-flex align-items-center">  <!-- Eliminado el row/col para simplificar -->
                                            <i class="fas fa-file-alt fs-4 me-3" style="color: #1B3C53;"></i>
                                            <div>
                                                <h6 class="mb-0 fw-bold">Solicitud de Títulos</h6>
                                                <small class="text-dark fw-bold">${formatDate(data.solicitud_titulos)}</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            <!-- Orden de Pago -->
                            <div class="card mb-3 border-0 shadow-sm">
                                <div class="card-body">
                                    <div class="row align-items-center">
                                        <div class="col-md-3 d-flex align-items-center">
                                            <i class="fas fa-file-invoice-dollar fs-4 me-3" style="color: #1B3C53;"></i>
                                            <div>
                                                <h6 class="mb-0 fw-bold">Orden de Pago</h6>
                                                <small class="text-dark fw-bold">${formatDate(data.orden_pago)}</small>
                                            </div>
                                        </div>
                                        <div class="col-md-9">
                                            ${data.orden_pagopdf ? `
                                            <div class="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <i class="fas fa-file-pdf text-danger me-2"></i>
                                                    <span class="text-dark">Documento de orden de pago</span>
                                                </div>
                                                <a href="http://localhost:3000/uploads/${data.orden_pagopdf}" 
                                                   target="_blank" 
                                                   class="btn btn-md btn-info">
                                                    <i class="fas fa-eye me-1"></i> Ver PDF
                                                </a>
                                            </div>
                                            ` : '<span class="text-dark">No hay documento cargado</span>'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Responsable -->
                            <div class="mt-4 p-3 rounded" style="background-color: #f1f8ff; border-left: 4px solid #1B3C53;">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div class="fw-bold text-dark">
                                        <i class="fas fa-user-tie me-2"></i> RESPONSABLE DEL TRÁMITE:
                                    </div>
                                    <div>
                                        <span class="badge bg-dark py-2 px-3">
                                            ${data.asesor_titulos || 'No asignado'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('contenidoModalTitulo').innerHTML = contenido;
            const modal = new bootstrap.Modal(document.getElementById('modalVerTitulo'));
            modal.show();
        })
        .catch(err => {
            console.error('Error al obtener el título:', err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo obtener la información del título'
            });
        });
}

// Evento escucha para la modal de edición
document.getElementById("terminacionOficinaEdit").addEventListener("change", function () {
    const fechaTerminacion = this.value;

    if (fechaTerminacion) {
        const fechaAceptacion = sumarDiasHabiles(fechaTerminacion, 15);
        const fechaSolicitud = sumarDiasHabiles(fechaAceptacion, 15);

        document.getElementById("fechaAceptacionJuzgadoEdit").value = fechaAceptacion;
        document.getElementById("fechaSolicitudTitulosEdit").value = fechaSolicitud;
    } else {
        document.getElementById("fechaAceptacionJuzgadoEdit").value = "";
        document.getElementById("fechaSolicitudTitulosEdit").value = "";
    }
});

function editarTitulo(id_embargos) {
    fetch(`http://localhost:3000/api/titulos/${id_embargos}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener los datos');
            }
            return response.json();
        })
        .then(data => {
            console.log("Datos recibidos del backend para editar:", data);

            // Función para formatear fechas para inputs type="date"
            const formatDateForInput = (dateString) => {
                if (!dateString) return '';
                try {
                    const date = new Date(dateString);
                    return date.toISOString().split('T')[0];
                } catch (e) {
                    console.error("Error formateando fecha:", dateString, e);
                    return '';
                }
            };

            // 1. Llenar datos del cliente
            document.getElementById('inputIdClienteEdit').value = id_embargos;
            document.getElementById('idModalEdit').textContent = data.id_embargos || '---';
            document.getElementById('detalleNombreClienteEdit').textContent =
                `${data.nombres || ''} ${data.apellidos || ''}`.trim() || '---';
            document.getElementById('detalleTipoDocumentoEdit').innerHTML =
                `<i class="fas fa-id-card me-2 text-muted"></i> ${data.cedula || '---'}`;
            document.getElementById('telefonoModalEdit').textContent = data.telefono || '---';
            document.getElementById('emailModalEdit').textContent = data.correo || '---';
            document.getElementById('radicadoModalEdit').textContent = data.radicado || '---';
            document.getElementById('ciudadModalEdit').textContent = data.ciudad || '---';

            // Foto de perfil
            const fotoPerfil = document.getElementById('fotoperfilModalEdit');
            if (data.foto_perfil) {
                fotoPerfil.src = `http://localhost:3000${data.foto_perfil}`;
            } else {
                fotoPerfil.src = '../assets/img/avatar.png';
            }

            // 2. Llenar fechas del título
            document.getElementById('terminacionOficinaEdit').value = formatDateForInput(data.terminacion_ofic);
            document.getElementById('fechaAceptacionJuzgadoEdit').value = formatDateForInput(data.terminacion_juzg);
            document.getElementById('fechaSolicitudTitulosEdit').value = formatDateForInput(data.solicitud_titulos);
            document.getElementById('fechaOrdenPagadoEdit').value = formatDateForInput(data.orden_pago);

            // 3. Manejar documentos PDF
            const mostrarDocumento = (elementId, filePath, defaultText = 'Ningún archivo seleccionado') => {
                const element = document.getElementById(elementId);
                if (filePath) {
                    const fileName = filePath.split(/[\\/]/).pop(); // Maneja tanto \ como /
                    element.innerHTML = `
                        <i class="fas fa-file-pdf text-danger me-1"></i> ${fileName}
                        <a href="http://localhost:3000/uploads/${filePath.replace(/\\/g, '/')}" 
                           target="_blank" class="ms-2 text-primary">
                            <i class="fas fa-eye me-1"></i> Ver
                        </a>
                    `;
                } else {
                    element.innerHTML = `<i class="fas fa-info-circle me-1"></i> ${defaultText}`;
                }
            };

            mostrarDocumento('nombreArchivoTerminacionEdit', data.terminacion_oficpdf);
            mostrarDocumento('nombreArchivoAceptacionEdit', data.terminacion_juzgpdf);
            mostrarDocumento('nombreArchivoOrdenPagadoEdit', data.orden_pagopdf);

            // 4. Asesor responsable
            document.getElementById('asesorNombreEdit').innerHTML =
                `<i class="fas fa-user-tie me-1"></i> ${data.asesor_titulos || 'No asignado'}`;

            // 5. Mostrar el modal después de cargar todos los datos
            const modal = new bootstrap.Modal(document.getElementById('modalEditarTitulo'));
            modal.show();
        })
        .catch(error => {
            console.error('Error al obtener título:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los datos del título',
                footer: error.message
            });
        });
}


document.getElementById('btnActualizarTitulo').addEventListener('click', async () => {
    // 1. Obtener el ID correctamente
    const idEmbargo = document.getElementById('inputIdClienteEdit').value;
    if (!idEmbargo) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo identificar el título a actualizar'
        });
        return;
    }

    // 2. Preparar FormData
    const formData = new FormData();
    formData.append('id_embargos', idEmbargo);

    // 3. Agregar campos de fechas
    const agregarSiTieneValor = (campo, valor) => {
        if (valor) formData.append(campo, valor);
    };

    agregarSiTieneValor('terminacion_ofic', document.getElementById('terminacionOficinaEdit').value);
    agregarSiTieneValor('terminacion_juzg', document.getElementById('fechaAceptacionJuzgadoEdit').value);
    agregarSiTieneValor('solicitud_titulos', document.getElementById('fechaSolicitudTitulosEdit').value);
    agregarSiTieneValor('orden_pago', document.getElementById('fechaOrdenPagadoEdit').value);

    // 4. Manejo de archivos
    const manejarArchivo = (inputId, campo) => {
        const fileInput = document.getElementById(inputId);
        if (fileInput.files.length > 0) {
            formData.append(campo, fileInput.files[0]);
            return true;
        }
        return false;
    };

    // Solo agregar flags si no se subió nuevo archivo
    if (!manejarArchivo('inputPdfTerminacionEdit', 'terminacion_pdf')) {
        formData.append('mantener_terminacion_pdf', 'true');
    }
    if (!manejarArchivo('inputAceptacionEdit', 'aceptacion_pdf')) {
        formData.append('mantener_aceptacion_pdf', 'true');
    }
    if (!manejarArchivo('inputOrdenPagadoEdit', 'orden_pago_pdf')) {
        formData.append('mantener_orden_pdf', 'true');
    }

    // 5. Mostrar loader durante la solicitud
    Swal.fire({
        title: 'Actualizando título',
        html: 'Por favor espere...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        // 6. Enviar solicitud
        const response = await fetch(`http://localhost:3000/api/titulos/${idEmbargo}`, {
            method: 'PUT',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }

        // 7. Mostrar éxito
        Swal.fire({
            icon: 'success',
            title: '¡Actualizado!',
            text: 'El título se actualizó correctamente',
            timer: 2000,
            showConfirmButton: false
        });

        // 8. Cerrar modal y recargar
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarTitulo'));
        modal.hide();

        setTimeout(() => {
            if (typeof recargarTabla === 'function') {
                recargarTabla();
            } else {
                location.reload();
            }
        }, 1500);

    } catch (error) {
        console.error('Error en la solicitud:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error al actualizar',
            text: error.message,
            footer: 'Revise la consola para más detalles'
        });
    }
});