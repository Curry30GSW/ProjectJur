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
        pageLength: 5,
        lengthMenu: [5, 15, 25, 50, 100],
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
    const pagaduriasLista = document.getElementById("detallePagaduriasLista");
    pagaduriasLista.innerHTML = "";

    if (Array.isArray(cliente.pagadurias) && cliente.pagadurias.length > 0) {
        cliente.pagadurias.forEach((p, index) => {
            const row = document.createElement("tr");

            // Nombre
            const colNombre = document.createElement("td");
            colNombre.textContent = p.nombre_pagaduria;
            row.appendChild(colNombre);

            // Valor (formateado en pesos)
            const colValor = document.createElement("td");
            colValor.textContent = "$" + Number(p.valor_pagaduria).toLocaleString("es-CO");
            row.appendChild(colValor);

            // Descuento (%)
            const colDescuento = document.createElement("td");
            const porcentaje = (parseFloat(p.descuento_pagaduria) * 100).toFixed(2) + " %";
            colDescuento.textContent = porcentaje;
            row.appendChild(colDescuento);

            colNombre.style.color = "black";
            colValor.style.color = "black";
            colDescuento.style.color = "black";

            pagaduriasLista.appendChild(row);

        });
    } else {
        const row = document.createElement("tr");
        const col = document.createElement("td");
        col.colSpan = 4;
        col.textContent = "No registrado";
        col.classList.add("text-muted");
        row.appendChild(col);
        pagaduriasLista.appendChild(row);
    }


    document.getElementById('detalleCuota').value = cliente.valor_cuota ?
        '$' + parseInt(cliente.valor_cuota).toLocaleString('es-CO') : 'No registrado';

    document.getElementById('detallePorcentaje').value = cliente.porcentaje ?
        cliente.porcentaje + '%' : 'No registrado';

    document.getElementById('detalleInsolvencia').value = cliente.valor_insolvencia ?
        '$' + parseInt(cliente.valor_insolvencia).toLocaleString('es-CO') : 'No registrado';

    document.getElementById('detalleNCuotas').value = cliente.numero_cuotas || 'No registrado';



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


    // Recibo Publico
    const reciboPublicoDiv = document.getElementById('detalleReciboPublico');

    if (cliente.recibos_publicos) {
        actualizarBotonPDF('detalleReciboPublico', cliente.recibos_publicos, 'Ver Recibo');
    } else {
        reciboPublicoDiv.innerHTML = '<span class="text-muted">El cliente no tiene recibo público registrado</span>';
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

    // Motivo de retiro
    const motivoRetiroInput = document.getElementById('detalleMotivoRetiro');
    const motivoRetiroDiv = motivoRetiroInput.closest(".col-6"); // 📌 toma el contenedor de la columna

    if (estadoCliente === 'ACTIVO') {
        motivoRetiroDiv.style.display = "none"; // ocultar
    } else {
        motivoRetiroDiv.style.display = "block"; // mostrar
        motivoRetiroInput.value = cliente.motivo_retiro || 'NO APLICA';
    }



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
document.addEventListener('click', function (event) {
    if (event.target.classList.contains('editar-cliente')) {
        const cedula = event.target.getAttribute('data-cedula');

        // Obtener datos del cliente desde la API
        fetch(`http://localhost:3000/api/clientes/${cedula}`)
            .then(response => {
                if (!response.ok) throw new Error('Error al obtener cliente');
                return response.json();
            })
            .then(cliente => {

                const formatoPesos = new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0
                });

                // Evento de cambio para estado
                const estadoSelect = document.getElementById('editarEstadoCliente');
                const motivoRetiro = document.getElementById('editarMotivoRetiro');

                estadoSelect.addEventListener('change', function () {
                    if (estadoSelect.value === '1') {
                        motivoRetiro.disabled = false;
                        if (cliente.motivo_retiro) motivoRetiro.value = cliente.motivo_retiro;
                    } else {
                        motivoRetiro.disabled = true;
                        motivoRetiro.value = '';
                    }
                });

                // Llenar el formulario
                document.getElementById('editarID').textContent = cliente.id_cliente;
                document.getElementById('editarNombreCompleto').textContent = `${cliente.nombres} ${cliente.apellidos}`;
                document.getElementById('editarCedula').value = cliente.cedula;
                document.getElementById('editarTelefono').value = cliente.telefono;
                document.getElementById('editarCorreo').value = cliente.correo;
                document.getElementById('editarDireccion').value = cliente.direccion;
                document.getElementById('editarCiudad').value = cliente.ciudad;
                document.getElementById('editarBarrio').value = cliente.barrio;
                document.getElementById('editarSexo').value = cliente.sexo;
                document.getElementById('editarEdad').value = cliente.edad;
                document.getElementById('editarEstCivil').value = cliente.estado_civil || '';
                document.getElementById('editarAsesor').value = cliente.asesor;
                document.getElementById('editarSalario').value = formatoPesos.format(cliente.salario);
                document.getElementById('editarEmpresa').value = cliente.empresa;
                document.getElementById('editarCargo').value = cliente.cargo;
                document.getElementById('editarSituacionLaboral').value = cliente.laboral === 1 ? 'ACTIVO' : 'PENSIONADO';
                document.getElementById('editarCuota').value = formatoPesos.format(cliente.valor_cuota);
                document.getElementById('editarPorcentaje').value = `${cliente.porcentaje}%`;
                document.getElementById('editarInsolvencia').value = formatoPesos.format(cliente.valor_insolvencia);
                document.getElementById('editarNCuotas').value = cliente.numero_cuotas;
                estadoSelect.value = cliente.estado.toString();
                estadoSelect.dispatchEvent(new Event('change'));

                // Referencias Familiares
                const contFam = document.querySelector('#contenedorReferenciasFamiliares .card-body');
                contFam.innerHTML = '';
                cliente.referencias_familiares.forEach((ref, i) => {
                    contFam.innerHTML += `
                        <div class="mb-3">
                            <label class="form-label fw-bold">Referencia Familiar ${i + 1}:</label>
                            <input type="hidden" name="ref_fam_id${i + 1}" value="${ref.id_referenciaFa}">
                            <input type="text" class="form-control mb-2" name="ref_fam${i + 1}" value="${ref.familia_nombre}">
                            <div class="row">
                                <div class="col-md-6">
                                    <input type="text" class="form-control mb-2" name="ref_fam_tel${i + 1}" value="${ref.familia_telefono}" placeholder="Teléfono">
                                </div>
                                <div class="col-md-6">
                                    <input type="text" class="form-control" name="ref_fam_parentesco${i + 1}" value="${ref.parentesco}" placeholder="Parentesco">
                                </div>
                            </div>
                        </div>
                    `;
                });

                // Referencias Personales
                const contPer = document.querySelector('#contenedorReferenciasPersonales .card-body');
                contPer.innerHTML = '';
                cliente.referencias_personales.forEach((ref, i) => {
                    contPer.innerHTML += `
                        <div class="mb-3">
                            <label class="form-label fw-bold">Referencia Personal ${i + 1}:</label>
                            <input type="hidden" name="ref_per_id${i + 1}" value="${ref.id_referenciaPe}">
                            <input type="text" class="form-control mb-2" name="ref_per${i + 1}" value="${ref.personal_nombre}">
                            <input type="text" class="form-control" name="ref_per_tel${i + 1}" value="${ref.personal_telefono}" placeholder="Teléfono">
                        </div>
                    `;
                });

                // Foto de perfil
                if (cliente.foto_perfil) {
                    document.getElementById('editarFotoPerfil').src = `http://localhost:3000${cliente.foto_perfil}`;
                }

                // Desprendible
                const btnDesprendible = document.getElementById('verDesprendible');
                if (cliente.desprendible) {
                    btnDesprendible.classList.remove('d-none');
                    btnDesprendible.onclick = () => window.open(`http://localhost:3000${cliente.desprendible}`, '_blank');
                } else {
                    btnDesprendible.classList.add('d-none');
                }

                // Bienes inmuebles
                const btnInmuebles = document.getElementById('verBienesInmuebles');
                if (cliente.bienes_inmuebles && cliente.bienes_inmuebles.length > 0) {
                    btnInmuebles.classList.remove('d-none');
                    btnInmuebles.onclick = () => window.open(`http://localhost:3000${cliente.bienes_inmuebles}`, '_blank');
                } else {
                    btnInmuebles.classList.add('d-none');
                }

                // Cédula PDF
                const btnCedulaPDF = document.getElementById('verCedulaPDF');
                if (cliente.cedula_pdf) {
                    btnCedulaPDF.classList.remove('d-none');
                    btnCedulaPDF.onclick = () => window.open(`http://localhost:3000${cliente.cedula_pdf}`, '_blank');
                } else {
                    btnCedulaPDF.classList.add('d-none');
                }

                // Fecha de nacimiento
                if (cliente.fecha_nac) {
                    const fechaNacimiento = new Date(cliente.fecha_nac).toISOString().split('T')[0];
                    document.getElementById('editarFechaNacimiento').value = fechaNacimiento;
                    document.getElementById('editarEdad').value = calcularEdad(fechaNacimiento);

                }

                // Fecha de vínculo
                if (cliente.fecha_vinculo) {
                    const fechaVinculo = new Date(cliente.fecha_vinculo).toISOString().split('T')[0];
                    document.getElementById('editarFechaVinculo').textContent = fechaVinculo;
                }

                llenarPagaduriasEditar(cliente.pagadurias || []);



                // Mostrar el modal
                const modal = new bootstrap.Modal(document.getElementById('modalEditarCliente'));
                modal.show();
            })
            .catch(() => {
                mostrarError('No se pudo cargar la información del cliente');
            });
    }
});


