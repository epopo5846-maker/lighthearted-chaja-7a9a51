
/* =========================================================
   EDUMANAGE - SUPABASE DIRECTO DESDE JAVASCRIPT
   Consulta pública + administración privada.
   No utiliza Flask ni una API propia.
========================================================= */

/* =========================================================
   1. CONFIGURACIÓN
========================================================= */

const SUPABASE_URL = "https://yhbyalifccvjvukiuxol.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZGWciudvKLJvjvvhaLlbhA_bmmE4lN7";

const ADMIN_UID = "205a63d3-b5a8-4ec3-8876-cece194a96d5";

const createClient = window.supabase?.createClient;
const supabaseClient = createClient
    ? createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

/* =========================================================
   2. ESTADO DE LA APLICACIÓN
========================================================= */

let estudiantes = [];
let asistencias = {};
let asistenciaActual = {};
let esAdministrador = false;
let cargando = false;

/* =========================================================
   3. ELEMENTOS DEL DOM
========================================================= */

const $ = id => document.getElementById(id);

const loginScreen = $("loginScreen");
const appContainer = $("appContainer");
const loginForm = $("loginForm");
const loginError = $("loginError");
const loginButton = $("loginButton");
const logoutButton = $("logoutButton");

const formulario = $("studentForm");
const tablaEstudiantes = $("studentsTableBody");
const buscador = $("searchInput");
const filtroEstado = $("statusFilter");

const tablaAsistencia = $("attendanceTableBody");
const fechaAsistencia = $("attendanceDate");
const buscadorAsistencia = $("attendanceSearch");

const mensajeEstudiantes = $("emptyStudents");
const mensajeAsistencia = $("emptyAttendance");

const tituloModal = $("modalTitle");
const estadoConexion = $("connectionStatus");

const botonAgregar = $("addStudentButton");
const modalElemento = $("studentModal");

const modal = modalElemento && window.bootstrap?.Modal
    ? window.bootstrap.Modal.getOrCreateInstance(modalElemento)
    : null;

/* =========================================================
   4. FUNCIONES AUXILIARES
========================================================= */

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

function obtenerFechaLocal() {
    const fecha = new Date();

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
}

function obtenerIniciales(nombres, apellidos) {
    return (
        (nombres?.trim()?.[0] || "") +
        (apellidos?.trim()?.[0] || "")
    );
}

function mostrarError(error, contexto = "Ocurrió un error") {
    console.error(contexto, error);

    alert(
        `${contexto}:\n${error?.message || "Revisa la consola del navegador."}`
    );
}

function cambiarEstadoConexion(tipo, mensaje) {
    if (!estadoConexion) return;

    estadoConexion.classList.remove("connected", "error");

    if (tipo === "connected") {
        estadoConexion.classList.add("connected");
    }

    if (tipo === "error") {
        estadoConexion.classList.add("error");
    }

    estadoConexion.innerHTML =
        `<span class="connection-dot"></span>${escaparHTML(mensaje)}`;
}

function validarConfiguracion() {
    return (
        !!supabaseClient &&
        SUPABASE_URL.startsWith("https://") &&
        SUPABASE_KEY.startsWith("sb_publishable_") &&
        SUPABASE_KEY.length > 20
    );
}

/* =========================================================
   5. BOTONES DE ACCESO
========================================================= */


/* =========================================================
   5. BOTONES DE ACCESO
========================================================= */

// Botón para entrar al modo administrador.

const botonAccesoAdmin = document.createElement("button");

botonAccesoAdmin.type = "button";
botonAccesoAdmin.textContent = "Acceso administrador";
botonAccesoAdmin.className = "btn btn-outline-primary btn-sm";

document.querySelector(".topbar-right")?.appendChild(botonAccesoAdmin);


// Botón para entrar como estudiante.

const botonVolverPublico = document.createElement("button");

botonVolverPublico.type = "button";
botonVolverPublico.textContent = "Entrar como estudiante";
botonVolverPublico.className = "btn btn-outline-secondary btn-sm w-100";
botonVolverPublico.style.marginTop = "12px";
botonVolverPublico.style.display = "block";

if (loginForm) {
    loginForm.appendChild(botonVolverPublico);
}


/* =========================================================
   6. CONTROL DE INTERFAZ SEGÚN EL ROL
========================================================= */

