import React, { Component } from "react";
import * as d3 from "d3";
import { select } from "d3";
class Counter extends Component {
  static defaultProps = { width: 200, height: 200 };

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
      node = select(this.node),
      width = node.attr("width"),
      height = node.attr("height");

    initializeTitle();

    function initializeTitle() {
      var count = [0];
      var format = d3.format("~r");
      var textTitle = function(count) {
        return (
          "<div class='titleCount'>\
          <br/> <b>Samples</b>: " +
          samples.length +
          "<br/> <b>Libraries</b>: " +
          libraryCount +
          "<br /> <div class='cellCount'> \
          <b>Cells Sequenced</b>: " +
          count +
          "</div></div>"
        );
      };

      d3
        .select(".Counter")
        .append("div")
        .attr("left", 200)
        .attr("top", 200)
        .attr("width", width + "px")
        .attr("height", height + "px")
        .attr("position", "relative")
        .attr("class", "counter")
        .html(d => textTitle(d))
        .transition()
        .duration(5000)
        .ease(d3.easeLinear)
        .tween("text", function(d) {
          var node = d3.select(".titleCount");
          var i = d3.interpolate(0, cellCount);
          return function(t) {
            return node.html(textTitle(Math.round(i(t) * 10000 / 10000)));
          };
        });
    }
  }

  render() {
    if (this.props.data === null) {
      return null;
    }

    return (
      <div
        className="Counter"
        ref={node => (this.node = node)}
        width={this.props.width}
        height={this.props.height}
      />
    );
  }
}

export default Counter;
