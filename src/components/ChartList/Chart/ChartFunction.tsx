import { Layout, PlotData, Shape, Annotations } from "plotly.js";
import { LatestResult, Parameter } from "../../../react-app-env";

// WHO guidelines
const WHO_PM25_GUIDELINE = 15;
const WHO_PM10_GUIDELINE = 45;

/** Build a big scatter chart's data. No Hooks. */
export function calculateBigChart(chart: string, locations: LatestResult[]): Partial<PlotData>[] {
  const parameters: (Parameter & { guideline: number })[] = [
    {
      name: "PM10 µg/m³",
      value: "pm10",
      min: 0,
      max: 1000,
      guideline: WHO_PM10_GUIDELINE,
    },
    {
      name: "PM2.5 µg/m³",
      value: "pm25",
      min: 0,
      max: 500,
      guideline: WHO_PM25_GUIDELINE,
    },
  ];

  const colors = ["#e9c46a", "#2a9d8f"];
  const traces: Partial<PlotData>[] = [];
  const xValues = locations.map((_, idx) => idx);

  parameters.forEach((para, index) => {
    const xWithin: number[] = [];
    const yWithin: number[] = [];
    const hoverWithin: string[] = [];

    const xExceeds: number[] = [];
    const yExceeds: number[] = [];
    const hoverExceeds: string[] = [];

    locations.forEach((data, idx) => {
      const measurement = data.measurements.find(m => m.parameter === para.value);
      if (!measurement) return;
      if (measurement.value >= para.min && measurement.value <= para.max) {
        const value = measurement.value;
        const locationName = data.location + (data.city ? `, ${data.city}` : "");
        const hoverText = `${locationName}<br>${para.name}: ${value.toFixed(2)} µg/m³${
          value > para.guideline ? ` (Exceeds WHO guideline of ${para.guideline} µg/m³)` : ""
        }`;
        if (value > para.guideline) {
          xExceeds.push(idx);
          yExceeds.push(value);
          hoverExceeds.push(hoverText);
        } else {
          xWithin.push(idx);
          yWithin.push(value);
          hoverWithin.push(hoverText);
        }
      }
    });

    if (xWithin.length > 0) {
      traces.push({
        type: "scatter",
        x: xWithin,
        y: yWithin,
        mode: "markers",
        name: `${para.name} Within Guidelines`,
        marker: {
          color: colors[index],
          symbol: "circle",
          size: 10,
          line: { color:"#000000", width:1 },
        },
        text: hoverWithin,
        hoverinfo: "text",
        showlegend: true,
      });
    }
    if (xExceeds.length > 0) {
      traces.push({
        type: "scatter",
        x: xExceeds,
        y: yExceeds,
        mode: "markers",
        name: `${para.name} Exceeds Guidelines`,
        marker: {
          color: colors[index],
          symbol: "triangle-up",
          size: 10,
          line:{ color:"#000000", width:1},
        },
        text: hoverExceeds,
        hoverinfo:"text",
        showlegend:true,
      });
    }
    // WHO Guideline line
    traces.push({
      type: "scatter",
      x: [0, xValues.length - 1],
      y: [para.guideline, para.guideline],
      mode:"lines",
      name:`WHO Guideline (${para.name})`,
      line:{
        color: colors[index],
        dash:"dash",
        width:2
      },
      hoverinfo:"none",
      showlegend:true,
    });
  });

  return traces;
}

/** Build a layout for the big scatter chart. No Hooks. */
export function calculateBigLayout(chart: string, locations: LatestResult[], width:number, height:number): Partial<Layout> {
  return {
    width: width - 40,
    height: height - 45,
    title: `Air Pollution - from ${locations.length} Stations`,
    xaxis: {
      showgrid:false,
      showline:false,
      showticklabels:false,
    },
    yaxis: {
      title:"Concentration (µg/m³)",
    },
    margin:{ l:60, r:10, t:80, b:40 },
    legend:{ x:0, y:1, font:{ size:15}, yanchor:"top", xanchor:"left"},
    hovermode:"closest",
  };
}

/** Build bar chart data + averages for the average chart. */
export function calculateAverageChart(locations: LatestResult[]): { data:Partial<PlotData>[], averages:any} {
  const parameters: (Parameter & { guideline:number })[] = [
    { name:"PM10", value:"pm10", min:0, max:1000, guideline:WHO_PM10_GUIDELINE},
    { name:"PM2.5", value:"pm25", min:0, max:500, guideline:WHO_PM25_GUIDELINE},
  ];
  const averages = parameters.map(para => {
    const values = locations
      .map(loc => loc.measurements.find(m => m.parameter===para.value)?.value ?? null)
      .filter((v): v is number => v!==null && v>=para.min && v<=para.max);

    const avg = values.length? values.reduce((a,b)=>a+b,0)/values.length : 0;
    return { parameter: para.name, average: avg, guideline: para.guideline };
  });

  const traceAverage: Partial<PlotData> = {
    x: averages.map(a=>a.parameter),
    y: averages.map(a=>a.average),
    type: "bar",
    name:"Average",
    marker:{
      color: averages.map(a=> a.average> a.guideline? "#d62828":"#2a9d8f"),
    },
    text: averages.map(a=> a.average.toFixed(2)+" µg/m³"),
    textposition:"auto",
    hoverinfo:"x+y",
  };
  return { data:[traceAverage], averages };
}

export function calculateAverageLayout(
  averages: { parameter:string; guideline:number; average:number}[],
  _width:number,
  _height:number
): Partial<Layout> {
  // We ignore _width and _height and define a small fixed layout.
  const maxY = Math.max(...averages.map(a=> Math.max(a.average,a.guideline)));
  const yAxisMax = maxY * 1.2;

  // We'll keep shapes for WHO lines
  const shapes: Partial<Shape>[] = averages.map((a,idx)=>({
    type:"line",
    x0: idx-0.4,
    x1: idx+0.4,
    y0: a.guideline,
    y1: a.guideline,
    xref:"x",
    yref:"y",
    line:{ color:"#000000", dash:"dash", width:2}
  }));

  // We'll keep annotations if we want
  const annotations: Partial<Annotations>[] = averages.map((a,idx)=>({
    x: a.parameter,
    y: a.guideline,
    xref:"x",
    yref:"y",
    text: `WHO Guideline: ${a.guideline} µg/m³`,
    showarrow:false,
    // yshift:-10,
    font:{ color:"#000", size:12},
  }));

  // Return a smaller layout perfect for a mini chart ~ 280×240 container
  return {
    width: 280,
    height: 240,
    title: "Avg Air Pollution",
    xaxis: { title:"Concentration (µg/m³)" },
    yaxis: { range:[0,yAxisMax] },
    // margin: { l:40, r:20, b:40, t:40 },
    shapes,
    annotations,
    legend: {
      x:0, y:1, font:{ size:12 },
      yanchor:"top",
      xanchor:"left"
    },
  };
}
