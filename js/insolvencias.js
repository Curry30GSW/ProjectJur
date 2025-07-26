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

async function obtenerClientes() {
    try {
        const token = sessionStorage.getItem('token');
        const url = 'http://localhost:3000/api/clientes-insolvencias';


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

document.addEventListener('DOMContentLoaded', () => {
    if (!sessionStorage.getItem('token')) {
        window.location.href = '../pages/login.html';
        return;
    }
    obtenerClientes();
});


const mostrar = (clientes) => {
    let resultados = '';
    clientes.forEach((cliente) => {
        let estadoTexto = '';
        let estadoClase = '';
        let correccionesBadge = '';
        let estadoCreadaTexto = '';

        const botonEditar = `
            <button class="btn btn-sm btn-warning text-white editar-proceso" 
                data-cedula="${cliente.cedula}" 
                ${!cliente.creada || cliente.creada === 'null' ? 'disabled' : ''}>
                Editar Proceso
            </button>`;

        // Estado principal (APTO/NO APTO)
        if (cliente.terminacion === 'APTO') {
            estadoTexto = 'APTO';
            estadoClase = 'bg-gradient-success';
        } else if (cliente.terminacion === 'NO APTO') {
            estadoTexto = 'NO APTO';
            estadoClase = 'bg-gradient-danger';
        } else {
            estadoTexto = 'En proceso';
            estadoClase = 'bg-gradient-warning';
        }

        if (!cliente.creada || cliente.creada === 'null') {
            estadoCreadaTexto = '<span class="badge badge-sm bg-gradient-dark">No definido</span>';
        }

        // Badge para correcciones si existe información
        if (cliente.correcciones && cliente.correcciones.trim() !== '') {
            correccionesBadge = `<span class="badge badge-md bg-gradient-warning">CORRECCIONES</span>`;
            estadoTexto = '';
            estadoClase = '';
        }

        const fecha = new Date(cliente.fecha_vinculo);
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const dia = fecha.getDate();
        const mes = meses[fecha.getMonth()];
        const año = fecha.getFullYear();
        const fechaFormateada = `${dia}/${mes}/${año}`;

        const botonCrear = `
            <button class="btn btn-sm btn-primary text-white crear-insolvencia"
                data-id="${cliente.id_cliente}"
                data-cedula="${cliente.cedula}"
                data-nombres="${cliente.nombres}"
                data-apellidos="${cliente.apellidos}"
                data-correo="${cliente.correo}"
                data-telefono="${cliente.telefono}"
                data-direccion="${cliente.direccion}"
                data-ciudad="${cliente.ciudad}"
                data-foto="${cliente.foto_perfil}"
                data-fecha="${fechaFormateada}"
                data-porcentaje="${cliente.porcentaje ?? ''}"
                data-cuota="${cliente.valor_cuota ?? ''}"
                data-salario="${cliente.salario ?? ''}"
                ${cliente.creada == 1 ? 'disabled' : ''}>
                Crear Insolvencia
            </button>`;

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
            <td><p class="text-xs font-weight-bold">${cliente.cedula}</p></td>
            <td class="align-middle text-center text-sm">
                ${estadoTexto ? `<span class="badge badge-sm ${estadoClase}">${estadoTexto}</span>` : ''}
                ${correccionesBadge}
                ${estadoCreadaTexto}
            </td>
            <td class="align-middle">
                <div class="d-flex justify-content-center gap-2">
                    ${botonCrear}
                    ${botonEditar}
                    <button class="btn btn-sm btn-info text-white ver-detalle" data-cedula="${cliente.cedula}">
                        Ver detalles
                    </button>
                </div>
            </td>
        </tr>`;
    });

    if ($.fn.DataTable.isDataTable('#tablaClientes')) {
        $('#tablaClientes').DataTable().clear().destroy();
    }

    $("#tablaClientes tbody").html(resultados);

    // Inicializar DataTable
    $('#tablaClientes').DataTable({
        pageLength: 8,
        lengthMenu: [8, 16, 25, 50, 100],
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

// Esperar a que el DOM cargue completamente
document.addEventListener('DOMContentLoaded', () => {
    if (!sessionStorage.getItem('token')) {
        window.location.href = '../pages/login.html';
        return;
    }
    obtenerClientes();

    // Evento para el botón "Crear Insolvencia"
    $(document).on('click', '.crear-insolvencia', function () {


        const cliente = {
            id_cliente: $(this).data('id'),
            nombres: $(this).data('nombres'),
            apellidos: $(this).data('apellidos'),
            cedula: $(this).data('cedula'),
            correo: $(this).data('correo'),
            telefono: $(this).data('telefono'),
            direccion: $(this).data('direccion'),
            ciudad: $(this).data('ciudad'),
            foto: $(this).data('foto'),
            fecha: $(this).data('fecha'),
            porcentaje: $(this).data('porcentaje'),
            valor_cuota: $(this).data('cuota'),
            salario: $(this).data('salario') || ''
        };

        $('#idModal').text(String(cliente.id_cliente));
        $('#inputIdCliente').val(String(cliente.id_cliente));
        $('#detalleNombreCliente').text(`${cliente.nombres ?? ''} ${cliente.apellidos ?? ''}`);
        $('#detalleTipoDocumento').text(`Cédula: ${cliente.cedula ?? '---'}`);
        $('#telefonoModal').text(cliente.telefono ? String(cliente.telefono) : '---');
        $('#emailModal').text(cliente.correo ?? '---');
        $('#direccionModal').text(cliente.direccion ?? '---');
        $('#ciudadModal').text(cliente.ciudad ?? '---');
        $('#vinculacionModal').text(cliente.fecha ?? '---');
        $('#inputIdCliente').data('porcentaje', cliente.porcentaje);
        $('#inputIdCliente').data('cuota', cliente.valor_cuota);
        $('#salario').data('salario', cliente.salario);
        $('#salario').val(cliente.salario);


        if (cliente.foto) {
            $('#fotoperfilModal').attr('src', `http://localhost:3000${cliente.foto}`);
        } else {
            $('#fotoperfilModal').attr('src', '../assets/img/avatar.png');
        }

        const modalInsolvencia = new bootstrap.Modal(document.getElementById('modalCrearInsolvencia'));
        modalInsolvencia.show();
    });

    // Recargar la página al cerrar el modal
    $('#modalCrearInsolvencia').on('hidden.bs.modal', function () {
        location.reload();
    });
});



$(document).on('click', '.foto-cliente', function () {
    const src = $(this).data('src');
    $('#imagen-modal').attr('src', src);

    const modal = new bootstrap.Modal(document.getElementById('modalFoto'));
    modal.show();
});


// function limpiarModalInsolvencia() {
//     // Deseleccionar todos los radios
//     document.querySelectorAll('#modalCrearInsolvencia input[type="radio"]').forEach(input => {
//         input.checked = false;
//     });

//     // Limpiar inputs de texto
//     document.querySelectorAll('#modalCrearInsolvencia input[type="text"], #modalCrearInsolvencia input[type="email"], #modalCrearInsolvencia input[type="number"]').forEach(input => {
//         input.value = '';
//     });

//     // Limpiar textareas
//     document.querySelectorAll('#modalCrearInsolvencia textarea').forEach(textarea => {
//         textarea.value = '';
//     });