function aplicarVisibilidadColumnas() {

    // Tabla de estudiantes.
    const tablaEstudiantesCompleta =
        tablaEstudiantes?.closest("table");

    const encabezadosEstudiantes =
        tablaEstudiantesCompleta?.querySelectorAll("thead th");

    encabezadosEstudiantes?.forEach((th, index) => {

        const ocultar =
            !esAdministrador && [0, 2, 5].includes(index);

        th.style.display = ocultar ? "none" : "";

    });

    tablaEstudiantes?.querySelectorAll("tr").forEach(fila => {

        fila.querySelectorAll("td").forEach((td, index) => {

            const ocultar =
                !esAdministrador && [0, 2, 5].includes(index);

            td.style.display = ocultar ? "none" : "";

        });

    });


    // Tabla de asistencia.
    const tablaAsistenciaCompleta =
        tablaAsistencia?.closest("table");

    const encabezadosAsistencia =
        tablaAsistenciaCompleta?.querySelectorAll("thead th");

    encabezadosAsistencia?.forEach((th, index) => {

        const ocultar =
            !esAdministrador && index === 0;

        th.style.display = ocultar ? "none" : "";

    });

    tablaAsistencia?.querySelectorAll("tr").forEach(fila => {

        fila.querySelectorAll("td").forEach((td, index) => {

            const ocultar =
                !esAdministrador && index === 0;

            td.style.display = ocultar ? "none" : "";

        });

    });

}


function configurarInterfazPorRol() {

    const elementosAdministrativos = [
        botonAgregar,
        $("markAllPresent"),
        $("saveAttendance"),
        $("exportPDF"),
        $("exportDOCX"),
        $("exportTXT"),
        logoutButton
    ];

    elementosAdministrativos.forEach(elemento => {

        if (elemento) {
            elemento.style.display = esAdministrador ? "" : "none";
        }

    });

    botonAccesoAdmin.style.display =
        esAdministrador ? "none" : "";

    botonVolverPublico.style.display = "none";

    aplicarVisibilidadColumnas();
}


function mostrarLogin() {

    if (appContainer) appContainer.hidden = true;
    if (loginScreen) loginScreen.hidden = false;

    botonVolverPublico.style.display = "block";
}


function mostrarPanel() {

    if (loginScreen) loginScreen.hidden = true;
    if (appContainer) appContainer.hidden = false;

    configurarInterfazPorRol();
}


async function verificarAdministrador(usuario) {

    return !!usuario && usuario.id === ADMIN_UID;

}


/* =========================================================
   7. AUTENTICACIÓN
========================================================= */

botonAccesoAdmin.addEventListener("click", mostrarLogin);


// Regresar al modo público.

botonVolverPublico.addEventListener("click", async () => {

    esAdministrador = false;

    loginForm?.reset();

    if (loginError) {
        loginError.textContent = "";
    }

    mostrarPanel();

    await iniciarDatosAplicacion();

});


// Inicio de sesión.

loginForm?.addEventListener("submit", async event => {

    event.preventDefault();

    if (!supabaseClient) {
        loginError.textContent = "Supabase no está disponible.";
        return;
    }

    loginError.textContent = "";

    loginButton.disabled = true;
    loginButton.textContent = "Verificando...";

    const email = $("loginEmail").value.trim();
    const password = $("loginPassword").value;

    try {

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

        if (error) throw error;

        const autorizado =
            await verificarAdministrador(data.user);

        if (!autorizado) {

            await supabaseClient.auth.signOut();

            throw new Error(
                "Esta cuenta no tiene autorización administrativa."
            );

        }

        esAdministrador = true;

        loginForm.reset();

        mostrarPanel();

        await iniciarDatosAplicacion();

    } catch (error) {

        console.error("Error de autenticación:", error);

        loginError.textContent =
            error.message || "No se pudo iniciar sesión.";

        mostrarLogin();

    } finally {

        loginButton.disabled = false;

        loginButton.innerHTML =
            '<i class="bi bi-box-arrow-in-right"></i> Iniciar sesión';

    }

});


// Cerrar sesión.

logoutButton?.addEventListener("click", async () => {

    if (!confirm("¿Está seguro de que desea cerrar sesión?")) {
        return;
    }

    try {

        const { error } =
            await supabaseClient.auth.signOut();

        if (error) throw error;

        esAdministrador = false;

        mostrarPanel();

        await iniciarDatosAplicacion();

    } catch (error) {

        mostrarError(error, "No se pudo cerrar la sesión");

    }

});


/* =========================================================
   8. NAVEGACIÓN
========================================================= */

const botonesNavegacion =
    document.querySelectorAll("[data-section]");

const secciones =
    document.querySelectorAll(".page-section");

const tituloPagina = $("pageTitle");


