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
      hideDetail = this.props.hideDetail.bind(this),
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
        .append("g")
        .attr("class", "lineFocus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(zoom)
        .append("path")
        .datum(libraryDates)
        .attr("class", "line")
        .attr("d", line)
        .attr("clip-path", "url(#rectClip)");

      d3
        .select("#rectClip rect")
        .transition()
        .duration(7000)
        .ease(d3.easeSinInOut)
        .attr("width", dim.width);
    }
    function appendMouseFocus(mainSvg, line, zoom) {
      mainSvg
        .select(".lineFocus")
        .append("g")
        .attr("class", "markers");

      var focus = mainSvg.select(".markers");

      var nestedDates = libraryDates.reduce((rv, x) => {
        if (rv.hasOwnProperty(x["seq"])) {
          rv[x["seq"]] = [...rv[x["seq"]], x];
        } else {
          rv[x["seq"]] = [x];
        }
        return rv;
      }, {});

      for (var seqDate in nestedDates) {
        var date = nestedDates[seqDate];
        var markerLib = date[date.length - 1];
        focus
          .append("ellipse")
          .attr("rx", date.length)
          .attr("ry", date.length)
          .attr("class", "focusMarker")
          .attr("id", "cellCount-" + markerLib.accCellCount)
          .attr(
            "transform",
            d =>
              "translate(" +
              xScale(markerLib.seq) +
              "," +
              yScale(markerLib.accCellCount) +
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
          moveMarker(mouse, nestedDates);
        });
    }
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
    function showLineToolTip(day) {
      d3
        .select(".tooltip")
        .classed("hover", true)
        .html(
          "<b>Samples</b>: <br />" +
            [...new Set(day.map(item => item.sample))].join(", <br />") +
            "<br/> <b>Library</b>: <br />" +
            [...new Set(day.map(item => item.library))].join(", <br />") +
            "<br /> <b>Total Cells Sequenced Up To  " +
            d3.timeFormat("%Y-%m-%d")(day[day.length - 1].seq) +
            "</b>: " +
            day[day.length - 1].accCellCount
        )
        .style("left", xScale(day[day.length - 1].seq) + 50 + "px")
        .style("top", yScale(day[day.length - 1].accCellCount) + 50 + "px");
    }
    function moveMarker(mouse, nestedDates) {
      var day = getBisector(mouse);
      var markerDay = nestedDates[day.seq];
      var library = markerDay[markerDay.length - 1];
      if (library !== undefined) {
        showLineToolTip(markerDay);

        var pulse = d3.select(".lineFocus #cellCount-" + library.accCellCount);

        pulse
          .style("opacity", 1)
          .transition()
          .duration(100)
          .attr("rx", 2)
          .attr("ry", 2)
          .transition()
          .duration(100)
          .attr("rx", 7)
          .attr("ry", 7)
          .transition()
          .attr("rx", 3)
          .attr("ry", 3);
      } else {
        hideDetail();
      }
    }
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

      d3.event.transform.x = d3.event.transform.x;
      d3.event.transform.y = d3.event.transform.y;
      // update circle
      d3.select(".lineFocus").attr("transform", d3.event.transform);
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
