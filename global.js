import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
// Act 1
  function drawD3HistogramObjectData(data, attribute, binCount = 5, squareSize = 10, gap = 4, maxSquaresPerColumn = 20, me = null) {
    const svg = d3.select("#histogram");
    svg.selectAll("*").remove();
    const tooltip = d3.select("#tooltip");

    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const margin = { top: 40, right: 30, bottom: 80, left: 50 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    let filteredData = data.filter(d => typeof d[attribute] === "number");


const xScale = d3.scaleLinear()
  .domain(d3.extent(filteredData, d => d[attribute]))
  .nice(binCount)
  .range([0, plotWidth]);

let bins = d3.bin()
  .value(d => d[attribute])
  .domain(xScale.domain())
  .thresholds(xScale.ticks(binCount))(filteredData);

    bins = bins.filter(bin => bin.length > 0);
    const binWidth = plotWidth / bins.length;

    // Draw squares and labels
    bins.forEach((bin, i) => {
      const x = i * binWidth + (binWidth - squareSize) / 2;
      bin.forEach((d, j) => {
        const col = Math.floor(j / maxSquaresPerColumn);
        const row = j % maxSquaresPerColumn;

        const squareX = x + col * (squareSize + gap);
        const squareY = plotHeight - row * (squareSize + gap);

        g.append("rect")
          .attr("x", squareX)
          .attr("y", squareY - squareSize)
          .attr("width", squareSize)
          .attr("height", squareSize)
          .attr("fill", "#4a90e2")
          .attr("stroke", "#2e6bbf")
          .on("mouseover", (event) => {
            tooltip
            .style("opacity", 1)
            .html(`
              <div><strong>ID:</strong> ${d.ID ?? "Unknown"}</div>
              <div><strong>${attribute}:</strong> ${d[attribute]}</div>
            `);
          })
          .on("mousemove", (event) => {
            tooltip
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 20) + "px");
          })
          .on("mouseout", () => {
            tooltip.style("opacity", 0);
          });
      });

      // Bin label (below bar)
      g.append("text")
        .attr("x", x + squareSize / 2)
        .attr("y", plotHeight + 18)
        .attr("class", "bar-label")
        .text(`${bin.x0.toFixed(1)} - ${bin.x1.toFixed(1)}`);
    });

    // X-Axis Attribute Label (only)

    let specialValue = me[attribute];
    console.log(specialValue)
    g.append("text")
      .attr("class", "x-axis-label")
      .attr("x", plotWidth / 2)
      .attr("y", plotHeight + 50)
      .text(attribute.charAt(0).toUpperCase() + attribute.slice(1)); // Capitalize

      if (specialValue !== null && !isNaN(specialValue)) {
        const binIndex = bins.findIndex(bin => specialValue >= bin.x0 && specialValue < bin.x1);
      
        if (binIndex !== -1) {
          const bin = bins[binIndex];
          const x = binIndex * binWidth + (binWidth - squareSize) / 2;
      
          const col = Math.floor(bin.length / maxSquaresPerColumn);
          const row = bin.length % maxSquaresPerColumn;
      
          const squareX = x + col * (squareSize + gap);
          const squareY = plotHeight - row * (squareSize + gap);
      
          g.append("rect")
            .attr("x", squareX)
            .attr("y", squareY - squareSize)
            .attr("width", squareSize)
            .attr("height", squareSize)
            .attr("fill", "yellow")
            .attr("stroke", "#b59f00")
            .on("mouseover", (event) => {
              tooltip
                .style("opacity", 1)
                .html(`<strong>${attribute} (you):</strong> ${specialValue}`);
            })
            .on("mousemove", (event) => {
              tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", () => {
              tooltip.style("opacity", 0);
            });
        }
      }
      
  }

  async function loadCSV(filePath) {
    const columnsToConvert = ['Age', 'HR', 'Height', 'ID', 'Sex', 'Weight', 'time', 'VO2', 'RR', 'VCO2', 'VE'];
  
    const data = await d3.csv(filePath, row => {
      const converted = { ...row };
  
      columnsToConvert.forEach(col => {
        if (col in row && row[col] !== '') {
          const num = Number(row[col]);
          converted[col] = isNaN(num) ? null : num;
        }
      });
  
      return converted;
    });
  
    return data;
  }

  function createLabels(){
    /*
    document.querySelectorAll('label').forEach(label => {
        const rangeInput = label.querySelector('input[type="range"]');
        const em = label.querySelector('em');
    
        // Set initial value
        em.textContent = rangeInput.value;
    
        // Update on input
        rangeInput.addEventListener('input', () => {
          em.textContent = rangeInput.value;
        });
        rangeInput.addEventListener
      });
      */
    let caption = document.querySelector("#caption");
    document.querySelectorAll('input[type="range"]').forEach(slider => {
        const em = slider.nextElementSibling; // the <em> element
      
        // Update <em> live
        slider.addEventListener('input', () => {
          em.textContent = slider.value;
        });
      
        // On release (user stops dragging)
        slider.addEventListener('change', () => {
          const attribute = slider.dataset.attribute;
          const value = +slider.value;
          me[attribute] = value;
          caption.innerText = `The distribution of the top 100 longest lasting runners' 
            ${slider.dataset.attribute} vs. your selected ${slider.dataset.attribute}`
      
          // Redraw histogram for the changed attribute
          drawD3HistogramObjectData(data, attribute, 5, 10, 4, 20, me);
        });
      });
  }


