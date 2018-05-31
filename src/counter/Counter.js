import React, { Component } from "react";
import * as d3 from "d3";
import { select } from "d3";
class Counter extends Component {
  componentDidMount() {
    this.createChart();
  }

  componentDidUpdate() {
    this.createChart();
  }

  createChart() {
    const samples = this.props.samples,
      cellCount = this.props.stats.cellCount,
      libraryCount = this.props.stats.libraryCount,
      libraryDates = this.props.stats.libraryDates,
      node = select(this.node),
      screenWidth = window.innerWidth,
      screenHeight = window.innerHeight,
      width = screenWidth * 0.9,
      height = screenHeight * 0.8;

    const margin = {
      top: screenHeight / 15,
      right: 10,
      bottom: 5,
      left: screenWidth / 15,
      general: 10
    };
    const xScale = d3
        .scaleTime()
        .range([0, width])
        .domain(
          d3.extent(
            libraryDates.reduce((result, hit) => [...result, hit.seq], [])
          )
        ),
      yScale = d3
        .scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(libraryDates, d => d.accCellCount)]);

    const line = d3
      .line()
      .x(d => xScale(d.seq))
      .y(d => yScale(d.accCellCount))
      .curve(d3.curveBasis);

    initializeTitle();
    moveTitle();

    function initializeTitle() {
      const counter = d3
        .select(".Counter")
        .attr("width", screenWidth)
        .attr("height", screenHeight)
        .classed("svg-container", true)
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + screenWidth + " " + screenHeight + "")
        .classed("svg-content-responsive", true)
        .append("text")
        .attr("class", "counter")
        .attr("x", width - margin.left + "px")
        .attr("y", margin.top + "px")
        .text(d => setTitle(0));
    }
    function setTitle(count) {
      return " Cells Sequenced: " + count;
    }
    function moveTitle() {
      var formater = ",.3r";
      d3
        .select(".Counter")
        .transition()
        .delay(1000)
        .duration(6000)
        .ease(d3.easeSinInOut)
        .tween("text", function(d) {
          var node = d3.select(".counter");
          var i = d3.interpolate(0, cellCount);
          return function(t) {
            return node.html(
              setTitle(d3.format(formater)(Math.round(i(t) * 10000 / 10000)))
            );
          };
        })
        .transition()
        .delay(1000)
        .attr("opacity", 0);

      /*  d3
        .select(".Counter text")
        .transition()
        .duration(7000)
        .ease(d3.easeSinInOut)
        .attrTween("transform", function() {
          return (
            "translate(" +
            this.points[inter].x +
            "," +
            this.points[inter].y +
            ")"
          );
        });*/
    }
  }

  render() {
    if (this.props.data === null) {
      return null;
    }

    return (
      <svg
        className="Counter"
        ref={node => (this.node = node)}
        width={this.props.width}
        height={this.props.height}
      />
    );
  }
}

export default Counter;
