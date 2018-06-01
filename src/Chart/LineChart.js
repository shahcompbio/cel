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

  createChart() {
    const libraryDates = this.props.stats.libraryDates,
      cellCount = this.props.stats.cellCount,
      node = select(this.node),
      screenWidth = this.props.windowDim.screenWidth,
      screenHeight = this.props.windowDim.screenHeight,
      width = this.props.windowDim.width,
      height = this.props.windowDim.height,
      margin = this.props.margin,
      xScale = this.props.xScale,
      yScale = this.props.yScale,
      line = this.props.line,
      initializeEndClick = this.props.initializeEndClick.bind(this),
      initializeSvg = this.props.initializeSvg.bind(this);

    initializeEndClick();
    const mainSvg = initializeSvg(".LineChart");
    initializeAxis(mainSvg);
    appendClipPath(mainSvg);
    appendLine(mainSvg);
    hideChart();

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
        .call(
          d3
            .axisBottom(xScale)
            .tickFormat(d3.timeFormat("%b %Y"))
            .ticks(20)
        );

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
          ".LineChart .xAxis,.LineChart .area,.LineChart .line, .LineChart text, .LineChart .yAxis"
        )
        .transition()
        .delay(8000)
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
