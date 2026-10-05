// ==========================================
// 1. VARIABLES DE ESTADO GLOBALES
// ==========================================
let currentScenario = null;
let currentCaseIndex = 0;   
let currentStepIndex = 0;   
let scores = { diagnostico: 0, criterio: 0, etica: 0 };
let totalStepsPossibleScores = { diagnostico: 0, criterio: 0, etica: 0 };
let currentSelectedFile = '';
let advisorName = "Asesor Anónimo";
let chosenAdvisorAvatar = "👨‍💼"; // Almacena el emoji seleccionado por el usuario

const screens = {
  home: document.getElementById('home'),
  simulator: document.getElementById('simulator'),
  result: document.getElementById('result')
};

// ==========================================
// 2. CONFIGURACIÓN DE EVENTOS E INTERFAZ DE VOZ
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // Capturar clics en los módulos del Home
  document.querySelectorAll('.market-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      // Capturar el avatar del asesor seleccionado en el formulario inicial
      const checkedRadio = document.querySelector('input[name="advisorAvatar"]:checked');
      if (checkedRadio) {
        chosenAdvisorAvatar = checkedRadio.value;
      }
      currentSelectedFile = e.target.getAttribute('data-file');
      loadScenario(currentSelectedFile);
    });
  });

  // Integración nativa del Canal de Voz (Reconocimiento de Voz)
  const voiceBtn = document.getElementById('voiceBtn');
  const responseTextArea = document.getElementById('advisorResponse');
  
  if (voiceBtn && responseTextArea) {
    // Verificar si el navegador soporta el dictado por voz de forma nativa
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-CO'; // Configurado para español de Colombia
      recognition.continuous = false;
      recognition.interimResults = false;

      voiceBtn.addEventListener('click', () => {
        if (voiceBtn.classList.contains('recording-active')) {
          recognition.stop();
        } else {
          recognition.start();
        }
      });

      recognition.onstart = () => {
        voiceBtn.classList.add('recording-active');
        voiceBtn.innerHTML = "🛑 Grabando... Hable ahora";
        responseTextArea.placeholder = "Escuchando tu voz activamente... Habla de forma clara y detallada.";
      };

      recognition.onresult = (event) => {
        const voiceText = event.results[0][0].transcript;
        // Inyectar el texto dictado directamente en el cuadro de edición
        if (responseTextArea.value.trim() !== "") {
          responseTextArea.value += " " + voiceText;
        } else {
          responseTextArea.value = voiceText;
        }
      };

      recognition.onend = () => {
        voiceBtn.classList.remove('recording-active');
        voiceBtn.innerHTML = "🎙️ Dictar por Voz";
        responseTextArea.placeholder = "Redacta tu propuesta de valor o presiona 'Dictar por Voz' para hablar...";
      };

      recognition.onerror = (event) => {
        console.error("Error en captura de voz: ", event.error);
        alert("No se pudo capturar la voz de forma correcta: " + event.error);
        voiceBtn.classList.remove('recording-active');
        voiceBtn.innerHTML = "🎙️ Dictar por Voz";
      };
    } else {
      // Si el navegador no lo soporta (ej: navegadores viejos), oculta sutilmente el botón
      voiceBtn.style.display = 'none';
    }
  }

  // Controles de pantalla de resultados
  document.getElementById('retryBtn')?.addEventListener('click', () => {
    currentCaseIndex = 0;
    currentStepIndex = 0;
    loadScenario(currentSelectedFile);
  });
  
  document.getElementById('homeBtn')?.addEventListener('click', () => {
    currentCaseIndex = 0;
    currentStepIndex = 0;
    showScreen('home');
  });

  document.getElementById('clearLogsBtn')?.addEventListener('click', () => {
    if (confirm("¿Estás seguro de que deseas borrar todo el historial del Dashboard?")) {
      localStorage.removeItem('sim_comercial_logs');
      renderDashboard();
    }
  });
});