//     // Resetear selects
//     document.querySelectorAll('#modalCrearInsolvencia select').forEach(select => {
//         select.selectedIndex = 0;
//     });


//     // Ocultar campos condicionales
//     const camposOcultar = [
//         'campoDetalleCorrecciones',
//         'contenedorAudiencias',
//         'datos_liquidador',
//         'motivo_no_apto'
//     ];

//     camposOcultar.forEach(id => {
//         const elemento = document.getElementById(id);
//         if (elemento) elemento.style.display = 'none';
//     });

//     // Limpiar lista de audiencias
//     const listaAudiencias = document.getElementById('listaAudiencias');
//     if (listaAudiencias) listaAudiencias.innerHTML = '';

//     // Resetear campo de archivo PDF y su UI
//     const inputArchivo = document.getElementById('archivoPDF');
//     if (inputArchivo) {
//         inputArchivo.value = '';

//         // Restablecer la UI del campo de archivo
//         const uploadLabel = document.querySelector('.file-upload-label');
//         if (uploadLabel) {
//             uploadLabel.classList.remove('has-file');
//             const uploadText = uploadLabel.querySelector('.file-upload-text');
//             if (uploadText) uploadText.textContent = 'Seleccionar archivo';
//         }

//         const fileNameDisplay = document.getElementById('fileNameDisplay');
//         if (fileNameDisplay) fileNameDisplay.textContent = 'Ningún archivo seleccionado';
//     }

//     // Resetear campo oculto del archivo
//     const archivoUrl = document.getElementById('archivoPDFUrl');
//     if (archivoUrl) archivoUrl.value = '';

//     // Resetear campos específicos adicionales
//     const camposEspecificos = {
//         'juzgado': '',
//         'nombre_liquidador': '',
//         'telefono_liquidador': '',
//         'correo_liquidador': '',
//         'motivo': '',
//         'detalleCorrecciones': ''
//     };

//     Object.entries(camposEspecificos).forEach(([id, value]) => {
//         const elemento = document.getElementById(id);
//         if (elemento) elemento.value = value;
//     });

//     // Remover clases de validación si existen
//     document.querySelectorAll('#modalCrearInsolvencia .is-invalid').forEach(el => {
//         el.classList.remove('is-invalid');
//     });

//     document.querySelectorAll('#modalCrearInsolvencia .is-valid').forEach(el => {
//         el.classList.remove('is-valid');
//     });

//     const idsCalculadora = [
//         'salario',
//         'salud',
//         'salario_total',
//         'saldo_total',
//         'deducciones',
//         'saldo_libre',
//         'porcentaje',
//         'cuota_pagar'
//     ];

//     idsCalculadora.forEach(id => {
//         const campo = document.getElementById(id);
//         if (campo) campo.value = '';
//     });

//     // Ocultar la calculadora parcial
//     const calculadora = document.getElementById('calculadora-parcial');
//     if (calculadora) calculadora.style.display = 'none';

//     // Limpiar radios y fechas de Cuadernillo y Radicación
//     const radiosExtras = ['cuadernillo', 'radicacion', 'correcciones'];
//     radiosExtras.forEach(name => {
//         const radios = document.querySelectorAll(`#modalCrearInsolvencia input[name="${name}"]`);
//         radios.forEach(radio => radio.checked = false);
//     });

//     // Limpiar fechas y ocultar contenedores de fechas
//     const fechasExtras = ['cuadernillo', 'radicacion'];
//     fechasExtras.forEach(item => {
//         const fechaInput = document.getElementById(`fecha_${item}`);
//         const fechaContainer = document.getElementById(`fecha_${item}_container`);
//         if (fechaInput) fechaInput.value = '';
//         if (fechaContainer) fechaContainer.style.display = 'none';
//     });

//     // Ocultar campo y limpiar textarea de correcciones
//     const campoCorrecciones = document.getElementById('campoDetalleCorrecciones');
//     if (campoCorrecciones) campoCorrecciones.style.display = 'none';

//     const detalleCorrecciones = document.getElementById('detalleCorrecciones');
//     if (detalleCorrecciones) detalleCorrecciones.value = '';

//     const fechaCuadernillo = document.getElementById('fecha_cuadernillo');
//     if (fechaCuadernillo) {
//         fechaCuadernillo.readOnly = false;
//         fechaCuadernillo.style.backgroundColor = '';
//         fechaCuadernillo.value = '';
//     }

//     const fechaRadicacion = document.getElementById('fecha_radicacion');
//     if (fechaRadicacion) {
//         fechaRadicacion.readOnly = false;
//         fechaRadicacion.style.backgroundColor = '';
//         fechaRadicacion.value = '';
//     }

//     // Ocultar contenedores
//     document.getElementById('fecha_cuadernillo_container').style.display = 'none';
//     document.getElementById('fecha_radicacion_container').style.display = 'none';

//     // Limpiar calculadora de LIMPIO
//     const camposCalculadoraLimpio = ['porcentaje_limpio', 'cuota_limpio'];
//     camposCalculadoraLimpio.forEach(id => {
//         const campo = document.getElementById(id);
//         if (campo) campo.value = '';
//     });

//     const calculadoraLimpio = document.getElementById('calculadora-limpio');
//     if (calculadoraLimpio) calculadoraLimpio.style.display = 'none';

//     const inputDesprendible = document.getElementById('desprendiblePDF');
//     if (inputDesprendible) {
//         inputDesprendible.value = '';

//         const uploadLabelDesprendible = document.querySelector('label[for="desprendiblePDF"]');
//         if (uploadLabelDesprendible) {
//             uploadLabelDesprendible.classList.remove('has-file');

//             const uploadText = uploadLabelDesprendible.querySelector('.file-upload-text');
//             if (uploadText) uploadText.textContent = 'Seleccionar desprendible';
//         }

//         const fileNameDisplayDesprendible = document.getElementById('desprendibleFileNameDisplay');
//         if (fileNameDisplayDesprendible) fileNameDisplayDesprendible.textContent = 'Ningún archivo seleccionado';
//     }

//     // Limpiar campo de Autoliquidador
//     const inputAutoliquidador = document.getElementById('archivoAutoliquidador');
//     if (inputAutoliquidador) {
//         inputAutoliquidador.value = '';

//         const uploadLabelAuto = document.querySelector('label[for="archivoAutoliquidador"]');
//         if (uploadLabelAuto) {
//             uploadLabelAuto.classList.remove('has-file'); // <-- Remueve clase visual si existe

//             const uploadText = uploadLabelAuto.querySelector('.file-upload-text');
//             if (uploadText) uploadText.textContent = 'Seleccionar archivo';
//         }

//         const fileNameDisplayAuto = document.getElementById('fileNameDisplayAutoliquidador');
//         if (fileNameDisplayAuto) fileNameDisplayAuto.textContent = 'Ningún archivo seleccionado';
//     }

//     const archivoAutoliquidadorUrl = document.getElementById('archivoAutoliquidadorUrl');
//     if (archivoAutoliquidadorUrl) archivoAutoliquidadorUrl.value = '';

//     const filePreviewAuto = document.getElementById('filePreviewAutoliquidador');
//     if (filePreviewAuto) filePreviewAuto.innerHTML = '';

