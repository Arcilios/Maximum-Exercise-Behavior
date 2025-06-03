import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

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

  bins.forEach((bin, i) => {
    const x0 = i * binWidth + (binWidth - squareSize) / 2;
    bin.forEach((d, j) => {
      const col = Math.floor(j / maxPerCol);
      const row = j % maxPerCol;
      const xx = x0 + col * (squareSize + gap);
      const yy = height - 180 - row * (squareSize + gap);

      g.append("rect")
        .attr("x", xx)
        .attr("y", yy - squareSize)
        .attr("width", squareSize)
        .attr("height", squareSize)
        .attr("fill", "#4a90e2")
        .attr("stroke", "#2e6bbf")
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

    g.append("text")
      .attr("transform", `translate(${x0 + squareSize/2}, ${height - 180 + 18}) rotate(30)`)
      .style("text-anchor", "start")
      .style("font-size", "12px")
      .text(`${bins[i].x0.toFixed(1)} - ${bins[i].x1.toFixed(1)}`);
  });

  const special = me[attribute];
  if (special != null && !isNaN(special)) {
    const idx = bins.findIndex(bin => special >= bin.x0 && special < bin.x1);
    if (idx !== -1) {
      const binObj = bins[idx];
      const x0 = idx * binWidth + (binWidth - squareSize) / 2;
      const col = Math.floor(binObj.length / maxPerCol);
      const row = binObj.length % maxPerCol;
      const xx = x0 + col * (squareSize + gap);
      const yy = height - 180 - row * (squareSize + gap);

      g.append("rect")
        .attr("x", xx)
        .attr("y", yy - squareSize)
        .attr("width", squareSize)
        .attr("height", squareSize)
        .attr("fill", "yellow")
        .attr("stroke", "#b59f00")
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
    }
  }

  g.append("text")
    .attr("class", "x-axis-label")
    .attr("x", width / 2)
    .attr("y", height - 100)
    .style("font-size", "16px")
    .text(attribute.charAt(0).toUpperCase() + attribute.slice(1));
}


document.getElementById("submit").addEventListener("click", () => {
  me.Temperature = +document.getElementById("temperatureInput").value;
  me.Humidity    = +document.getElementById("humidityInput").value;

  const nearest = findNearest(data2, me);

  matched = dataset.find(p =>
    Math.abs(p.features[0] - nearest.Age) < 2 &&
    Math.abs(p.features[1] - nearest.Weight) < 2 &&
    Math.abs(p.features[2] - nearest.Height) < 2 &&
    Math.abs(p.features[3] - me.Humidity) < 2 &&
    Math.abs(p.features[4] - me.Temperature) < 1 &&
    p.features[5] == nearest.Sex
  );

  const physMatch = phys.find(p => p.ID === nearest.ID);

if (!matched || !physMatch) {
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
      ["Age", "Weight", "Height", "Sex"].reduce((sum, k) => sum + (row[k] - target[k]) ** 2, 0)
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
  document.querySelectorAll('input[type="range"]').forEach(slider => {
    const em = document.getElementById(slider.id.replace("Slider", "Val"));
    const label = document.querySelector(`label[for="${slider.id}"]`);
    slider.addEventListener('input', () => {  
      if (slider.id === "sexSlider") {
        em.textContent = slider.value === "0" ? "Male" : "Female";
      }
      else {
        em.textContent = slider.value;
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

      const gradient = (slider.value - slider.min) / (slider.max - slider.min) * 100 + '%';
      slider.style.setProperty('--gradient', gradient);
    });
  });
}
