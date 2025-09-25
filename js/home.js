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

async function buscarPersona() {
    const cedula = document.getElementById('cedulaInput').value.trim();
    const btnBuscar = document.getElementById('btnBuscar');

    // Validación
    if (!cedula || !/^\d{8,10}$/.test(cedula)) {
        mostrarToast('Por favor ingrese una cédula válida (8-10 dígitos)', 'danger');
        return;
    }

    // Mostrar estado de carga
    btnBuscar.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>';
    btnBuscar.disabled = true;

    try {
        const response = await fetch(`http://localhost:3000/api/buscar-persona/${cedula}`);

        if (!response.ok) {
            throw new Error(response.status === 404 ? 'Cliente no encontrado' : 'Error en la búsqueda');
        }

        const data = await response.json();
        mostrarResultados(data);

    } catch (error) {
        console.error('Error:', error);
        mostrarToast(error.message, 'danger');
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('resultadosModulos').style.display = 'none';
        const clienteContainer = document.querySelector('.card.cliente-card');
        if (clienteContainer) {
            clienteContainer.remove();
        }
    } finally {
        btnBuscar.innerHTML = '<i class="fas fa-search me-2"></i>';
        btnBuscar.disabled = false;
    }
}

function mostrarDatosCliente(cliente) {
    const contenedorCliente = document.createElement('div');
    contenedorCliente.className = 'card cliente-card';

    // Formatear nombres y valores de pagadurías
    const pagadurias = cliente.nombres_pagadurias
        ? cliente.nombres_pagadurias.split(',').map(s => s.trim())
        : [];
    const valores = cliente.valores_pagadurias
        ? cliente.valores_pagadurias.split(',').map(v => Number(v.trim()))
        : [];

    // Crear string formateado
    let pagaduriasStr = 'No registrada';
    let valoresStr = '---';
    if (pagadurias.length > 0) {
        pagaduriasStr = pagadurias.join(', ');
        valoresStr = valores.map(v => `$${v.toLocaleString()}`).join(', ');
    }



    const fotoUrl = cliente.foto_perfil
        ? `http://localhost:3000${cliente.foto_perfil}`
        : 'https://via.placeholder.com/200';

    const estadoBadge = cliente.estado === 0
        ? `<span class="badge bg-success ms-2">Activo</span>`
        : `<span class="badge bg-danger ms-2">Inactivo</span>`;
    contenedorCliente.innerHTML = `
        <div class="cliente-body">
            <!-- Foto grande centrada en la parte superior -->
            <div class="text-center mb-4">
                <div class="cliente-img-grande-container">
                        <img src="${fotoUrl}" 
                            class="cliente-img-grande foto-cliente" 
                            alt="${cliente.nombres || 'Foto perfil'}"
                            data-src="${fotoUrl}"
                            onerror="this.src='https://via.placeholder.com/200'">
                        <div class="cliente-nombre text-center mt-2">
                            <h4 class="text-dark fw-bold">#${cliente.id_cliente} - ${cliente.nombres} ${cliente.apellidos}</h4>
                            <!-- Badge de estado debajo del nombre -->
                            ${estadoBadge === 0
            ? '<span class="badge bg-success mt-2">Activo</span>'
            : '<span class="badge bg-danger mt-2">Inactivo</span>'}
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <!-- Columna izquierda - Datos personales -->
                <div class="col-md-6">
                    <div class="cliente-seccion">
                        <h5><i class="fas fa-user"></i> Datos Personales</h5>
                        <p><i class="fas fa-id-card"></i> <strong>Cédula:</strong> ${cliente.cedula}</p>
                        <p><i class="fas fa-birthday-cake"></i> <strong>Edad:</strong> ${cliente.edad} años</p>
                        <p><i class="fas fa-heart"></i> <strong>Estado Civil:</strong> ${cliente.estado_civil}</p>
                    </div>

                    <div class="cliente-seccion">
                        <h5><i class="fas fa-address-book"></i> Contacto</h5>
                        <p><i class="fas fa-map-marker-alt"></i> <strong>Dirección:</strong> ${cliente.direccion || 'No registrada'}</p>
                        <p><i class="fas fa-phone"></i> <strong>Teléfono:</strong> ${cliente.telefono || 'No registrado'}</p>
                        <p><i class="fas fa-envelope"></i> <strong>Correo:</strong> ${cliente.correo || 'No registrado'}</p>
                    </div>
                </div>

                <!-- Columna derecha - Datos laborales y financieros -->
                <div class="col-md-6">
                    <div class="cliente-seccion">
                        <h5><i class="fas fa-briefcase"></i> Información Laboral</h5>
                         <p><i class="fas fa-user-check"></i> 
                            <strong>Situación:</strong> ${cliente.laboral == 1 ? 'ACTIVO' : 'PENSIONADO'}
                        </p>
                        <p><i class="fas fa-building"></i> <strong>Empresa:</strong> ${cliente.empresa || 'No registrada'}</p>
                        <p><i class="fas fa-user-tie"></i> <strong>Cargo:</strong> ${cliente.cargo || 'No registrado'}</p>
                    </div>

                    <div class="cliente-seccion">
                        <h5><i class="fas fa-wallet"></i> Información Financiera</h5>
                        <p><i class="fas fa-landmark"></i> <strong>Pagaduría:</strong> ${pagaduriasStr}</p>
                        <p><i class="fas fa-money-bill-wave"></i> <strong>Valor:</strong> ${valoresStr}</p>
                        <p><i class="fas fa-calendar-day"></i> <strong>Fecha Vinculación:</strong> ${formatearFecha(cliente.fecha_vinculo)}</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Insertar antes de los módulos
    const resultadosModulos = document.getElementById('resultadosModulos');
    if (resultadosModulos) {
        resultadosModulos.parentNode.insertBefore(contenedorCliente, resultadosModulos);
    }
}


function mostrarResultados(data) {
    // Primero verificar que los elementos existen
    const elementosRequeridos = [
        'emptyState', 'resultadosModulos',
        'timelineCartera', 'timelineEmbargos', 'timelineInsolvencia',
        'contadorCartera', 'contadorEmbargos', 'contadorInsolvencia',
        'contador'
    ];

    // Verificar elementos requeridos
    elementosRequeridos.forEach(id => {
        if (!document.getElementById(id)) {
            console.error(`❌ No se encontró el elemento con ID '${id}'`);
            return;
        }
    });

    // Limpiar sección del cliente si existe
    const clienteContainer = document.querySelector('.card.cliente-card');
    if (clienteContainer) {
        clienteContainer.remove();
    }

    // Ocultar estado vacío y preparar para mostrar resultados
    document.getElementById('emptyState').style.display = 'none';
    const resultadosDiv = document.getElementById('resultadosModulos');
    resultadosDiv.style.display = 'flex';
    resultadosDiv.style.opacity = '0';
    resultadosDiv.style.transition = 'opacity 0.5s ease';

    setTimeout(() => {
        resultadosDiv.style.opacity = '1';
    }, 100);

    // Limpiar timelines y contadores
    const timelines = [
        { id: 'timelineCartera', contador: 'contadorCartera' },
        { id: 'timelineEmbargos', contador: 'contadorEmbargos' },
        { id: 'timelineInsolvencia', contador: 'contadorInsolvencia' }
    ];

    timelines.forEach(({ id, contador }) => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '';
            document.getElementById(contador).textContent = '0 registros';
        }
    });

    // Reiniciar contador general
    document.getElementById('contador').textContent = '0';

    let totalRegistros = 0;


    if (data.cliente) {
        mostrarDatosCliente(data.cliente);
    }

    if (data.modulos.cartera) {
        const carteraTimeline = document.getElementById('timelineCartera');
        if (carteraTimeline) {
            let registrosCartera = 0;

            // 🔹 Tarjetas
            if (data.modulos.cartera.tarjetas && data.modulos.cartera.tarjetas.length) {
                data.modulos.cartera.tarjetas.forEach(tarjeta => {
                    if (tarjeta.cred_creado === null) {
                        carteraTimeline.innerHTML += `
                        <div class="evento-pendiente">
                            <div class="efecto-azul"></div>
                            <div class="contenido-pendiente">
                                <div class="icono-alerta-cart">
                                    <i class="fas fa-exclamation-triangle"></i> 
                                    <div class="pulso-azul"></div>
                                    <div class="rayo"></div>
                                </div>
                                <div class="texto-alerta-cart">
                                    <h3>Cliente en CARTERA sin gestión iniciada</h3>
                                    <div class="detalle-pendiente">
                                        <span><i class="fas fa-clock"></i> <strong>Estado:</strong> Pendiente por gestión</span>
                                        <span><i class="fas fa-user"></i> <strong>Asignar Asesor:</strong> Requerido</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        `;
                        registrosCartera++;
                        return;
                    }

                    carteraTimeline.innerHTML += `
                    <div class="evento-timeline completado tarjeta-credito">
                        <div class="fecha-evento">${formatearFecha(tarjeta.fecha_prestamo)}</div>
                        <div class="icono-evento"><i class="fas fa-credit-card"></i></div>
                        <div class="detalle-evento">
                            <div class="encabezado-tarjeta">
                                <div class="titulo-tarjeta">
                                    <i class="fas fa-credit-card"></i> 
                                    Crédito - Tarjeta #${tarjeta.id_creditos}
                                </div>
                            </div>
                            
                            <div class="info-tarjeta-grid">
                                <div class="info-tarjeta-item">
                                    <span class="info-tarjeta-label">Valor Prestado</span>
                                    <span class="info-tarjeta-valor monto">$${tarjeta.valor_prestado.toLocaleString()}</span>
                                </div>
                                <div class="info-tarjeta-item">
                                    <span class="info-tarjeta-label">Tasa de Interés</span>
                                    <span class="info-tarjeta-valor">${tarjeta.interes_prestado}%</span>
                                </div>
                                <div class="info-tarjeta-item importante">
                                    <span class="info-tarjeta-label">Valor Total</span>
                                    <span class="info-tarjeta-valor monto">$${tarjeta.valor_total.toLocaleString()}</span>
                                </div>
                                <div class="info-tarjeta-item">
                                    <span class="info-tarjeta-label">Asesor</span>
                                    <span class="info-tarjeta-valor">${tarjeta.asesor || 'No asignado'}</span>
                                </div>
                            </div>
                            
                            <div class="observaciones-tarjeta">
                                <strong><i class="fas fa-clipboard-list"></i> Observación</strong>
                                <p>${tarjeta.obs_credito || 'Sin observaciones'}</p>
                            </div>
                        </div>
                    </div>
                    `;
                    registrosCartera++;
                });
            }

            // 🔹 Bancos
            if (data.modulos.cartera.bancos && data.modulos.cartera.bancos.length) {
                data.modulos.cartera.bancos.forEach(banco => {


                    carteraTimeline.innerHTML += `
        <div class="evento-timeline pendiente banco-negociacion">
            <div class="fecha-evento">${formatearFecha(banco.fecha_banco)}</div>
            <div class="icono-evento"><i class="fas fa-university"></i></div>
            <div class="detalle-evento">
                <div class="encabezado-banco">
                    <div class="titulo-banco">
                        <i class="fas fa-university"></i> 
                        Crédito - Banco #${banco.id_banco}
                    </div>
                </div>
                
                <div class="info-banco-grid">
                    <div class="info-banco-item importante">
                        <span class="info-banco-label">Entidad Bancaria</span>
                        <span class="info-banco-valor entidad">${banco.banco}</span>
                    </div>
                    
                    <div class="info-banco-item">
                        <span class="info-banco-label">Monto Solicitado</span>
                        <span class="info-banco-valor">$${banco.monto_solicitado.toLocaleString()}</span>
                    </div>
                    
                    <div class="info-banco-item monto">
                        <span class="info-banco-label">Monto Aprobado</span>
                        <span class="info-banco-valor monto">$${banco.monto_aprobado.toLocaleString()}</span>
                    </div>
                    
                    <div class="info-banco-item negociacion">
                        <span class="info-banco-label">Estrategia de Negociación</span>
                        <span class="info-banco-valor">${banco.negociacion}</span>
                    </div>
                    
                    <div class="info-banco-item">
                        <span class="info-banco-label">Asesor Asignado</span>
                        <span class="info-banco-valor">${banco.asesor_banco || 'No asignado'}</span>
                    </div>
                </div>
            </div>
        </div>
        `;
                    registrosCartera++;
                });
            }

            // 🔹 Cuotas pendientes
            if (data.modulos.cartera.cuotas && data.modulos.cartera.cuotas.length) {
                data.modulos.cartera.cuotas.forEach(cuota => {
                    carteraTimeline.innerHTML += `
                    <div class="evento-timeline rechazado">
                        <div class="fecha-evento">${formatearFecha(cuota.fecha_programada)}</div>
                        <div class="icono-evento"><i class="fas fa-calendar-day"></i></div>
                        <div class="detalle-evento">
                            <div class="encabezado-embargo">
                                <span class="num-embargo">Cuota #${cuota.numero_cuota}</span>
                                <span class="badge-estado badge-warning">
                                    <i class="fas fa-clock"></i> Pendiente
                                </span>
                            </div>
                            <p><strong>Valor Cuota:</strong> $${cuota.valor_cuota.toLocaleString()}</p>
                            <p><strong>Saldo Pendiente:</strong> $${(cuota.saldo_pendiente || 0).toLocaleString()}</p>
                            <p><strong>Estado:</strong> ${cuota.estado}</p>
                        </div>
                    </div>
                `;
                    registrosCartera++;
                });
            }

            // 🔹 Actualizar contador
            document.getElementById('contadorCartera').textContent = `${registrosCartera} registro${registrosCartera !== 1 ? 's' : ''}`;
            totalRegistros += registrosCartera;
        }
    }

    // ---------- EMBARGOS CON TÍTULOS ----------
    if (data.modulos.embargos && data.modulos.embargos.length) {
        const embargosTimeline = document.getElementById('timelineEmbargos');
        if (embargosTimeline) {
            let registrosEmbargos = 0;

            data.modulos.embargos.forEach(embargo => {

                if (embargo.creada === 0) {
                    embargosTimeline.innerHTML += `
                    <div class="evento-urgente">
                        <div class="efecto-luminoso"></div>
                        <div class="contenido-urgente">
                            <div class="icono-alerta">
                                <i class="fas fa-exclamation-triangle"></i> <!-- Icono de peligro -->
                                <div class="pulso"></div>
                                <div class="rayo"></div> <!-- Nuevo efecto de rayo -->
                            </div>
                            <div class="texto-alerta">
                                <h3>Cliente en EMBARGOS sin gestión iniciada</h3>
                                <div class="detalle-urgente">
                                    <span><i class="fas fa-clock"></i> <strong>Estado:</strong> Pendiente por realizar proceso</span>
                                    <span><i class="fas fa-user-tag"></i> <strong>Asignar Asesor:</strong> Urgente</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    `;
                    registrosEmbargos++;
                    return;
                }

                const estado = {
                    0: { texto: 'Aceptado', clase: 'badge-success', icono: 'fa-check-circle' },
                    1: { texto: 'Rechazado', clase: 'badge-danger', icono: 'fa-times-circle' },
                    2: { texto: 'En Proceso', clase: 'badge-warning', icono: 'fa-spinner' }
                }[embargo.estado_embargo] || { texto: 'No Definido', clase: 'badge-secondary', icono: 'fa-question-circle' };

                let tituloInfo = '';
                if (embargo.titulos === 1 && data.modulos.titulos && data.modulos.titulos.length) {
                    const titulo = data.modulos.titulos[0];
                    tituloInfo = `
                    <div class="seccion-titulos">
                        <div class="titulo-seccion"><i class="fas fa-file-contract"></i> Título Ejecutivo</div>
                        <div class="contenido-titulo">
                            <div class="fila-titulo">
                                <span class="etiqueta-titulo">Terminación Oficina:</span>
                                <span class="valor-titulo">${titulo.terminacion_ofic ? formatearFecha(titulo.terminacion_ofic) : 'No registrada'}</span>
                            </div>
                            <div class="fila-titulo">
                                <span class="etiqueta-titulo">Terminación Juzgado:</span>
                                <span class="valor-titulo">${titulo.terminacion_juzg ? formatearFecha(titulo.terminacion_juzg) : 'No registrada'}</span>
                            </div>
                            <div class="fila-titulo">
                                <span class="etiqueta-titulo">Solicitud de Títulos:</span>
                                <span class="valor-titulo">${titulo.solicitud_titulos ? formatearFecha(titulo.solicitud_titulos) : 'No registrada'}</span>
                            </div>
                            <div class="fila-titulo">
                                <span class="etiqueta-titulo">Orden de Pago:</span>
                                <span class="valor-titulo">${titulo.orden_pago ? formatearFecha(titulo.orden_pago) : 'Pendiente'}</span>
                            </div>
                        </div>
                    </div>
                `;
                } else {
                    tituloInfo = `
                    <div class="sin-titulos">
                        <i class="far fa-file-alt"></i> Sin título registrado
                    </div>
                `;
                }

                embargosTimeline.innerHTML += `
                <div class="evento-timeline ${embargo.estado_embargo === 0 ? 'completado' :
                        embargo.estado_embargo === 1 ? 'rechazado' : 'pendiente'}">
                    <div class="fecha-evento">Fecha de Ult. Modificación: ${formatearFechaHora(embargo.updated_at) || 'Pendiente'}</div>
                    <div class="icono-evento"><i class="fas fa-gavel"></i></div>
                    <div class="detalle-evento">
                        <div class="encabezado-embargo">
                            <span class="num-embargo">
                                Embargo #${embargo.id_embargos}${embargo.radicado ? '-' + embargo.radicado : ' (S/R)'}
                            </span>
                            <span class="badge-estado ${estado.clase}">
                                <i class="fas ${estado.icono}"></i> ${estado.texto}
                            </span>
                        </div>
                        <div class="info-principal">
                            <p><strong>Pagaduría:</strong> ${embargo.pagaduria_embargo || 'No especificada'}</p>
                            <p><strong>Valor:</strong> $${embargo.valor_embargo || 'No especificado'}</p>
                            <p><strong>Juzgado:</strong> ${embargo.juzgado_embargo || 'No especificado'}</p>
                        </div>
                        
                        <div class="proceso-embargo">
                            <p><i class="far fa-file-alt"></i> Radicado: <strong>${embargo.fecha_radicacion ? formatearFecha(embargo.fecha_radicacion) : 'Pendiente'}</strong></p>
                            <p><i class="fas fa-folder-open"></i> Expediente: <strong>${embargo.fecha_expediente ? formatearFecha(embargo.fecha_expediente) : 'Pendiente'}</strong></p>
                            <p><i class="fas fa-search"></i> Revisión: <strong>${embargo.fecha_revision_exp ? formatearFecha(embargo.fecha_revision_exp) : 'Pendiente'}</strong></p>
                        </div>

                        <div class="red-judicial ${embargo.red_judicial?.trim() === "https://www.redjudicial.com/nuevo/" ? 'registrado' : 'no-registrado'}">
                            <i class="fas fa-globe"></i> ${embargo.red_judicial?.trim() === "https://www.redjudicial.com/nuevo/" ? 'Registrado en Red Judicial' : 'No registrado'}
                        </div>
                        
                        ${embargo.asesor_embargo ? `<div class="asesor"><i class="fas fa-user-tie"></i> ${embargo.asesor_embargo}</div>` : ''}
                        
                        ${tituloInfo}
                    </div>
                </div>
            `;
                registrosEmbargos++;
            });

            document.getElementById('contadorEmbargos').textContent = `${registrosEmbargos} ${registrosEmbargos !== 1 ? 'embargos' : 'embargo'}`;
            totalRegistros += registrosEmbargos;
        }
    }



    // INSOLVENCIA
    if (data.modulos.insolvencia && data.modulos.insolvencia.length) {
        const insolvenciaTimeline = document.getElementById('timelineInsolvencia');
        if (insolvenciaTimeline) {
            let registrosInsolvencia = 0;

            data.modulos.insolvencia.forEach(item => {
                if (item.creada === null) {
                    insolvenciaTimeline.innerHTML += `
                        <div class="evento-urgente-inso evento-urgente-warning">
                            <div class="efecto-luminoso-inso"></div>
                            
                            <div class="contenido-urgente">
                                <div class="icono-alerta-inso">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    <div class="pulso-inso"></div>
                                    <div class="rayo"></div>
                                </div>
                                <div class="texto-alerta-inso">
                                    <h3>Cliente en INSOLVENCIA sin gestión iniciada</h3>
                                    <div class="detalle-urgente-inso">
                                        <span><i class="fas fa-clock"></i> <strong>Estado:</strong> Pendiente por iniciar proceso</span>
                                        <span><i class="fas fa-user-tag"></i> <strong>Asignar Asesor:</strong> Urgente</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        `;
                    registrosInsolvencia++;
                    return;
                }



                // Estado de terminación con iconos
                let textoEstado = (item.terminacion || '').toUpperCase();
                const estadoTerminacion = {
                    texto: textoEstado || 'En proceso',
                    clase: textoEstado === 'APTO'
                        ? 'badge-success'
                        : textoEstado === 'NO APTO'
                            ? 'badge-danger'
                            : 'badge-warning',
                    icono: textoEstado === 'APTO'
                        ? 'fa-check-circle'
                        : textoEstado === 'NO APTO'
                            ? 'fa-times-circle'
                            : 'fa-spinner'
                };

                // Clase para el borde del evento-timeline
                let claseEstado;
                if (textoEstado === 'APTO') {
                    claseEstado = 'completado'; // verde
                } else if (textoEstado === 'NO APTO') {
                    claseEstado = 'rechazado'; // rojo
                } else {
                    claseEstado = 'pendiente'; // amarillo
                }



                // Fechas principales (cuadernillo y radicación) con estilo "proceso-embargo"
                let fechasHTML = `
                <div class="proceso-embargo">
                    <p><i class="fas fa-book"></i> Fecha Cuadernillo: <strong>${item.fecha_cuadernillo ? formatearFecha(item.fecha_cuadernillo) : 'Pendiente'}</strong></p>
                    <p><i class="fas fa-paper-plane"></i> Fecha Radicación: <strong>${item.fecha_radicacion ? formatearFecha(item.fecha_radicacion) : 'Pendiente'}</strong></p>
                </div>
            `;

                // Listado de audiencias con estilo "seccion-titulos"
                let audienciasHTML = '';
                if (data.modulos.audiencias && data.modulos.audiencias.length) {
                    audienciasHTML = `
                    <div class="seccion-titulos">
                        <div class="titulo-seccion"><i class="fas fa-calendar-alt"></i> Audiencias</div>
                        <div class="contenido-titulo">
                `;
                    data.modulos.audiencias.forEach(a => {
                        audienciasHTML += `
                        <div class="fila-titulo">
                            <span class="etiqueta-titulo">${a.audiencia}:</span> 
                            <span class="valor-titulo">${formatearFecha(a.Fecha_audiencias)}</span>
                        </div>
                    `;
                    });
                    audienciasHTML += `
                        </div>
                    </div>
                `;
                } else {
                    audienciasHTML = `
                    <div class="seccion-titulos">
                        <div class="titulo-seccion"><i class="fas fa-calendar-alt"></i> Audiencias</div>
                        <div class="contenido-titulo">
                            <div class="fila-titulo">
                                <span class="valor-titulo">Ninguna registrada</span>
                            </div>
                        </div>
                    </div>
                `;
                }


                // Bloque de desprendible
                let desprendibleHTML = '';
                if (data.modulos.desprendible && data.modulos.desprendible.length) {
                    desprendibleHTML = `
                    <div class="seccion-titulos">
                        <div class="titulo-seccion"><i class="fas fa-file-alt"></i> Desprendible</div>
                        <div class="contenido-titulo">
                            <div class="fila-titulo">
                                <span class="etiqueta-titulo">Estado:</span>
                                <span class="valor-titulo">${data.modulos.desprendible[0].estado_desprendible || 'No registrado'}</span>
                            </div>
                            <div class="fila-titulo">
                                <span class="etiqueta-titulo">Observación:</span>
                                <span class="valor-titulo">${data.modulos.desprendible[0].obs_desprendible || 'Sin observación'}</span>
                            </div>
                        </div>
                    </div>
                    `;
                } else {
                    desprendibleHTML = `
                    <div class="seccion-titulos">
                        <div class="titulo-seccion"><i class="fas fa-file-alt"></i> Desprendible</div>
                        <div class="contenido-titulo">
                            <div class="fila-titulo">
                                <span class="valor-titulo">Ninguno registrado aún</span>
                            </div>
                        </div>
                    </div>
                    `;
                }



                // Info de liquidador
                let liquidadorInfo = `
            <div class="seccion-titulos">
                <div class="titulo-seccion"><i class="fas fa-user-tie"></i> Liquidador</div>
                <div class="contenido-titulo">
                    <div class="fila-titulo"><span class="etiqueta-titulo">Nombre:</span> <span class="valor-titulo">${item.nombre_liquidador || 'No asignado'}</span></div>
                    <div class="fila-titulo"><span class="etiqueta-titulo">Teléfono:</span> <span class="valor-titulo">${item.telefono_liquidador || 'No disponible'}</span></div>
                    <div class="fila-titulo"><span class="etiqueta-titulo">Correo:</span> <span class="valor-titulo">${item.correo_liquidador || 'No disponible'}</span></div>
                    <div class="fila-titulo"><span class="etiqueta-titulo">Pago:</span> <span class="valor-titulo">${item.pago_liquidador || 'No'}</span></div>
                    <div class="fila-titulo"><span class="etiqueta-titulo">Valor:</span> <span class="valor-titulo">${item.valor_liquidador || 'No definido'}</span></div>
                </div>
            </div>
        `;






                insolvenciaTimeline.innerHTML += `
              <div class="evento-timeline ${claseEstado}">
                <div class="fecha-evento">Fecha de Ult. Modificación: ${formatearFechaHora(item.updated_at) || 'Pendiente'}</div>
                <div class="icono-evento"><i class="fas fa-file-invoice-dollar"></i></div>
                <div class="detalle-evento">
                    <div class="encabezado-embargo">
                        <span class="num-embargo">
                            Insolvencia #${item.id_insolvencia}
                        </span>
                      <span class="badge-estado ${estadoTerminacion.clase}">
                            <i class="fas ${estadoTerminacion.icono}"></i> ${estadoTerminacion.texto}
                        </span>
                    </div>

                    ${fechasHTML}
                    ${audienciasHTML}
                    ${desprendibleHTML}

                    <p><strong>Tipo de Proceso:</strong> ${item.tipo_proceso || 'No especificado'}</p>
                    <p><strong>Juzgado:</strong> ${item.juzgado || 'No especificado'}</p>

                    ${liquidadorInfo}

                     ${estadoTerminacion.texto === 'NO APTO' && item.motivo_insolvencia
                        ? `<div class="observacion-no-apto"><strong>Motivo:</strong> ${item.motivo_insolvencia}</div>`
                        : ''
                    }
                </div>
            </div>
        `;
                registrosInsolvencia++;
            });

            document.getElementById('contadorInsolvencia').textContent = `${registrosInsolvencia} ${registrosInsolvencia !== 1 ? 'procesos' : 'proceso'}`;
            totalRegistros += registrosInsolvencia;
        }
    }





    // Actualizar contadores
    if (document.getElementById('contador')) {
        document.getElementById('contador').textContent = totalRegistros;
    }

    // Mostrar toast de éxito
    if (totalRegistros > 0) {
        mostrarToast(`Búsqueda completada: ${totalRegistros} registros encontrados`, 'success');
    } else {
        mostrarToast('No se encontraron registros para esta cédula', 'info');
    }
}

// Función auxiliar para formatear fechas
function formatearFecha(fechaString) {
    if (!fechaString) return null;
    try {
        const fecha = new Date(fechaString);

        const dia = fecha.getDate(); // sin ceros a la izquierda
        const meses = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];
        const mes = meses[fecha.getMonth()];
        const anio = fecha.getFullYear();

        return `${dia} ${mes} del ${anio}`;
    } catch (e) {
        console.error('Error formateando fecha:', e);
        return null;
    }
}



// Función auxiliar para formatear fechas con hora
function formatearFechaHora(fechaString) {
    if (!fechaString) return null;
    try {
        const fecha = new Date(fechaString);
        return fecha.toLocaleString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    } catch (e) {
        console.error('Error formateando fecha y hora:', e);
        return null;
    }
}



// Función auxiliar para crear items de timeline
function crearItemTimeline(titulo, ...lineas) {
    const colorClass = lineas.pop() || 'primary';
    const fecha = lineas.pop() || '';

    let lineasHTML = lineas.map(linea =>
        `<small class="d-block text-muted">${linea}</small>`
    ).join('');

    if (fecha) {
        lineasHTML += `<small class="d-block mt-1"><i class="far fa-calendar-alt me-1"></i>${fecha}</small>`;
    }

    return `
        <li class="border-start-${colorClass}">
            <strong class="text-${colorClass}">${titulo}</strong>
            ${lineasHTML}
        </li>
    `;
}


function mostrarToast(mensaje, tipo = 'info') {
    // Implementación básica de toast - puedes usar Bootstrap Toast si lo prefieres
    const toast = document.createElement('div');
    toast.className = `toast show position-fixed bottom-0 end-0 mb-4 me-4 bg-${tipo} text-white`;
    toast.style.zIndex = '1100';
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${mensaje}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.parentNode.parentNode.remove()"></button>
        </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Event listener para tecla Enter
document.getElementById('cedulaInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        buscarPersona();
    }
});



$(document).on('click', '.foto-cliente', function () {
    const src = $(this).data('src');
    $('#imagen-modal').attr('src', src);

    const modal = new bootstrap.Modal(document.getElementById('modalFoto'));
    modal.show();
});