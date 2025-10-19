document.getElementById("unlockBtn").addEventListener("click", function() {
  const pwd = document.getElementById("passwordInput").value.trim();
  if (pwd === "Hydra@2025") {
    document.getElementById("loginContainer").style.display = "none";
    document.getElementById("mainApp").style.display = "block";
  } else {
    document.getElementById("loginError").innerText = "Incorrect password. Please try again.";
  }
});

// Prevent modal from closing on outside click
const findModal = document.getElementById("findModal");
findModal.addEventListener("click", (e) => { e.stopPropagation(); });
document.getElementById("findCylinderBtn").onclick = () => { findModal.style.display = "flex"; };
document.getElementById("closeFindBtn").onclick = () => { findModal.style.display = "none"; };

document.getElementById("resetFindBtn").onclick = () => {
  document.querySelectorAll("#findModal input").forEach(i => i.value = "");
  document.getElementById("allCylHoldChk").checked = false;
  document.getElementById("resultsContainer").innerHTML = "";
};

document.getElementById("applyFindBtn").onclick = () => {
  const weightVal = parseFloat(document.getElementById("weightInput").value) || 0;
  const weightUnit = document.getElementById("weightUnit").value;
  const capacity = parseFloat(document.getElementById("capacityInput").value) || 0;
  const pressure = parseFloat(document.getElementById("pressureInput").value) || 0;
  const stroke = parseFloat(document.getElementById("strokeInput").value) || 0;
  const cylCount = parseInt(document.getElementById("noOfCylInput").value) || 1;
  const allHold = document.getElementById("allCylHoldChk").checked;
  let resultsDiv = document.getElementById("resultsContainer");
  resultsDiv.innerHTML = "";

  let totalWeightN = weightUnit === "kg" ? weightVal * 9.81 : weightVal * 1000 * 9.81;
  let perCylLoad = allHold ? totalWeightN : totalWeightN / cylCount;

  let boreDia = 0, rodDia = 0;
  if (capacity > 0 && pressure > 0) {
    boreDia = Math.sqrt((4 * (capacity * 1000)) / (Math.PI * pressure * 1e5)) * 1000;
  } else if (weightVal > 0 && pressure > 0) {
    boreDia = Math.sqrt((4 * perCylLoad) / (Math.PI * pressure * 1e5)) * 1000;
  } else if (weightVal > 0 && pressure === 0) {
    boreDia = Math.pow(perCylLoad / (0.6 * 1e5), 0.5) * 10;
  }

  rodDia = 0.7 * boreDia;
  const isoBore = [25,32,40,50,63,80,100,125,160,200,250,320].reduce((a,b)=>Math.abs(b-boreDia)<Math.abs(a-boreDia)?b:a);
  const isoRod = [12,16,20,25,28,32,36,40,45,50,56,63,70,80].reduce((a,b)=>Math.abs(b-rodDia)<Math.abs(a-boreDia)?b:a);

  let safetyMsg = "";
  const E = 2.1e5;
  const K = 1;
  if (stroke > 0 && isoRod > 0) {
    const critical = (Math.PI**2 * E * Math.PI*(isoRod/2)**4) / (4 * (K*stroke)**2);
    const SF = critical / (perCylLoad/1000);
    if (SF < 2) safetyMsg = `<p style='color:red'>Rod may buckle (SF=${SF.toFixed(2)}).</p>`;
    else if (SF < 3) safetyMsg = `<p style='color:orange'>Caution: Borderline safe (SF=${SF.toFixed(2)}).</p>`;
    else safetyMsg = `<p style='color:green'>Rod is safe (SF=${SF.toFixed(2)}).</p>`;
  }

  resultsDiv.innerHTML = `
    <p>Calculated Bore Dia: ${boreDia.toFixed(2)} mm (ISO: ${isoBore} mm)</p>
    <p>Recommended Rod Dia: ${rodDia.toFixed(2)} mm (ISO: ${isoRod} mm)</p>
    ${safetyMsg}
  `;
};