// Función helper para mayúsculas (solo si es texto y no está vacío)
const upper = (val) => val ? val.toString().toUpperCase().trim() : '';

// Evento para enviar el formulario de edición
document.getElementById('formEditarCliente').addEventListener('submit', function (e) {
    e.preventDefault();

    const formData = new FormData();
    const cedula = document.getElementById('editarCedula').value;

    // Agregar datos personales en MAYÚSCULAS
    formData.append('cedula', upper(cedula));
    formData.append('telefono', document.getElementById('editarTelefono').value);
    formData.append('correo', upper(document.getElementById('editarCorreo').value));
    formData.append('direccion', upper(document.getElementById('editarDireccion').value));
    formData.append('ciudad', upper(document.getElementById('editarCiudad').value));
    formData.append('barrio', upper(document.getElementById('editarBarrio').value));
    formData.append('estado', document.getElementById('editarEstadoCliente').value);
    formData.append('motivo_retiro', upper(document.getElementById('editarMotivoRetiro').value));

    formData.append('fecha_nacimiento', document.getElementById('editarFechaNacimiento').value);
    formData.append('edad', document.getElementById('editarEdad').value);
    formData.append('estado_civil', upper(document.getElementById('editarEstCivil').value));
    formData.append('cuota', document.getElementById('editarCuota').value.replace(/[^0-9]/g, ''));
    formData.append('porcentaje', document.getElementById('editarPorcentaje').value.replace('%', ''));
    formData.append('valor_insolvencia', document.getElementById('editarInsolvencia').value.replace(/[^0-9]/g, ''));
    formData.append('numero_cuotas', document.getElementById('editarNCuotas').value);
    formData.append('empresa', upper(document.getElementById('editarEmpresa').value));
    formData.append('cargo', upper(document.getElementById('editarCargo').value));

    // Datos financieros
    const salario = document.getElementById('editarSalario').value.replace(/[^0-9]/g, '');
    formData.append('salario', salario);

    // Situación laboral
    const situacion = document.getElementById('editarSituacionLaboral').value;
    let valorLaboral = 'NO APLICA';
    if (situacion === 'ACTIVO') valorLaboral = '1';
    else if (situacion === 'PENSIONADO') valorLaboral = '0';
    formData.append('laboral', valorLaboral);

    // Archivos
    const archivo = (id) => document.getElementById(id)?.files?.[0];
    if (archivo('inputFotoPerfil')) formData.append('foto_perfil', archivo('inputFotoPerfil'));
    if (archivo('cedulaPDF')) formData.append('cedula_pdf', archivo('cedulaPDF'));
    if (archivo('desprendiblePDF')) formData.append('desprendible_pago', archivo('desprendiblePDF'));

    const bienesInmuebles = document.getElementById('bienesInmueblesPDF')?.files;
    if (bienesInmuebles?.length > 0) {
        Array.from(bienesInmuebles).forEach(file => {
            formData.append('bienes_inmuebles[]', file);
        });
    }

    // Referencias familiares
    const referenciasFamiliares = [];
    for (let i = 1; i <= 3; i++) {
        const nombre = upper(document.querySelector(`input[name="ref_fam${i}"]`)?.value || '');
        const telefono = document.querySelector(`input[name="ref_fam_tel${i}"]`)?.value || '';
        const parentesco = upper(document.querySelector(`input[name="ref_fam_parentesco${i}"]`)?.value || '');
        const id = document.querySelector(`input[name="ref_fam_id${i}"]`)?.value || null;

        if (nombre || telefono || parentesco) {
            referenciasFamiliares.push({
                id_referenciaFa: id,
                familia_nombre: nombre,
                familia_telefono: telefono,
                parentesco
            });
        }
    }

    // Referencias personales
    const referenciasPersonales = [];
    for (let i = 1; i <= 3; i++) {
        const nombre = upper(document.querySelector(`input[name="ref_per${i}"]`)?.value || '');
        const telefono = document.querySelector(`input[name="ref_per_tel${i}"]`)?.value || '';
        const id = document.querySelector(`input[name="ref_per_id${i}"]`)?.value || null;

        if (nombre || telefono) {
            referenciasPersonales.push({
                id_referenciaPe: id,
                personal_nombre: nombre,
                personal_telefono: telefono
            });
        }
    }

    // Construir array de pagadurías (en MAYÚSCULAS solo el nombre)
    const pagadurias = [];
    for (let i = 1; i <= 4; i++) {
        const nombre = upper(document.getElementById(`editarPagaduria${i}`)?.value.trim() || '');
        const valor = document.getElementById(`editarValor${i}`)?.value.trim();
        const descuento = document.getElementById(`editarDescuento${i}`)?.value;

        if (nombre && valor) {
            pagadurias.push({
                nombre,
                valor: parseInt(valor.replace(/[^\d]/g, '')) || 0,
                descuento: parseFloat(descuento) || 0.0
            });
        }
    }

    // Agregar pagadurías al FormData
    formData.append('pagadurias', JSON.stringify(pagadurias));
    // Agregar referencias al FormData
    formData.append('referencias_familiares', JSON.stringify(referenciasFamiliares));
    formData.append('referencias_personales', JSON.stringify(referenciasPersonales));
    formData.append('_method', 'PUT');

    // Lista de campos obligatorios con sus mensajes
    const camposObligatorios = [
        { id: 'editarCedula', mensaje: 'La cédula es obligatoria' },
        { id: 'editarTelefono', mensaje: 'El teléfono es obligatorio' },
        { id: 'editarCorreo', mensaje: 'El correo es obligatorio' },
        { id: 'editarDireccion', mensaje: 'La dirección es obligatoria' },
        { id: 'editarCiudad', mensaje: 'La ciudad es obligatoria' },
        { id: 'editarBarrio', mensaje: 'El barrio es obligatorio' },
        { id: 'editarEstadoCliente', mensaje: 'Debe seleccionar el estado del cliente' },
        { id: 'editarEstCivil', mensaje: 'Debe seleccionar el estado civil' },
        { id: 'editarCuota', mensaje: 'El valor de la cuota es obligatorio' },
        { id: 'editarPorcentaje', mensaje: 'El porcentaje es obligatorio' },
        { id: 'editarInsolvencia', mensaje: 'El valor de insolvencia es obligatorio' },
        { id: 'editarNCuotas', mensaje: 'El número de cuotas es obligatorio' },
        { id: 'editarEmpresa', mensaje: 'La empresa es obligatoria' },
        { id: 'editarCargo', mensaje: 'El cargo es obligatorio' },
        { id: 'editarSalario', mensaje: 'El salario es obligatorio' }
    ];

    // Verificar campos vacíos
    for (let campo of camposObligatorios) {
        const valor = document.getElementById(campo.id)?.value.trim();
        if (!valor) {
            Swal.fire({
                icon: 'warning',
                title: 'Campo obligatorio',
                text: campo.mensaje
            });
            return; // Detener el envío
        }
    }

    // Ocultar el modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarCliente'));
    if (modal) modal.hide();



    // Enviar los datos por fetch
    fetch(`http://localhost:3000/api/clientes/${cedula}`, {
        method: 'PUT',
        body: formData
    })
        .then(async response => {
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Error al actualizar el cliente');
            }
            return response.json();
        })
        .then(() => {
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Cliente actualizado correctamente',
                timer: 3000,
                showConfirmButton: false
            }).then(() => location.reload());
        })
        .catch(error => {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message
            });
        });
});