//     // Función auxiliar para limpiar un input file y su UI
//     function limpiarCampoArchivo(inputId, labelSelector, fileNameId, defaultText, previewId = null) {
//         const input = document.getElementById(inputId);
//         const label = document.querySelector(labelSelector);
//         const fileNameDisplay = document.getElementById(fileNameId);
//         const previewContainer = previewId ? document.getElementById(previewId) : null;

//         if (input) input.value = '';
//         if (label) {
//             label.classList.remove('has-file');
//             const textSpan = label.querySelector('.file-upload-text');
//             if (textSpan) textSpan.textContent = defaultText;
//         }
//         if (fileNameDisplay) fileNameDisplay.textContent = 'Ningún archivo seleccionado';
//         if (previewContainer) previewContainer.innerHTML = '';
//     }

//     // Limpiar todos los campos de archivos PDF
//     limpiarCampoArchivo('archivoPDF', '.file-upload-label[for="archivoPDF"]', 'fileNameDisplay', 'Seleccionar archivo', 'filePreviewActa');
//     limpiarCampoArchivo('desprendiblePDF', '.file-upload-label[for="desprendiblePDF"]', 'desprendibleFileNameDisplay', 'Seleccionar desprendible', 'filePreviewDesprendible');
//     limpiarCampoArchivo('archivoAutoliquidador', '.file-upload-label[for="archivoAutoliquidador"]', 'fileNameDisplayAutoliquidador', 'Seleccionar archivo', 'filePreviewAutoliquidador');

// }


