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
      dim = this.props.windowDim,
      margin = this.props.margin,
      line = this.props.line,
      initializeEndClick = this.props.initializeEndClick.bind(this),
      initializeSvg = this.props.initializeSvg.bind(this),
      initializeYaxis = this.props.initializeYaxis.bind(this),
      initializeXaxis = this.props.initializeXaxis.bind(this),
      hideElement = this.props.hideElement.bind(this),
      showElement = this.props.showElement.bind(this);

    const lineChartClasses =
      ".LineChart .xAxis,.LineChart .area,.LineChart .line, .LineChart text, .LineChart .yAxis, .Counter";
    initializeEndClick(lineChartClasses);

    const mainSvg = initializeSvg(".LineChart");

    initializeXaxis(mainSvg);
    initializeYaxis(mainSvg);
    appendClipPath(mainSvg);
    appendLine(mainSvg);
    hideChart();

    function appendClipPath(mainSvg) {
      mainSvg
        .append("clipPath")
        .attr("id", "rectClip")
        .append("rect")
        .attr("width", 0)
        .attr("height", dim.height);
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
        .attr("width", dim.width);
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
        width={this.props.windowDim.width}
        height={this.props.windowDim.height}
      />
    );
  }
}
export default LineChart;
