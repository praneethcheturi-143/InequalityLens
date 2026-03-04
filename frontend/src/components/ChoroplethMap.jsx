import { useEffect, useRef, useState } from "react";
import { useAPI } from "../hooks/useAPI";
import { api } from "../utils/api";
import * as d3 from "d3";

const METRIC_OPTIONS = [
  { value: "gini_index",       label: "Gini index" },
  { value: "gdp_per_capita",   label: "GDP per capita" },
  { value: "life_expectancy",  label: "Life expectancy" },
  { value: "poverty_rate",     label: "Poverty rate" },
];

export default function ChoroplethMap() {
  const { data, loading, error } = useAPI(api.choropleth);
  const [metric, setMetric] = useState("gini_index");
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const width = svgRef.current.clientWidth || 900;
    const height = 480;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const byCode = {};
    data.forEach(d => { byCode[d.country_code] = d; });

    const values = data.map(d => d[metric]).filter(v => v != null);
    const colorScale = d3.scaleSequential(d3.interpolateRdYlGn)
      .domain(metric === "gini_index" || metric === "poverty_rate"
        ? [d3.max(values), d3.min(values)]  // invert: low = green (good)
        : [d3.min(values), d3.max(values)]);

    const projection = d3.geoNaturalEarth1()
      .scale(width / 6.4)
      .translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);

    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then(world => {
        const { feature } = require("topojson-client");
        const countries = feature(world, world.objects.countries);

        // ISO numeric → ISO3 mapping (subset)
        const numToAlpha = {"4":"AFG","8":"ALB","12":"DZA","24":"AGO","32":"ARG","36":"AUS",
          "40":"AUT","50":"BGD","56":"BEL","68":"BOL","76":"BRA","100":"BGR","116":"KHM",
          "120":"CMR","124":"CAN","152":"CHL","156":"CHN","170":"COL","178":"COG",
          "188":"CRI","191":"HRV","192":"CUB","203":"CZE","204":"BEN","208":"DNK",
          "218":"ECU","818":"EGY","231":"ETH","246":"FIN","250":"FRA","276":"DEU",
          "288":"GHA","300":"GRC","320":"GTM","332":"HTI","348":"HUN","356":"IND",
          "360":"IDN","364":"IRN","368":"IRQ","372":"IRL","376":"ISR","380":"ITA",
          "388":"JAM","392":"JPN","404":"KEN","410":"KOR","414":"KWT","430":"LBR",
          "454":"MWI","458":"MYS","484":"MEX","504":"MAR","508":"MOZ","516":"NAM",
          "524":"NPL","528":"NLD","566":"NGA","578":"NOR","586":"PAK","591":"PAN",
          "604":"PER","608":"PHL","616":"POL","620":"PRT","630":"PRI","642":"ROU",
          "643":"RUS","682":"SAU","686":"SEN","694":"SLE","706":"SOM","710":"ZAF",
          "724":"ESP","752":"SWE","756":"CHE","764":"THA","768":"TGO","788":"TUN",
          "792":"TUR","800":"UGA","804":"UKR","826":"GBR","840":"USA","858":"URY",
          "862":"VEN","704":"VNM","894":"ZMB","716":"ZWE"};

        svg.append("g")
          .selectAll("path")
          .data(countries.features)
          .join("path")
          .attr("d", path)
          .attr("fill", d => {
            const code = numToAlpha[String(d.id)];
            const row = code ? byCode[code] : null;
            const val = row?.[metric];
            return val != null ? colorScale(val) : "#e5e5e5";
          })
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.3)
          .style("cursor", "pointer")
          .on("mouseover", (event, d) => {
            const code = numToAlpha[String(d.id)];
            const row = code ? byCode[code] : null;
            if (row) setTooltip({ x: event.clientX, y: event.clientY, data: row });
          })
          .on("mousemove", (event) => {
            setTooltip(t => t ? { ...t, x: event.clientX, y: event.clientY } : t);
          })
          .on("mouseout", () => setTooltip(null));

        // Legend
        const legendW = 200, legendH = 12;
        const legendX = width - legendW - 20, legendY = height - 40;
        const defs = svg.append("defs");
        const grad = defs.append("linearGradient").attr("id", "legend-grad");
        const stops = d3.range(0, 1.01, 0.1);
        stops.forEach(t => {
          grad.append("stop").attr("offset", `${t*100}%`)
              .attr("stop-color", colorScale(colorScale.domain()[0] + t*(colorScale.domain()[1]-colorScale.domain()[0])));
        });
        svg.append("rect")
          .attr("x", legendX).attr("y", legendY)
          .attr("width", legendW).attr("height", legendH)
          .style("fill", "url(#legend-grad)");
        svg.append("text").attr("x", legendX).attr("y", legendY - 4)
          .attr("font-size", 10).attr("fill", "#666")
          .text(METRIC_OPTIONS.find(m => m.value === metric)?.label || metric);
      });
  }, [data, metric]);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>World inequality map</h2>
        <select value={metric} onChange={e => setMetric(e.target.value)} className="select">
          {METRIC_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>
      {loading && <div className="loading-msg">Loading map data…</div>}
      {error && <div className="error-msg">Backend not connected — run the API locally. ({error})</div>}
      <div className="map-container">
        <svg ref={svgRef} width="100%" height="480" />
      </div>
      {tooltip && (
        <div className="tooltip" style={{ left: tooltip.x + 12, top: tooltip.y - 30 }}>
          <strong>{tooltip.data.country_name}</strong>
          {Object.entries(tooltip.data)
            .filter(([k]) => k !== "country_code" && k !== "country_name")
            .map(([k, v]) => (
              <div key={k}>{k.replace(/_/g, " ")}: {typeof v === "number" ? v.toFixed(1) : v}</div>
            ))}
        </div>
      )}
    </div>
  );
}