document.getElementById('formCrearInsolvencia').addEventListener('submit', function (e) {
    e.preventDefault();

    // Verificar si hay correcciones activas
    const tieneCorrecciones = document.querySelector('input[name="correcciones"]:checked')?.value === 'SI';

    // if (!tieneCorrecciones) {

    //     const radiosObligatorios = [
    //         'cuadernillo',
    //         'radicacion',
    //         'correcciones',
    //         'audiencias',
    //         'desprendible',
    //         'tipo_proceso',
    //         'liquidador',
    //         'estado'
    //     ];

    //     for (let nombre of radiosObligatorios) {
    //         const seleccionado = document.querySelector(`input[name="${nombre}"]:checked`);
    //         if (!seleccionado) {
    //             Swal.fire({
    //                 icon: 'warning',
    //                 title: 'Campos incompletos',
    //                 text: `Debes seleccionar una opción para "${nombre}".`,
    //                 confirmButtonColor: '#d33'
    //             });
    //             return;
    //         }
    //     }

    //     const archivoPDF = document.getElementById('archivoPDF').files[0];
    //     if (!archivoPDF) {
    //         Swal.fire({
    //             icon: 'warning',
    //             title: 'Archivo requerido',
    //             text: 'Debes subir el archivo PDF del acta de aceptación.',
    //             confirmButtonColor: '#d33'
    //         });
    //         return;
    //     }
    // }

    // Obtener valores del formulario
    const id_cliente = document.getElementById('inputIdCliente').value;
    const cuadernillo = document.querySelector('input[name="cuadernillo"]:checked')?.value === 'SI' ? 1 : 0;
    const fecha_cuadernillo = document.getElementById('fecha_cuadernillo')?.value || '';
    const radicacion = document.querySelector('input[name="radicacion"]:checked')?.value === 'SI' ? 1 : 0;
    const fecha_radicacion = document.getElementById('fecha_radicacion')?.value || '';
    const correcciones = tieneCorrecciones ? document.getElementById('detalleCorrecciones').value.trim() : '';
    const archivoPDF = document.getElementById('archivoPDF').files[0];
    const archivoAutoliquidador = document.getElementById('archivoAutoliquidador')?.files[0];
    const audienciasVisibles = document.querySelector('input[name="audiencias"]:checked')?.value === 'SI';
    const tipo_proceso = document.querySelector('input[name="tipo_proceso"]:checked')?.value || '';
    const juzgado = document.getElementById('juzgado')?.value.trim() || '';
    const liquidador = document.querySelector('input[name="liquidador"]:checked')?.value === 'SI' ? 1 : 0;
    const terminacion = document.querySelector('input[name="estado"]:checked')?.value || '';
    const desprendible_estado = document.querySelector('input[name="desprendible"]:checked')?.value || '';
    const desprendiblePDF = document.getElementById('desprendiblePDF').files[0];
    const observaciones_desprendible = document.getElementById('observaciones_desprendible')?.value.trim() || '';

    // Validar campos condicionales solo si no hay correcciones
    if (!tieneCorrecciones) {
        if (liquidador) {
            const nombre_liquidador = document.getElementById('nombre_liquidador')?.value.trim() || '';
            const telefono_liquidador = document.getElementById('telefono_liquidador')?.value.trim() || '';
            const correo_liquidador = document.getElementById('correo_liquidador')?.value.trim() || '';
            const pago_liquidador = document.querySelector('input[name="pago_liquidador"]:checked')?.value || '';

            if (!nombre_liquidador || !telefono_liquidador || !correo_liquidador || !pago_liquidador) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Campos incompletos',
                    text: 'Debes completar todos los datos del liquidador.',
                    confirmButtonColor: '#d33'
                });
                return;
            }
        }

        if (terminacion === 'NO APTO') {
            const motivo = document.getElementById('motivo')?.value.trim().toUpperCase() || '';
            if (!motivo) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Motivo requerido',
                    text: 'Debes escribir el motivo si el proceso no es apto.',
                    confirmButtonColor: '#d33'
                });
                return;
            }
        }
    }

    // Preparar datos del desprendible
    let datosParcial = null;
    if (desprendible_estado === 'PARCIAL') {
        datosParcial = {
            salario: document.getElementById('salario')?.value || '',
            salud: document.getElementById('salud')?.value || '',
            salario_total: document.getElementById('salario_total')?.value || '',
            saldo_total: document.getElementById('saldo_total')?.value || '',
            deducciones: document.getElementById('deducciones')?.value || '',
            saldo_libre: document.getElementById('saldo_libre')?.value || '',
            porcentaje: document.getElementById('porcentaje')?.value || '',
            cuota_pagar: document.getElementById('cuota_pagar')?.value || ''
        };
    } else if (desprendible_estado === 'LIMPIO') {
        datosParcial = {
            porcentaje: document.getElementById('porcentaje_limpio')?.value || '',
            cuota_pagar: document.getElementById('cuota_limpio')?.value || ''
        };
    }

    const desprendibleData = {
        estado_desprendible: desprendible_estado,
        obs_desprendible: observaciones_desprendible.toUpperCase(),
        datos_parcial: datosParcial
    };

    // Preparar FormData
    const formData = new FormData();
    formData.append('id_cliente', id_cliente);
    formData.append('cuadernillo', cuadernillo);
    formData.append('fecha_cuadernillo', fecha_cuadernillo);
    formData.append('radicacion', radicacion);
    formData.append('fecha_radicacion', fecha_radicacion);
    formData.append('correcciones', correcciones.toUpperCase());
    formData.append('tipo_proceso', tipo_proceso);
    formData.append('juzgado', juzgado.toUpperCase());
    formData.append('liquidador', liquidador);
    formData.append('terminacion', terminacion.toUpperCase());
    formData.append('datos_desprendible', JSON.stringify(desprendibleData));

    // Agregar archivos solo si existen
    if (archivoPDF) formData.append('archivoPDF', archivoPDF);
    if (desprendiblePDF) formData.append('desprendiblePDF', desprendiblePDF);
    if (archivoAutoliquidador) formData.append('archivoAutoliquidador', archivoAutoliquidador);

    // Procesar audiencias si están visibles
    if (audienciasVisibles) {
        const audienciasItems = document.querySelectorAll('#listaAudiencias .audiencia-item');
        const audiencias = [];

        for (const item of audienciasItems) {
            const descripcion = item.querySelector('input[name^="audiencias"][name$="[descripcion]"]').value.trim().toUpperCase();
            const fecha = item.querySelector('input[name^="audiencias"][name$="[fecha]"]').value.trim().toUpperCase();

            if (!tieneCorrecciones && (!descripcion || !fecha)) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Datos incompletos',
                    text: 'Cada audiencia debe tener descripción y fecha completas.',
                    confirmButtonColor: '#d33'
                });
                return;
            }

            audiencias.push({ descripcion, fecha });
        }

        formData.append('audiencias', JSON.stringify(audiencias));
    }

    // Agregar datos del liquidador si corresponde
    if (liquidador && !tieneCorrecciones) {
        const nombre_liquidador = document.getElementById('nombre_liquidador')?.value.trim().toUpperCase() || '';
        const telefono_liquidador = document.getElementById('telefono_liquidador')?.value.trim().toUpperCase() || '';
        const correo_liquidador = document.getElementById('correo_liquidador')?.value.trim().toUpperCase() || '';
        const pago_liquidador = document.querySelector('input[name="pago_liquidador"]:checked')?.value || '';

        formData.append('nombre_liquidador', nombre_liquidador);
        formData.append('telefono_liquidador', telefono_liquidador);
        formData.append('correo_liquidador', correo_liquidador);
        formData.append('pago_liquidador', pago_liquidador);

        if (pago_liquidador === 'SI') {
            const valor_total_pagado = document.getElementById('valor_total_pagado')?.value || '';

            const cuotas = [
                document.getElementById('cuota_1')?.value || '',
                document.getElementById('cuota_2')?.value || '',
                document.getElementById('cuota_3')?.value || '',
                document.getElementById('cuota_4')?.value || ''
            ];

            const fechas = [
                document.getElementById('fecha_1')?.value || '',
                document.getElementById('fecha_2')?.value || '',
                document.getElementById('fecha_3')?.value || '',
                document.getElementById('fecha_4')?.value || ''
            ];


            // Agregar al FormData directamente
            formData.append('valor_liquidador', valor_total_pagado);
            formData.append('cuota_1', cuotas[0]);
            formData.append('cuota_2', cuotas[1]);
            formData.append('cuota_3', cuotas[2]);
            formData.append('cuota_4', cuotas[3]);
            formData.append('fecha_1', fechas[0]);
            formData.append('fecha_2', fechas[1]);
            formData.append('fecha_3', fechas[2]);
            formData.append('fecha_4', fechas[3]);
        }
    }


    // Agregar motivo si no es apto
    if (terminacion === 'NO APTO' && !tieneCorrecciones) {
        const motivo = document.getElementById('motivo')?.value.trim().toUpperCase() || '';
        formData.append('motivo_insolvencia', motivo);
    }

    // Generar resumen para confirmación
    let resumen = `
        <strong>Cuadernillo:</strong> ${cuadernillo ? 'Sí' : 'No'}<br>
        <strong>Fecha Cuadernillo:</strong> ${fecha_cuadernillo || 'N/A'}<br>
        <strong>Radicación:</strong> ${radicacion ? 'Sí' : 'No'}<br>
        <strong>Fecha Radicación:</strong> ${fecha_radicacion || 'N/A'}<br>
        <strong>Correcciones:</strong> ${correcciones || 'No'}<br>
        <strong>Desprendible:</strong> ${desprendible_estado}<br>
        <strong>Observaciones Desprendible:</strong> ${observaciones_desprendible || 'N/A'}<br>`;

    if (desprendible_estado === 'PARCIAL' || desprendible_estado === 'LIMPIO') {
        resumen += `<strong>Cuota a Pagar:</strong> ${datosParcial?.cuota_pagar || 'N/A'}<br>`;
    }

    resumen += `
        <strong>Tipo de Proceso:</strong> ${tipo_proceso}<br>
        <strong>Juzgado:</strong> ${juzgado || 'N/A'}<br>
        <strong>Liquidador:</strong> ${liquidador ? 'Sí' : 'No'}<br>
        <strong>Estado/Terminación:</strong> ${terminacion}<br>`;

    if (terminacion === 'NO APTO' && !tieneCorrecciones) {
        resumen += `<strong>Motivo:</strong> ${document.getElementById('motivo').value.trim()}<br>`;
    }

    if (liquidador && !tieneCorrecciones) {
        resumen += `
            <strong>Nombre Liquidador:</strong> ${document.getElementById('nombre_liquidador').value.trim()}<br>
            <strong>Teléfono Liquidador:</strong> ${document.getElementById('telefono_liquidador').value.trim()}<br>
            <strong>Correo Liquidador:</strong> ${document.getElementById('correo_liquidador').value.trim()}<br>
            <strong>Pago Liquidador:</strong> ${document.querySelector('input[name="pago_liquidador"]:checked')?.value}<br>`;
    }

    if (audienciasVisibles) {
        const audienciasItems = document.querySelectorAll('#listaAudiencias .audiencia-item');
        resumen += `<strong>Audiencias:</strong><br><ul style="margin-left: 20px;">`;
        audienciasItems.forEach((item) => {
            const descripcion = item.querySelector('input[name^="audiencias"][name$="[descripcion]"]').value.trim();
            const fecha = item.querySelector('input[name^="audiencias"][name$="[fecha]"]').value.trim();
            resumen += `<li>${descripcion} - ${fecha}</li>`;
        });
        resumen += `</ul>`;
    }

    // Mostrar confirmación antes de enviar
    Swal.fire({
        title: '¿Confirmar envío?',
        html: `<div style="text-align: left; max-height: 60vh; overflow-y: auto;">${resumen}</div>`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        width: '800px'
    }).then((result) => {
        if (result.isConfirmed) {
            // Mostrar carga mientras se envía
            Swal.fire({
                title: 'Enviando datos...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Enviar datos al servidor
            fetch('http://localhost:3000/api/actualizar-insolvencias', {
                method: 'PUT',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    Swal.close();
                    if (data.success) {
                        Swal.fire({
                            icon: 'success',
                            title: '¡Guardado!',
                            text: 'Los datos se guardaron correctamente.',
                            confirmButtonColor: '#3085d6'
                        }).then(() => {
                            // Cerrar modal y recargar si es necesario
                            const modal = bootstrap.Modal.getInstance(document.getElementById('modalCrearInsolvencia'));
                            if (modal) modal.hide();
                            location.reload(); // Opcional: recargar la página
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: data.message || 'Hubo un problema al guardar los datos.',
                            confirmButtonColor: '#d33'
                        });
                    }
                })
                .catch(error => {
                    Swal.close();
                    console.error('Error:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error de conexión',
                        text: 'No se pudo conectar con el servidor.',
                        confirmButtonColor: '#d33'
                    });
                });
        }
    });
});


