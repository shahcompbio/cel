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
      nestedLibraryDates = this.props.stats.nestedLibraryDates,
      dim = this.props.windowDim,
      margin = this.props.margin,
      line = this.props.line,
      yScale = this.props.yScale,
      xScale = this.props.xScale,
      showTooltip = this.props.showTooltip.bind(this),
      hideTooltip = this.props.hideTooltip.bind(this),
      hideChart = this.props.hideChart.bind(this),
      initializeSvg = this.props.initializeSvg.bind(this),
      initializeYaxis = this.props.initializeYaxis.bind(this),
      initializeXaxis = this.props.initializeXaxis.bind(this);

    const mainSvg = initializeSvg(".LineChart");
    const zoom = addZoom();
    initializeXaxis(mainSvg);
    initializeYaxis(mainSvg);
    appendClipPath(mainSvg);
    appendLine(mainSvg);
    appendLineMarkers(mainSvg, nestedLibraryDates);
    hideChart();

    /**
     * Append the clip path to the line chart for curtain animation
     *
     * @param {Object} mainSvg - the element that holds the chart
     */
    function appendClipPath(mainSvg) {
      mainSvg.style("overflow", "visible").style("pointer-events", "none");

      mainSvg
        .append("clipPath")
        .attr("id", "rectClip")
        .append("rect")
        .attr("width", 0)
        .attr("height", dim.height);
    }

    /**
     * Append the line to the chart
     *
     * @param {Object} mainSvg - the element that holds the chart
     */
    function appendLine(mainSvg) {
      mainSvg
        .append("g")
        .attr("class", "lineFocus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("clip-path", "url(#clip)")
        .call(zoom)
        .append("path")
        .datum(libraryDates)
        .attr("class", "line")
        .attr("id", "lineChart")
        .attr("d", line)
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("clip-path", "url(#rectClip)");

      mainSvg
        .select(".lineFocus")
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", dim.width)
        .attr("height", dim.height);

      d3
        .select("#rectClip rect")
        .transition()
        .duration(6000)
        .ease(d3.easeSinInOut)
        .attr("width", dim.width);
    }

    /**
     * Append the circle markers to the line chart
     *
     * @param {Object} mainSvg - the element that holds the chart
     */
    function appendLineMarkers(mainSvg, nestedLibraryDates) {
      mainSvg
        .select(".lineFocus")
        .append("g")
        .attr("class", "markers");

      var focus = mainSvg.select(".markers");

      for (var seqDate in nestedLibraryDates) {
        var date = nestedLibraryDates[seqDate];
        var markerLib = date[date.length - 1];
        focus
          .append("ellipse")
          .attr("rx", 4)
          .attr("ry", 4)
          .attr("class", "focusMarker")
          .attr("id", "cellCount-" + markerLib.accCellCount)
          .attr(
            "transform",
            d =>
              "translate(" +
              xScale(markerLib.seq) +
              6 +
              "," +
              yScale(markerLib.accCellCount) +
              6 +
              ")"
          )
          .style("opacity", 0);
      }

      focus
        .append("rect")
        .attr("class", "overlay")
        .attr("opacity", 0)
        .attr("width", dim.screenWidth)
        .attr("height", dim.screenHeight)
        .on("mousemove", function() {
          var mouse = d3.mouse(this);
          moveChartMarker(mouse, nestedLibraryDates);
        });
    }

    /**
     * Find the closest point on the line graph to the mouse
     *
     * @param {Object} mouse - holds coordinates
     */
    function getBisector(mouse) {
      var bisectDate = d3.bisector(function(d) {
          return d.seq;
        }).right,
        xDate = xScale.invert(mouse[0]);

      var i = bisectDate(libraryDates, xDate, 1);
      var d0 = libraryDates[i - 1];
      var d1 = libraryDates[i];
      return d0 === undefined
        ? d1
        : d1 === undefined ? d0 : xDate - d0.seq > d1.seq - xDate ? d1 : d0;
    }

    /**
     * Append text to the line tooltip
     *
     * @param {Object} day - the element that is closest to the mouse
     */
    function showLineToolTip(day) {
      var htmlText =
        "<b>Samples</b>: " +
        [...new Set(day.map(item => item.sample))].join(", ") +
        "<br/> <b>Library</b>: " +
        [...new Set(day.map(item => item.library))].join(", ") +
        "<br /> </br><b>Total Cells Sequenced</br>by  " +
        d3.timeFormat("%B %d %Y")(day[day.length - 1].seq) +
        "</b>: " +
        day[day.length - 1].accCellCount;

      showTooltip(day, htmlText);
    }

    /**
     * Changes the apperance of the closest circle marker
     *
     * @param {Object} mouse -  holds coordinates
     * @param {Object} nestedLibraryDates - library dates but collapsed by day
     */
    function moveChartMarker(mouse, nestedLibraryDates) {
      var day = getBisector(mouse);
      var markerDay = nestedLibraryDates[day.seq];
      var library = markerDay[markerDay.length - 1];
      if (library !== undefined) {
        showLineToolTip(markerDay);
        d3.selectAll(".focusMarker").classed("lineMarkerFocus", false);
        d3
          .select(".lineFocus #cellCount-" + library.accCellCount)
          .classed("lineMarkerFocus", true);
      } else {
        hideTooltip();
      }
    }

    /**
     * Add chart zooming ability
     */
    function addZoom() {
      var lastPoint = libraryDates.length - 1;
      var x1 = xScale(libraryDates[0].seq);
      var y1 = yScale(libraryDates[lastPoint].accCellCount);
      var x2 = xScale(libraryDates[lastPoint].seq);
      var y2 = yScale(0);

      return d3
        .zoom()
        .extent([[x1, y1], [x2, y2]])
        .scaleExtent([1, 5])
        .translateExtent([[x1, y1], [x2, y2]])
        .on("zoom", zooming);
    }
    /**
     * Scales chart and axis on zoom
     */
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

      // update axes
      var xAxis = d3.select(".xAxis");
      var yAxis = d3.select(".yAxis");

      xAxis.call(xAxisObj.scale(new_xScale));
      yAxis.call(yAxisObj.scale(new_yScale));

      // update circle
      d3.select(".lineFocus path").attr("transform", d3.event.transform);
      d3.select(".markers").attr("transform", d3.event.transform);
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
