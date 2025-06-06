import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

let dataset, data2, phys, data;
let chart1Instance, chart2Instance;
let matched;

let me = {
  Age: 35,
  Weight: 75,
  Height: 175,
  Sex: 0,
  Temperature: 22,
  Humidity: 40
};

async function loadCSV(file) {
  const cols = ['Age', 'HR', 'Height', 'ID', 'Sex', 'Weight', 'time', 'VO2', 'RR', 'VCO2', 'VE'];
  return await d3.csv(file, row => {
    const parsed = { ...row };
    cols.forEach(k => {
      if (k in row) parsed[k] = +row[k];
    });
    return parsed;
  });
}

async function loadAll() {
  dataset = await fetch("data.json").then(r => r.json());
  data2   = await loadCSV("demo.csv");
  phys    = await loadCSV("demo2.csv");
  data    = await loadCSV("output.csv");

  drawHistogram(data, "Height");
  setupSliders(data);
}

loadAll();

function drawHistogram(data, attribute) {
  const svg = d3.select("#histogram");
  svg.selectAll("*").remove();

  const filtered = data.filter(d => typeof d[attribute] === "number");
  const width = +svg.attr("width");
  const height = +svg.attr("height");

  // binCount 改为 5
  const xScale = d3.scaleLinear()
    .domain(d3.extent(filtered, d => d[attribute]))
    .nice(5)
    .range([0, width]);

  let bins = d3.bin()
    .value(d => d[attribute])
    .domain(xScale.domain())
    .thresholds(xScale.ticks(5))(filtered);
  bins = bins.filter(bin => bin.length > 0);

  const g = svg.append("g");
  const squareSize = 10;
  const gap = 4;
  const maxPerCol = 20;
  const binWidth = width / bins.length;

  let male = true;

  bins.forEach((bin, i) => {
    const x0 = i * binWidth + (binWidth - squareSize) / 2 - 10;
    bin.forEach((d, j) => {
      const col = Math.floor(j / maxPerCol);
      const row = j % maxPerCol;
      const xx = x0 + col * (squareSize + gap);
      const yy = height - 100 - row * (squareSize + gap);

      g.append("rect")
        .attr("x", xx)
        .attr("y", 0) // Start at top
        .attr("width", squareSize)
        .attr("height", squareSize)
        .attr("fill", "#4a90e2")
        .attr("stroke", "#2e6bbf")
        .attr("opacity", 0) // Start transparent
        .transition()
        .duration(400)
        .delay(j * 10 + i * 20) // Stagger animation by position
        .ease(d3.easeQuadInOut)
        .attr("y", yy - squareSize) // Animate to final position
        .attr("opacity", 1) // Fade in
        .on("end", function() {
          // Add mouse events after animation completes
          d3.select(this)
            .on("mouseover", event => {
              d3.select("#tooltip")
                .style("opacity", 1)
                .html(`<div><strong>ID:</strong> ${d.ID ?? "Unknown"}</div>
                       <div><strong>${attribute}:</strong> ${d[attribute]}</div>`);
            })
            .on("mousemove", event => {
              d3.select("#tooltip")
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", () => {
              d3.select("#tooltip").style("opacity", 0);
            });
        });
    });
    
    if (attribute === "Sex") {
      let label = "";
      let xFix = 25
      if (male) {
        label = "Male";
        male = !male;
      }
      else {
        label = "Female";
        male = !male;
        xFix = -10
      }
      g.append("text")
      .attr("transform", `translate(${x0 + squareSize/2 - 10 + xFix}, ${height - 180 + 18 + 80}) rotate(30)`)
      .style("text-anchor", "start")
      .style("font-size", "12px")
      .text(label);
    }
    else {
      g.append("text")
      .attr("transform", `translate(${x0 + squareSize/2 - 10}, ${height - 180 + 18 + 80}) rotate(30)`)
      .style("text-anchor", "start")
      .style("font-size", "12px")
      .text(`${bins[i].x0.toFixed(1)} - ${bins[i].x1.toFixed(1)}`);
    }
    
  });

  const special = me[attribute];
  if (special != null && !isNaN(special)) {
    const idx = bins.findIndex(bin => special >= bin.x0 && special <= bin.x1);
    if (idx !== -1) {
      const binObj = bins[idx];
      const x0 = idx * binWidth + (binWidth - squareSize) / 2 - 10;
      const col = Math.floor(binObj.length / maxPerCol);
      const row = binObj.length % maxPerCol;
      const xx = x0 + col * (squareSize + gap);
      const yy = height - 100 - row * (squareSize + gap);

      g.append("rect")
        .attr("x", xx)
        .attr("y", 0) // Start at top
        .attr("width", squareSize)
        .attr("height", squareSize)
        .attr("fill", "yellow")
        .attr("stroke", "#b59f00")
        .attr("opacity", 0) // Start transparent
        .transition()
        .duration(600)
        .delay(binObj.length * 10 + idx * 20 + 200) // Delay after regular squares
        .ease(d3.easeBounceOut)
        .attr("y", yy - squareSize) // Animate to final position
        .attr("opacity", 1) // Fade in
        .on("end", function() {
          // Add mouse events after animation completes
          d3.select(this)
            .on("mouseover", event => {
              d3.select("#tooltip")
                .style("opacity", 1)
                .html(`<strong>${attribute} (you):</strong> ${special}`);
            })
            .on("mousemove", event => {
              d3.select("#tooltip")
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", () => {
              d3.select("#tooltip").style("opacity", 0);
            });
        });
    }
  }
 
  let label = "";
  if (attribute === "Height") {
    label = " (cm)"
  }
  if (attribute === "Weight") {
    label = " (kg)"
  }
  if (attribute === "Age") {
    label = " (years)"
  }
  g.append("text")
    .attr("class", "x-axis-label")
    .attr("x", width / 2 - 25 - 10)
    .attr("y", height - 100 + 80)
    .style("font-size", "16px")
    .text(attribute.charAt(0).toUpperCase() + attribute.slice(1) + label);

}


