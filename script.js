const PASSWORD = "Manifold@2025";

function checkPassword() {
    const input = document.getElementById("password").value;
    if (input === PASSWORD) {
        document.getElementById("login-box").style.display = "none";
        document.getElementById("calculator").style.display = "block";
    } else {
        alert("Incorrect password");
    }
}

function convertToSpeed(value, unit, stroke) {
    if (unit === "sec") return stroke / value;
    if (unit === "mm/s") return value;
    if (unit === "m/s") return value * 1000;
    if (unit === "m/min") return (value * 1000) / 60;
    return 0;
}

function convertToTime(value, unit, stroke) {
    if (unit === "sec") return value;
    if (unit === "mm/s") return stroke / value;
    if (unit === "m/s") return stroke / (value * 1000);
    if (unit === "m/min") return stroke / ((value * 1000) / 60);
    return 0;
}

function calculate() {
    const boreDia = parseFloat(document.getElementById("boreDia").value);
    const rodDia = parseFloat(document.getElementById("rodDia").value);
    const stroke = parseFloat(document.getElementById("stroke").value);
    const cylinders = parseFloat(document.getElementById("cylinders").value);

    const boreArea = Math.PI * Math.pow(boreDia, 2) / 4;
    const rodArea = Math.PI * (Math.pow(boreDia, 2) - Math.pow(rodDia, 2)) / 4;

    const timeUnitBore = document.getElementById("timeUnitBore").value;
    const timeValueBore = parseFloat(document.getElementById("timeValueBore").value);
    const timeUnitRod = document.getElementById("timeUnitRod").value;
    const timeValueRod = parseFloat(document.getElementById("timeValueRod").value);

    const boreSpeed = convertToSpeed(timeValueBore, timeUnitBore, stroke);
    const boreTime = convertToTime(timeValueBore, timeUnitBore, stroke);
    const rodSpeed = convertToSpeed(timeValueRod, timeUnitRod, stroke);
    const rodTime = convertToTime(timeValueRod, timeUnitRod, stroke);

    const boreFlow = (boreArea * boreSpeed * 60) / 1000000;
    const rodFlow = (rodArea * rodSpeed * 60) / 1000000;

    const totalBoreFlow = boreFlow * cylinders;
    const totalRodFlow = rodFlow * cylinders;

    const pfOptionBore = document.getElementById("pfOptionBore").value;
    const pfValueBore = parseFloat(document.getElementById("pfValueBore").value);
    const pfOptionRod = document.getElementById("pfOptionRod").value;
    const pfValueRod = parseFloat(document.getElementById("pfValueRod").value);

    let borePressure, boreForce, rodPressure, rodForce;

    if (pfOptionBore === "pressure") {
        borePressure = pfValueBore;
        boreForce = (boreArea * borePressure * 0.1) / 1000;
    } else {
        boreForce = pfValueBore;
        borePressure = (boreForce * 1000) / (boreArea * 0.1);
    }

    if (pfOptionRod === "pressure") {
        rodPressure = pfValueRod;
        rodForce = (rodArea * rodPressure * 0.1) / 1000;
    } else {
        rodForce = pfValueRod;
        rodPressure = (rodForce * 1000) / (rodArea * 0.1);
    }

    const regen = document.getElementById("regen").checked;

    let borePower;
    if (regen) {
        borePower = ((boreFlow - rodFlow) * borePressure) / 600;
    } else {
        borePower = (boreFlow * borePressure) / 600;
    }
    const rodPower = (rodFlow * rodPressure) / 600;

    const totalBorePower = borePower * cylinders;
    const totalRodPower = rodPower * cylinders;

    document.getElementById("boreArea").textContent = boreArea.toFixed(2);
    document.getElementById("rodArea").textContent = rodArea.toFixed(2);
    document.getElementById("boreSpeed").textContent = boreSpeed.toFixed(2) + " mm/s";
    document.getElementById("rodSpeed").textContent = rodSpeed.toFixed(2) + " mm/s";
    document.getElementById("boreTime").textContent = boreTime.toFixed(2);
    document.getElementById("rodTime").textContent = rodTime.toFixed(2);
    document.getElementById("boreFlow").textContent = boreFlow.toFixed(2);
    document.getElementById("rodFlow").textContent = rodFlow.toFixed(2);
    document.getElementById("totalBoreFlow").textContent = totalBoreFlow.toFixed(2);
    document.getElementById("totalRodFlow").textContent = totalRodFlow.toFixed(2);
    document.getElementById("borePressure").textContent = borePressure.toFixed(2);
    document.getElementById("boreForce").textContent = boreForce.toFixed(2);
    document.getElementById("rodPressure").textContent = rodPressure.toFixed(2);
    document.getElementById("rodForce").textContent = rodForce.toFixed(2);
    document.getElementById("borePower").textContent = totalBorePower.toFixed(2);
    document.getElementById("rodPower").textContent = totalRodPower.toFixed(2);
}