function cambiarSeccion(nombreSeccion) {

    secciones.forEach(seccion => {

        seccion.classList.toggle(
            "active",
            seccion.id === nombreSeccion
        );

    });

    botonesNavegacion.forEach(boton => {

        boton.classList.toggle(
            "active",
            boton.dataset.section === nombreSeccion
        );

    });

    const titulos = {
        dashboard: "Panel principal",
        students: "Estudiantes",
        attendance: "Control de asistencia"
    };

    if (tituloPagina) {
        tituloPagina.textContent =
            titulos[nombreSeccion] || "EduManage";
    }

    $("sidebar")?.classList.remove("show");

    if (nombreSeccion === "attendance") {
        cargarAsistenciaFecha();
    }

}


botonesNavegacion.forEach(boton => {

    boton.addEventListener("click", () => {
        cambiarSeccion(boton.dataset.section);
    });

});


document.querySelectorAll("[data-open-section]").forEach(boton => {

    boton.addEventListener("click", () => {
        cambiarSeccion(boton.dataset.openSection);
    });

});


/* =========================================================
   9. CONSULTAR ESTUDIANTES
========================================================= */

async function cargarEstudiantes() {

    let consulta;

    if (esAdministrador) {

        consulta = supabaseClient
            .from("estudiantes")
            .select(
                "id, matricula, nombres, apellidos, correo, telefono, carrera, estado"
            );

    } else {

        consulta = supabaseClient
            .from("vista_publica_estudiantes")
            .select("id, nombres, apellidos, carrera, estado");

    }

    const { data, error } = await consulta
        .order("apellidos", { ascending: true });

    if (error) throw error;

    estudiantes = data || [];

    mostrarEstudiantes();

    actualizarEstadisticas();

}


/* =========================================================
   10. MOSTRAR ESTUDIANTES
========================================================= */

