import React, { Component } from "react";
import * as d3 from "d3";
import * as moment from "moment";
import { select } from "d3";
import "d3-transition";
import LineChart from "./LineChart.js";
import CircleChart from "./CircleChart.js";

const Chart = ({ stats, library, samples }) => {
  //Chart dimensions according to screen size
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

  // X & Y scales for line chart, based on time and number of cells sequenced
  const xScale = d3
      .scaleTime()
      .range([0, windowDim.width])
      .domain(
        d3.extent(
          stats.libraryDates
            .reduce((result, hit) => [...result, hit.seq], [])
            .map((date, i) => {
              if (i === 0) {
                date.setDate(1);
              }
              if (i === stats.libraryDates.length - 1) {
                date.setDate(30);
              }
              return date;
            })
        )
      ),
    yScale = d3
      .scaleLinear()
      .range([windowDim.height, 0])
      .domain([0, d3.max(stats.libraryDates, d => d.accCellCount)]),
    line = d3
      .line()
      .x(d => xScale(d.seq))
      .y(d => yScale(d.accCellCount))
      .curve(d3.curveBasis);

  const lineChartClasses =
    ".LineChart .xAxis,.LineChart .line, .LineChart text, .LineChart .yAxis, .Counter, .sepLines";

  /**
   * Initializes skip intro animation and goes to end.
   *
   * @param {String} chart - Class names for given chart.
   */
  function initializeEndClick(chart) {
    d3.select("body").on("mousedown", function(d) {
      if (d3.event.which === 1) {
        d3.select(".LineChart").classed("clicked", true);
        d3.selectAll("*").transition();

        hideElement(lineChartClasses);
        d3.selectAll(lineChartClasses).classed("clicked", true);

        goToEndAnimation(true);
        completeLineChart();
        removeEndClickListener();
        return true;
      }
    });
  }
  function hideChart() {
    d3
      .selectAll(lineChartClasses)
      .transition()
      .delay(8000)
      .style("opacity", 0);
  }

  function removeEndClickListener() {
    d3.select("body").on("mousedown", null);
  }
  /**
   * Initializes an svg element.
   *
   * @param {String} type - Class name for given svg.
   */
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

  /**
   * Initializes and appends X axis for a given svg element.
   *
   * @param {Object} mainSvg - A given svg element.
   */
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

  /**
   * Initializes and appends Y axis for a given svg element.
   *
   * @param {Object} mainSvg - A given svg element.
   */
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

  /**
   * Hide a given element.
   *
   * @param {Object} element - A given dom element.
   */
  function hideElement(element) {
    d3.selectAll(element).style("opacity", 0);
  }

  /**
   * Show a given element.
   *
   * @param {Object} element - A given dom element.
   */
  function showElement(element) {
    d3.selectAll(element).style("opacity", 1);
  }
  function completeLineChart() {
    d3
      .select("#rectClip rect")
      .transition()
      .duration(0)
      .ease(d3.easeSinInOut)
      .attr("width", windowDim.width);
  }

  function goToEndAnimation(isStaticTransition) {
    d3
      .selectAll("circle")
      .on("mouseenter", showDetail)
      .on("mouseleave", hideDetail)
      .transition()
      .delay(function() {
        return isStaticTransition ? 0 : 12000;
      })
      .duration(function() {
        return isStaticTransition ? 0 : 200;
      })
      .style("opacity", 1)
      .transition()
      .delay(function(d, i) {
        return isStaticTransition ? 0 : i * 10 + 500;
      })
      .duration(function() {
        return isStaticTransition ? 0 : 1000;
      })
      .attr("cx", function(d, i) {
        return d.x;
      })
      .attr("cy", function(d, i) {
        return d.y;
      })
      .transition()
      .delay(function() {
        return isStaticTransition ? 0 : 200;
      })
      .duration(1000)
      .attr("r", function(d) {
        return d.r;
      })
      .on("end", function() {
        showElement(".toggles");
        showElement(".switchViews");
      });
  }
  function showDetail(d) {
    d3
      .select(".tooltip")
      .classed("hover", true)
      .html(
        "<b>Sample</b>: " +
          d.data.sample +
          "<br/> <b>Library</b>: " +
          d.data.library +
          "<br /> <b>Total Cells</b>: " +
          d.data.size +
          "<br /> <b>Seq Date</b>: " +
          d3.timeFormat("%Y-%m-%d")(d.data.seq)
      )
      .style("left", d3.event.pageX + "px")
      .style("top", d3.event.pageY + "px");
  }

  function hideDetail() {
    d3
      .select(".tooltip")
      .classed("hover", false)
      .style("left", "0px")
      .style("top", "0px");
  }
  return (
    <div className="Charts">
      <LineChart
        stats={stats}
        margin={margin}
        windowDim={windowDim}
        line={line}
        xScale={xScale}
        yScale={yScale}
        hideChart={hideChart}
        initializeSvg={initializeSvg}
        initializeYaxis={initializeYaxis}
        initializeXaxis={initializeXaxis}
        hideElement={hideElement}
        showElement={showElement}
        showDetail={showDetail}
        hideDetail={hideDetail}
      />
      <CircleChart
        library={library}
        samples={samples}
        stats={stats}
        margin={margin}
        windowDim={windowDim}
        xScale={xScale}
        goToEndAnimation={goToEndAnimation}
        initializeEndClick={initializeEndClick}
        initializeSvg={initializeSvg}
        initializeXaxis={initializeXaxis}
        hideElement={hideElement}
        showElement={showElement}
        hideDetail={hideDetail}
      />
    </div>
  );
};
export default Chart;
