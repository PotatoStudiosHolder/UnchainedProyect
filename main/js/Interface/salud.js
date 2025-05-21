document.addEventListener("DOMContentLoaded", function () {
  // Variables globales
  let wounds = [];
  let tourniquets = [];
  let patientStatus = "ESTABLE";
  let isDeceased = false;
  let estimatedSurvivalTime = 48 * 3600; // en segundos (48 horas)
  let vitalHistory = {
    pulse: [80],
    bloodPressure: ["120/80"],
    temperature: [36.5],
    oxygenation: [98]
  };

  // Referencias a elementos del DOM
  const bodySvgFront = document.getElementById("bodySvgFront");
  const bodySvgBack = document.getElementById("bodySvgBack");
  const toggleViewBtn = document.getElementById("toggleView");
  const systemTimeElement = document.getElementById("systemTime");
  const woundModal = document.getElementById("woundModal");
  const tourniquetModal = document.getElementById("tourniquetModal");
  const woundForm = document.getElementById("woundForm");
  const bodyPartInput = document.getElementById("bodyPart");
  const woundsList = document.getElementById("woundsList");
  const clearWoundsBtn = document.getElementById("clearWounds");
  const declareDeceasedBtn = document.getElementById("declareDeceased");
  const tourniquetBodyPartSpan = document.getElementById("tourniquetBodyPart");
  const applyTourniquetBtn = document.getElementById("applyTourniquet");
  const removeTourniquetBtn = document.getElementById("removeTourniquet");
  const saveVitalsBtn = document.getElementById("saveVitals");
  const resetVitalsBtn = document.getElementById("resetVitals");
  const patientStatusText = document.getElementById("patientStatusText");
  const estimationTimeElement = document.getElementById("estimationTime");
  const criticalStatusElement = document.getElementById("criticalStatus");

  // Cerrar modales al hacer clic en X o en cancelar
  document.getElementById("closeModal").addEventListener("click", closeWoundModal);
  document.getElementById("cancelWound").addEventListener("click", closeWoundModal);
  document.getElementById("closeTourniquetModal").addEventListener("click", closeTourniquetModal);
  document.getElementById("cancelTourniquet").addEventListener("click", closeTourniquetModal);

  // Asignación de eventos principales
  toggleViewBtn.addEventListener("click", toggleBodyView);
  woundForm.addEventListener("submit", handleWoundSubmit);
  clearWoundsBtn.addEventListener("click", clearAllWounds);
  declareDeceasedBtn.addEventListener("click", declarePatientDeceased);
  applyTourniquetBtn.addEventListener("click", handleApplyTourniquet);
  removeTourniquetBtn.addEventListener("click", handleRemoveTourniquet);
  saveVitalsBtn.addEventListener("click", saveVitalSigns);
  resetVitalsBtn.addEventListener("click", resetVitalSigns);

  // Inicializaciones
  initBodyRegions();
  updateSystemTime();
  setInterval(updateSystemTime, 1000);
  setInterval(updateSurvivalTime, 10000); // Actualiza cada 10 segundos

  // --- Funciones Principales ---

  function initBodyRegions() {
    // Registrar eventos en las regiones de la vista frontal
    const frontRegions = bodySvgFront.querySelectorAll(".body-region");
    frontRegions.forEach(region => {
      if (region.dataset.hasArtery === "true") {
        region.classList.add("has-artery");
      }
      region.addEventListener("click", function (event) {
        if (isDeceased) return;
        const bodyPart = region.dataset.part;
        const canTourniquet = region.dataset.canTourniquet === "true";
        if (canTourniquet && (event.ctrlKey || event.metaKey)) {
          openTourniquetModal(bodyPart);
        } else {
          openWoundModal(bodyPart);
        }
      });
    });
    // Registrar eventos en la vista posterior (lógica similar)
    const backRegions = bodySvgBack.querySelectorAll(".body-region");
    backRegions.forEach(region => {
      if (region.dataset.hasArtery === "true") {
        region.classList.add("has-artery");
      }
      region.addEventListener("click", function (event) {
        if (isDeceased) return;
        const bodyPart = region.dataset.part;
        const canTourniquet = region.dataset.canTourniquet === "true";
        if (canTourniquet && (event.ctrlKey || event.metaKey)) {
          openTourniquetModal(bodyPart);
        } else {
          openWoundModal(bodyPart);
        }
      });
    });
  }

  function updateSystemTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    systemTimeElement.textContent = `${hours}:${minutes}:${seconds}`;
  }

  function toggleBodyView() {
    const isFrontVisible = bodySvgFront.style.display !== "none";
    if (isFrontVisible) {
      bodySvgFront.style.display = "none";
      bodySvgBack.style.display = "block";
      toggleViewBtn.textContent = "Vista Frontal";
    } else {
      bodySvgFront.style.display = "block";
      bodySvgBack.style.display = "none";
      toggleViewBtn.textContent = "Vista Posterior";
    }
  }

  function openWoundModal(bodyPart) {
    bodyPartInput.value = bodyPart;
    woundModal.style.display = "flex";
    document.getElementById("modalTitle").textContent = `Añadir Herida: ${getBodyPartName(bodyPart)}`;
    updateWoundOptions();
  }

  function closeWoundModal() {
    woundModal.style.display = "none";
    woundForm.reset();
  }

  function openTourniquetModal(bodyPart) {
    tourniquetBodyPartSpan.textContent = getBodyPartName(bodyPart);
    tourniquetModal.style.display = "flex";
    const hasTourniquet = tourniquets.some(t => t.bodyPart === bodyPart);
    applyTourniquetBtn.style.display = hasTourniquet ? "none" : "block";
    removeTourniquetBtn.style.display = hasTourniquet ? "block" : "none";
    tourniquetModal.dataset.bodyPart = bodyPart;
  }

  function closeTourniquetModal() {
    tourniquetModal.style.display = "none";
  }

  function handleWoundSubmit(event) {
    event.preventDefault();
    const bodyPart = bodyPartInput.value;
    const woundType = document.getElementById("woundType").value;
    const severity = document.getElementById("severity").value;
    const bleeding = document.getElementById("bleeding").value;
    const notes = document.getElementById("notes").value;
    let internalInjuryType = null;
    if (woundType === "internal") {
      internalInjuryType = document.getElementById("internalInjuryType").value;
    }
    const bodyRegion = getBodyRegionByPart(bodyPart);
    const hasArtery = bodyRegion?.dataset.hasArtery === "true";
    const arteryName = bodyRegion?.dataset.arteryName || "";
    let effectiveBleeding = bleeding;
    if (hasArtery && ["gunshot", "cut", "puncture"].includes(woundType)) {
      switch (bleeding) {
        case "none":
          effectiveBleeding = "mild";
          break;
        case "mild":
          effectiveBleeding = "moderate";
          break;
        case "moderate":
          effectiveBleeding = "severe";
          break;
        case "severe":
          effectiveBleeding = "severe";
          break;
      }
    }
    const hasTourniquetApplied = tourniquets.some(t =>
      t.bodyPart === bodyPart ||
      (t.bodyPart.includes("Upper") &&
       bodyPart.includes("Lower") &&
       t.bodyPart.includes(bodyPart.split("Lower")[0]))
    );
    if (hasTourniquetApplied && !bodyPart.includes("Torso") && !bodyPart.includes("head") && !bodyPart.includes("neck")) {
      effectiveBleeding = "none";
    }
    const wound = {
      id: Date.now(),
      bodyPart,
      woundType,
      severity,
      bleeding: effectiveBleeding,
      originalBleeding: bleeding,
      notes,
      hasArtery,
      arteryName,
      internalInjuryType,
      treated: false,
      timestamp: new Date()
    };
    wounds.push(wound);
    updateBodyVisuals();
    renderWoundsList();
    updatePatientStatus();
    closeWoundModal();
  }

  function handleApplyTourniquet() {
    const bodyPart = tourniquetModal.dataset.bodyPart;
    const tourniquet = {
      id: Date.now(),
      bodyPart,
      timestamp: new Date()
    };
    tourniquets.push(tourniquet);
    wounds.forEach(wound => {
      if (
        wound.bodyPart === bodyPart ||
        (bodyPart.includes("Upper") &&
          wound.bodyPart.includes("Lower") &&
          wound.bodyPart.includes(bodyPart.split("Upper")[0]))
      ) {
        wound.bleeding = "none";
      }
    });
    updateBodyVisuals();
    renderWoundsList();
    updatePatientStatus();
    closeTourniquetModal();
  }

  function handleRemoveTourniquet() {
    const bodyPart = tourniquetModal.dataset.bodyPart;
    tourniquets = tourniquets.filter(t => t.bodyPart !== bodyPart);
    wounds.forEach(wound => {
      if (
        wound.bodyPart === bodyPart ||
        (bodyPart.includes("Upper") &&
          wound.bodyPart.includes("Lower") &&
          wound.bodyPart.includes(bodyPart.split("Upper")[0]))
      ) {
        wound.bleeding = wound.originalBleeding;
      }
    });
    updateBodyVisuals();
    renderWoundsList();
    updatePatientStatus();
    closeTourniquetModal();
  }

  function getBodyRegionByPart(bodyPart) {
    let region = bodySvgFront.querySelector(`[data-part="${bodyPart}"]`);
    if (!region) {
      region = bodySvgBack.querySelector(`[data-part="${bodyPart}"]`);
    }
    return region;
  }

  function getBodyPartName(bodyPart) {
    const partMap = {
      head: "Cabeza",
      neck: "Cuello",
      upperTorso: "Torso Superior",
      lowerTorso: "Torso Inferior",
      leftUpperArm: "Brazo Izquierdo Superior",
      leftLowerArm: "Brazo Izquierdo Inferior",
      rightUpperArm: "Brazo Derecho Superior",
      rightLowerArm: "Brazo Derecho Inferior",
      leftUpperLeg: "Pierna Izquierda Superior",
      leftLowerLeg: "Pierna Izquierda Inferior",
      rightUpperLeg: "Pierna Derecha Superior",
      rightLowerLeg: "Pierna Derecha Inferior",
      headBack: "Cabeza (Posterior)",
      neckBack: "Cuello (Posterior)",
      upperTorsoBack: "Torso Superior (Posterior)",
      lowerTorsoBack: "Torso Inferior (Posterior)",
      leftUpperArmBack: "Brazo Izquierdo Superior (Posterior)",
      leftLowerArmBack: "Brazo Izquierdo Inferior (Posterior)",
      rightUpperArmBack: "Brazo Derecho Superior (Posterior)",
      rightLowerArmBack: "Brazo Derecho Inferior (Posterior)"
    };
    return partMap[bodyPart] || bodyPart;
  }

  function updateWoundOptions() {
    const woundType = document.getElementById("woundType").value;
    const internalInjuryGroup = document.getElementById("internalInjuryTypeGroup");
    if (woundType === "internal") {
      internalInjuryGroup.style.display = "block";
    } else {
      internalInjuryGroup.style.display = "none";
    }
  }

  function updateBodyVisuals() {
    const allRegions = document.querySelectorAll(".body-region");
    allRegions.forEach(region => {
      region.classList.remove("wounded-minor", "wounded-moderate", "wounded-severe", "wounded-critical", "treated", "tourniquet");
    });
    wounds.forEach(wound => {
      const region = getBodyRegionByPart(wound.bodyPart);
      if (region) {
        if (wound.treated) {
          region.classList.add("treated");
        } else {
          switch (wound.severity) {
            case "minor":
              region.classList.add("wounded-minor");
              break;
            case "moderate":
              region.classList.add("wounded-moderate");
              break;
            case "severe":
              region.classList.add("wounded-severe");
              break;
            case "critical":
              region.classList.add("wounded-critical");
              break;
          }
        }
      }
    });
    tourniquets.forEach(tourniquet => {
      const region = getBodyRegionByPart(tourniquet.bodyPart);
      if (region) {
        region.classList.add("tourniquet");
      }
    });
  }

  function renderWoundsList() {
    woundsList.innerHTML = "";
    if (wounds.length === 0) {
      woundsList.innerHTML = "<p>No hay heridas documentadas.</p>";
      return;
    }
    wounds.forEach(wound => {
      const woundItem = document.createElement("div");
      woundItem.className = `wound-item ${wound.severity}`;
      if (wound.treated) woundItem.classList.add("treated");
      if (wound.woundType === "internal") woundItem.classList.add("internal");

      const bleedingIndicator = document.createElement("span");
      bleedingIndicator.className = `bleeding-indicator bleeding-${wound.bleeding}`;

      const woundContent = document.createElement("div");
      woundContent.className = "wound-content";

      const woundTitle = document.createElement("strong");
      woundTitle.textContent = `${getBodyPartName(wound.bodyPart)} - ${getWoundTypeText(wound.woundType, wound.internalInjuryType, wound.bodyPart)}`;
      if (wound.hasArtery) {
        const arteryIndicator = document.createElement("span");
        arteryIndicator.className = "artery-indicator";
        arteryIndicator.textContent = `Arteria ${wound.arteryName}`;
        woundTitle.appendChild(arteryIndicator);
      }

      const woundDetails = document.createElement("p");
      woundDetails.textContent = `Severidad: ${getSeverityText(wound.severity)} | Sangrado: ${getBleedingText(wound.bleeding)}`;

      const woundNotes = document.createElement("p");
      woundNotes.textContent = wound.notes || "Sin notas adicionales";

      const treatmentStatus = document.createElement("p");
      treatmentStatus.textContent = wound.treated ? "Estado: Tratada" : "Estado: No tratada";
      treatmentStatus.style.fontWeight = "bold";
      treatmentStatus.style.color = wound.treated ? "#4caf50" : "#f44336";

      const woundActions = document.createElement("div");
      woundActions.className = "wound-actions";

      const treatBtn = document.createElement("button");
      treatBtn.className = "treat-btn";
      treatBtn.textContent = wound.treated ? "Reabrir" : "Tratar";
      treatBtn.onclick = () => toggleTreatWound(wound.id);

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "Eliminar";
      deleteBtn.onclick = () => deleteWound(wound.id);

      woundContent.appendChild(woundTitle);
      woundContent.appendChild(woundDetails);
      woundContent.appendChild(woundNotes);
      woundContent.appendChild(treatmentStatus);
      woundActions.appendChild(treatBtn);
      woundActions.appendChild(deleteBtn);
      woundItem.appendChild(bleedingIndicator);
      woundItem.appendChild(woundContent);
      woundItem.appendChild(woundActions);
      woundsList.appendChild(woundItem);
    });
  }

  function toggleTreatWound(woundId) {
    const woundIndex = wounds.findIndex(w => w.id === woundId);
    if (woundIndex !== -1) {
      wounds[woundIndex].treated = !wounds[woundIndex].treated;
      if (wounds[woundIndex].treated) {
        wounds[woundIndex].bleeding = "none";
      } else {
        wounds[woundIndex].bleeding = wounds[woundIndex].originalBleeding;
        const hasTourniquet = tourniquets.some(t =>
          t.bodyPart === wounds[woundIndex].bodyPart ||
          (t.bodyPart.includes("Upper") &&
            wounds[woundIndex].bodyPart.includes("Lower") &&
            wounds[woundIndex].bodyPart.includes(t.bodyPart.split("Upper")[0]))
        );
        if (hasTourniquet) {
          wounds[woundIndex].bleeding = "none";
        }
      }
      updateBodyVisuals();
      renderWoundsList();
      updatePatientStatus();
    }
  }

  function deleteWound(woundId) {
    wounds = wounds.filter(w => w.id !== woundId);
    updateBodyVisuals();
    renderWoundsList();
    updatePatientStatus();
  }

  function clearAllWounds() {
    if (confirm("¿Estás seguro de querer eliminar todas las heridas?")) {
      wounds = [];
      tourniquets = [];
      updateBodyVisuals();
      renderWoundsList();
      updatePatientStatus();
      if (isDeceased) {
        isDeceased = false;
        const deceasedOverlay = document.querySelector(".deceased-overlay");
        if (deceasedOverlay) deceasedOverlay.remove();
      }
    }
  }

  function declarePatientDeceased() {
    if (confirm("¿Estás seguro de querer declarar al paciente como fallecido?")) {
      isDeceased = true;
      patientStatus = "FALLECIDO";
      updatePatientStatusDisplay();
      const bodyDisplay = document.querySelector(".body-display");
      const deceasedOverlay = document.createElement("div");
      deceasedOverlay.className = "deceased-overlay";
      deceasedOverlay.textContent = "FALLECIDO";
      bodyDisplay.appendChild(deceasedOverlay);
      estimationTimeElement.textContent = "00:00:00";
    }
  }

  function updatePatientStatus() {
    if (isDeceased) {
      patientStatus = "FALLECIDO";
      updatePatientStatusDisplay();
      return;
    }
    let criticalWounds = 0;
    let severeWounds = 0;
    let totalBleeding = 0;
    let hasInternalInjury = false;
    wounds.forEach(wound => {
      if (!wound.treated) {
        if (wound.severity === "critical") criticalWounds++;
        if (wound.severity === "severe") severeWounds++;
        switch (wound.bleeding) {
          case "mild":
            totalBleeding += 1;
            break;
          case "moderate":
            totalBleeding += 2;
            break;
          case "severe":
            totalBleeding += 3;
            break;
        }
        if (wound.woundType === "internal") {
          hasInternalInjury = true;
        }
      }
    });
    const pulse = parseInt(document.getElementById("pulse").value);
    const temperature = parseFloat(document.getElementById("temperature").value);
    const oxygenation = parseInt(document.getElementById("oxygenation").value);
    const consciousness = document.getElementById("consciousness").value;
    if (consciousness === "unresponsive" && (criticalWounds > 0 || severeWounds > 1 || totalBleeding > 5)) {
      patientStatus = "CRÍTICO";
    } else if (criticalWounds > 0 || severeWounds > 1 || totalBleeding > 4 || consciousness === "pain" || oxygenation < 90) {
      patientStatus = "INESTABLE";
    } else if (severeWounds > 0 || totalBleeding > 2 || hasInternalInjury || consciousness === "verbal" || pulse > 120 || temperature < 35.5 || oxygenation < 95) {
      patientStatus = "GRAVE";
    } else {
      patientStatus = "ESTABLE";
    }
    let globalHemorrhage = "none";
    if (totalBleeding > 5) {
      globalHemorrhage = "critical";
    } else if (totalBleeding > 3) {
      globalHemorrhage = "severe";
    } else if (totalBleeding > 1) {
      globalHemorrhage = "moderate";
    } else if (totalBleeding > 0) {
      globalHemorrhage = "mild";
    }
    document.getElementById("hemorrhage").value = globalHemorrhage;
    updatePatientStatusDisplay();
  }

  function updatePatientStatusDisplay() {
    patientStatusText.textContent = patientStatus;
    const statusElement = document.getElementById("patientStatus");
    statusElement.className = "patient-status";
    switch (patientStatus) {
      case "ESTABLE":
        statusElement.classList.add("stable");
        break;
      case "GRAVE":
        statusElement.classList.add("warning");
        break;
      case "INESTABLE":
        statusElement.classList.add("danger");
        break;
      case "CRÍTICO":
        statusElement.classList.add("critical");
        break;
      case "FALLECIDO":
        statusElement.classList.add("deceased");
        break;
    }
  }

  // --- Funciones Auxiliares para Textos ---

function getWoundTypeText(type) {
  switch (type) {
    case "gunshot":
      return "Herida de Bala";
    case "cut":
      return "Corte";
    case "blunt":
      return "Trauma Contuso";
    case "burn":
      return "Quemadura";
    case "fracture":
      return "Fractura";
    case "puncture":
      return "Herida Punzante";
    case "internal":
      return "Lesión Interna"; // Se elimina la especificación del tipo de lesión interna
    default:
      return type;
  }
}



  function getSeverityText(severity) {
    switch (severity) {
      case "minor":
        return "Leve";
      case "moderate":
        return "Moderada";
      case "severe":
        return "Severa";
      case "critical":
        return "Crítica";
      default:
        return severity;
    }
  }

  function getBleedingText(bleeding) {
    switch (bleeding) {
      case "none":
        return "Sin sangrado";
      case "mild":
        return "Leve";
      case "moderate":
        return "Moderado";
      case "severe":
        return "Severo";
      case "critical":
        return "Crítico";
      default:
        return bleeding;
    }
  }

  // --- Funciones para Guardar/Restablecer Signos Vitales ---
  function saveVitalSigns() {
    const pulse = parseInt(document.getElementById("pulse").value);
    const bloodPressure = document.getElementById("bloodPressure").value;
    const temperature = parseFloat(document.getElementById("temperature").value);
    const oxygenation = parseInt(document.getElementById("oxygenation").value);
    const consciousness = document.getElementById("consciousness").value;
    
    // Guardar en el historial
    vitalHistory.pulse.push(pulse);
    vitalHistory.bloodPressure.push(bloodPressure);
    vitalHistory.temperature.push(temperature);
    vitalHistory.oxygenation.push(oxygenation);
    
    // Actualizar estado del paciente basado en los valores introducidos
    updatePatientStatus();
    
    alert("Signos vitales guardados");
  }

  function resetVitalSigns() {
    document.getElementById("pulse").value = 80;
    document.getElementById("bloodPressure").value = "120/80";
    document.getElementById("temperature").value = 36.5;
    document.getElementById("oxygenation").value = 98;
    document.getElementById("consciousness").value = "alert";
    updatePatientStatus();
  }
});