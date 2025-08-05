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

document.addEventListener('DOMContentLoaded', async function () {
    if (!token) {
        window.location.href = '../pages/login.html';
        return;
    }
    async function obtenerClientes() {
        try {
            const token = sessionStorage.getItem('token');
            const url = 'http://localhost:3000/api/clientes';

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


    await obtenerClientes();


});

const mostrar = (clientes) => {
    let resultados = '';

    clientes.forEach((cliente) => {
        const estadoTexto = cliente.estado == 0 ? "ACTIVO" : "INACTIVO";
        const estadoClase = cliente.estado == 0 ? "bg-gradient-success" : "bg-gradient-danger";

        // Formatear la fecha para mostrar en el formato 13/Sep/2025
        const fecha = new Date(cliente.fecha_vinculo);
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const dia = fecha.getDate();
        const mes = meses[fecha.getMonth()];
        const año = fecha.getFullYear();
        const fechaFormateada = `${dia}/${mes}/${año}`;

        resultados += `
        <tr>
            <td class="text-center align-middle">
                <p class="text-center text-md text-dark ">#${cliente.id_cliente}</p>
            </td>
            <td>
                <div class="d-flex align-items-center px-2 py-1">
                    <div>
                        <img src="http://localhost:3000${cliente.foto_perfil}" 
                            class="avatar avatar-lg me-3 foto-cliente" 
                            alt="${cliente.nombres}"
                            data-src="http://localhost:3000${cliente.foto_perfil}">
                    </div>
                    <div class="d-flex flex-column justify-content-center">
                        <h6 class="mb-0 text-sm">${cliente.nombres} ${cliente.apellidos}</h6>
                        <p class="text-sm text-secondary mb-0">${cliente.correo}</p>
                    </div>
                </div>
            </td>
            <td>
                <p class="text-sm text-dark ">${cliente.cedula}</p>
            </td>
            <td class="align-middle text-center text-sm">
                <p class="badge badge-sm ${estadoClase}">${estadoTexto}</p>
            </td>
            <td class="align-middle text-center">
                <p class="text-dark text-sm ">${fechaFormateada}</p>
            </td>
            <td class="align-middle">
                <div class="d-flex justify-content-center gap-2">
                    <button class="btn btn-sm btn-info text-white ver-detalle" data-cedula="${cliente.cedula}">
                        Ver detalle
                    </button>
                    <button class="btn btn-sm btn-warning text-white editar-cliente" data-cedula="${cliente.cedula}">
                        Editar
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

    $('#tablaClientes').DataTable({
        pageLength: 8,
        lengthMenu: [8, 16, 25, 50, 100],
        order: [[0, 'desc']],
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



// Evento para el botón Editar
$(document).on('click', '.editar-cliente', function () {
    const cedula = $(this).data('cedula');


    // Obtener datos del cliente desde la API
    $.get(`http://localhost:3000/api/clientes/${cedula}`, function (cliente) {
        console.log('Datos completos del cliente recibidos:', cliente);
        const salarioFormateado = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(cliente.salario);
        // Habilitar/deshabilitar motivo de retiro según estado
        $('#editarEstadoCliente').change(function () {
            if ($(this).val() === '1') {
                $('#editarMotivoRetiro').prop('disabled', false);
                if (cliente.motivo_retiro) {
                    $('#editarMotivoRetiro').val(cliente.motivo_retiro);
                }
            } else {
                $('#editarMotivoRetiro').prop('disabled', true).val('');
            }
        });


        // Llenar el formulario con los datos del cliente
        $('#editarID').text(cliente.id_cliente);
        $('#editarNombreCompleto').text(`${cliente.nombres} ${cliente.apellidos}`);
        $('#editarCedula').val(cliente.cedula);
        $('#editarTelefono').val(cliente.telefono);
        $('#editarCorreo').val(cliente.correo);
        $('#editarDireccion').val(cliente.direccion);
        $('#editarCiudad').val(cliente.ciudad);
        $('#editarBarrio').val(cliente.barrio);
        $('#editarSexo').val(cliente.sexo);
        $('#editarEdad').val(cliente.edad);
        $('#editarEstCivil').val(cliente.estado_civil);
        $('#editarAsesor').val(cliente.asesor);
        $('#editarSalario').val(salarioFormateado);
        $('#editarEmpresa').val(cliente.empresa);
        $('#editarCargo').val(cliente.cargo);
        $('#editarPagaduria').val(cliente.pagaduria);
        if (cliente.laboral === 1) {
            $('#editarSituacionLaboral').val('ACTIVO').trigger('change');
        } else {
            $('#editarSituacionLaboral').val('PENSIONADO').trigger('change');
        }
        const formatoPesos = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        });

        $('#editarCuota').val(formatoPesos.format(cliente.valor_cuota));
        $('#editarPorcentaje').val(cliente.porcentaje + '%');
        $('#editarInsolvencia').val(formatoPesos.format(cliente.valor_insolvencia));

        $('#editarNCuotas').val(cliente.numero_cuotas)
        $('#editarEstadoCliente').val(cliente.estado.toString()).trigger('change');





        // Mostrar referencias familiares
        // Limpiar los contenedores primero
        $('#contenedorReferenciasFamiliares .card-body').empty();
        $('#contenedorReferenciasPersonales .card-body').empty();

        // Mostrar referencias familiares
        cliente.referencias_familiares.forEach((ref, index) => {
            const html = `
                <div class="mb-3">
                <label class="form-label fw-bold">Referencia Familiar ${index + 1}:</label>
                <input type="hidden" name="ref_fam_id${index + 1}" value="${ref.id_referenciaFa}">
                <input type="text" class="form-control mb-2" name="ref_fam${index + 1}" value="${ref.familia_nombre}">
                <div class="row">
                    <div class="col-md-6">
                    <input type="text" class="form-control mb-2" name="ref_fam_tel${index + 1}" value="${ref.familia_telefono}" placeholder="Teléfono">
                    </div>
                    <div class="col-md-6">
                    <input type="text" class="form-control" name="ref_fam_parentesco${index + 1}" value="${ref.parentesco}" placeholder="Parentesco">
                    </div>
                </div>
                </div>
            `;
            $('#contenedorReferenciasFamiliares .card-body').append(html);
        });


        // Mostrar referencias personales
        cliente.referencias_personales.forEach((ref, index) => {
            const html = `
                <div class="mb-3">
                <label class="form-label fw-bold">Referencia Personal ${index + 1}:</label>
                <input type="hidden" name="ref_per_id${index + 1}" value="${ref.id_referenciaPe}">
                <input type="text" class="form-control mb-2" name="ref_per${index + 1}" value="${ref.personal_nombre}">
                <input type="text" class="form-control" name="ref_per_tel${index + 1}" value="${ref.personal_telefono}" placeholder="Teléfono">
                </div>
            `;
            $('#contenedorReferenciasPersonales .card-body').append(html);
        });



        // Mostrar la foto de perfil si existe
        if (cliente.foto_perfil) {
            $('#editarFotoPerfil').attr('src', `http://localhost:3000${cliente.foto_perfil}`);
        }

        // Mostrar botón para ver Desprendible si existe
        if (cliente.desprendible) {
            $('#verDesprendible')
                .removeClass('d-none')
                .off('click')
                .on('click', function () {
                    window.open(`http://localhost:3000${cliente.desprendible}`, '_blank');
                });
        } else {
            $('#verDesprendible').addClass('d-none');
        }

        // Mostrar botón para ver Bienes Inmuebles si existe
        if (cliente.bienes_inmuebles && cliente.bienes_inmuebles.length > 0) {
            $('#verBienesInmuebles')
                .removeClass('d-none')
                .off('click')
                .on('click', function () {
                    // Si hay varios archivos, puedes abrir todos o uno solo, aquí se abre el primero como ejemplo:
                    window.open(`http://localhost:3000${cliente.bienes_inmuebles}`, '_blank');
                });
        } else {
            $('#verBienesInmuebles').addClass('d-none');
        }

        if (cliente.cedula_pdf) {
            $('#verCedulaPDF')
                .removeClass('d-none')
                .off('click')
                .on('click', function () {
                    window.open(`http://localhost:3000${cliente.cedula_pdf}`, '_blank');
                });
        } else {
            $('#verCedulaPDF').addClass('d-none');
        }

        // Formatear la fecha de nacimiento a YYYY-MM-DD
        if (cliente.fecha_nac) {
            const fechaNacimiento = new Date(cliente.fecha_nac);
            const fechaFormateada = fechaNacimiento.toISOString().split('T')[0];
            $('#editarFechaNacimiento').val(fechaFormateada);
        }

        if (cliente.fecha_vinculo) {
            const fechaVinculo = new Date(cliente.fecha_vinculo);
            const fechaFormateada = fechaVinculo.toISOString().split('T')[0];
            $('#editarFechaVinculo').text(fechaFormateada);
        }


        // Mostrar el modal
        $('#modalEditarCliente').modal('show');
    }).fail(function () {
        mostrarError('No se pudo cargar la información del cliente');
    });
});