function mostrarEstudiantes() {

    if (!tablaEstudiantes) return;

    const busqueda =
        (buscador?.value || "").toLowerCase().trim();

    const estadoSeleccionado =
        filtroEstado?.value || "Todos";


    const resultados = estudiantes.filter(estudiante => {

        const nombreCompleto =
            `${estudiante.nombres || ""} ${estudiante.apellidos || ""}`
                .toLowerCase();

        const coincideBusqueda =
            nombreCompleto.includes(busqueda) ||
            (estudiante.matricula || "").toLowerCase().includes(busqueda) ||
            (estudiante.correo || "").toLowerCase().includes(busqueda);

        const coincideEstado =
            estadoSeleccionado === "Todos" ||
            estudiante.estado === estadoSeleccionado;

        return coincideBusqueda && coincideEstado;

    });


    tablaEstudiantes.innerHTML = "";


    if (resultados.length === 0) {

        if (mensajeEstudiantes) {
            mensajeEstudiantes.style.display = "block";
        }

        tablaEstudiantes.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    No se encontraron estudiantes.
                </td>
            </tr>
        `;

        $("recordsCounter").textContent = "0 registros";

        aplicarVisibilidadColumnas();

        return;

    }


    if (mensajeEstudiantes) {
        mensajeEstudiantes.style.display = "none";
    }


    resultados.forEach(estudiante => {

        const fila = document.createElement("tr");

        const nombre =
            `${estudiante.nombres || ""} ${estudiante.apellidos || ""}`;

        const estado = estudiante.estado || "";


        if (esAdministrador) {

            fila.innerHTML = `
                <td>${escaparHTML(estudiante.matricula)}</td>

                <td>
                    <div class="student-info">
                        <strong>${escaparHTML(nombre)}</strong>
                        <small>${escaparHTML(estudiante.telefono)}</small>
                    </div>
                </td>

                <td>${escaparHTML(estudiante.correo)}</td>

                <td>${escaparHTML(estudiante.carrera)}</td>

                <td>
                    <span class="status-badge ${escaparHTML(estado.toLowerCase())}">
                        ${escaparHTML(estado)}
                    </span>
                </td>

                <td>
                    <div class="action-buttons">

                        <button
                            type="button"
                            class="btn btn-sm btn-outline-primary"
                            data-action="edit"
                            data-id="${escaparHTML(estudiante.id)}">
                            Editar
                        </button>

                        <button
                            type="button"
                            class="btn btn-sm btn-outline-danger"
                            data-action="delete"
                            data-id="${escaparHTML(estudiante.id)}">
                            Eliminar
                        </button>

                    </div>
                </td>
            `;

        } else {

            // Se conservan las seis celdas para mantener
            // la estructura de la tabla HTML.
            // Las columnas privadas se ocultan después.

            fila.innerHTML = `
                <td></td>

                <td>
                    <div class="student-info">
                        <strong>${escaparHTML(nombre)}</strong>
                    </div>
                </td>

                <td></td>

                <td>${escaparHTML(estudiante.carrera)}</td>

                <td>
                    <span class="status-badge ${escaparHTML(estado.toLowerCase())}">
                        ${escaparHTML(estado)}
                    </span>
                </td>

                <td></td>
            `;

        }

        tablaEstudiantes.appendChild(fila);

    });


    $("recordsCounter").textContent =
        `${resultados.length} registros`;

    aplicarVisibilidadColumnas();

}


/* =========================================================
   11. ESTADÍSTICAS GENERALES
========================================================= */

function actualizarEstadisticas() {

    if ($("totalStudents")) {
        $("totalStudents").textContent = estudiantes.length;
    }

    if ($("activeStudents")) {

        $("activeStudents").textContent =
            estudiantes.filter(e => e.estado === "Activo").length;

    }

    if ($("attendanceRecords")) {

        $("attendanceRecords").textContent =
            Object.values(asistencias).reduce(
                (total, rows) => total + rows.length,
                0
            );

    }

}


/* =========================================================
   12. REGISTRAR Y EDITAR ESTUDIANTES
========================================================= */

function limpiarFormulario() {

    formulario?.reset();

    $("studentId").value = "";

    if (tituloModal) {
        tituloModal.textContent = "Registrar estudiante";
    }

}


botonAgregar?.addEventListener("click", () => {

    if (!esAdministrador) return;

    limpiarFormulario();

    modal?.show();

});


modalElemento?.addEventListener(
    "hidden.bs.modal",
    limpiarFormulario
);


formulario?.addEventListener("submit", async event => {

    event.preventDefault();

    if (!esAdministrador) {
        alert("No tienes permisos para realizar esta operación.");
        return;
    }

    const id = $("studentId").value;

    const estudiante = {

        matricula: $("matricula").value.trim(),

        nombres: $("nombres").value.trim(),

        apellidos: $("apellidos").value.trim(),

        correo: $("correo").value.trim().toLowerCase(),

        telefono: $("telefono").value.trim(),

        carrera: $("carrera").value,

        estado: $("estado").value

    };


    const matriculaDuplicada = estudiantes.some(e =>
        (e.matricula || "").toLowerCase() ===
        estudiante.matricula.toLowerCase() &&
        e.id !== id
    );

    if (matriculaDuplicada) {

        alert("Esta matrícula ya se encuentra registrada.");
        return;

    }


    const correoDuplicado = estudiantes.some(e =>
        (e.correo || "").toLowerCase() ===
        estudiante.correo &&
        e.id !== id
    );

    if (correoDuplicado) {

        alert("Este correo electrónico ya se encuentra registrado.");
        return;

    }


    const botonGuardar =
        formulario.querySelector('button[type="submit"]');

    botonGuardar.disabled = true;


    try {

        let resultado;

        if (id) {

            resultado = await supabaseClient
                .from("estudiantes")
                .update(estudiante)
                .eq("id", id);

        } else {

            resultado = await supabaseClient
                .from("estudiantes")
                .insert(estudiante);

        }

        if (resultado.error) throw resultado.error;


        await cargarEstudiantes();

        await cargarAsistenciaFecha();

        modal?.hide();

        limpiarFormulario();

        alert(
            id
                ? "Estudiante actualizado correctamente."
                : "Estudiante registrado correctamente."
        );


    } catch (error) {

        mostrarError(error, "No se pudo guardar el estudiante");

    } finally {

        botonGuardar.disabled = false;

    }

});


function editarEstudiante(id) {

    if (!esAdministrador) return;

    const estudiante =
        estudiantes.find(e => e.id === id);

    if (!estudiante) {
        alert("No se encontró el estudiante.");
        return;
    }

    $("studentId").value = estudiante.id;
    $("matricula").value = estudiante.matricula || "";
    $("nombres").value = estudiante.nombres || "";
    $("apellidos").value = estudiante.apellidos || "";
    $("correo").value = estudiante.correo || "";
    $("telefono").value = estudiante.telefono || "";
    $("carrera").value = estudiante.carrera || "";
    $("estado").value = estudiante.estado || "";

    tituloModal.textContent = "Actualizar estudiante";

    modal?.show();

}


async function eliminarEstudiante(id) {

    if (!esAdministrador) return;

    const estudiante =
        estudiantes.find(e => e.id === id);

    if (!estudiante) {
        alert("No se encontró el estudiante.");
        return;
    }

    const confirmar = confirm(
        `¿Deseas eliminar a ${estudiante.nombres} ${estudiante.apellidos}?\nTambién se eliminarán sus registros de asistencia.`
    );

    if (!confirmar) return;


    try {

        const { error } = await supabaseClient
            .from("estudiantes")
            .delete()
            .eq("id", id);

        if (error) throw error;

        await cargarEstudiantes();

        await cargarAsistenciaFecha();

        alert(
            "Estudiante eliminado correctamente."
        );

    } catch (error) {

        mostrarError(error, "No se pudo eliminar el estudiante");

    }

}


// Eventos de los botones de la tabla.

tablaEstudiantes?.addEventListener("click", event => {

    const boton = event.target.closest("button[data-action]");

    if (!boton || !esAdministrador) return;

    const id = boton.dataset.id;

    if (boton.dataset.action === "edit") {
        editarEstudiante(id);
    }

    if (boton.dataset.action === "delete") {
        eliminarEstudiante(id);
    }

});


buscador?.addEventListener("input", mostrarEstudiantes);

filtroEstado?.addEventListener("change", mostrarEstudiantes);


/* =========================================================
   13. CONSULTAR ASISTENCIA POR FECHA
========================================================= */

async function cargarAsistenciaFecha() {

    const fecha = fechaAsistencia?.value;

    if (!fecha || cargando) return;

    cargando = true;

    try {

        let consulta;

        if (esAdministrador) {

            consulta = supabaseClient
                .from("asistencias")
                .select("id, estudiante_id, fecha, estado, observacion")
                .eq("fecha", fecha);

        } else {

            consulta = supabaseClient
                .from("vista_publica_asistencias")
                .select("estudiante_id, fecha, estado")
                .eq("fecha", fecha);

        }


        const { data, error } = await consulta;

        if (error) throw error;


        asistenciaActual = {};

        (data || []).forEach(registro => {

            asistenciaActual[registro.estudiante_id] =
                registro.estado;

        });


        asistencias[fecha] = data || [];

        mostrarAsistencia();

        if ($("attendanceStatus")) {

            $("attendanceStatus").textContent = data?.length
                ? "Registros recuperados desde Supabase."
                : "No hay registros guardados para esta fecha.";

        }

        actualizarEstadisticas();

    } catch (error) {

        mostrarError(error, "No se pudo consultar la asistencia");

    } finally {

        cargando = false;

    }

}


/* =========================================================
   14. MOSTRAR ASISTENCIA
========================================================= */

function mostrarAsistencia() {

    if (!tablaAsistencia) return;

    const busqueda =
        (buscadorAsistencia?.value || "").toLowerCase().trim();


    const activos = estudiantes.filter(
        estudiante => estudiante.estado === "Activo"
    );


    const resultados = activos.filter(estudiante => {

        const nombre =
            `${estudiante.nombres || ""} ${estudiante.apellidos || ""}`
                .toLowerCase();

        const matricula =
            (estudiante.matricula || "").toLowerCase();

        return (
            nombre.includes(busqueda) ||
            (esAdministrador && matricula.includes(busqueda))
        );

    });


    tablaAsistencia.innerHTML = "";


    if (resultados.length === 0) {

        if (mensajeAsistencia) {
            mensajeAsistencia.style.display = "block";
        }

        tablaAsistencia.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">
                    No hay estudiantes para mostrar.
                </td>
            </tr>
        `;

        actualizarEstadisticasAsistencia();

        aplicarVisibilidadColumnas();

        return;

    }


    if (mensajeAsistencia) {
        mensajeAsistencia.style.display = "none";
    }


    resultados.forEach(estudiante => {

        const estado =
            asistenciaActual[estudiante.id] || "Sin registrar";

        const fila = document.createElement("tr");

        const nombre =
            `${estudiante.nombres || ""} ${estudiante.apellidos || ""}`;

        const iniciales =
            obtenerIniciales(estudiante.nombres, estudiante.apellidos);


        if (esAdministrador) {

            fila.innerHTML = `

                <td>
                    <strong>
                        ${escaparHTML(estudiante.matricula)}
                    </strong>
                </td>

                <td>

                    <div class="student-info">

                        <div class="student-avatar">
                            ${escaparHTML(iniciales)}
                        </div>

                        <span class="student-name">
                            ${escaparHTML(nombre)}
                        </span>

                    </div>

                </td>

                <td>
                    ${escaparHTML(estudiante.carrera)}
                </td>

                <td>

                    <select
                        class="attendance-select"
                        data-student-id="${escaparHTML(estudiante.id)}">

                        <option value="Sin registrar"
                            ${estado === "Sin registrar" ? "selected" : ""}>
                            Sin registrar
                        </option>

                        <option value="Presente"
                            ${estado === "Presente" ? "selected" : ""}>
                            Presente
                        </option>

                        <option value="Ausente"
                            ${estado === "Ausente" ? "selected" : ""}>
                            Ausente
                        </option>

                        <option value="Tardanza"
                            ${estado === "Tardanza" ? "selected" : ""}>
                            Tardanza
                        </option>

                        <option value="Excusa"
                            ${estado === "Excusa" ? "selected" : ""}>
                            Excusa
                        </option>

                    </select>

                </td>

            `;

        } else {

            // Se conserva la primera celda vacía para
            // mantener la estructura de cuatro columnas.

            fila.innerHTML = `

                <td></td>

                <td>

                    <div class="student-info">

                        <div class="student-avatar">
                            ${escaparHTML(iniciales)}
                        </div>

                        <span class="student-name">
                            ${escaparHTML(nombre)}
                        </span>

                    </div>

                </td>

                <td>
                    ${escaparHTML(estudiante.carrera)}
                </td>

                <td>
                    <span class="status-badge">
                        ${escaparHTML(estado)}
                    </span>
                </td>

            `;

        }


        tablaAsistencia.appendChild(fila);

    });


    actualizarEstadisticasAsistencia();

    aplicarVisibilidadColumnas();

}


