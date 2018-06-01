import React, { Component } from "react";
import * as d3 from "d3";
import * as moment from "moment";
import { select } from "d3";
import "d3-transition";
import LineChart from "./LineChart.js";
import CircleChart from "./CircleChart.js";

const Chart = ({ stats, library, samples }) => {
  const libraryDates = stats.libraryDates;
  const windowDim = {
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    width: window.innerWidth * 0.9,
    height: window.innerHeight * 0.8
  };

  const margin = {
    top: windowDim.screenHeight / 15,
    right: 10,
    bottom: 5,
    left: windowDim.screenWidth / 15,
    general: 10
  };

  const xScale = d3
      .scaleTime()
      .range([0, windowDim.width])
      .domain(
        d3.extent(
          libraryDates.reduce((result, hit) => [...result, hit.seq], [])
        )
      ),
    yScale = d3
      .scaleLinear()
      .range([windowDim.height, 0])
      .domain([0, d3.max(libraryDates, d => d.accCellCount)]),
    line = d3
      .line()
      .x(d => xScale(d.seq))
      .y(d => yScale(d.accCellCount))
      .curve(d3.curveBasis);

  const lineChartClasses =
    ".LineChart .xAxis,.LineChart .area,.LineChart .line, .LineChart text, .LineChart .yAxis, .Counter";

  function initializeEndClick() {
    d3.select("body").on("mousedown", function(d) {
      if (d3.event.which == 1) {
        d3.selectAll("*").transition();
        d3
          .selectAll(lineChartClasses)
          .interrupt()
          .style("opacity", 0)
          .classed("clicked", true);
      }
    });
  }

  function initializeSvg(type) {
    return d3
      .selectAll(type)
      .attr("width", windowDim.screenWidth)
      .attr("height", windowDim.screenHeight)
      .classed("svg-container", true)
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr(
        "viewBox",
        "0 0 " + windowDim.screenWidth + " " + windowDim.screenHeight + ""
      )
      .classed("svg-content-responsive", true);
  }

  return (
    <div>
      <LineChart
        stats={stats}
        margin={margin}
        windowDim={windowDim}
        xScale={xScale}
        yScale={yScale}
        line={line}
        initializeEndClick={initializeEndClick}
        initializeSvg={initializeSvg}
      />
      <CircleChart
        library={library}
        samples={samples}
        stats={stats}
        margin={margin}
        windowDim={windowDim}
        xScale={xScale}
        yScale={yScale}
        line={line}
        initializeEndClick={initializeEndClick}
        initializeSvg={initializeSvg}
      />
    </div>
  );
};
export default Chart;
