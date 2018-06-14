import React, { Component } from "react";
import * as d3 from "d3";
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
      dim = this.props.windowDim,
      margin = this.props.margin,
      line = this.props.line,
      yScale = this.props.yScale,
      xScale = this.props.xScale,
      hideChart = this.props.hideChart.bind(this),
      initializeEndClick = this.props.initializeEndClick.bind(this),
      initializeSvg = this.props.initializeSvg.bind(this),
      initializeYaxis = this.props.initializeYaxis.bind(this),
      initializeXaxis = this.props.initializeXaxis.bind(this);

    const mainSvg = initializeSvg(".LineChart");
    const zoom = addZoom();
    mainSvg.call(zoom);
    initializeXaxis(mainSvg);
    initializeYaxis(mainSvg);
    appendClipPath(mainSvg);
    appendLine(mainSvg);
    appendMouseFocus(mainSvg, line, zoom);
    hideChart();

    function appendClipPath(mainSvg) {
      mainSvg.style("overflow", "visible").style("pointer-events", "none");
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
    function appendMouseFocus(mainSvg, line, zoom) {
      console.log(libraryDates);
      var focus = mainSvg.append("g").attr("class", "lineGraphFocus");
      libraryDates.map(library => {
        focus
          .append("ellipse")
          .attr("cx", 3)
          .attr("cy", 3)
          .attr("rx", 3)
          .attr("ry", 3)
          .attr("fill", "white")
          .attr("class", "focusMarker")
          .style("stroke", "black")
          .style("stroke-width", "2px")
          .attr("id", "cellCount-" + library.accCellCount)
          .attr(
            "transform",
            d =>
              "translate(" +
              (xScale(library.seq) - 3) +
              "," +
              (yScale(library.accCellCount) - 3) +
              ")"
          )
          .style("opacity", 0);
      });
      focus
        .append("rect")
        .attr("class", "overlay")
        .attr("opacity", 0)
        .attr("width", dim.screenWidth)
        .attr("height", dim.screenHeight)
        .on("mousemove", function() {
          var mouse = d3.mouse(this);
          moveMarker(mouse, line);
        });
      //.call(zoom);
    }

    function moveMarker(mouse, line) {
      var bisectDate = d3.bisector(function(d) {
          return d.seq;
        }).right,
        xDate = xScale.invert(mouse[0]);
      var i = bisectDate(libraryDates, xDate, 1);
      //  var timeParser = d3.timeFormat("%B-%Y");

      var d0 = libraryDates[i - 1];
      var d1 = libraryDates[i];
      var d =
        d0 === undefined
          ? d1
          : d1 === undefined ? d0 : xDate - d0.seq > d1.seq - xDate ? d1 : d0;
      //  console.log(d3.select(".lineGraphFocus #cellCount-" + d.accCellCount));
      d3
        .select(".lineGraphFocus #cellCount-" + d.accCellCount)
        .attr("opacity", 0);
      /*  .attr(
          "transform",
          "translate(" +
            (point.x + margin.left) +
            "," +
            (point.y + margin.top) +
            ")"
        );*/
    }
    function addZoom() {
      var lastPoint = libraryDates.length - 1;
      var x1 = xScale(libraryDates[0].seq);
      var y1 = yScale(libraryDates[lastPoint].accCellCount);
      var x2 = xScale(libraryDates[lastPoint].seq);
      var y2 = yScale(0);
      console.log(x1 + "," + y1 + "," + x2 + "," + y2);
      return (
        d3
          .zoom()
          .extent([[x1, y1], [x2, y2]])
          .scaleExtent([1, 5])
          .translateExtent([[x1, y1], [x2, y2]])
          //    [libraryDates[0].seq, 0],
          //    [libraryDates[lastPoint].seq, libraryDates[lastPoint].accCellCount]
          //    )
          .on("zoom", zooming)
      );
    }
    function zooming() {
      var xAxisObj = d3
        .axisBottom(xScale)
        .tickFormat(d3.timeFormat("%b %Y"))
        .ticks(d3.timeMonth);
      var yAxisObj = d3
        .axisLeft(yScale)
        .tickSize(-dim.width)
        .ticks(10);
      // create new scale ojects based on event
      var new_xScale = d3.event.transform.rescaleX(xScale);
      var new_yScale = d3.event.transform.rescaleY(yScale);
      console.log(d3.event.transform);

      // update axes
      var xAxis = d3.select(".xAxis");
      var yAxis = d3.select(".yAxis");

      xAxis.call(xAxisObj.scale(new_xScale));
      yAxis.call(yAxisObj.scale(new_yScale));
      d3.event.transform.x = d3.event.transform.x + margin.left;
      d3.event.transform.y = d3.event.transform.y + margin.top;
      // update circle
      d3.select(".line").attr("transform", d3.event.transform);
      d3.select(".lineGraphFocus").attr("transform", d3.event.transform);
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