/* =========================================================
   15. CAMBIOS EN LA ASISTENCIA
========================================================= */

tablaAsistencia?.addEventListener("change", event => {

    if (!esAdministrador) return;

    const selector =
        event.target.closest(".attendance-select");

    if (!selector) return;

    const id = selector.dataset.studentId;

    if (selector.value === "Sin registrar") {

        delete asistenciaActual[id];

    } else {

        asistenciaActual[id] = selector.value;

    }

    $("attendanceStatus").textContent =
        "Tienes cambios pendientes por guardar.";

    actualizarEstadisticasAsistencia();

});


function actualizarEstadisticasAsistencia() {

    const total =
        estudiantes.filter(e => e.estado === "Activo").length;

    const estados =
        Object.values(asistenciaActual);

    const presentes =
        estados.filter(e => e === "Presente").length;

    const ausentes =
        estados.filter(e => e === "Ausente").length;

    const tardanzas =
        estados.filter(e => e === "Tardanza").length;

    const excusas =
        estados.filter(e => e === "Excusa").length;

    const registrados =
        presentes + ausentes + tardanzas + excusas;


    if ($("dayTotal")) {
        $("dayTotal").textContent = total;
    }

    if ($("dayPresent")) {
        $("dayPresent").textContent = presentes;
    }

    if ($("dayAbsent")) {
        $("dayAbsent").textContent = ausentes;
    }

    if ($("dayLate")) {
        $("dayLate").textContent = tardanzas;
    }

    if ($("attendanceCounter")) {

        $("attendanceCounter").textContent =
            `${registrados} de ${total} registrados`;

    }

    if ($("attendanceDescription")) {

        $("attendanceDescription").textContent =
            `Presentes: ${presentes} · Ausentes: ${ausentes} · Tardanzas: ${tardanzas} · Excusas: ${excusas}`;

    }

}