// Evento para enviar el formulario de edición
$('#formEditarCliente').submit(function (e) {
    e.preventDefault();

    const formData = new FormData();
    const cedula = $('#editarCedula').val();

    // Agregar datos personales al FormData
    formData.append('cedula', cedula);
    formData.append('nombres', $('#editarNombre').val());
    formData.append('apellidos', $('#editarApellidos').val());
    formData.append('telefono', $('#editarTelefono').val());
    formData.append('correo', $('#editarCorreo').val());
    formData.append('direccion', $('#editarDireccion').val());
    formData.append('ciudad', $('#editarCiudad').val());
    formData.append('barrio', $('#editarBarrio').val());
    formData.append('estado', $('#editarEstado').val());  // ver esto
    formData.append('motivo_retiro', $('#editarMotivoRetiro').val());

    $('#editarEmpresa, #editarCargo, #editarPagaduria').prop('disabled', false);

    // Datos financieros
    formData.append('salario', $('#editarSalario').val().replace(/[^0-9]/g, ''));

    //formData.append('laboral', $('#editarSituacionLaboral').val());  // ver esto

    const situacion = $('#editarSituacionLaboral').val();
    let valorLaboral = '';

    if (situacion === 'ACTIVO') {
        valorLaboral = '1';
    } else if (situacion === 'PENSIONADO') {
        valorLaboral = '0';
    } else {
        valorLaboral = 'NO APLICA';
    }
    formData.append('laboral', valorLaboral);


    formData.set('empresa', $('#editarEmpresa').val() || 'NO APLICA');
    formData.set('cargo', $('#editarCargo').val() || 'NO APLICA');
    formData.set('pagaduria', $('#editarPagaduria').val() || 'NO APLICA');

    // Archivos
    const fotoPerfil = $('#inputFotoPerfil')[0].files[0];
    if (fotoPerfil) formData.append('foto_perfil', fotoPerfil);

    const cedulaPDF = $('#inputCedulaPDF')[0].files[0];
    if (cedulaPDF) formData.append('cedula_pdf', cedulaPDF);

    const desprendible = $('#editarDesprendible')[0].files[0];
    if (desprendible) formData.append('desprendible_pago', desprendible);

    const bienesInmuebles = $('#editarBienesInmuebles')[0].files;
    if (bienesInmuebles && bienesInmuebles.length > 0) {
        for (let i = 0; i < bienesInmuebles.length; i++) {
            formData.append('bienes_inmuebles[]', bienesInmuebles[i]);
        }
    }

    const dataCredito = $('#editarDataCredito')[0].files[0];
    if (dataCredito) formData.append('data_credito', dataCredito);

    // Procesar referencias familiares
    const referenciasFamiliares = [];
    for (let i = 1; i <= 3; i++) {
        const nombre = $(`input[name="ref_fam${i}"]`).val();
        const telefono = $(`input[name="ref_fam_tel${i}"]`).val();
        const parentesco = $(`input[name="ref_fam_parentesco${i}"]`).val();
        const id = $(`input[name="ref_fam_id${i}"]`).val();

        if (nombre || telefono || parentesco) {
            referenciasFamiliares.push({
                id_referenciaFa: id || null,
                familia_nombre: nombre,
                familia_telefono: telefono,
                parentesco: parentesco
            });
        }
    }

    // Procesar referencias personales
    const referenciasPersonales = [];
    for (let i = 1; i <= 3; i++) {
        const nombre = $(`input[name="ref_per${i}"]`).val();
        const telefono = $(`input[name="ref_per_tel${i}"]`).val();
        const id = $(`input[name="ref_per_id${i}"]`).val();

        if (nombre || telefono) {
            referenciasPersonales.push({
                id_referenciaPe: id || null,
                personal_nombre: nombre,
                personal_telefono: telefono
            });
        }
    }

    // Agregar referencias al FormData
    formData.append('referencias_familiares', JSON.stringify(referenciasFamiliares));
    formData.append('referencias_personales', JSON.stringify(referenciasPersonales));
    formData.append('_method', 'PUT');

    $('#modalEditarCliente').modal('hide');

    for (let [key, value] of formData.entries()) {
    }


    $.ajax({
        url: `http://localhost:3000/api/clientes/${cedula}`,
        type: 'PUT',
        data: formData,
        contentType: false,
        processData: false,
        success: function (response) {
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Cliente actualizado correctamente',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                location.reload();
            });
        },
        error: function (xhr) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: xhr.responseJSON?.message || 'Error al actualizar el cliente'
            });
        }
    });
});