// Evento para cambiar la situación laboral
document.getElementById('editarSituacionLaboral').addEventListener('change', function () {
    calcularSalarioPensionadoEditar();

    const valor = this.value;
    const esActivo = valor === 'ACTIVO';
    const esPensionado = valor === 'PENSIONADO';

    // Mostrar/ocultar campos empresa y cargo
    document.getElementById('editarEmpresaContainer').style.display = esActivo ? 'block' : 'none';
    document.getElementById('editarCargoContainer').style.display = esActivo ? 'block' : 'none';
    document.getElementById('editarEmpresa').required = esActivo;
    document.getElementById('editarCargo').required = esActivo;

    // Mostrar/ocultar grupo de pagaduría 1 si aplica
    const campoPagaduria = document.getElementById('editarCampoPagaduria');
    campoPagaduria.style.display = (esActivo || esPensionado) ? 'block' : 'none';

    const grupoPag1 = document.getElementById('grupoEditarPagaduria1');
    if (grupoPag1) grupoPag1.style.removeProperty('display');

    const inputPag1 = document.getElementById('editarPagaduria1');
    if (inputPag1) inputPag1.required = true;

    const inputVal1 = document.getElementById('editarValor1');
    if (inputVal1) inputVal1.required = true;

    // Si no es ACTIVO, limpiar empresa/cargo
    if (!esActivo) {
        document.getElementById('editarEmpresa').value = '';
        document.getElementById('editarCargo').value = '';
    }

    // Si es pensionado, deshabilitar salario
    document.getElementById('editarSalario').disabled = esPensionado;
});