fechaAsistencia?.addEventListener(
    "change",
    cargarAsistenciaFecha
);

buscadorAsistencia?.addEventListener(
    "input",
    mostrarAsistencia
);


/* =========================================================
   16. MARCAR TODOS COMO PRESENTES
========================================================= */

$("markAllPresent")?.addEventListener("click", () => {

    if (!esAdministrador) return;

    if (!confirm(
        "¿Deseas marcar a todos los estudiantes activos como presentes?"
    )) {
        return;
    }

    estudiantes
        .filter(e => e.estado === "Activo")
        .forEach(e => {

            asistenciaActual[e.id] = "Presente";

        });

    mostrarAsistencia();

    $("attendanceStatus").textContent =
        "Tienes cambios pendientes por guardar.";

});


/* =========================================================
   17. GUARDAR ASISTENCIA EN SUPABASE
========================================================= */

$("saveAttendance")?.addEventListener("click", async () => {

    if (!esAdministrador) return;

    const fecha = fechaAsistencia.value;

    if (!fecha) {
        alert("Debes seleccionar una fecha.");
        return;
    }


    const activos =
        estudiantes.filter(e => e.estado === "Activo");

    const pendientes =
        activos.filter(e => !asistenciaActual[e.id]);


    if (
        pendientes.length &&
        !confirm(
            `Hay ${pendientes.length} estudiantes sin registrar. Se guardarán solo los que tienen un estado seleccionado. ¿Deseas continuar?`
        )
    ) {
        return;
    }


    const registros = activos
        .filter(e => asistenciaActual[e.id])
        .map(e => ({

            estudiante_id: e.id,
            fecha,
            estado: asistenciaActual[e.id],
            observacion: null

        }));


    const boton = $("saveAttendance");

    boton.disabled = true;


    try {

        // Guardar o actualizar los registros seleccionados.

        if (registros.length) {

            const { error } = await supabaseClient
                .from("asistencias")
                .upsert(registros, {
                    onConflict: "estudiante_id,fecha"
                });

            if (error) throw error;

        }


        // Eliminar registros que se cambiaron a
        // "Sin registrar".

        const idsSinRegistro = activos
            .filter(e => !asistenciaActual[e.id])
            .map(e => e.id);


        if (idsSinRegistro.length) {

            const { error } = await supabaseClient
                .from("asistencias")
                .delete()
                .eq("fecha", fecha)
                .in("estudiante_id", idsSinRegistro);

            if (error) throw error;

        }


        await cargarAsistenciaFecha();

        $("attendanceStatus").textContent =
            "Asistencia guardada correctamente en Supabase.";

        alert("La asistencia del día se guardó correctamente.");


    } catch (error) {

        mostrarError(error, "No se pudo guardar la asistencia");

    } finally {

        boton.disabled = false;

    }

});