document.getElementById("submit").addEventListener("click", () => {
  me.Temperature = +document.getElementById("temperatureSlider").value;
  me.Humidity    = +document.getElementById("humiditySlider").value;

  const nearest = findNearest(dataset, me);
  
/*
  matched = dataset.find(p =>
    Math.abs(p.features[0] - nearest.Age) < 2 &&
    Math.abs(p.features[1] - nearest.Weight) < 2 &&
    Math.abs(p.features[2] - nearest.Height) < 2 &&
    Math.abs(p.features[3] - me.Humidity) < 2 &&
    Math.abs(p.features[4] - me.Temperature) < 1 &&
    p.features[5] == nearest.Sex
  );
  */
  const matched = nearest;


if (!matched) {
  console.warn("No match found. Cannot generate charts.");

  if (chart1Instance) {
    chart1Instance.destroy();
    chart1Instance = null;
  }
  if (chart2Instance) {
    chart2Instance.destroy();
    chart2Instance = null;
  }
  document.getElementById("chart1").getContext('2d').clearRect(0, 0, 600, 400);
  document.getElementById("chart2").getContext('2d').clearRect(0, 0, 600, 400);
  document.getElementById("organBox").style.display = "none";
  document.getElementById("lungs").classList.add("paused");
  document.getElementById("heart").classList.add("paused");
  document.getElementById("animationArea").innerHTML = "";

  const caption = document.getElementById("match");
  caption.innerText = "⚠ No match found.";

  return;
}
  const labels = matched.time_series.map(d => d.time);
  const draw   = key => matched.time_series.map(d => d[key]);

  if (chart1Instance) chart1Instance.destroy();
  if (chart2Instance) chart2Instance.destroy();

  chart1Instance = new Chart(document.getElementById("chart1"), {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "HR (bpm)", data: draw("HR"), borderWidth: 2, pointRadius: 2 },
        { label: "RR (breaths/min)", data: draw("RR"), borderWidth: 2, pointRadius: 2 },
        { label: "VE (L/min)", data: draw("VE"), borderWidth: 2, pointRadius: 2 }
      ]
    },
    options: {
      onHover: (event, elements) => {
        if (elements.length > 0) {
          const idx = elements[0].index;
          updateAnimationWithData(matched.time_series[idx]);
          const caption = document.getElementById("match");
          caption.innerText = 'HR: ' + matched.time_series[idx].HR +
          ', RR: ' + matched.time_series[idx].RR +
          ', VE: ' + matched.time_series[idx].VE +
          ', VO2: ' + matched.time_series[idx].VO2 +
          ', VCO2: ' + matched.time_series[idx].VCO2;
        }
      }
    }
  });