function calcularSalarioPensionadoEditar() {
    let salario = 0;

    for (let i = 1; i <= 4; i++) {
        const valorInput = document.getElementById(`editarValor${i}`);
        const descuentoSelect = document.getElementById(`editarDescuento${i}`);

        if (valorInput && descuentoSelect && valorInput.value.trim() !== '') {
            const valorLimpio = valorInput.value.replace(/\./g, '').replace(/\s/g, '');
            const valor = parseFloat(valorLimpio);
            const descuento = parseFloat(descuentoSelect.value);
            const valorConDescuento = valor - (valor * descuento);
            salario += valorConDescuento;
        }
    }

    document.getElementById('editarSalario').value = Math.round(salario).toLocaleString('es-CO');
}

for (let i = 1; i <= 4; i++) {
    const valorInput = document.getElementById(`editarValor${i}`);
    const descuentoSelect = document.getElementById(`editarDescuento${i}`);
    if (valorInput && descuentoSelect) {
        valorInput.addEventListener('input', calcularSalarioPensionadoEditar);
        descuentoSelect.addEventListener('change', calcularSalarioPensionadoEditar);
    }
}

function formatearMoneda(input) {
    // Obtener solo los números
    let valor = input.value.replace(/\D/g, '');

    // Guardar valor sin formato para enviar si se quiere
    input.dataset.rawValue = valor;

    if (valor) {
        // Formatear como moneda sin incluir el símbolo $
        input.value = new Intl.NumberFormat('es-CO').format(valor);
    } else {
        input.value = '';
    }
}