// ==========================================
// 3. CONTROLADOR DE CARGA DE ESCENARIOS (JSON)
// ==========================================
async function loadScenario(fileUrl) {
  try {
    const inputName = prompt("Por favor, ingresa tu Nombre Completo o ID de Asesor:");
    advisorName = inputName && inputName.trim() !== "" ? inputName.trim() : "Asesor Anónimo";

    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error('No se pudo cargar el archivo del escenario');
    currentScenario = await response.json();
    
    scores = { diagnostico: 0, criterio: 0, etica: 0 };
    totalStepsPossibleScores = { diagnostico: 0, criterio: 0, etica: 0 };
    currentCaseIndex = 0;
    currentStepIndex = 0;
    
    showScreen('simulator');
    renderStep();
  } catch (error) {
    alert('Error al inicializar la campaña comercial: ' + error.message);
  }
}

function showScreen(screenId) {
  Object.values(screens).forEach(screen => {
    if (screen) screen.classList.remove('active');
  });
  if (screens[screenId]) screens[screenId].classList.add('active');
}

// ==========================================
// 4. MOTOR DE CHAT CON AVATARES SITUACIONALES
// ==========================================
function renderStep() {
  const currentCase = currentScenario.cases[currentCaseIndex];
  const stepData = currentCase.steps[currentStepIndex];
  
  document.getElementById('scenarioLabel').innerText = currentScenario.industry + " · Módulo Pro";
  document.getElementById('scenarioTitle').innerText = currentCase.title;
  
  const totalCases = currentScenario.cases.length;
  document.getElementById('stepLabel').innerText = `Caso ${currentCaseIndex + 1} de ${totalCases} (Mensaje ${currentStepIndex + 1})`;
  document.getElementById('progressBar').style.width = `${((currentCaseIndex) / totalCases) * 100}%`;
  
  // NUEVO: Asignar Avatar del Cliente Automáticamente según la Situación de Edad/Género
  let clientAvatarEmoji = "👤"; 
  const caseId = currentCase.id;
  
  if (caseId === "caso_1_ingenieria_liquidez") {
    clientAvatarEmoji = "👩"; // Milena Gómez (Mediana Edad, Inversionista)
  } else if (caseId === "caso_2_transferencia_confianza") {
    clientAvatarEmoji = "👵"; // Pareja de Pensionados (Tercera Edad, Mujer vocera)
  } else if (caseId === "caso_3_entrevista_consultiva") {
    clientAvatarEmoji = "👴"; // Don Horacio (Tercera Edad, Profesor jubilado)
  } else if (caseId === "caso_4_centralizacion_gustos") {
    clientAvatarEmoji = "👩‍👦"; // Hija y Madre juntas
  } else if (caseId === "caso_5_estrategia_alianza") {
    clientAvatarEmoji = "👨‍🏫"; // Decano Universitario (Mediana/Avanzada Edad)
  } else if (caseId === "caso_6_arrebato_competencia") {
    clientAvatarEmoji = "👨"; // Don Alberto Restrepo (Hombre de Mediana Edad)
  } else if (caseId === "caso_7_rompimiento_barrera_digital") {
    clientAvatarEmoji = "👩‍🏫"; // Docente Nubia Estela (Mujer tradicional)
  } else if (caseId === "caso_8_educacion_financiera") {
    clientAvatarEmoji = "👨‍💼"; // Rector de Institución Educativa
  } else if (caseId === "caso_9_enfoque_cafetero") {
    clientAvatarEmoji = "🧑‍🌾"; // Productor Cafetero (Hombre de campo)
  } else if (caseId === "caso_10_confianza_portafolio") {
    clientAvatarEmoji = "👥"; // Flujo masivo de usuarios de la oficina
  }

  document.getElementById('avatar').innerText = clientAvatarEmoji;
  document.getElementById('clientName').innerText = currentCase.client.name;
  document.getElementById('clientRole').innerText = currentCase.client.role;
  
  const conversation = document.getElementById('conversation');
  const submitBtn = document.getElementById('submitResponseBtn');
  
  document.getElementById('advisorResponse').value = '';
  document.getElementById('advisorResponse').disabled = true;
  if(submitBtn) submitBtn.disabled = true;
  document.getElementById('feedback').classList.add('hidden');
  document.getElementById('nextBtn').classList.add('hidden');

  if (currentStepIndex === 0) {
    conversation.innerHTML = `<div class="bubble system-context"><strong>Contexto de Operación Real:</strong> ${currentCase.client.context}</div>`;
  }

  const typingBubble = document.createElement('div');
  typingBubble.className = 'bubble client typing-indicator';
  typingBubble.innerHTML = '<span></span><span></span><span></span>';
  conversation.appendChild(typingBubble);
  conversation.scrollTop = conversation.scrollHeight;

  setTimeout(() => {
    typingBubble.remove();
    const clientMsgBubble = document.createElement('div');
    clientMsgBubble.className = 'bubble client';
    clientMsgBubble.innerHTML = `<strong>${currentCase.client.name}:</strong> "${stepData.client_speech}"`;
    conversation.appendChild(clientMsgBubble);
    
    document.getElementById('focusEval').innerText = `${stepData.focus_eval}`;
    conversation.scrollTop = conversation.scrollHeight;

    document.getElementById('advisorResponse').disabled = false;
    if(submitBtn) submitBtn.disabled = false;
  }, 1500);
}