let me = {ID : 'You', Age : 35, Weight : 75 ,Height : 175 ,Sex : 0.5};
let data = await loadCSV('output.csv');
console.log(data);
createLabels();
//drawD3HistogramObjectData(data, "time"); 
console.log(me);
drawD3HistogramObjectData(data, "Height", 5, 10, 4, 20, me);
console.log("hi");
// Act 2
function findNearestNeighbor(data, newRow, skipFirst = true) {
  // Get column names, skipping index/ID if specified
  const columns = skipFirst ? data.columns.slice(1) : data.columns;

  // Compute mean and std for each column
  const stats = {};
  columns.forEach(col => {
    const values = data.map(d => d[col]);
    const allNumeric = values.every(v => typeof v === 'number' && !isNaN(v));
    if (allNumeric) {
      stats[col] = {
        mean: d3.mean(values),
        std: d3.deviation(values)
      };
    }
  });

  // Helper to standardize a single row
  function standardizeRow(row) {
    const result = {};
    columns.forEach(col => {
      const val = +row[col];
      const { mean, std } = stats[col] || {};
      if (!isNaN(val) && std && std !== 0) {
        result[col] = (val - mean) / std;
      }
    });
    return result;
  }

  // Standardize the input row
  const standardizedInput = standardizeRow(newRow);

  // Standardize all rows and compute distances
  let minDist = Infinity;
  let nearest = null;

  data.forEach(originalRow => {
    const standardizedRow = standardizeRow(originalRow);

    // Compute Euclidean distance
    const dist = columns.reduce((sum, col) => {
      const a = standardizedInput[col];
      const b = standardizedRow[col];
      if (!isNaN(a) && !isNaN(b)) {
        return sum + Math.pow(a - b, 2);
      }
      return sum;
    }, 0);

    if (dist < minDist) {
      minDist = dist;
      nearest = originalRow;
    }
  });

  return nearest;
}

function ruochen(person){
  console.log(person);
  const rr = person.RR;
     const hr = person.HR;
     const ve = person.VE;
     const vo2 = person.VO2;
     const vco2 = person.VCO2;


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
}

let submit = d3.select("#submit");
let stage = d3.select('#act-2');
let data2 = await loadCSV("demo.csv");
console.log(stage);
let phys = await loadCSV("demo2.csv");

submit.on("click", (event) => {
  d3.select('#act-2')
  .selectAll('*:not(#submit)')
  .remove();
  let closeEnough = findNearestNeighbor(data2,me);
  let closePhys = phys.find(d => d.ID === closeEnough.ID);
  console.log(closePhys);
  

  const entries = Object.entries(closePhys).filter(([key]) => key !== 'ID');
stage
  .append('h2')
  .text('Predicted Physiology:');

stage
  .append('div')
  .attr('class', 'tuple-display')
  .style('padding', '10px')
  .style('border', '1px solid #ccc')
  .style('border-radius', '6px')
  .style('margin', '10px 0')
  .style('background', '#f9f9f9');
let box = d3.select('.tuple-display');
// Add each key-value pair as a row
entries.forEach(([key, value]) => {
  box.append('div')
    .style('margin', '4px 0')
    .html(`<strong>Mean ${key}:</strong> ${value}`);
});

const container = document.querySelector('#act-2'); // replace with your actual selector

// Create the div
const newDiv = document.createElement('div');
newDiv.classList.add('img-holder')

// Create the first image
const lungImg = document.createElement('img');
lungImg.src = 'img/lung.png';
lungImg.id = 'lungs';
lungImg.className = 'breath';

// Create the second image
const heartImg = document.createElement('img');
heartImg.src = 'img/heart.png';
heartImg.id = 'heart';
heartImg.className = 'heartbeat';

// Append images to the div
newDiv.appendChild(lungImg);
newDiv.appendChild(heartImg);

const animationDiv = document.createElement('div');
animationDiv.className = 'animation-container';
animationDiv.id = 'animationArea';

// Append both new divs to the container
container.appendChild(newDiv);
container.appendChild(animationDiv);

ruochen(closePhys);


  
})