function llenarPagaduriasEditar(pagadurias) {
    const contenedorPagadurias = document.getElementById('editarCampoPagaduria');
    contenedorPagadurias.style.display = pagadurias.length > 0 ? 'block' : 'none';

    for (let i = 1; i <= 4; i++) {
        const grupo = document.getElementById(`grupoEditarPagaduria${i}`);

        const inputPag = document.getElementById(`editarPagaduria${i}`);
        const inputVal = document.getElementById(`editarValor${i}`);
        const inputDesc = document.getElementById(`editarDescuento${i}`);

        if (pagadurias[i - 1]) {
            const pag = pagadurias[i - 1];

            inputPag.value = pag.nombre_pagaduria;
            inputVal.value = Math.round(pag.valor_pagaduria).toLocaleString('es-CO');
            inputDesc.value = pag.descuento_pagaduria;

            grupo.style.display = 'flex'; // o 'block', según prefieras
        } else {
            inputPag.value = '';
            inputVal.value = '';
            inputDesc.value = '0';

            grupo.style.display = 'none';
        }
    }

    calcularSalarioPensionadoEditar(); // Recalcula con los valores cargados
}

document.getElementById('editarFechaNacimiento').addEventListener('change', function () {
    const fecha = this.value;
    document.getElementById('editarEdad').value = calcularEdad(fecha);
});


