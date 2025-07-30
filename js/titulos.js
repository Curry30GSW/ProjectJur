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

    titulos.forEach((titulo) => {

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
                <span class="text-md font-weight-bold text-dark">${formatearFecha(titulo.fecha_terminacion)}</span>
            </td>
             <td class="text-center align-middle">
                <button class="btn btn-success btn-md me-1" title="Crear título"
                    onclick="crearTitulo(
                        '${titulo.id_embargos}',
                        '${titulo.foto_perfil}',
                        '${titulo.nombres}',
                        '${titulo.apellidos}',
                        '${titulo.cedula}',
                        '${titulo.radicado}',
                        '${titulo.fecha_terminacion}',
                        '${titulo.telefono}',
                        '${titulo.correo}',
                        '${titulo.ciudad}',
                        '${titulo.ruta_desprendible}'
                    )">
                    <i class="fas fa-plus me-1"></i> Crear título
                    </button>
                <button class="btn btn-warning btn-md" title="Editar título" onclick="editarTitulo(${titulo.id_embargos})">
                    <i class="fas fa-edit me-1"></i> Editar título
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



function crearTitulo(id, foto_perfil, nombres, apellidos, cedula, radicado, fecha_terminacion, telefono, correo, ciudad, ruta_desprendible) {
    limpiarModalCrearTitulo();
    const modal = new bootstrap.Modal(document.getElementById('modalCrearTitulo'));
    modal.show();

    document.getElementById('fotoperfilModal').src = `http://localhost:3000${foto_perfil}`;
    document.getElementById('idModal').textContent = id;
    document.getElementById('inputIdCliente').value = id;
    document.getElementById('detalleNombreCliente').textContent = `${nombres} ${apellidos}`;
    document.getElementById('detalleTipoDocumento').textContent = `Cédula: ${cedula}`;

    const fechaTerminacionISO = convertirFechaISO(fecha_terminacion);
    document.getElementById('terminacionOficina').value = fechaTerminacionISO;

    // 🟩 Calcular fechas
    const fechaAceptacion = sumarDiasHabiles(fechaTerminacionISO, 15);
    const fechaSolicitud = sumarDiasHabiles(fechaAceptacion, 15);

    document.getElementById('fechaAceptacionJuzgado').value = fechaAceptacion;
    document.getElementById('fechaSolicitudTitulos').value = fechaSolicitud;

    // Otros datos
    document.getElementById('telefonoModal').textContent = `${telefono}`;
    document.getElementById('emailModal').textContent = `${correo}`;
    document.getElementById('radicadoModal').textContent = `${radicado}`;
    document.getElementById('ciudadModal').textContent = `${ciudad}`;

    const btnVerPdf = document.getElementById('btnVerPdfTerminacion');
    btnVerPdf.onclick = () => {
        if (ruta_desprendible) {
            const url = `http://localhost:3000/uploads${ruta_desprendible}`;
            window.open(url, '_blank');
        } else {
            alert("No hay archivo PDF disponible.");
        }
    };
}


// Función auxiliar para formatear fecha si aún no la tienes
function convertirFechaISO(fecha) {
    if (!fecha) return '';
    const dateObj = new Date(fecha);
    if (isNaN(dateObj)) return '';

    // Devuelve el formato YYYY-MM-DD para <input type="date">
    return dateObj.toISOString().split('T')[0];
}

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
    configurarPrevisualizacionArchivo('inputAceptacion', 'label[for="inputAceptacion"]', 'nombreArchivoAceptacion');
    configurarPrevisualizacionArchivo('inputOrdenPagado', 'label[for="inputOrdenPagado"]', 'nombreArchivoOrdenPagado');
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
    document.getElementById('nombreArchivoAceptacion').innerHTML = '<i class="fas fa-info-circle me-1"></i> Ningún archivo seleccionado';
    document.getElementById('nombreArchivoOrdenPagado').innerHTML = '<i class="fas fa-info-circle me-1"></i> Ningún archivo seleccionado';

    // 💡 Elimina el estilo CSS de archivo subido
    document.querySelector("label[for='inputAceptacion']").classList.remove("has-file");
    document.querySelector("label[for='inputOrdenPagado']").classList.remove("has-file");
}