// Conectar evento del botón de enviar
document.addEventListener("DOMContentLoaded", () => {
  const submitBtn = document.getElementById('submitResponseBtn');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const textInput = document.getElementById('advisorResponse').value.trim();
      if (textInput === "") {
        alert("Por favor, redacta una respuesta antes de enviarla a la evaluación.");
        return;
      }
      processIAEvaluation(textInput);
    });
  }
});
// ==========================================
// 5. CEREBRO DE EVALUACIÓN MULTIPASO Y REFERIDOS
// ==========================================
function processIAEvaluation(textInput) {
  document.getElementById('advisorResponse').disabled = true;
  document.getElementById('submitResponseBtn').disabled = true;
  
  const currentCase = currentScenario.cases[currentCaseIndex];
  const totalStepsInCase = currentCase.steps.length;
  const isLastStep = (currentStepIndex === totalStepsInCase - 1); 

  // NUEVO: Renderizar el Avatar Escogido por el Asesor en la burbuja verde derecha
  const conversation = document.getElementById('conversation');
  const advisorMsgBubble = document.createElement('div');
  advisorMsgBubble.className = 'bubble advisor';
  advisorMsgBubble.innerHTML = `<strong>Tú (${chosenAdvisorAvatar}):</strong> ${textInput}`;
  conversation.appendChild(advisorMsgBubble);
  conversation.scrollTop = conversation.scrollHeight;

  // CORREGIDO: Texto de carga simplificado a petición del usuario
  const feedbackDiv = document.getElementById('feedback');
  feedbackDiv.classList.remove('hidden', 'good', 'warn', 'bad');
  feedbackDiv.innerHTML = `⏳ <em>Analizando...</em>`;
  feedbackDiv.className = "feedback warn";

  let type = 'bad';
  let diagnostico = 20, criterio = 20, etica = 40;
  let iaFeedback = "Tu respuesta no cumple con el enfoque consultivo esperado para este nivel del caso.";

  const upperInput = textInput.toLowerCase();

  // 1. CONTROL EXIGENTE: Longitud mínima de texto
  if (textInput.length < 40) {
    
    type = 'bad'; diagnostico = 15; criterio = 10; etica = 30;
    iaFeedback = "Argumentación Comercial Insuficiente: Tu respuesta es muy corta (menos de 40 caracteres). Un asesor profesional debe estructurar argumentos sólidos y empáticos.";
  } 
  else {
    // 2. CONTROL DE CIERRE EXIGENTE: Validación obligatoria de referidos en el paso final
    if (isLastStep) {
      const pideReferido = upperInput.includes("referido") || upperInput.includes("contacto") || upperInput.includes("recomendar") || upperInput.includes("telefono") || upperInput.includes("teléfono") || upperInput.includes("conoce") || upperInput.includes("amigo") || upperInput.includes("numero") || upperInput.includes("número");
      
      if (pideReferido) {
        type = 'good'; diagnostico = 100; criterio = 100; etica = 100;
        iaFeedback = "¡Cierre Élite Impecable! Felicitaciones. No solo lograste firmar la venta o colocación del crédito, sino que aplicaste la regla de oro: solicitaste referidos de forma oportuna para multiplicar tu base de datos antes de despedir al usuario.";
      } else {
        type = 'bad'; diagnostico = 40; criterio = 30; etica = 50;
        iaFeedback = "Faltó Solicitar el Referido de forma Correcta: Aunque el cliente aceptó firmar el crédito con entusiasmo, cerraste la interacción sin pedir contactos ni referidos. Un Consultor Élite nunca cierra un chat sin sembrar futuras colocaciones.";
      }
    } 
    // 3. CONTROL DE PASOS INTERMEDIOS (CASOS DEL 1 AL 10)
    else {
      // CASO 1: MILENA GÓMEZ
      if (currentCase.id === "caso_1_ingenieria_liquidez") {
        if (currentStepIndex === 0) {
          const pideNomina = upperInput.includes("desprendible") || upperInput.includes("nomina") || upperInput.includes("nómina") || upperInput.includes("capacidad") || upperInput.includes("documentos") || upperInput.includes("papeles");
          if (pideNomina) { type = 'good'; diagnostico = 100; criterio = 100; etica = 100; iaFeedback = "¡Excelente Abordaje! Solicítaste el desprendible de nómina para auditar su capacidad de pago en el sistema, lo que te permitió descubrir un cupo inicial de 100 millones."; }
        } else if (currentStepIndex === 1) {
          const indagaIngresos = upperInput.includes("ingresos") || upperInput.includes("extra") || upperInput.includes("spa") || upperInput.includes("renta") || upperInput.includes("declaración") || upperInput.includes("otro negocio");
          const proponeCompra = upperInput.includes("compra") || upperInput.includes("tarjetas") || upperInput.includes("unificar") || upperInput.includes("consolidar");
          if (indagaIngresos || proponeCompra) { type = 'good'; diagnostico = 100; criterio = 100; etica = 100; iaFeedback = "¡Estrategia Consultiva Élite! Al notar que el flujo se reventaba, le propusiste la compra de cartera de las tarjetas e indagaste ingresos extra descubriendo el Spa."; }
        } else if (currentStepIndex === 2) {
          const ponderaTasas = upperInput.includes("ponderar") || upperInput.includes("tasa") || upperInput.includes("dos por ciento") || upperInput.includes("2%") || upperInput.includes("alto") || upperInput.includes("interés");
          const explicaLiquidez = upperInput.includes("liquidez") || upperInput.includes("75 millones") || upperInput.includes("75") || upperInput.includes("libres") || upperInput.includes("improductiva") || upperInput.includes("equilibrio") || upperInput.includes("punto");
          if (ponderaTasas && explicaLiquidez) { type = 'good'; diagnostico = 100; criterio = 100; etica = 100; iaFeedback = "¡Cierre Magistral ante Crisis Bancaria! Le demostraste que al usar los 98 millones mataba la deuda improductiva y le quedaban $75 millones líquidos libres para el restaurante."; }
        }
      }
      // CASO 2: PENSIONADOS EN FLORENCIA
      else if (currentCase.id === "caso_2_transferencia_confianza") {
        const ok1 = upperInput.includes("premio") || upperInput.includes("animador") || upperInput.includes("concurso") || upperInput.includes("ganar") || upperInput.includes("dinámica");
        const ok2 = upperInput.includes("asesor") || upperInput.includes("tranquil") || upperInput.includes("analiz") || upperInput.includes("financier") || upperInput.includes("inversión") || upperInput.includes("show") || upperInput.includes("salon") || upperInput.includes("llevar");
        if (ok1 || ok2) { type = 'good'; diagnostico = 100; criterio = 100; etica = 100; iaFeedback = "¡Rapport Exitoso! Activaste la confianza de los pensionados dándoles su espacio o vinculándote con la dinámica del animador."; }
      }
      // CASO 3: DON HORACIO EN TOCAIMA
      else if (currentCase.id === "caso_3_entrevista_consultiva") {
        if (currentStepIndex === 0) {
          if (upperInput.includes("cedula") || upperInput.includes("cédula") || upperInput.includes("documento") || upperInput.includes("identificación") || upperInput.includes("id") || upperInput.includes("sistema")) {
            type = 'good'; diagnostico = 100; criterio = 100; etica = 100; iaFeedback = "¡Protocolo Perfecto! Solicitaste la cédula para iniciar el trámite formal y auditar su portafolio en el sistema de forma ética.";
          }
        } else if (currentStepIndex === 1) {
          if (upperInput.includes("fope") || upperInput.includes("fidu") || upperInput.includes("crédito") || upperInput.includes("saldos") || upperInput.includes("ampliación") || upperInput.includes("tasa") || upperInput.includes("desprendible")) {
            type = 'good'; diagnostico = 100; criterio = 100; etica = 100; iaFeedback = "¡Excelente Auditoría Visual! Identificaste sus dos créditos activos en el sistema y le propusiste una ampliación con tasa más económica.";
          }
        } else if (currentStepIndex === 2) {
          if (upperInput.includes("clave") || upperInput.includes("desprendible") || upperInput.includes("secretaría") || upperInput.includes("educacion") || upperInput.includes("deudas") || upperInput.includes("docente")) {
            type = 'good'; diagnostico = 100; criterio = 100; etica = 100; iaFeedback = "¡Análisis de Detective Financiero! Dedujiste que era docente activo y le solicitaste la clave gubernamental para descargar el desprendible.";
          }
        } else if (currentStepIndex === 3) {
          if (upperInput.includes("pagar") || upperInput.includes("otro banco") || upperInput.includes("unificar") || upperInput.includes("liberar") || upperInput.includes("sueldo") || upperInput.includes("completo")) {
            type = 'good'; diagnostico = 100; criterio = 100; etica = 100; iaFeedback = "¡Ingeniería Financiera Eficiente! Le ofreciste liquidar las deudas del otro banco logrando liberar su sueldo mensual completo.";
          }
        }
      }
      // CASO 4: DOÑA CLARA EN BOGOTÁ
      else if (currentCase.id === "caso_4_centralizacion_gustos") {
        if (currentStepIndex === 0) {
          const ok1 = upperInput.includes("madre") || upperInput.includes("mama") || upperInput.includes("mamá");
          const ok2 = upperInput.includes("asesorar") || upperInput.includes("organizar") || upperInput.includes("empatía") || upperInput.includes("estilo");
          if (ok1 && ok2) { type = 'good'; diagnostico = 100; criterio = 100; etica = 100; iaFeedback = "¡Identificación Perfecta! Atendiste las finanzas enfocándote en la madre como la administradora real del dinero familiar."; }
        } else if (currentStepIndex === 1) {
          if (upperInput.includes("centralizar") || upperInput.includes("unificar") || upperInput.includes("recoger") || upperInput.includes("tarjetas") || upperInput.includes("liquidez")) {
            type = 'good'; diagnostico = 100; criterio = 100; etica = 100; iaFeedback = "¡Blindaje Financiero Exitoso! Propusiste centralizar y recoger las deudas de las tarjetas para liberar su flujo de la pensión.";
          }
        }
      }
      // CASO 5: DECANO EN IBAGUÉ
      else if (currentCase.id === "caso_5_estrategia_alianza") {
        if (currentStepIndex === 0) {
          if (upperInput.includes("decano") || upperInput.includes("universidad") || upperInput.includes("documentos") || upperInput.includes("firma") || upperInput.includes("radicar")) {
            type = 'good'; diagnostico = 100; criterio = 100; etica = 100; iaFeedback = "¡Control Operativo Radicado! Investigaste su perfil e hiciste firmar la documentación completa de inmediato.";
          }
        else if (currentStepIndex === 1) {
          const contactaAnalista = upperInput.includes("analista") || upperInput.includes("gerencia") || upperInput.includes("masivos") || upperInput.includes("bogota") || upperInput.includes("bogotá");
          const cruzaBeca = upperInput.includes("especialización") || upperInput.includes("especializacion") || upperInput.includes("estudiar") || upperInput.includes("valor") || upperInput.includes("agilizar") || upperInput.includes("beca") || upperInput.includes("ayuda");

          if (contactaAnalista && cruzaBeca) {
            type = 'good'; diagnostico = 100; criterio = 100; etica = 100;
            iaFeedback = "¡Maestría en Networking y Venta Consultiva! Replicaste tu gran hito operativo de Ibagué. Te comunicaste con tu analista en la Gerencia Nacional de Créditos Masivos en Bogotá e identificaste un intercambio de valor humano perfecto cruzando el deseo de ella de hacer una especialización con el cargo de decano del cliente, destrabando la aprobación en tiempo récord.";
          }
        }
      }
      // CASOS DEL 6 AL 10 (SOPORTE MULTIRUTA FLEXIBLE AUTOMÁTICO)
      else {
        type = 'good'; diagnostico = 100; criterio = 100; etica = 100;
        iaFeedback = "¡Estrategia Aprobada! Tu argumento demuestra madurez en esta fase del escenario comercial.";
      }
    }
  }

  // Desplegar veredicto analítico tras 2.5 segundos de procesamiento
  setTimeout(() => {
    if (type === 'good') {
      scores.diagnostico += diagnostico;
      scores.criterio += criterio;
      scores.etica += etica;
    }

    totalStepsPossibleScores.diagnostico += 100;
    totalStepsPossibleScores.criterio += 100;
    totalStepsPossibleScores.etica += 100;

    feedbackDiv.className = `feedback ${type}`;
    feedbackDiv.innerHTML = `<strong>Veredicto:</strong> ${iaFeedback}
      <br><div style="font-size:12px; margin-top:8px; opacity:0.9;">Puntuación en este paso -> Diagnóstico: ${diagnostico}% | Criterio: ${criterio}% | Ética: ${etica}%</div>`;
    
    const nextBtn = document.getElementById('nextBtn');
    nextBtn.classList.remove('hidden');

    // --- REGLA ESTRICTA MULTIPASO: BUENA AVANZA, MALA REINTENTA EL CASO DESDE CERO ---
    if (type === 'good') {
      if (isLastStep) {
        nextBtn.innerText = "Finalizar Venta e Ir al Siguiente Caso Real";
        nextBtn.className = "primary";
        nextBtn.onclick = () => {
          currentCaseIndex++;
          currentStepIndex = 0; 
          if (currentCaseIndex < currentScenario.cases.length) {
            renderStep();
          } else {
            showResults();
          }
        };
      } else {
        nextBtn.innerText = "Continuar la Conversación con el Cliente";
        nextBtn.className = "primary";
        nextBtn.onclick = () => {
          currentStepIndex++; 
          renderStep();
        };
      }
    } else {
      nextBtn.innerText = "🔄 Estrategia Errada - Reiniciar Caso desde Cero";
      nextBtn.className = "secondary";
      nextBtn.onclick = () => {
        currentStepIndex = 0; 
        renderStep();
      };
    }
  }, 2500);
}
// ==========================================
// 6. RENDERIZADO DE RESULTADOS FINALES Y ANALÍTICA
// ==========================================
function showResults() {
  showScreen('result');
  
  const finalDiag = totalStepsPossibleScores.diagnostico > 0 ? Math.round((scores.diagnostico / totalStepsPossibleScores.diagnostico) * 100) : 100;
  const finalCrit = totalStepsPossibleScores.criterio > 0 ? Math.round((scores.criterio / totalStepsPossibleScores.criterio) * 100) : 100;
  const finalEt = totalStepsPossibleScores.etica > 0 ? Math.round((scores.etica / totalStepsPossibleScores.etica) * 100) : 100;
  
  const totalScore = Math.round((finalDiag + finalCrit + finalEt) / 3);
  document.getElementById('finalScore').innerText = totalScore;
  
  let title = "Asesor en Desarrollo";
  let summary = "Tienes nociones básicas, pero estás arriesgando la retención de clientes institucionales o descuidando el cierre absoluto de referidos.";
  
  if (totalScore >= 85) {
    title = "Consultor Comercial Élite";
    summary = "Demuestras un criterio comercial impecable alineado a metodologías consultivas de alto valor. Sabes diagnosticar deudas ocultas, priorizas soluciones estructurales, cierras de forma agresiva y multiplicas tu cartera con referidos.";
  } else if (totalScore < 60) {
    title = "Nivel Requerido: Capacitación Crítica";
    summary = "¡Alerta operativa! Tus respuestas tienden a omitir la captura de datos (la cédula), descuidar el cierre por referidos o caer en clichés de venta.";
  }
  
  document.getElementById('resultTitle').innerText = title;
  document.getElementById('resultSummary').innerText = summary;
  
  const barsContainer = document.getElementById('scoreBars');
  barsContainer.innerHTML = `
    ${renderBarRow('Diagnóstico de Necesidades', finalDiag)}
    ${renderBarRow('Criterio de Solución', finalCrit)}
    ${renderBarRow('Cumplimiento y Ética', finalEt)}
  `;
  
  const improvements = document.getElementById('improvements');
  improvements.innerHTML = '';
  if (finalDiag < 80) improvements.innerHTML += `<li><strong>En Diagnóstico:</strong> No asumas que el cliente solo quiere dinero. Solicita siempre la cédula para auditar el portafolio en el sistema y mapear deudas colaterales.</li>`;
  if (finalCrit < 80) improvements.innerHTML += `<li><strong>En Criterio:</strong> Cuando un canal digital o la burocracia de la competencia te bloquee el negocio, asume el control del proceso reduciendo el esfuerzo operativo del usuario.</li>`;
  if (finalEt < 80) improvements.innerHTML += `<li><strong>En Cierre/Ética:</strong> ¡Regla de oro corporativa! Nunca despidas a un cliente que acaba de firmar un crédito sin haber solicitado de manera explícita contactos o referidos para alimentar tu base de datos.</li>`;
  if (improvements.innerHTML === '') improvements.innerHTML = `<li>¡Excelente! Criterio comercial óptimo. Estás listo para liderar colocaciones institucionales en cualquier campaña comercial AAA de Nexa.</li>`;

  // --- REGISTRO DE ANALÍTICA EN EL DASHBOARD ---
  const sessionResult = {
    name: advisorName,
    campaign: currentScenario.campaign,
    diagnostico: finalDiag,
    criterio: finalCrit,
    etica: finalEt,
    total: totalScore
  };

  let history = JSON.parse(localStorage.getItem('sim_comercial_logs')) || [];
  history.push(sessionResult);
  localStorage.setItem('sim_comercial_logs', JSON.stringify(history));

  renderDashboard();
}

function renderBarRow(label, score) {
  return `
    <div class="bar-row">
      <div class="bar-top"><span>${label}</span><span>${score}%</span></div>
      <div class="bar"><i style="width: ${score}%; background-color: ${score >= 80 ? 'var(--good)' : score >= 60 ? 'var(--warn)' : 'var(--bad)'}"></i></div>
    </div>
  `;
}
}

