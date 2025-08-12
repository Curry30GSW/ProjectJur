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
        const url = 'http://localhost:3000/api/clientes-datacredito';

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

    let resultados = '';

    clientes.forEach((cliente) => {
        const estadoTexto = !cliente.nombreData ? "FALTA DATACREDITO" : "Cargado";
        const estadoClase = !cliente.nombreData ? "bg-gradient-danger" : "bg-gradient-success";
        const moverAreaDisabled = !cliente.nombreData ? 'disabled' : '';

        const fecha = new Date(cliente.fecha_vinculo);
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const dia = fecha.getDate();
        const mes = meses[fecha.getMonth()];
        const año = fecha.getFullYear();
        const fechaFormateada = `${dia}/${mes}/${año}`;

        resultados += `
        <tr>
            <td>
                <div class="d-flex align-items-center px-2 py-1">
                    <div>
                        <img src="http://localhost:3000${cliente.foto_perfil}" 
                            class="avatar avatar-lg me-3 foto-cliente" 
                            alt="${cliente.nombres}"
                            data-src="http://localhost:3000${cliente.foto_perfil}">
                    </div>
                    <div class="d-flex flex-column justify-content-center">
                        <h6 class="mb-0 text-xs">${cliente.nombres} ${cliente.apellidos}</h6>
                        <p class="text-xs text-secondary mb-0">${cliente.correo}</p>
                    </div>
                </div>
            </td>
            <td class="text-center align-middle"><p class="text-sm text-dark mb-0">${cliente.cedula}</p></td>
            <td class="align-middle text-center text-sm">
                <p class="badge badge-sm ${estadoClase}">${estadoTexto}</p>
            </td>
            <td class="align-middle text-center">
                <p class="text-dark text-sm font-weight-normal">${fechaFormateada}</p>
            </td>
            <td class="align-middle">
                <div class="d-flex justify-content-center gap-2">
                    <button class="btn btn-sm btn-info text-white ver-detalle" data-cedula="${cliente.cedula}">
                        Ver detalle
                    </button>
                    <button class="btn btn-sm btn-primary text-white subir-data"
                        data-cedula="${cliente.cedula}"
                        data-nombre="${cliente.nombres} ${cliente.apellidos}">
                        Subir DataCrédito
                    </button>
                    <button class="btn btn-sm btn-warning text-white mover-area" ${moverAreaDisabled}
                        data-cedula="${cliente.cedula}"
                        data-nombre="${cliente.nombres} ${cliente.apellidos}">
                        Mover de Área
                    </button>
                </div>
            </td>
        </tr>
    `;
    });

    if ($.fn.DataTable.isDataTable('#tablaClientes')) {
        $('#tablaClientes').DataTable().clear().destroy();
    }

    $("#tablaClientes tbody").html(resultados);

    // Inicializa DataTable
    $('#tablaClientes').DataTable({
        language: {
            decimal: ",",
            thousands: ".",
            processing: "Procesando...",
            search: "Buscar:",
            lengthMenu: "Mostrar _MENU_ registros",
            info: "Mostrando del _START_ al _END_ de _TOTAL_ registros",
            infoEmpty: "Mostrando 0 a 0 de 0 registros",
            infoFiltered: "(filtrado de _MAX_ registros totales)",
            infoPostFix: "",
            loadingRecords: "Cargando...",
            zeroRecords: "No se encontraron registros",
            emptyTable: "No hay datos disponibles en la tabla",
            paginate: {
                first: "Primero",
                previous: "Anterior",
                next: "Siguiente",
                last: "Último"
            },
            aria: {
                sortAscending: ": activar para ordenar ascendente",
                sortDescending: ": activar para ordenar descendente"
            }
        },
        pageLength: 10,
        responsive: true,
        order: [[3, 'desc']],
    });

};


$(document).on('click', '.foto-cliente', function () {
    const src = $(this).data('src');
    $('#imagen-modal').attr('src', src);

    const modal = new bootstrap.Modal(document.getElementById('modalFoto'));
    modal.show();
});