$('#editarSituacionLaboral').change(function () {
    const situacion = $(this).val();
    // let valorLaboral = '';

    if (situacion === 'ACTIVO') {
        // valorLaboral = '1';
        $('#editarEmpresa').prop('disabled', false);
        $('#editarCargo').prop('disabled', false);
        $('#editarPagaduria').prop('disabled', true).val('');
    } else if (situacion === 'PENSIONADO') {
        // valorLaboral = '0';
        $('#editarEmpresa').prop('disabled', true).val('');
        $('#editarCargo').prop('disabled', true).val('');
        $('#editarPagaduria').prop('disabled', false);
    } else {
        // Si no se selecciona nada
        // valorLaboral = '';
        $('#editarEmpresa, #editarCargo, #editarPagaduria').prop('readonly', true).val('');

    }
    // formData.append('laboral', valorLaboral);
});


// cerrar modales tabs
const ModalEdit = document.getElementById('modalEditarCliente');
const firstTabEdit = document.querySelector('#editar-datos-personales-tab');

if (ModalEdit && firstTabEdit) {
    ModalEdit.addEventListener('hidden.bs.modal', () => {
        const tabTrigger = new bootstrap.Tab(firstTabEdit);
        tabTrigger.show();
    });
}

const ModalSeen = document.getElementById('modalVerDetalle');
const firstTabSeen = document.querySelector('#datos-personales-tab');

