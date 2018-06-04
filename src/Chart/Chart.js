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

  const xScaleDomain = d3.extent(
    libraryDates
      .reduce((result, hit) => [...result, hit.seq], [])
      .map((date, i) => {
        if (i == 0) {
          date.setDate(1);
        }
        if (i == libraryDates.length - 1) {
          date.setDate(30);
        }
        return date;
      })
  );

  const xScale = d3
      .scaleTime()
      .range([0, windowDim.width])
      .domain(xScaleDomain),
    yScale = d3
      .scaleLinear()
      .range([windowDim.height, 0])
      .domain([0, d3.max(libraryDates, d => d.accCellCount)]),
    line = d3
      .line()
      .x(d => xScale(d.seq))
      .y(d => yScale(d.accCellCount))
      .curve(d3.curveBasis);

  function initializeEndClick(chart) {
    d3.select("body").on("mousedown", function(d) {
      if (d3.event.which == 1) {
        d3.selectAll("*").transition();
        d3
          .selectAll(chart)
          .interrupt()
          .style("opacity", 0)
          .classed("clicked", true);
        return true;
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
  function initializeXaxis(mainSvg) {
    mainSvg
      .append("g")
      .attr("class", "xAxis")
      .attr(
        "transform",
        "translate(" + margin.left + "," + (windowDim.height + margin.top) + ")"
      )
      .call(
        d3
          .axisBottom(xScale)
          .tickFormat(d3.timeFormat("%b %Y"))
          .ticks(d3.timeMonth)
      );

    mainSvg
      .append("text")
      .attr("class", "xAxis")
      .attr(
        "transform",
        "translate(" +
          windowDim.width / 2 +
          " ," +
          (windowDim.height + margin.top * 2) +
          ")"
      )
      .style("text-anchor", "middle")
      .text("Date");
  }
  function initializeYaxis(mainSvg) {
    mainSvg
      .append("g")
      .attr("class", "yAxis")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .call(
        d3
          .axisLeft(yScale)
          .tickSize(-windowDim.width)
          .ticks(10)
      );

    mainSvg
      .append("text")
      .attr("class", "yAxis")
      .attr("text-anchor", "middle")
      .attr(
        "transform",
        "translate(" +
          margin.left / 2 +
          "," +
          windowDim.height / 2 +
          ")rotate(-90)"
      )
      .text("Cells Sequenced");
  }

  function hideElement(element) {
    d3.selectAll(element).style("opacity", 0);
  }
  function showElement(element) {
    d3.selectAll(element).style("opacity", 1);
  }
  return (
    <div>
      <LineChart
        stats={stats}
        margin={margin}
        windowDim={windowDim}
        line={line}
        initializeEndClick={initializeEndClick}
        initializeSvg={initializeSvg}
        initializeYaxis={initializeYaxis}
        initializeXaxis={initializeXaxis}
        hideElement={hideElement}
        showElement={showElement}
      />
      <CircleChart
        library={library}
        samples={samples}
        stats={stats}
        margin={margin}
        windowDim={windowDim}
        xScale={xScale}
        line={line}
        initializeEndClick={initializeEndClick}
        initializeSvg={initializeSvg}
        initializeXaxis={initializeXaxis}
        hideElement={hideElement}
        showElement={showElement}
      />
    </div>
  );
};
export default Chart;