document.querySelector('#tablaClientes tbody').addEventListener('click', function (e) {
    const boton = e.target.closest('.ver-detalle');
    if (boton) {
        const cedula = boton.getAttribute('data-cedula');
        const fila = boton.closest('tr');
        const foto = fila.querySelector('.foto-cliente')?.getAttribute('data-src');

        fetch(`http://localhost:3000/api/clientes/${cedula}`)
            .then(response => response.json())
            .then(cliente => {
                // Llenar datos en el modal
                llenarModalDetalle(cliente, foto);

                // Mostrar el modal
                const modal = new bootstrap.Modal(document.getElementById('modalVerDetalle'));
                modal.show();
            })
            .catch(error => {
                console.error('Error al obtener los detalles:', error);
                mostrarError('Error al cargar los datos del cliente');
            });
    }
});

function llenarModalDetalle(cliente, fotoUrl) {


    // Foto de perfil
    const fotoPerfil = document.getElementById('detalleFotoPerfil');
    fotoPerfil.src = cliente.foto_perfil
        ? `http://localhost:3000${cliente.foto_perfil}`
        : (fotoUrl || '../assets/img/avatar.png');


    // Datos personales
    document.getElementById('detalleID').textContent = cliente.id_cliente || 'No registrado';
    const vinculo = cliente.fecha_vinculo;

    if (vinculo) {
        const fecha = new Date(vinculo);
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = fecha.toLocaleString('es-CO', { month: 'short' }).replace('.', '');
        const mesFormateado = mes.charAt(0).toUpperCase() + mes.slice(1).toLowerCase(); // Ene, Feb, Mar, etc.
        const anio = fecha.getFullYear();

        document.getElementById('detalleVinculacion').textContent = `${dia}/${mesFormateado}/${anio}`;
    } else {
        document.getElementById('detalleVinculacion').textContent = 'No registrado';
    }
    const nombreCompleto = `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim();
    document.getElementById('detalleNombreCompleto').innerText = nombreCompleto || 'No registrado';

    document.getElementById('detalleCedula').value = cliente.cedula || 'No registrado';
    document.getElementById('detalleTelefono').value = cliente.telefono || 'No registrado';
    document.getElementById('detalleCorreo').value = cliente.correo || 'No registrado';
    document.getElementById('detalleDireccion').value = cliente.direccion || 'No registrado';
    document.getElementById('detalleCiudad').value = cliente.ciudad || 'No registrado';
    document.getElementById('detalleBarrio').value = cliente.barrio || 'No registrado';
    document.getElementById('detalleSexo').value = cliente.sexo || 'No registrado';

    if (cliente.fecha_nac) {
        const fecha = new Date(cliente.fecha_nac);

        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = fecha.toLocaleString('es-CO', { month: 'short' });
        const anio = fecha.getFullYear();

        const mesFormateado = mes.charAt(0).toUpperCase() + mes.slice(1).replace('.', '');

        const fechaFormateada = `${dia}/${mesFormateado}/${anio}`;
        document.getElementById('detalleFechaNacimiento').value = fechaFormateada;
    } else {
        document.getElementById('detalleFechaNacimiento').value = 'No registrado';
    }

    document.getElementById('detalleEdad').value = cliente.edad || 'No registrado';
    document.getElementById('detalleEstCivil').value = cliente.estado_civil || 'No registrado';

    // Datos financieros
    document.getElementById('detalleSalario').value = cliente.salario ?
        '$' + cliente.salario.toLocaleString('es-CO') : 'No registrado';

    const situacionLaboral = cliente.laboral == 1 ? 'ACTIVO' : 'PENSIONADO';
    document.getElementById('detalleSituacionLaboral').value = situacionLaboral;

    document.getElementById('detalleEmpresa').value = cliente.empresa || 'No registrado';
    document.getElementById('detalleCargo').value = cliente.cargo || 'No registrado';
    document.getElementById('detallePagaduria').value = cliente.pagaduria || 'No registrado';
    document.getElementById('detalleCuota').value = cliente.valor_cuota ?
        '$' + parseInt(cliente.valor_cuota).toLocaleString('es-CO') : 'No registrado';

    document.getElementById('detallePorcentaje').value = cliente.porcentaje ?
        cliente.porcentaje + '%' : 'No registrado';

    document.getElementById('detalleInsolvencia').value = cliente.valor_insolvencia ?
        '$' + parseInt(cliente.valor_insolvencia).toLocaleString('es-CO') : 'No registrado';

    document.getElementById('detalleNCuotas').value = cliente.numero_cuotas || 'No registrado';

    // Mostrar/ocultar campos según situación laboral
    if (cliente.laboral == 1) {
        document.getElementById('detalleEmpresaContainer').style.display = 'block';
        document.getElementById('detalleCargoContainer').style.display = 'block';
        document.getElementById('detallePagaduriaContainer').style.display = 'none';
    } else {
        document.getElementById('detalleEmpresaContainer').style.display = 'none';
        document.getElementById('detalleCargoContainer').style.display = 'none';
        document.getElementById('detallePagaduriaContainer').style.display = 'block';
    }

    // Documentos PDF
    actualizarBotonPDF('detalleCedulaPDF', cliente.cedula_pdf, 'Ver Cédula');
    actualizarBotonPDF('detalleDesprendible', cliente.desprendible, 'Ver Desprendible');

    actualizarBotonPDF('detalleBienesInmuebles', cliente.bienes, 'Ver Bienes');


    // Bienes inmuebles
    const bienesInmueblesDiv = document.getElementById('detalleBienesInmuebles');

    if (cliente.bienes === "1" && cliente.bienes_inmuebles) {
        actualizarBotonPDF('detalleBienesInmuebles', cliente.bienes_inmuebles, 'Ver Bienes Inmuebles');
    } else {
        bienesInmueblesDiv.innerHTML = '<span class="text-muted">El cliente no reporta bienes inmuebles</span>';
    }

    // Data crédito
    const dataCreditoDiv = document.getElementById('detalleDataCredito');

    if (cliente.nombreData) {
        actualizarBotonPDF('detalleDataCredito', cliente.nombreData, 'Ver DataCredito');
    } else {
        dataCreditoDiv.innerHTML = '<span class="text-muted">El cliente no tiene data crédito registrado</span>';
    }




    // Asesor
    document.getElementById('detalleAsesor').value = cliente.asesor || 'No asignado';

    // Fecha de vinculación
    if (cliente.fecha_vinculo) {
        const fecha = new Date(cliente.fecha_vinculo);

        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = fecha.toLocaleString('es-CO', { month: 'short' }); // ejemplo: "may."
        const anio = fecha.getFullYear();

        // Quitar el punto final en el mes (si lo tiene)
        const mesFormateado = mes.charAt(0).toUpperCase() + mes.slice(1).replace('.', '');

        const fechaFormateada = `${dia}/${mesFormateado}/${anio}`;
        document.getElementById('detalleFechaVinculo').value = fechaFormateada;
    } else {
        document.getElementById('detalleFechaVinculo').value = 'No registrada';
    }


    // Estado del cliente
    const estadoCliente = cliente.estado == 0 ? 'ACTIVO' : 'INACTIVO';
    document.getElementById('detalleEstadoCliente').value = estadoCliente;

    // Motivo de retiro (si aplica)
    document.getElementById('detalleMotivoRetiro').value = cliente.motivo_retiro || 'NO APLICA';


    // Llenar referencias familiares
    if (cliente.referencias_familiares) {
        const refsFamiliares = cliente.referencias_familiares;

        for (let i = 0; i < 3; i++) {
            const nombreInput = document.getElementById(`detalleRefFam${i + 1}`);
            const telInput = document.getElementById(`detalleRefFamTel${i + 1}`);
            const parentescoInput = document.getElementById(`detalleRefFamParentesco${i + 1}`);

            if (refsFamiliares[i]) {
                nombreInput.value = refsFamiliares[i].familia_nombre || '';
                telInput.value = refsFamiliares[i].familia_telefono || '';
                parentescoInput.value = refsFamiliares[i].parentesco || '';

                // Mostrar el campo por si estaba oculto
                nombreInput.parentElement.style.display = '';
                telInput.parentElement.style.display = '';
                parentescoInput.parentElement.style.display = '';
            } else {
                // Limpiar y ocultar campos si no hay datos
                nombreInput.value = '';
                telInput.value = '';
                parentescoInput.value = '';

                nombreInput.parentElement.style.display = 'none';
                telInput.parentElement.style.display = 'none';
                parentescoInput.parentElement.style.display = 'none';
            }
        }
    }

    // Llenar referencias personales
    if (cliente.referencias_personales) {
        const refsPersonales = cliente.referencias_personales;

        for (let i = 0; i < 3; i++) {
            const nombreInput = document.getElementById(`detalleRefPer${i + 1}`);
            const telInput = document.getElementById(`detalleRefPerTel${i + 1}`);

            if (refsPersonales[i]) {
                nombreInput.value = refsPersonales[i].personal_nombre || '';
                telInput.value = refsPersonales[i].personal_telefono || '';

                nombreInput.parentElement.style.display = '';
                telInput.parentElement.style.display = '';
            } else {
                nombreInput.value = '';
                telInput.value = '';

                nombreInput.parentElement.style.display = 'none';
                telInput.parentElement.style.display = 'none';
            }
        }
    }

}

function actualizarBotonPDF(elementId, url, textoBoton) {
    const elemento = document.getElementById(elementId);
    if (url) {
        const fullUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`;
        elemento.innerHTML = `
            <a href="${fullUrl}" target="_blank" class="btn btn-danger btn-lg">
                <i class="fas fa-file-pdf me-1"></i> ${textoBoton}
            </a>
        `;
    } else {
        elemento.innerHTML = '<span class="text-muted">No hay documento adjunto</span>';
    }
}