document.addEventListener('click', async function (e) {
    if (e.target.classList.contains('editar-proceso')) {
        const cedula = e.target.dataset.cedula;

        try {
            const response = await fetch(`http://localhost:3000/api/insolvencia/cedula/${cedula}`);
            const data = await response.json();
            console.log("Respuesta completa de la API:", data);
            if (data.success && data.data) {
                cargarDatosEnFormulario(data.data);
                const modal = new bootstrap.Modal(document.getElementById('modalCrearInsolvencia'));
                modal.show();
            } else {
                Swal.fire('Error', 'No se encontraron datos para esta cédula', 'error');
            }

        } catch (error) {
            console.error('Error al obtener datos:', error);
            Swal.fire('Error', 'No se pudo obtener la información del cliente', 'error');
        }
    }
});


let datosOriginalesParcial = {};

function cargarDatosEnFormulario(cliente) {
    console.log("Datos del cliente recibidos CLIENTE EDIT:", cliente);


    // Datos básicos del cliente (ya funcionan)
    document.getElementById('idModal').textContent = cliente.id_cliente || '---';
    document.getElementById('inputIdCliente').value = cliente.id_cliente || '';
    const nombreCompleto = `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim();
    document.getElementById('detalleNombreCliente').textContent = nombreCompleto || '---';
    document.getElementById('detalleTipoDocumento').textContent = cliente.cedula ? `Cédula: ${cliente.cedula}` : '---';
    document.getElementById('telefonoModal').textContent = cliente.telefono || '---';
    document.getElementById('emailModal').textContent = cliente.correo || '---';
    document.getElementById('direccionModal').textContent = cliente.direccion || '---';
    document.getElementById('ciudadModal').textContent = cliente.ciudad || '---';
    const fechaVinculo = cliente.fecha_vinculo ? new Date(cliente.fecha_vinculo).toLocaleDateString() : '---';
    document.getElementById('vinculacionModal').textContent = fechaVinculo;

    // Foto de perfil
    const foto = document.getElementById('fotoperfilModal');
    if (foto) {
        foto.src = cliente.foto_perfil ? `http://localhost:3000${cliente.foto_perfil}` : '../assets/img/avatar.png';
        foto.onerror = function () {
            this.src = '../assets/img/avatar.png';
        };
    }

    // Cuadernillo y Radicación con fechas
    const cuadernilloValor = cliente.cuadernillo ? 'SI' : 'NO';
    document.querySelector(`input[name="cuadernillo"][value="${cuadernilloValor}"]`).checked = true;

    if (cliente.cuadernillo) {
        const fechaCuadernilloInput = document.getElementById('fecha_cuadernillo');
        document.getElementById('fecha_cuadernillo_container').style.display = 'block';

        if (cliente.fecha_cuadernillo) {
            // Si ya existe fecha en BD: mostrar como solo lectura
            fechaCuadernilloInput.value = cliente.fecha_cuadernillo.split('T')[0];
            fechaCuadernilloInput.readOnly = true;
            fechaCuadernilloInput.style.backgroundColor = '#e9ecef';
        } else {
            // Si no hay fecha en BD: dejar editable para nueva fecha
            fechaCuadernilloInput.value = '';
            fechaCuadernilloInput.readOnly = false;
            fechaCuadernilloInput.style.backgroundColor = '';
        }
    }

    const radicacionValor = cliente.radicacion ? 'SI' : 'NO';
    document.querySelector(`input[name="radicacion"][value="${radicacionValor}"]`).checked = true;

    if (cliente.radicacion) {
        const fechaRadicacionInput = document.getElementById('fecha_radicacion');
        document.getElementById('fecha_radicacion_container').style.display = 'block';

        if (cliente.fecha_radicacion) {
            // Si ya existe fecha en BD: mostrar como solo lectura
            fechaRadicacionInput.value = cliente.fecha_radicacion.split('T')[0];
            fechaRadicacionInput.readOnly = true;
            fechaRadicacionInput.style.backgroundColor = '#e9ecef';
        } else {
            // Si no hay fecha en BD: dejar editable para nueva fecha
            fechaRadicacionInput.value = '';
            fechaRadicacionInput.readOnly = false;
            fechaRadicacionInput.style.backgroundColor = '';
        }
    }

    // Correcciones
    if (cliente.correcciones && cliente.correcciones.trim() !== '') {
        document.querySelector(`input[name="correcciones"][value="SI"]`).checked = true;
        document.getElementById('detalleCorrecciones').value = cliente.correcciones;
        document.getElementById('campoDetalleCorrecciones').style.display = 'block';
    } else {
        document.querySelector(`input[name="correcciones"][value="NO"]`).checked = true;
    }



    datosOriginalesParcial = {
        salario: cliente.salario || '',
        cuota_pagar: cliente.valor_cuota || ''
    };



    if (cliente.estado_desprendible) {
        document.querySelector(`input[name="desprendible"][value="${cliente.estado_desprendible}"]`).checked = true;
        document.querySelector(`input[name="desprendible"][value="${cliente.estado_desprendible}"]`).dispatchEvent(new Event('change'));
    }

    document.querySelectorAll('input[name="desprendible"]').forEach((radio) => {
        radio.addEventListener('change', (e) => {
            const estado = e.target.value;
            const calculadoraParcial = document.getElementById('calculadora-parcial');
            const calculadoraLimpio = document.getElementById('calculadora-limpio');

            // Oculta ambos primero
            calculadoraParcial.style.display = 'none';
            calculadoraLimpio.style.display = 'none';

            if (estado === 'PARCIAL') {
                calculadoraParcial.style.display = 'block';

                if (datosOriginalesParcial) {
                    document.getElementById('salario').value = '$ ' + Number(datosOriginalesParcial.salario).toLocaleString('es-CO');
                    document.getElementById('cuota_pagar').value = '$ ' + Number(datosOriginalesParcial.cuota_pagar).toLocaleString('es-CO');
                }
            }
            else if (estado === 'LIMPIO') {
                calculadoraLimpio.style.display = 'block';

                // Cargar desde el cliente directamente
                const porcentaje = cliente.porcentaje?.toString().replace('%', '').trim() || '0';
                const cuota = cliente.valor_cuota?.toString().replace(/[^\d.-]/g, '') || '0';

                document.getElementById('porcentaje_limpio').value = porcentaje + ' %';
                document.getElementById('cuota_limpio').value = '$ ' + Number(cuota).toLocaleString('es-CO');
            } else {
                // Si hay otro estado como "DEUDA", podrías manejarlo aquí también
                console.log('Otro estado:', estado);
            }
        });
    });




    // Mostrar nombre del archivo de desprendible si existe
    if (cliente.ruta_desprendible) {
        const fileName = cliente.ruta_desprendible.split('/').pop();
        document.getElementById('desprendibleFileNameDisplay').textContent = fileName;
        document.getElementById('desprendiblePDFUrl').value = cliente.ruta_desprendible;
    }

    // Observaciones del desprendible
    if (cliente.obs_desprendible) {
        document.getElementById('observaciones_desprendible').value = cliente.obs_desprendible;
    }

    // Cuota a pagar
    if (cliente.cuota_pagar) {
        document.getElementById('cuota_pagar').value = cliente.cuota_pagar;
    }

    // Tipo de proceso
    if (cliente.tipo_proceso) {
        document.querySelector(`input[name="tipo_proceso"][value="${cliente.tipo_proceso}"]`).checked = true;
    }

    // Juzgado
    document.getElementById('juzgado').value = cliente.juzgado || '';

    // Autoliquidador: mostrar nombre del archivo y enlace si existe
    if (cliente.autoliquidador) {
        const fileName = cliente.autoliquidador.split('/').pop();
        document.getElementById('fileNameDisplayAutoliquidador').textContent = fileName;
        document.getElementById('archivoAutoliquidadorUrl').value = cliente.ruta_autoliquidador;

        const filePreview = document.getElementById('filePreviewAutoliquidador');
        filePreview.innerHTML = `
            <a href="http://localhost:3000${cliente.autoliquidador}" target="_blank" class="btn btn-md btn-outline-info mt-2">
                <i class="fas fa-eye me-1"></i> Ver archivo
            </a>
        `;
    }

    // Estado del proceso
    if (cliente.terminacion) {
        document.querySelector(`input[name="estado"][value="${cliente.terminacion}"]`).checked = true;
        if (cliente.terminacion === 'NO APTO' && cliente.motivo_insolvencia) {
            document.getElementById('motivo').value = cliente.motivo_insolvencia;
            document.getElementById('motivo_no_apto').style.display = 'block';
        }
    }

    // Acta de aceptación
    if (cliente.acta_aceptacion) {
        const fileName = cliente.acta_aceptacion.split('/').pop();
        document.getElementById('fileNameDisplay').textContent = fileName;
        document.getElementById('archivoPDFUrl').value = cliente.acta_aceptacion;
    }

    // Cargar audiencias
    if (cliente.audiencias && cliente.audiencias.length > 0) {
        // Activar el botón de "Sí"
        document.getElementById('audiencias_si').checked = true;
        document.getElementById('audiencias_no').disabled = true; // ⛔ Deshabilitar el "No"
        mostrarAudiencias();

        // Limpiar audiencias anteriores
        const listaAudiencias = document.getElementById('listaAudiencias');
        listaAudiencias.innerHTML = '';

        cliente.audiencias.forEach((audienciaObj, index) => {
            const div = document.createElement('div');
            div.classList.add('mb-2');

            const audiencia = audienciaObj.audiencia || '---';
            const fecha = audienciaObj.fecha_audiencias
                ? new Date(audienciaObj.fecha_audiencias).toLocaleDateString()
                : '---';

            div.innerHTML = `
                <div class="border rounded p-2 bg-light">
                    <strong>Audiencia:</strong> ${audiencia}<br>
                    <strong>Fecha:</strong> ${fecha}
                </div>
            `;

            listaAudiencias.appendChild(div);
        });
    } else {
        document.getElementById('audiencias_no').checked = true;
        document.getElementById('audiencias_no').disabled = false;
        ocultarAudiencias();
    }

    // Liquidador
    if (cliente.nombre_liquidador || cliente.telefono_liquidador || cliente.correo_liquidador) {
        // Marcar "Sí"
        document.getElementById('liquidador_si').checked = true;
        mostrarDatosLiquidador(true); // Muestra los campos del liquidador

        document.getElementById('nombre_liquidador').value = cliente.nombre_liquidador || '';
        document.getElementById('telefono_liquidador').value = cliente.telefono_liquidador || '';
        document.getElementById('correo_liquidador').value = cliente.correo_liquidador || '';

        if (cliente.pago_liquidador === 'Sí') {
            document.getElementById('pago_si').checked = true;
        } else if (cliente.pago_liquidador === 'No') {
            document.getElementById('pago_no').checked = true;
        }

    } else {
        document.getElementById('liquidador_no').checked = true;
        mostrarDatosLiquidador(false); // Oculta los campos
    }

    // Mostrar visualmente el archivo del desprendible
    if (cliente.ruta_desprendible) {
        const filePreview = document.getElementById('filePreviewDesprendible');
        filePreview.innerHTML = `
        <a href="http://localhost:3000${cliente.ruta_desprendible}" target="_blank" class="btn btn-outline-info btn-md" title="Ver desprendible">
            <i class="fas fa-eye"></i> Ver Desprendible
        </a>
    `;
    }

    // Mostrar visualmente el archivo del acta de aceptación
    if (cliente.acta_aceptacion) {
        const filePreview = document.getElementById('filePreviewActa');
        filePreview.innerHTML = `
        <a href="http://localhost:3000${cliente.acta_aceptacion}" target="_blank" class="btn btn-outline-info btn-md" title="Ver acta de aceptación">
            <i class="fas fa-eye"></i> Ver Acta
        </a>
    `;
    }




}



