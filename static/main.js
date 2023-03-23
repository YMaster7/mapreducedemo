document.getElementById("fetchData").addEventListener("click", async () => {
  const inputText = document.getElementById("inputText").value;
  const numMappers = document.getElementById("numMappers").value;
  const numReducers = document.getElementById("numReducers").value;
  const response = await fetch("/wordcount", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input_data: inputText,
      mapper_count: numMappers,
      reducer_count: numReducers,
    }),
  });
  const data = await response.json();
  visualize(data);
});

function visualize(data) {
  const container = d3.select("#visualization");
  container.html(""); // Clear previous visualization

  // Display mapper input
  container.append("h2").text("Mapper Input");
  const mapperInputGroup = container.append("div").attr("class", "row");
  data.mapper_input.forEach((input, index) => {
    mapperInputGroup
      .append("div")
      .attr("class", "col-md-4 mb-2")
      .append("div")
      .attr("class", "card")
      .append("div")
      .attr("class", "card-body")
      .append("pre")
      .text(`${JSON.stringify(input, null, 2)}`);
  });

  // Group mapper output by mapper index
  const mapperOutputByMapper = data.mapper_output.reduce((acc, output) => {
    if (!acc[output.mapper]) {
      acc[output.mapper] = [];
    }
    acc[output.mapper].push(output);
    return acc;
  }, {});

  // Display mapper output
  container.append("h2").text("Mapper Output");
  const mapperOutputGroup = container.append("div").attr("class", "row");
  Object.entries(mapperOutputByMapper).forEach(([mapper, outputs]) => {
    const mapperOutputs = outputs
      .map((output) => `${output.word}: ${output.count}`)
      .join(", ");
    mapperOutputGroup
      .append("div")
      .attr("class", "col-md-4 mb-2")
      .append("div")
      .attr("class", "card")
      .append("div")
      .attr("class", "card-body")
      .append("pre")
      .text(`Mapper ${parseInt(mapper) + 1}: ${mapperOutputs}`);
  });

  // Group reducer output by reducer index
  const reducerOutputByReducer = data.reducer_output.reduce((acc, output) => {
    if (!acc[output.reducer]) {
      acc[output.reducer] = [];
    }
    acc[output.reducer].push(output);
    return acc;
  }, {});

  // Display reducer output
  container.append("h2").text("Reducer Output");
  const reducerOutputGroup = container.append("div").attr("class", "row");
  Object.entries(reducerOutputByReducer).forEach(([reducer, outputs]) => {
    const reducerOutputs = outputs
      .map((output) => `${output.word}: ${output.count}`)
      .join(", ");
    reducerOutputGroup
      .append("div")
      .attr("class", "col-md-4 mb-2")
      .append("div")
      .attr("class", "card")
      .append("div")
      .attr("class", "card-body")
      .append("pre")
      .text(`Reducer ${parseInt(reducer) + 1}: ${reducerOutputs}`);
  });

  // Remaining code for drawing the bar chart

  // Visualize the reducer_output using a bar chart
  const margin = { top: 30, right: 30, bottom: 70, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = container
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Create X and Y scales
  const x = d3.scaleBand().range([0, width]).padding(0.2);
  const y = d3.scaleLinear().range([height, 0]);

  // Set the domains for the X and Y scales
  x.domain(data.reducer_output.map((d) => d.word));
  y.domain([0, d3.max(data.reducer_output, (d) => d.count)]);

  // Draw the X axis
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

  // Draw the Y axis
  svg.append("g").call(d3.axisLeft(y));

  // Draw the bars
  svg
    .selectAll(".bar")
    .data(data.reducer_output)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => x(d.word))
    .attr("y", (d) => y(d.count))
    .attr("width", x.bandwidth())
    .attr("height", (d) => height - y(d.count))
    .attr("fill", "steelblue");
}