function mostrarError(mensaje) {
    console.error(mensaje);
    alert(mensaje);
}

document.addEventListener('click', function (event) {
    if (event.target.classList.contains('subir-data')) {
        const cedula = event.target.getAttribute('data-cedula');
        const nombre = event.target.getAttribute('data-nombre');

        // Mostrar el nombre del cliente
        document.getElementById('nombreClienteModal').textContent = nombre;
        document.getElementById('cedulaClienteModal').textContent = cedula;

        // Guardar la cédula en el input hidden
        document.getElementById('cedulaClienteSeleccionado').value = cedula;

        // Mostrar la modal
        const modal = new bootstrap.Modal(document.getElementById('modalDataCredito'));
        modal.show();
    }
});

document.addEventListener('click', function (event) {
    if (event.target.classList.contains('mover-area')) {
        const cedula = event.target.getAttribute('data-cedula');
        const nombre = event.target.getAttribute('data-nombre');

        document.getElementById('nombreClienteArea').textContent = nombre;
        document.getElementById('cedulaClienteArea').value = cedula;
        document.getElementById('selectNuevaArea').value = '';

        // Mostrar la modal
        const modal = new bootstrap.Modal(document.getElementById('modalMoverArea'));
        modal.show();
    }
});

document.getElementById('btnConfirmarDatacredito').addEventListener('click', async () => {
    const fileInput = document.getElementById('inputDatacredito');
    const cedula = document.getElementById('cedulaClienteSeleccionado').value;
    const usuario = sessionStorage.getItem('nombreUsuario');

    if (!fileInput.files[0]) {
        return Swal.fire({
            icon: 'warning',
            title: 'Archivo faltante',
            text: 'Por favor selecciona un archivo PDF.'
        });
    }

    if (fileInput.files[0].size > 5 * 1024 * 1024) {
        return Swal.fire({
            icon: 'error',
            title: 'Archivo demasiado grande',
            text: 'El archivo supera el límite permitido de 5 MB.'
        });
    }


    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('cedula', cedula);
    formData.append('usuario', usuario);

    try {
        const response = await fetch('http://localhost:3000/api/subir-documento', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalDataCredito'));
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

document.getElementById('btnConfirmarMoverArea').addEventListener('click', async () => {
    const cedula = document.getElementById('cedulaClienteArea').value;
    const nuevaArea = document.getElementById('selectNuevaArea').value;
    const usuario = sessionStorage.getItem('nombreUsuario');

    if (!nuevaArea) {
        Swal.fire({
            icon: 'warning',
            title: 'Área no seleccionada',
            text: 'Por favor selecciona una nueva área.'
        });
        return;
    }

    try {
        const res = await fetch('http://localhost:3000/api/mover-area', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cedula, area: nuevaArea, usuario })
        });

        const result = await res.json();

        if (res.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Área actualizada',
                html: result.message
            }).then(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalMoverArea'));
                modal.hide();
                location.reload();
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: result.message || 'Ocurrió un error al mover de área.'
            });
        }
    } catch (error) {
        console.error('Error al mover de área:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo conectar con el servidor.'
        });
    }
});