function calcularEdad(fecha) {
    const hoy = new Date();
    const nacimiento = new Date(fecha);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();

    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }

    return edad;
}


// Asignar eventos
document.getElementById('editarValor1').addEventListener('input', calcularSalarioPensionadoEditar);
document.getElementById('editarDescuento1').addEventListener('change', calcularSalarioPensionadoEditar);



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


//Contar clientes

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("http://localhost:3000/api/conteo-pagadurias");
        const data = await response.json();

        // Recorre cada elemento del DOM con la clase "folder-item"
        document.querySelectorAll(".folder-item").forEach((item) => {
            const pagaduria = item.getAttribute("data-pagaduria");

            // Busca si hay datos para esa pagaduría
            const resultado = data.find(d => d.nombre_pagaduria === pagaduria);

            // Si hay resultado, actualiza el texto
            if (resultado) {
                const countElement = item.querySelector(".folder-count");
                countElement.textContent = `${resultado.cantidad} cliente${resultado.cantidad !== 1 ? 's' : ''}`;
            }
        });
    } catch (error) {
        console.error("Error al cargar conteo de pagadurías:", error);
    }
});

// MOSTRAR CLIENTES POR PAGADURÍA
document.addEventListener("DOMContentLoaded", () => {
    const folderItems = document.querySelectorAll(".folder-item");

    folderItems.forEach(item => {
        item.addEventListener("click", async () => {
            const pagaduria = item.getAttribute("data-pagaduria");

            try {
                const response = await fetch(`http://localhost:3000/api/clientes/por-pagaduria/${encodeURIComponent(pagaduria)}`);
                const clientes = await response.json();
                document.getElementById("nombrePagaduriaTitulo").textContent = pagaduria;

                mostrarClientesTabla(clientes);

                const modal = new bootstrap.Modal(document.getElementById('modalClientes'));
                modal.show();

            } catch (error) {
                console.error("Error al obtener clientes:", error);
            }
        });
    });
});