chart2Instance = new Chart(document.getElementById("chart2"), {
  type: "line",
  data: {
    labels,
    datasets: [
      {
        label: "VO2 (mL/min)",
        data: draw("VO2"),
        borderWidth: 2,
        pointRadius: 2,
        borderColor: "blue",       
        backgroundColor: "blue"
      },
      {
        label: "VCO2 (mL/min)",
        data: draw("VCO2"),
        borderWidth: 2,
        pointRadius: 2,
        borderColor: "red",        
        backgroundColor: "red"
      }
    ]
  },
  options: {
    onHover: (event, elements) => {
      if (elements.length > 0) {
        const idx = elements[0].index;
        updateAnimationWithData(matched.time_series[idx]);
        const caption = document.getElementById("match");
        caption.innerText = 'HR: ' + matched.time_series[idx].HR +
          ', RR: ' + matched.time_series[idx].RR +
          ', VE: ' + matched.time_series[idx].VE +
          ', VO2: ' + matched.time_series[idx].VO2 +
          ', VCO2: ' + matched.time_series[idx].VCO2;
      }
    }
  }
});


  ruochen();
});

function findNearest(data, target) {
  let minDist = Infinity, best = null;

  for (const row of data) {
    const dist = Math.sqrt(
      (row.features[0] - target.Age) ** 2 +
      (row.features[1] - target.Weight) ** 2 +
      (row.features[2] - target.Height) ** 2 +
      (row.features[3] - target.Humidity) ** 2 + //check
      (row.features[4] - target.Temperature) ** 2 +
      (row.features[5] - target.Sex) ** 2
    );
    if (dist < minDist) {
      minDist = dist;
      best = row;
    }
  }

  return best;
}
function ruochen() {
  document.getElementById("organBox").style.display = "block";
  document.getElementById("lungs").classList.remove("paused");
  document.getElementById("heart").classList.remove("paused");

  const animArea = document.getElementById("animationArea");
  animArea.innerHTML = "";
  let count = 0;
  const interval = setInterval(() => {
    if (count >= 20) {
      clearInterval(interval);
      return;
    }
    const b1 = document.createElement("div");
    b1.className = "bubble vo2";
    b1.style.left = `${20 + Math.random() * 30}px`;
    animArea.appendChild(b1);
    setTimeout(() => b1.remove(), 3000);

    const b2 = document.createElement("div");
    b2.className = "bubble vco2";
    b2.style.left = `${60 + Math.random() * 30}px`;
    animArea.appendChild(b2);
    setTimeout(() => b2.remove(), 3000);

    count++;
  }, 150);
}

function updateAnimationWithData(point) {
  const heart = document.getElementById("heart");
  const lungs = document.getElementById("lungs");


  const hr = point.HR || 80;
  heart.style.animationDuration = `${Math.max(0.3, 120 / hr)}s`;

  const rr = point.RR || 15;
  lungs.style.animationDuration = `${Math.max(1, 60 / rr)}s`;


  const vo2 = point.VO2 || 2000;
  const vo2Freq = Math.min(300, 60000 / vo2);

  const vco2 = point.VCO2 || 2000;
  const vco2Freq = Math.min(300, 60000 / vco2);

  if (!window.lastVo2BubbleTime) window.lastVo2BubbleTime = 0;
  if (Date.now() - window.lastVo2BubbleTime > vo2Freq) {
    window.lastVo2BubbleTime = Date.now();
    const bubbleVo2 = document.createElement("div");
    bubbleVo2.className = "bubble vo2";
    bubbleVo2.style.left = `${30 + Math.random() * 20}px`;
    document.getElementById("animationArea").appendChild(bubbleVo2);
  }

  if (!window.lastVco2BubbleTime) window.lastVco2BubbleTime = 0;
  if (Date.now() - window.lastVco2BubbleTime > vco2Freq) {
    window.lastVco2BubbleTime = Date.now();
    const bubbleVco2 = document.createElement("div");
    bubbleVco2.className = "bubble vco2";
    bubbleVco2.style.left = `${30 + Math.random() * 20}px`;
    document.getElementById("animationArea").appendChild(bubbleVco2);
  }
}

