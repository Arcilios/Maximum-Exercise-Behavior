function updateRates() {
    const rr = parseFloat(document.getElementById('rrInput').value);
    const hr = parseFloat(document.getElementById('hrInput').value);
    const ve = parseFloat(document.getElementById('veInput').value);
    const vo2 = parseFloat(document.getElementById('vo2Input').value);
    const vco2 = parseFloat(document.getElementById('vco2Input').value);

    // TODO: fix when zero or negative numbers 
    document.getElementById('lungs').style.animationDuration = (60 / rr).toFixed(2) + 's'; 
    document.getElementById('heart').style.animationDuration = (60 / hr).toFixed(2) + 's';

    const container = document.getElementById('animationArea');
    container.innerHTML = '';  

    for (let i = 0; i < ve / 2; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.style.left = `${40 + Math.random() * 20}%`;
        bubble.style.animationDuration = `${2 + Math.random()}s`;
        container.appendChild(bubble);
    }

    for (let i = 0; i < vo2 / 100; i++) {
        const dot = document.createElement('div');
        dot.className = 'vo2-dot';
        dot.style.left = `${30 + Math.random() * 10}%`;
        dot.style.animationDuration = `${1.5 + Math.random()}s`;
        container.appendChild(dot);
    }
    for (let i = 0; i < vco2 / 100; i++) {
        const dot = document.createElement('div');
        dot.className = 'vco2-dot';
        dot.style.left = `${60 + Math.random() * 10}%`;
        dot.style.animationDuration = `${1.5 + Math.random()}s`;
        container.appendChild(dot);
    }
    console.log('updated')
}
updateRates();

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("update").addEventListener("click", updateRates);
});