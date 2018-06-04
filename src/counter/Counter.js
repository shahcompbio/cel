import React, { Component } from "react";
import * as d3 from "d3";

class Counter extends Component {
  componentDidMount() {
    this.createChart();
  }

  componentDidUpdate() {
    this.createChart();
  }

  createChart() {
    const cellCount = this.props.stats.cellCount,
      screenWidth = window.innerWidth,
      screenHeight = window.innerHeight,
      width = screenWidth * 0.9;

    const margin = {
      top: screenHeight / 15,
      right: 10,
      bottom: 5,
      left: screenWidth / 15,
      general: 10
    };

    initializeTitle();
    moveTitle();

    function initializeTitle() {
      return d3
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