/* =========================================================
   18. EXPORTAR ASISTENCIA
========================================================= */

function obtenerFilasExportacion() {

    if (!esAdministrador) return [];

    return estudiantes

        .filter(e => e.estado === "Activo")

        .map(e => ({

            matricula: e.matricula || "",
            nombre: `${e.nombres} ${e.apellidos}`,
            carrera: e.carrera || "",
            estado: asistenciaActual[e.id] || "Sin registrar"

        }));

}


function textoExportacion() {

    const fecha = fechaAsistencia.value;

    const filas = obtenerFilasExportacion();

    const lineas = [

        "EDUMANAGE - REGISTRO DE ASISTENCIA",
        `Fecha: ${fecha}`,
        `Total de estudiantes activos: ${filas.length}`,
        "",
        "MATRÍCULA | ESTUDIANTE | CARRERA | ASISTENCIA",

        ...filas.map(f =>
            `${f.matricula} | ${f.nombre} | ${f.carrera} | ${f.estado}`
        )

    ];

    return lineas.join("\n");

}


function descargarBlob(blob, nombre) {

    const url = URL.createObjectURL(blob);

    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = nombre;

    document.body.appendChild(enlace);

    enlace.click();

    enlace.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

}


/* =========================================================
   19. EXPORTAR TXT
========================================================= */

$("exportTXT")?.addEventListener("click", () => {

    if (!esAdministrador) return;

    const blob = new Blob(
        ["\ufeff" + textoExportacion()],
        { type: "text/plain;charset=utf-8" }
    );

    descargarBlob(
        blob,
        `asistencia-${fechaAsistencia.value}.txt`
    );

});


/* =========================================================
   20. EXPORTAR PDF
========================================================= */

$("exportPDF")?.addEventListener("click", () => {

    if (!esAdministrador) return;

    if (!window.jspdf?.jsPDF) {

        alert(
            "No se pudo cargar la biblioteca PDF. Comprueba tu conexión a Internet."
        );

        return;

    }

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF();

    const filas = obtenerFilasExportacion();


    pdf.setFontSize(16);

    pdf.text(
        "EduManage - Registro de asistencia",
        14,
        18
    );

    pdf.setFontSize(10);

    pdf.text(
        `Fecha: ${fechaAsistencia.value}`,
        14,
        26
    );


    let y = 36;

    const columnas = [
        "MATRÍCULA",
        "ESTUDIANTE",
        "CARRERA",
        "ASISTENCIA"
    ];

    const anchos = [35, 58, 58, 35];

    let x = 14;


    pdf.setFont(undefined, "bold");

    columnas.forEach((col, i) => {

        pdf.text(col, x, y);

        x += anchos[i];

    });


    pdf.setFont(undefined, "normal");

    y += 8;


    filas.forEach(f => {

        const valores = [
            f.matricula,
            f.nombre,
            f.carrera,
            f.estado
        ];

        const lineas = valores.map((valor, i) =>
            pdf.splitTextToSize(
                String(valor),
                anchos[i] - 3
            )
        );

        const altura =
            Math.max(...lineas.map(linea => linea.length)) * 5;

        if (y + altura > 275) {

            pdf.addPage();

            y = 20;

        }

        x = 14;

        lineas.forEach((texto, i) => {

            pdf.text(texto, x, y);

            x += anchos[i];

        });

        y += altura + 4;

    });


    pdf.save(
        `asistencia-${fechaAsistencia.value}.pdf`
    );

});