function mostrarDatosLiquidador(mostrar) {
    const contenedor = document.getElementById('datos_liquidador');
    contenedor.style.display = mostrar ? 'block' : 'none';
}



function renderizarAudiencias(audiencias) {
    const contenedor = document.getElementById('listaAudiencias');
    contenedor.innerHTML = '';

    audiencias.forEach((audiencia, index) => {
        const item = document.createElement('div');
        item.classList.add('audiencia-item');
        item.innerHTML = `
            <input type="text" name="audiencias[${index}][descripcion]" value="${audiencia.descripcion}" placeholder="Descripción" class="form-control mb-2">
            <input type="date" name="audiencias[${index}][fecha]" value="${audiencia.fecha}" class="form-control mb-3">
        `;
        contenedor.appendChild(item);
    });
}


// Función para toggle de tarjetas
function toggleCard(element) {
    const card = element.closest('.toggle-card');
    card.classList.toggle('active');
}


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
    actualizarBotonPDF('detalleDataCredito', cliente.datacred, 'Ver DataCredito');

    // Bienes inmuebles
    const bienesInmueblesDiv = document.getElementById('detalleBienesInmuebles');
    if (cliente.bienes === "1" && cliente.bienes_inmuebles) {
        bienesInmueblesDiv.innerHTML = `
         <button class="btn btn-sm btn-outline-primary" onclick="window.open('http://localhost:3000${cliente.bienes_inmuebles}', '_blank')">
            Ver Documento de Bienes
        </button>`;
    } else if (cliente.bienes === "1") {
        bienesInmueblesDiv.innerHTML = `
        <span class="text-success fw-bold">El cliente reporta tener bienes inmuebles</span>
        <small class="text-muted d-block">(Los documentos deben ser consultados)</small>`;
    } else {
        bienesInmueblesDiv.innerHTML = '<span class="text-muted">El cliente no reporta bienes inmuebles</span>';
    }


    // Data crédito
    const dataCreditoDiv = document.getElementById('detalleDataCredito');
    if (cliente.datacred === "1" && cliente.data_credPdf) {
        dataCreditoDiv.innerHTML = `
        <button class="btn btn-sm btn-outline-primary" onclick="window.open('http://localhost:3000${cliente.data_credPdf}', '_blank')">
            Ver Reporte de DataCrédito
        </button>`;
    } else if (cliente.datacred === "1") {
        dataCreditoDiv.innerHTML = `
        <span class="text-success fw-bold">El cliente tiene data crédito registrado</span>
        <small class="text-muted d-block">(El documento debe ser consultado)</small>`;
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
    const estadoCliente = cliente.estado == 0 ? 'Activo' : 'Inactivo';
    document.getElementById('detalleEstadoCliente').value = estadoCliente;

    // Motivo de retiro (si aplica)
    document.getElementById('detalleMotivoRetiro').value = cliente.motivo_retiro || 'No aplica';


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

const modal = document.getElementById('modalVerDetalle');
const ModalSeen = document.getElementById('modalVerDetalle');

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


function agregarAudiencia() {
    const contadorAudiencias = document.getElementById('listaAudiencias').children.length + 1;
    const nuevoId = 'audiencia_' + contadorAudiencias;

    const nuevaAudiencia = document.createElement('div');
    nuevaAudiencia.className = 'audiencia-item mb-2';
    nuevaAudiencia.id = nuevoId;
    nuevaAudiencia.innerHTML = `
      <div class="row g-2">
        <div class="col-md-7">
          <input type="text" class="form-control form-control-sm" 
                 name="audiencias[${contadorAudiencias}][descripcion]" 
                 value="Audiencia ${contadorAudiencias}" required>
        </div>
        <div class="col-md-4">
          <input type="date" class="form-control form-control-sm" 
                 name="audiencias[${contadorAudiencias}][fecha]" required>
        </div>
        <div class="col-md-1">
          <button type="button" class="btn btn-md btn-outline-danger w-100" onclick="eliminarAudiencia('${nuevoId}')">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    `;

    document.getElementById('listaAudiencias').appendChild(nuevaAudiencia);
}


function eliminarAudiencia(id) {
    Swal.fire({
        title: '¿Eliminar audiencia?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            document.getElementById(id).remove();
        }
    });
}