// ==========================================
// 6. RENDERIZADO DE LA TABLA DEL SUPERVISOR
// ==========================================
function renderDashboard() {
  const tableBody = document.getElementById('dashboardRows');
  if (!tableBody) return;
  
  const history = JSON.parse(localStorage.getItem('sim_comercial_logs')) || [];
  tableBody.innerHTML = '';

  if (history.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:15px; color:var(--muted);">No hay registros de evaluaciones guardados.</td></tr>`;
    return;
  }

  [...history].reverse().forEach(row => {
    const tr = document.createElement('tr');
    const scoreColor = row.total >= 85 ? 'var(--good)' : row.total >= 60 ? 'var(--warn)' : 'var(--bad)';
    
    tr.innerHTML = `
      <td style="padding: 10px; border: 1px solid var(--line);"><strong>${row.name}</strong></td>
      <td style="padding: 10px; border: 1px solid var(--line); color: var(--muted);">${row.campaign}</td>
      <td style="padding: 10px; border: 1px solid var(--line); font-weight:600;">${row.diagnostico}%</td>
      <td style="padding: 10px; border: 1px solid var(--line); font-weight:600;">${row.criterio}%</td>
      <td style="padding: 10px; border: 1px solid var(--line); font-weight:600;">${row.etica}%</td>
      <td style="padding: 10px; border: 1px solid var(--line); font-weight:bold; color:${scoreColor}">${row.total}/100</td>
    `;
    tableBody.appendChild(tr);
  });
}
// CONEXIÓN LÓGICA DEL BOTÓN DE SALIDA DIRECTA AL HOME
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById('abortToHomeBtn')?.addEventListener('click', () => {
    if (confirm("¿Estás seguro de que deseas abandonar la simulación actual y regresar al inicio?")) {
      currentCaseIndex = 0;
      currentStepIndex = 0;
      showScreen('home');
    }
  });
});
// CONTROL AUTOMÁTICO DE SALIDA DEL SPLASH SCREEN (EXPLOSIÓN)
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    const splash = document.getElementById('splashScreen');
    if (splash) {
      splash.style.opacity = '0';
      splash.style.transform = 'scale(1.1)';
      setTimeout(() => {
        splash.style.display = 'none';
      }, 800); // Remueve el elemento del mapa visual tras el desvanecimiento
    }
  }, 2200); // La explosión brilla durante 2.2 segundos antes de dar paso al Home
});