let activeLabel = null;

function setupSliders(data) {
  const caption = document.getElementById("caption");
  document.querySelectorAll('.slider-histogram').forEach(slider => {
    const em = document.getElementById(slider.id.replace("Slider", "Val"));
    const label = document.querySelector(`label[for="${slider.id}"]`);
    slider.addEventListener('input', () => {  
      // if (slider.id === "sexSlider") {
      //   em.textContent = slider.value === "0" ? "Male" : "Female";
      // }
      if (slider.id === "ageSlider") {
        em.textContent = slider.value + " years";
      }
      if (slider.id === "weightSlider") {
        em.textContent = slider.value + " kg";
      }
      if (slider.id === "heightSlider") {
        em.textContent = slider.value + " cm";
      }
      if (activeLabel && activeLabel !== label) {
        activeLabel.style.fontWeight = 'normal';
      }
      label.style.fontWeight = 'bold';
      activeLabel = label;
    });
    slider.addEventListener('input', () => {
      const attr = slider.id.replace("Slider", "");
      const key = attr.charAt(0).toUpperCase() + attr.slice(1);
      me[key] = +slider.value;
      caption.innerText = `The distribution of the top 100 longest lasting runners' ${attr.toLowerCase()} vs. your selected ${attr.toLowerCase()}.`;
      drawHistogram(data, key);

    });
  });
  
  document.querySelectorAll('.form-histogram').forEach(form => {
    form.addEventListener('change', () => {
      const checkedRadio = form.querySelector('input[name="choice"]:checked');
      const label = document.querySelector(`label[for="${checkedRadio.id}"]`);
      if (activeLabel && activeLabel !== label) {
        activeLabel.style.fontWeight = 'normal';
      }
      label.style.fontWeight = 'bold';
      activeLabel = label;
      const attr = "sex";
      const key = attr.charAt(0).toUpperCase() + attr.slice(1);
      me[key] = +checkedRadio.value;
      caption.innerText = `The distribution of the top 100 longest lasting runners' ${attr.toLowerCase()} vs. your selected ${attr.toLowerCase()}.`;
      drawHistogram(data, key);
    });
  });

  document.querySelectorAll('.slider-line').forEach(slider => {
    const em = document.getElementById(slider.id.replace("Slider", "Val"));
    const label = document.querySelector(`label[for="${slider.id}"]`);
    slider.addEventListener('input', () => {
      if (slider.id === "temperatureSlider") {
          em.textContent = slider.value + " °C";
      }
      if (slider.id === "humiditySlider") {
        em.textContent = slider.value + " %";
      }
      if (activeLabel && activeLabel !== label) {
        activeLabel.style.fontWeight = 'normal';
      }
      label.style.fontWeight = 'bold';
      activeLabel = label;
    });
  });

  document.querySelectorAll('input[type="range"]').forEach(slider => {
    slider.addEventListener('input', () => {
      const gradient = (slider.value - slider.min) / (slider.max - slider.min) * 100 + '%';
      slider.style.setProperty('--gradient', gradient);
    });
  });
}

//scrollytelling
function onStepEnter(response) {
  response.element.classList.add('active');
}
function onStepExit(response) {
  response.element.classList.remove('active');
}

const scroller = scrollama();
scroller
  .setup({
    container: '#scrolly1',
    step: '#scrolly1 .story-step',
  })
  .onStepEnter(onStepEnter)
  .onStepExit(onStepExit);