function mostrarAudiencias() {
    document.getElementById('contenedorAudiencias').style.display = 'block';
    if (document.getElementById('listaAudiencias').children.length === 0) {
        agregarAudiencia();
    }
}

function ocultarAudiencias() {
    document.getElementById('contenedorAudiencias').style.display = 'none';
    document.getElementById('listaAudiencias').innerHTML = '';
}

function mostrarDatosLiquidador(mostrar) {
    document.getElementById('datos_liquidador').style.display = mostrar ? 'block' : 'none';
}

function mostrarMotivo(mostrar) {
    document.getElementById('motivo_no_apto').style.display = mostrar ? 'block' : 'none';
}

// VISUAL DEL BOTÓN DE ADJUNTAR + PREVISUALIZACIÓN
document.addEventListener('DOMContentLoaded', function () {
    // Acta de Aceptación
    setupFileInput(
        'archivoPDF',
        'fileNameDisplay',
        '.file-upload-label[for="archivoPDF"]',
        'Seleccionar archivo',
        'filePreviewActa'
    );

    // Desprendible
    setupFileInput(
        'desprendiblePDF',
        'desprendibleFileNameDisplay',
        '.file-upload-label[for="desprendiblePDF"]',
        'Seleccionar desprendible',
        'filePreviewDesprendible'
    );

    // Autoliquidador con vista previa
    setupFileInput(
        'archivoAutoliquidador',
        'fileNameDisplayAutoliquidador',
        '.file-upload-label[for="archivoAutoliquidador"]',
        'Seleccionar archivo',
        'filePreviewAutoliquidador'
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



// Mostrar nombre de archivo seleccionado
document.getElementById('archivoPDF').addEventListener('change', function (e) {
    const fileName = e.target.files[0] ? e.target.files[0].name : 'Ningún archivo seleccionado';
    document.getElementById('fileNameDisplay').textContent = fileName;
});

function formatearPeso(valor) {
    return valor.toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    });
}



const radioParcial = document.getElementById("desprendible_parcial");
const radioOtros = document.querySelectorAll('input[name="desprendible"]:not(#desprendible_parcial)');
const seccionParcial = document.getElementById("calculadora-parcial");
const radioLimpio = document.getElementById("desprendible_limpio");
const seccionLimpio = document.getElementById("calculadora-limpio");
document.querySelectorAll('input[name="desprendible"]').forEach(radio => {
    radio.addEventListener('change', function () {
        seccionParcial.style.display = 'none';
        seccionLimpio.style.display = 'none';

        if (this.value === 'PARCIAL') {
            seccionParcial.style.display = 'block';

            const salario = $('#salario').data('salario');
            if (salario) {
                document.getElementById('salario').value = formatCurrency(salario);
                document.getElementById('salario').dataset.valor = salario;
            } else {
                document.getElementById('salario').value = '';
                document.getElementById('salario').dataset.valor = '0';
            }

            calcular(); // ejecuta la función de cálculo automáticamente
        }
        else if (this.value === 'LIMPIO') {
            seccionLimpio.style.display = 'block';

            // Obtener porcentaje y cuota desde los inputs ocultos o del DOM
            const porcentaje = $('#inputIdCliente').data('porcentaje');
            const cuota = $('#inputIdCliente').data('cuota');

            if (porcentaje && cuota) {
                document.getElementById('porcentaje_limpio').value = porcentaje + ' %';
                document.getElementById('cuota_limpio').value = '$ ' + Number(cuota).toLocaleString('es-CO');
            } else {
                document.getElementById('porcentaje_limpio').value = '';
                document.getElementById('cuota_limpio').value = '';
            }
        }
    });
});




const salario = document.getElementById("salario");
const salud = document.getElementById("salud");
const salario_total = document.getElementById("salario_total");
const saldo_total = document.getElementById("saldo_total");
const deducciones = document.getElementById("deducciones");
const saldo_libre = document.getElementById("saldo_libre");
const porcentaje = document.getElementById("porcentaje");
const cuota_pagar = document.getElementById("cuota_pagar");

function limpiarNumero(valor) {
    return valor.replace(/\D/g, '');
}

function formatearMonedaVisual(input) {
    const crudo = limpiarNumero(input.value);
    input.dataset.valor = crudo;

    if (crudo) {
        input.value = new Intl.NumberFormat('es-CO').format(crudo);
    } else {
        input.value = '';
    }
}

function capturarValorCrudo(input) {
    const crudo = limpiarNumero(input.value);
    input.dataset.valor = crudo;
}

function formatCurrency(value) {
    const number = parseFloat(value);
    if (isNaN(number)) return "";
    return '$' + number.toLocaleString('es-CO', { maximumFractionDigits: 0 });
}

function unformatCurrency(value) {
    return parseFloat(value.replace(/[^\d.-]/g, "")) || 0;
}

function calcular() {
    const sal = parseFloat(salario.dataset.valor || 0);
    const salu = unformatCurrency(salud.value);
    const ded = unformatCurrency(deducciones.value);
    const porc = parseFloat(porcentaje.value) || 0;

    const sal_total = sal - salu;
    salario_total.value = formatCurrency(sal_total);
    salario_total.style.color = sal_total < 0 ? 'red' : 'inherit';

    const saldo = sal_total / 2;
    saldo_total.value = formatCurrency(saldo);
    saldo_total.style.color = saldo < 0 ? 'red' : 'inherit';

    const libre = saldo - ded;
    saldo_libre.value = formatCurrency(libre);
    saldo_libre.style.color = libre < 0 ? 'red' : 'inherit';

    const cuota = (libre * porc) / 100;
    cuota_pagar.value = formatCurrency(cuota);
    cuota_pagar.style.color = cuota < 0 ? 'red' : 'inherit';
}

function applyCurrencyFormatting(input) {
    input.addEventListener("input", () => {
        // Obtener solo los números
        let raw = input.value.replace(/\D/g, '');
        input.dataset.valor = raw;

        if (raw) {
            input.value = formatCurrency(raw);

            // Mover el cursor al final
            setTimeout(() => {
                input.selectionStart = input.selectionEnd = input.value.length;
            }, 0);
        } else {
            input.value = '';
        }

        calcular();
    });

    // Inicializar si hay valor al cargar
    const initialRaw = input.value.replace(/\D/g, '');
    input.dataset.valor = initialRaw;
    if (initialRaw) {
        input.value = formatCurrency(initialRaw);
    }
}



[salario, salud, deducciones].forEach(applyCurrencyFormatting);
porcentaje.addEventListener("input", calcular);

radioParcial.addEventListener("change", () => {
    if (radioParcial.checked) {
        seccionParcial.style.display = "block";
    }
});

radioOtros.forEach(radio => {
    radio.addEventListener("change", () => {
        seccionParcial.style.display = "none";
    });
});

function mostrarFecha(tipo, mostrar) {
    const container = document.getElementById(`fecha_${tipo}_container`);
    if (container) {
        container.style.display = mostrar ? 'block' : 'none';
    }
}

function mostrarCampoCorrecciones() {
    document.getElementById("campoDetalleCorrecciones").style.display = "block";
}

function ocultarCampoCorrecciones() {
    document.getElementById("campoDetalleCorrecciones").style.display = "none";
}


//OBSERVACIONES SCRIPT
document.addEventListener('DOMContentLoaded', function () {
    const textarea = document.getElementById('observaciones_desprendible');
    const contador = document.getElementById('contadorCaracteres');

    if (textarea && contador) {
        textarea.addEventListener('input', function () {
            const caracteres = this.value.length;
            contador.textContent = caracteres;

            // Cambiar estilo si se acerca al límite
            if (caracteres > 100) {
                contador.className = 'text-warning';
            } else if (caracteres > 150) {
                contador.className = 'text-danger';
            } else {
                contador.className = 'text-muted';
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const textareaCorrecciones = document.getElementById('detalleCorrecciones');
    const contadorCorrecciones = document.getElementById('contadorCorrecciones');

    if (textareaCorrecciones && contadorCorrecciones) {
        textareaCorrecciones.addEventListener('input', function () {
            const caracteres = this.value.length;
            contadorCorrecciones.textContent = caracteres;

            // Cambiar estilo si se acerca al límite
            if (caracteres > 250) {
                contadorCorrecciones.className = 'text-warning';
            } else if (caracteres > 290) {
                contadorCorrecciones.className = 'text-danger';
            } else {
                contadorCorrecciones.className = 'text-muted';
            }
        });
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const pagoSi = document.getElementById('pago_si');
    const pagoNo = document.getElementById('pago_no');
    const cuotasDiv = document.getElementById('cuotas_pago');

    function toggleCuotas() {
        cuotasDiv.style.display = pagoSi.checked ? 'block' : 'none';
    }

    pagoSi.addEventListener('change', toggleCuotas);
    pagoNo.addEventListener('change', toggleCuotas);

    toggleCuotas();

    // ⬇️ Aplicar formato de moneda a los campos
    const camposMoneda = [
        'valor_total_pagado',
        'cuota_1',
        'cuota_2',
        'cuota_3',
        'cuota_4'
    ];

    camposMoneda.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            applyCurrencyFormatting(campo);
        }
    });
});

// Lista de IDs de campos a deshabilitar (actualizada)
const CAMPOS_A_DESHABILITAR = [
    // Audiencias
    "audiencias_si", "audiencias_no",

    // Acta de aceptación
    "archivoPDF", "archivoPDFUrl",

    // Estado del Proceso
    "desprendiblePDF", "desprendiblePDFUrl",
    "desprendible_parcial", "desprendible_limpio", "desprendible_deudas",
    "salario", "salud", "salario_total", "saldo_total", "deducciones",
    "saldo_libre", "porcentaje", "cuota_pagar",
    "porcentaje_limpio", "cuota_limpio",
    "observaciones_desprendible",

    // Proceso Jurídico
    "proceso_liquidacion", "proceso_acuerdo_pago",
    "juzgado", "archivoAutoliquidador", "archivoAutoliquidadorUrl",
    "liquidador_si", "liquidador_no",
    "nombre_liquidador", "telefono_liquidador", "correo_liquidador",
    "pago_si", "pago_no",

    // Proceso Finalizado
    "estado_apto", "estado_no_apto", "motivo"
];

// Función para deshabilitar un elemento y su label asociado
function deshabilitarElemento(elemento) {
    if (!elemento) return;

    elemento.disabled = true;

    // Manejo especial para radios/checkboxes
    if (elemento.type === "radio" || elemento.type === "checkbox") {
        elemento.onclick = function (e) { e.preventDefault(); return false; };
        const label = document.querySelector(`label[for="${elemento.id}"]`);
        if (label) {
            label.classList.add('disabled-field');
            label.style.pointerEvents = 'none';
        }
    }

    // Manejo especial para file inputs
    if (elemento.type === "file") {
        const label = document.querySelector(`label[for="${elemento.id}"]`);
        if (label) {
            label.classList.add('disabled-field');
            label.style.pointerEvents = 'none';
        }
    }
}

// Función para habilitar un elemento y su label asociado
function habilitarElemento(elemento) {
    if (!elemento) return;

    elemento.disabled = false;

    if (elemento.type === "radio" || elemento.type === "checkbox") {
        elemento.onclick = null;
        const label = document.querySelector(`label[for="${elemento.id}"]`);
        if (label) {
            label.classList.remove('disabled-field');
            label.style.pointerEvents = '';
        }
    }

    if (elemento.type === "file") {
        const label = document.querySelector(`label[for="${elemento.id}"]`);
        if (label) {
            label.classList.remove('disabled-field');
            label.style.pointerEvents = '';
        }
    }
}

// Mostrar campo de correcciones y deshabilitar otros campos
function mostrarCampoCorrecciones() {
    console.log("Mostrando campo de correcciones");

    // Mostrar el textarea de correcciones
    const campoCorrecciones = document.getElementById("campoDetalleCorrecciones");
    if (campoCorrecciones) {
        campoCorrecciones.style.display = "block";
    } else {
        console.error("No se encontró el elemento con ID 'campoDetalleCorrecciones'");
    }

    // Deshabilitar todos los campos especificados
    CAMPOS_A_DESHABILITAR.forEach(id => {
        const elemento = document.getElementById(id);
        if (!elemento) {
            console.warn(`Elemento con ID ${id} no encontrado`);
            return;
        }
        deshabilitarElemento(elemento);
    });
}

// Ocultar campo de correcciones y habilitar otros campos
function ocultarCampoCorrecciones() {
    console.log("Ocultando campo de correcciones");

    // Ocultar el textarea de correcciones
    const campoCorrecciones = document.getElementById("campoDetalleCorrecciones");
    if (campoCorrecciones) {
        campoCorrecciones.style.display = "none";
        document.getElementById("detalleCorrecciones").value = "";
    }

    // Habilitar todos los campos especificados
    CAMPOS_A_DESHABILITAR.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            habilitarElemento(elemento);
        }
    });
}