/* =========================================================
   21. EXPORTAR DOCX
========================================================= */

$("exportDOCX")?.addEventListener("click", async () => {

    if (!esAdministrador) return;

    if (!window.docx) {

        alert(
            "No se pudo cargar la biblioteca DOCX. Comprueba tu conexión a Internet."
        );

        return;

    }


    try {

        const {
            Document,
            Packer,
            Paragraph,
            TextRun,
            HeadingLevel
        } = window.docx;

        const filas = obtenerFilasExportacion();


        const contenido = [

            new Paragraph({

                text: "EduManage - Registro de asistencia",

                heading: HeadingLevel.HEADING_1

            }),

            new Paragraph({

                children: [

                    new TextRun({

                        text: `Fecha: ${fechaAsistencia.value}`,

                        bold: true

                    })

                ]

            }),

            new Paragraph({ text: "" }),

            new Paragraph({

                children: [

                    new TextRun({

                        text: "MATRÍCULA | ESTUDIANTE | CARRERA | ASISTENCIA",

                        bold: true

                    })

                ]

            }),

            ...filas.map(f => new Paragraph({

                text:
                    `${f.matricula} | ${f.nombre} | ${f.carrera} | ${f.estado}`

            }))

        ];


        const documento = new Document({

            sections: [

                { children: contenido }

            ]

        });


        const blob = await Packer.toBlob(documento);

        descargarBlob(
            blob,
            `asistencia-${fechaAsistencia.value}.docx`
        );


    } catch (error) {

        mostrarError(error, "No se pudo generar el documento DOCX");

    }

});


/* =========================================================
   22. FECHA Y MENÚ
========================================================= */

if ($("currentDate")) {

    $("currentDate").textContent =
        new Date().toLocaleDateString("es-DO", {

            day: "numeric",
            month: "long",
            year: "numeric"

        });

}


$("menuToggle")?.addEventListener("click", () => {

    $("sidebar")?.classList.toggle("show");

});


document.addEventListener("click", event => {

    const sidebar = $("sidebar");

    const menuToggle = $("menuToggle");

    if (
        window.innerWidth <= 768 &&
        sidebar &&
        menuToggle &&
        !sidebar.contains(event.target) &&
        !menuToggle.contains(event.target)
    ) {

        sidebar.classList.remove("show");

    }

});


/* =========================================================
   23. CARGAR LOS DATOS DE EDUMANAGE
========================================================= */

async function iniciarDatosAplicacion() {

    if (!supabaseClient) {

        cambiarEstadoConexion(
            "error",
            "Supabase no está disponible"
        );

        return;

    }


    fechaAsistencia.value = obtenerFechaLocal();


    try {

        cambiarEstadoConexion(
            "pending",
            "Conectando..."
        );


        await cargarEstudiantes();

        await cargarAsistenciaFecha();


        cambiarEstadoConexion(
            "connected",
            "Conectado a Supabase"
        );


    } catch (error) {

        cambiarEstadoConexion(
            "error",
            "Error de conexión"
        );

        mostrarError(
            error,
            "No se pudo cargar EduManage"
        );

    }

}


/* =========================================================
   24. INICIO DE LA APLICACIÓN
========================================================= */

async function iniciarAplicacion() {

    if (!validarConfiguracion()) {

        cambiarEstadoConexion(
            "error",
            "Falta configurar Supabase"
        );

        if (loginError) {

            loginError.textContent =
                "La configuración de Supabase no es válida.";

        }

        mostrarLogin();

        return;

    }


    try {

        const { data, error } =
            await supabaseClient.auth.getSession();

        if (error) throw error;


        const usuario = data.session?.user;


        // Si existe una sesión, comprobar si pertenece
        // al administrador autorizado.

        if (usuario) {

            const autorizado =
                await verificarAdministrador(usuario);

            if (autorizado) {

                esAdministrador = true;

            } else {

                await supabaseClient.auth.signOut();

                esAdministrador = false;

            }

        } else {

            esAdministrador = false;

        }


        // Si no hay administrador autenticado,
        // iniciar directamente en consulta pública.

        mostrarPanel();

        await iniciarDatosAplicacion();


    } catch (error) {

        console.error(
            "Error al iniciar la aplicación:",
            error
        );

        esAdministrador = false;

        mostrarPanel();

        cambiarEstadoConexion(
            "error",
            "Error al verificar la sesión"
        );

        if (loginError) {

            loginError.textContent =
                "No se pudo verificar la sesión.";

        }

    }

}


/* =========================================================
   25. EJECUTAR EDUMANAGE
========================================================= */

iniciarAplicacion();