async function cargarNotificaciones() {
    try {
        const res = await fetch('http://localhost:3000/api/notificaciones');
        const datos = await res.json();
        const contenedor = document.getElementById('notificaciones-contenedor');
        contenedor.innerHTML = ''; // limpiar

        datos.forEach(n => {
            contenedor.innerHTML += `
                    <div class="timeline-block mb-3">
                        <span class="timeline-step bg-success shadow">
                            <i class="fa fa-check text-white"></i>
                        </span>
                        <div class="timeline-content">
                            <h6 class="text-dark text-sm font-weight-bold mb-0">
                                ${n.nombre_cliente} fue trasladado a <strong>${n.area_destino}</strong> por ${n.usuario}
                            </h6>
                            <p class="text-secondary font-weight-bold text-xs mt-1 mb-0">${n.fecha_formateada}</p>
                        </div>
                    </div>
                `;
        });

    } catch (err) {
        console.error('Error cargando notificaciones:', err);
    }
}

// Llamar al cargar la página
window.addEventListener('DOMContentLoaded', cargarNotificaciones);


const modalDataCredito = document.getElementById('modalDataCredito');

modalDataCredito.addEventListener('hidden.bs.modal', function () {
    // Limpiar el input file
    const fileInput = document.getElementById('inputDatacredito');
    const fileNameDisplay = document.getElementById('inputDatacreditoFileNameDisplay');
    const uploadLabel = document.querySelector('.file-upload-container label[for="inputDatacredito"]');

    if (fileInput) fileInput.value = ''; // Limpia el archivo
    if (fileNameDisplay) fileNameDisplay.textContent = 'Ningún archivo seleccionado';
    if (uploadLabel) {
        uploadLabel.classList.remove('has-file');
        const textSpan = uploadLabel.querySelector('.file-upload-text');
        if (textSpan) textSpan.textContent = 'Subir Datacrédito PDF';
    }

    // También limpiar la vista previa del PDF
    const previewContainer = document.getElementById('pdfPreviewContainer');
    const previewFrame = document.getElementById('pdfPreview');
    if (previewContainer) previewContainer.style.display = 'none';
    if (previewFrame) previewFrame.src = '';
});



