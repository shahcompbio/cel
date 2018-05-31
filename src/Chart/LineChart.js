import React, { Component } from "react";
import * as d3 from "d3";
import * as moment from "moment";
import { select } from "d3";
import "d3-transition";
class LineChart extends Component {
  componentDidMount() {
    this.createChart();
  }

  componentDidUpdate() {
    this.createChart();
  }
  yj;
  createChart() {
    initializeEndClick();
    const mainSvg = initializeSvg();
    initializeAxis(mainSvg);
    appendClipPath(mainSvg);
    appendLine(mainSvg);
    hideChart();

    function initializeEndClick() {
      d3.select("no").on("mousedown", function(d) {
        if (d3.event.which == 1) {
          d3.selectAll("*").transition();
          var chart = d3.selectAll(
            ".LineChart .xAxis,.LineChart .area,.LineChart .line, .LineChart text, .LineChart .yAxis, .Counter"
          );
          var circleChart = d3.selectAll(
            ".CircleChart circle, .CircleChart .sepLines, .CircleChart .sep"
          );

          chart
            .interrupt()
            .transition()
            .style("opacity", 0);

          d3.select(".LineChart").classed("clicked", true);

          circleChart
            .interrupt()
            .transition()
            .style("opacity", 0);
        }
      });
    }
    function initializeSvg() {
      return d3
        .select("svg")
        .attr("width", screenWidth)
        .attr("height", screenHeight)
        .classed("svg-container", true)
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + screenWidth + " " + screenHeight + "")
        .classed("svg-content-responsive", true);
    }
    function appendClipPath(mainSvg) {
      mainSvg
        .append("clipPath")
        .attr("id", "rectClip")
        .append("rect")
        .attr("width", 0)
        .attr("height", height);
    }
    function initializeAxis(mainSvg) {
      mainSvg
        .append("g")
        .attr("class", "xAxis")
        .attr(
          "transform",
          "translate(" + margin.left + "," + (height + margin.top) + ")"
        )
        .call(d3.axisBottom(xScale));

      mainSvg
        .append("text")
        .attr(
          "transform",
          "translate(" + width / 2 + " ," + (height + margin.top * 2) + ")"
        )
        .style("text-anchor", "middle")
        .text("Date");
      mainSvg
        .append("g")
        .attr("class", "yAxis")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(
          d3
            .axisLeft(yScale)
            .tickSize(-width)
            .ticks(10)
        );
      mainSvg
        .append("text")
        .attr("text-anchor", "middle")
        .attr(
          "transform",
          "translate(" + margin.left / 2 + "," + height / 2 + ")rotate(-90)"
        )
        .text("Cells Sequenced");
    }

    function appendLine(mainSvg) {
      var line = d3
        .line()
        .x(d => xScale(d.seq))
        .y(d => yScale(d.accCellCount))
        .curve(d3.curveBasis);

      mainSvg
        .append("path")
        .datum(libraryDates)
        .attr("class", "line")
        .attr("d", line)
        .attr("clip-path", "url(#rectClip)")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      d3
        .select("#rectClip rect")
        .transition()
        .duration(7000)
        .ease(d3.easeSinInOut)
        .attr("width", width);
    }

    function hideChart(isEndClick) {
      d3
        .selectAll(
          ".LineChart .xAxis,.LineChart .area,.LineChart .line, .LineChart text"
        )
        .transition()
        .delay(8000)
        .style("opacity", 0);

      d3
        .selectAll(".LineChart .yAxis")
        .transition()
        .delay(10000)
        .style("opacity", 0);
    }
  }

  render() {
    if (this.props.data === null) {
      return null;
    }

    return (
      <svg
        className="LineChart"
        ref={node => (this.node = node)}
        width={this.props.width}
        height={this.props.height}
      />
    );
  }
}
export default LineChart;