// Función para mostrar los clientes en la tabla
const mostrarClientesTabla = (clientes) => {
    let resultados = '';

    clientes.forEach((cliente) => {
        const estadoTexto = cliente.estado == 0 ? "ACTIVO" : "RECHAZADO";
        const estadoClase = cliente.estado == 0 ? "bg-gradient-success" : "bg-gradient-danger";

        const fecha = new Date(cliente.fecha_vinculo || cliente.fecha_vinculacion);
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = meses[fecha.getMonth()];
        const año = fecha.getFullYear();
        const fechaFormateada = `${dia}/${mes}/${año}`;

        resultados += `
        <tr>
            <td class="text-center align-middle">
                <p class="text-center text-md text-dark">#${cliente.id_cliente}</p>
            </td>
            <td>
                <div class="d-flex align-items-center px-2 py-1">
                    <div>
                        <img src="http://localhost:3000${cliente.foto_perfil || '/default.png'}" 
                            class="avatar avatar-lg me-3 foto-cliente" 
                            alt="${cliente.nombres}"
                            data-src="http://localhost:3000${cliente.foto_perfil || '/default.png'}">
                    </div>
                    <div class="d-flex flex-column justify-content-center">
                        <h6 class="mb-0 text-sm">${cliente.nombres} ${cliente.apellidos}</h6>
                        <p class="text-sm text-secondary mb-0">${cliente.correo}</p>
                    </div>
                </div>
            </td>
            <td class="align-middle text-center"><p class="text-sm text-dark">${cliente.cedula}</p></td>
            <td class="align-middle text-center"><p class="text-sm text-dark">${cliente.pagaduria}</p></td>
            <td class="align-middle text-center"><p class="text-sm text-dark">
            ${cliente.valor_pagaduria.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p></td>
            <td class="align-middle text-center">
                <span class="badge badge-sm ${estadoClase}">${estadoTexto}</span>
            </td>
            <td class="align-middle text-center">
                <p class="text-dark text-sm">${fechaFormateada}</p>
            </td>
        </tr>
        `;
    });

    if ($.fn.DataTable.isDataTable('#tablaClientesPagaduria')) {
        $('#tablaClientesPagaduria').DataTable().clear().destroy();
    }

    $("#tablaClientesBody").html(resultados);

    $('#tablaClientesPagaduria').DataTable({
        pageLength: 7,
        lengthMenu: [7, 16, 25, 50],
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



function mostrarSiguientePagaduria(numero) {
    const pagaduria = document.getElementById(`editarPagaduria${numero}`);
    const valor = document.getElementById(`editarValor${numero}`);

    if (pagaduria && valor && pagaduria.value.trim() !== '' && valor.value.trim() !== '') {
        const siguiente = numero + 1;
        if (siguiente <= 4) {
            const grupoSiguiente = document.getElementById(`grupoEditarPagaduria${siguiente}`);
            if (grupoSiguiente) {
                grupoSiguiente.style.removeProperty('display'); // O usa 'flex' si prefieres
                grupoSiguiente.classList.add('row'); // Por si acaso se pierde
            }
        }
    }
}


function validarPorcentajeEnTiempoReal(input) {
    // Permitir borrado completo
    if (input.value === '') return;

    // Remover el % temporalmente para procesar (por si acaso)
    let valor = input.value.replace('%', '');

    // Permitir solo números y punto decimal
    valor = valor.replace(/[^\d.]/g, '');

    // Evitar múltiples puntos decimales
    if ((valor.match(/\./g) || []).length > 1) {
        valor = valor.substring(0, valor.indexOf('.') + 1) +
            valor.substring(valor.indexOf('.') + 1).replace(/\./g, '');
    }

    // Aplicar el valor limpio
    input.value = valor;
}


function formatearPorcentajeAlSalir(input) {


    console.log('Valor inicial:', input.value);

    if (!input.value || input.value.trim() === '') {
        return;
    }

    let valor = input.value;

    valor = valor.replace('%', '');

    if (valor.endsWith('.')) {
        valor = valor.slice(0, -1);
    }

    if (/^\d+$/.test(valor)) {
        switch (valor.length) {
            case 4: // 5555 → 55.55
                valor = valor.substring(0, 2) + '.' + valor.substring(2, 4);
                break;
            case 3: // 555 → 55.50
                valor = valor.substring(0, 2) + '.' + valor.substring(2, 3) + '0';
                break;
            case 2: // 55 → 55.00
                valor = valor + '.00';
                break;
            case 1: // 5 → 5.00
                valor = valor + '.00';
                break;
        }
    }

    const numero = parseFloat(valor);

    if (!isNaN(numero)) {
        // Limitar entre 0-100
        const limitado = Math.max(0, Math.min(100, numero));
        // Mostrar con % solo visualmente
        input.value = limitado.toFixed(2) + '%';
    } else {
        console.log('No es un numero valido')
    }
    // Si no es número válido, no hacer nada (mantener lo que escribió)
}