document.addEventListener('DOMContentLoaded', function () {
    function setupFileInput(inputId, displayId, labelSelector, defaultText = 'Seleccionar archivo', selectedText = 'Archivo seleccionado') {
        const fileInput = document.getElementById(inputId);
        const fileNameDisplay = document.getElementById(displayId);
        const uploadLabel = document.querySelector(labelSelector);
        const previewContainer = document.getElementById('pdfPreviewContainer');
        const previewFrame = document.getElementById('pdfPreview');

        if (fileInput && fileNameDisplay && uploadLabel) {
            fileInput.addEventListener('change', function () {
                if (this.files.length > 0) {
                    const file = this.files[0];
                    const fileName = file.name;

                    // Mostrar nombre del archivo
                    fileNameDisplay.textContent = fileName;
                    uploadLabel.classList.add('has-file');
                    uploadLabel.querySelector('.file-upload-text').textContent = selectedText;

                    // Validar que sea PDF
                    if (file.type === "application/pdf") {
                        const fileURL = URL.createObjectURL(file);
                        previewFrame.src = fileURL;
                        previewContainer.style.display = 'block';
                    } else {
                        previewContainer.style.display = 'none';
                        previewFrame.src = '';
                    }

                } else {
                    fileNameDisplay.textContent = 'Ningún archivo seleccionado';
                    uploadLabel.classList.remove('has-file');
                    uploadLabel.querySelector('.file-upload-text').textContent = defaultText;

                    previewContainer.style.display = 'none';
                    previewFrame.src = '';
                }
            });
        }
    }

    setupFileInput(
        'inputDatacredito',
        'inputDatacreditoFileNameDisplay',
        '.file-upload-container label[for="inputDatacredito"]',
        'Subir Datacrédito PDF',
        'Archivo seleccionado'
    );
});
