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

  //Global margins
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
  /**
   * Hide the line chart with a delay
   */
  function hideChart() {
    d3
      .selectAll(lineChartClasses)
      .transition()
      .delay(6000)
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

  /**
   * Go to the end of the circle animation
   *
   * @param {Object} isStaticTransition - if true there is no delay or transition duration
   */
  function goToEndAnimation(isStaticTransition) {
    d3
      .selectAll("circle")
      .on("mouseenter", d => showTooltip(d, false))
      .on("mouseleave", hideTooltip)
      .transition()
      .delay(function() {
        return isStaticTransition ? 0 : 10000;
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
        removeEndClickListener();
      });
  }

  /**
   * Show the tooltip.
   *
   * @param {Object} d - data of hovered element
   * @param {boolean} isLineGraph - if true display different text
   */
  function showTooltip(d, isLineGraph) {
    d3
      .select(".tooltip")
      .classed("hover", true)
      .classed("lineGraphToolTip", isLineGraph)
      .html(function() {
        return isLineGraph
          ? isLineGraph
          : "<b>Sample</b>: " +
              d.data.sample +
              "<br/> <b>Library</b>: " +
              d.data.library +
              "<br /> <b>Total Cells</b>: " +
              d.data.size +
              "<br /> <b>Seq Date</b>: " +
              d3.timeFormat("%Y-%m-%d")(d.data.seq);
      })
      .style(
        "left",
        d =>
          isLineGraph
            ? xScale(xScale.domain()[1]) - 250 + "px"
            : d3.event.pageX + "px"
      )
      .style(
        "top",
        d => (isLineGraph ? yScale(0) - 200 + "px" : d3.event.pageY + "px")
      );
  }

  /**
   * Hide the tooltip.
   */
  function hideTooltip() {
    d3
      .select(".tooltip")
      .classed("hover", false)
      .style("left", "0px")
      .style("top", "0px");
  }

  /**
   * Append an arrow button to switch views
   */
  function appendSwitchViewsButtons() {
    d3
      .select(".App")
      .append("div")
      .classed("switchViews", true)
      .classed("circleView", true)
      .style("margin-top", windowDim.height / 3 + "px")
      .text(">")
      .on("mousedown", function() {
        d3
          .select(this)
          .classed("circleView", !d3.select(this).classed("circleView"));
        hideTooltip();
        toggleSwitchViews();
      })
      .style("opacity", 0);
  }

  /**
   *  Toggle between circle chart and line graph
   */
  function toggleSwitchViews() {
    if (d3.select(".switchViews").classed("circleView")) {
      //Show the circle chart
      showElement(".CircleChart");
      showElement(".toggles");
      d3.select(".tooltip").classed("lineGraphToolTip", false);
      d3.select(".CircleChart").style("pointer-events", "all");

      //Hide the line chart
      hideElement(
        ".LineChart .xAxis, .LineChart text, .LineChart .yAxis,.LineChart .line, .focusMarker"
      );
    } else {
      //Show the line chart
      showElement(
        ".LineChart .xAxis, .LineChart text, .LineChart .yAxis,.LineChart .line, .focusMarker"
      );

      //Hide the circle chart
      d3.select(".CircleChart").style("pointer-events", "none");
      hideElement(".CircleChart");
      hideElement(".toggles");
    }
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
        showTooltip={showTooltip}
        hideTooltip={hideTooltip}
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
        appendSwitchViewsButtons={appendSwitchViewsButtons}
      />
    </div>
  );
};
export default Chart;