if (ModalSeen && firstTabSeen) {
    ModalSeen.addEventListener('hidden.bs.modal', () => {
        const tabTrigger = new bootstrap.Tab(firstTabSeen);
        tabTrigger.show();
    });
}


const modal = document.getElementById('modalVerDetalle');

modal.addEventListener('hidden.bs.modal', function () {
    const firstTab = document.querySelector('#editar-datos-personales-tab');
    const tabInstance = new bootstrap.Tab(firstTab);
    tabInstance.show();
})


// VISUAL DEL BOTÓN DE ADJUNTAR + PREVISUALIZACIÓN
document.addEventListener('DOMContentLoaded', function () {
    setupFileInput(
        'bienesInmueblesPDF',
        'bienesInmueblesFileNameDisplay',
        '.file-upload-label[for="bienesInmueblesPDF"]',
        'Seleccionar archivos',
        'filePreviewBienesInmuebles'
    );

    setupFileInput(
        'desprendiblePDF',
        'desprendibleFileNameDisplay',
        '.file-upload-label[for="desprendiblePDF"]',
        'Seleccionar desprendible',
        'filePreviewDesprendible'
    );

    setupFileInput(
        'cedulaPDF',
        'cedulaFileNameDisplay',
        '.file-upload-label[for="cedulaPDF"]',
        'Seleccionar Cédula',
        'filePreviewCedula'
    );

    function setupFileInput(inputId, displayId, labelSelector, defaultText, previewContainerId = null) {
        const fileInput = document.getElementById(inputId);
        const fileNameDisplay = document.getElementById(displayId);
        const uploadLabel = document.querySelector(labelSelector);
        const previewContainer = previewContainerId ? document.getElementById(previewContainerId) : null;

        if (fileInput && fileNameDisplay && uploadLabel) {
            fileInput.addEventListener('change', function () {
                if (this.files.length > 0) {
                    const file = this.files[0];
                    const fileName = file.name;
                    fileNameDisplay.textContent = fileName;
                    uploadLabel.classList.add('has-file');
                    uploadLabel.querySelector('.file-upload-text').textContent = 'Archivo seleccionado';

                    // Si es PDF y hay contenedor de previsualización
                    if (previewContainer && file.type === 'application/pdf') {
                        const fileURL = URL.createObjectURL(file);
                        previewContainer.innerHTML = `
                            <iframe src="${fileURL}" width="100%" height="400px" style="border:1px solid #ccc; border-radius: 8px;"></iframe>
                        `;
                    } else if (previewContainer) {
                        previewContainer.innerHTML = `<div class="text-danger small">Archivo no compatible para previsualización.</div>`;
                    }

                } else {
                    fileNameDisplay.textContent = 'Ningún archivo seleccionado';
                    uploadLabel.classList.remove('has-file');
                    uploadLabel.querySelector('.file-upload-text').textContent = defaultText;
                    if (previewContainer) {
                        previewContainer.innerHTML = '';
                    }
                }
            });
        }
    }
});