import React, { Component } from "react";
import * as d3 from "d3";
import { select } from "d3";
class CircleChart extends Component {
  componentDidMount() {
    this.createChart();
  }

  componentDidUpdate() {
    this.createChart();
  }

  createChart() {
    const libraries = this.props.library,
      samples = this.props.samples,
      cellCount = this.props.stats.cellCount,
      libraryCount = this.props.stats.libraryCount,
      libraryDates = this.props.stats.libraryDates,
      node = select(this.node),
      screenWidth = window.innerWidth,
      screenHeight = window.innerHeight,
      width = screenWidth * 0.9,
      height = screenHeight * 0.8,
      transitionDur = 500;

    d3
      .selectAll(".CircleChart")
      .attr("width", screenWidth)
      .attr("height", screenHeight)
      .classed("svg-container", true)
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", "0 0 " + screenWidth + " " + screenHeight + "")
      .classed("svg-content-responsive", true);

    const tooltip = initializeTooltip();
    const color = initializeColors(samples.length);
    const pointData = splitLineGraph(color);
    drawSegements(pointData);
    startLineAnimation();

    const pack = d3.pack().size([width, height]);

    const nodes = pack(libraries)
      .descendants()
      .filter(d => d.depth === 2); // only retain nodes of max depth

    const clusters = new Array(samples.length);

    nodes.forEach(function(d) {
      const i = samples.indexOf(d.data.sample);
      if (!clusters[i] || d.r > clusters[i].r) {
        clusters[i] = d;
      }
    });

    const updatedNodes = nodes.map((d, i) => {
      return { p1: pointData[i].p1, ...d };
    });

    d3
      .forceSimulation(updatedNodes)
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("charge", null)
      .force(
        "collision",
        d3
          .forceCollide()
          .radius(function(d) {
            return d.r + 2;
          })
          .strength(0.3)
      )
      .force("cluster", clustering)
      .force(
        "x",
        d3.forceX().x(function(d) {
          return samples.indexOf(d.data.sample) * 10;
        })
      )
      .force(
        "y",
        d3.forceY().y(function(d) {
          return d.y / 3;
        })
      )
      .on("tick", ticked); // enables you to get the state of the layout when it has changed

    function clustering(alpha) {
      nodes.map(node => {
        const cluster = clusters[samples.indexOf(node.data.sample)];
        if (cluster === node) return;
        var x = node.x - cluster.x,
          y = node.y - cluster.y,
          l = Math.sqrt(x * x + y * y),
          r = node.r + cluster.r;
        if (l !== r) {
          l = (l - r) / l * alpha;
          node.x -= x *= l;
          node.y -= y *= l;
          cluster.x += x;
          cluster.y += y;
        }
      });
    }

    function ticked() {
      const tickedChart = node
        .selectAll("circle")
        .data(updatedNodes)
        .attr("r", 1)
        .style("fill", function(d) {
          return color(samples.indexOf(d.data.sample));
        })
        .on("mouseover", showDetail)
        .on("mouseout", hideDetail);

      tickedChart
        .enter()
        .append("circle")
        .merge(tickedChart)
        .attr("cx", function(d) {
          return d.p1.x;
        })
        .attr("cy", function(d) {
          return d.p1.y;
        })
        .attr(
          "transform",
          "translate(" + screenWidth / 15 + "," + screenHeight / 15 + ")"
        )
        .style("opacity", 0)
        .transition()
        .delay(6000)
        .style("opacity", 1)
        .transition()
        .delay(function(d, i) {
          return i * 100;
        })
        .duration(100)
        .attr("cx", function(d, i) {
          return d.x;
        })
        .attr("cy", function(d, i) {
          return d.y;
        })
        .transition()
        .delay(200)
        .duration(1000)
        .attr("r", function(d) {
          return d.r;
        });

      tickedChart.exit().remove();
    }

    function showDetail(d, i) {
      d3
        .select(this)
        .classed("hover", true)
        .transition()
        .duration(transitionDur);

      tooltip
        .classed("hover", true)
        .transition()
        .duration(transitionDur);

      tooltip
        .html(
          "<b>Sample</b>: " +
            d.data.sample +
            "<br/> <b>Library</b>: " +
            d.data.library +
            "<br /> <b>Total Cells</b>: " +
            d.data.size
        )
        .style("left", d3.event.pageX + "px")
        .style("top", d3.event.pageY + "px");
    }

    function hideDetail(d, i) {
      d3
        .select(this)
        .classed("hover", false)
        .transition()
        .duration(transitionDur);

      tooltip
        .classed("hover", false)
        .style("left", "0px")
        .style("top", "0px")
        .transition()
        .duration(transitionDur);
    }

    function initializeTooltip() {
      return d3
        .select("body")
        .append("div")
        .attr("class", "tooltip");
    }
    function initializeColors(len) {
      return d3
        .scaleSequential()
        .domain([0, len])
        .interpolator(d3.interpolateRainbow);
    }
    function splitLineGraph(color) {
      var linePath = d3.select(".line").node();
      var pathLength = linePath.getTotalLength();
      var segementedLines = [];
      for (var i = 0; i < libraryCount; i++) {
        var p1 = linePath.getPointAtLength(pathLength * (i / libraryCount));
        var p2 = linePath.getPointAtLength(
          pathLength * ((i + 1) / libraryCount)
        );
        var angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
        var libName = libraryDates[i].library;
        var colour = color(samples.indexOf(libraryDates[i].sample));

        segementedLines.push({
          id: libName,
          p1: p1,
          p2: p2,
          angle: angle,
          color: colour
        });
      }
      return segementedLines;
    }
    function drawSegements(segementedLines, mainSvg) {
      var path = d3.line().curve(d3.curveCardinal);
      var sep = d3
        .selectAll(".LineChart")
        .append("g")
        .attr("class", "sep")
        .attr("width", screenWidth)
        .attr("height", screenHeight)
        .attr(
          "transform",
          "translate(" + screenWidth / 15 + "," + screenHeight / 15 + ")"
        );

      sep
        .selectAll(".sep")
        .data(segementedLines)
        .enter()
        .append("line")
        .attr("class", "sepLines")
        .attr("stroke", function(d, i) {
          return d.color;
        })
        .attr("stroke-width", "2px")
        .attr("x1", function(d, i) {
          return d.p1.x;
        })
        .attr("y1", function(d, i) {
          return d.p1.y;
        })
        .attr("x2", function(d, i) {
          return d.p2.x;
        })
        .attr("y2", function(d, i) {
          return d.p2.y;
        })
        .style("opacity", 0);
    }
    function startLineAnimation() {
      d3
        .selectAll(".sepLines")
        .transition()
        .delay(5500)
        .style("opacity", 1)
        .transition()
        .delay(500)
        .duration(200)
        .attr("x2", function(d, i) {
          return d.p1.x + 1;
        })
        .attr("y2", function(d, i) {
          return d.p1.y + 1;
        })
        .transition()
        .style("opacity", 0);
    }
  }

  render() {
    if (this.props.data === null) {
      return null;
    }

    return (
      <svg
        className="CircleChart"
        ref={node => (this.node = node)}
        width={this.props.width}
        height={this.props.height}
      />
    );
  }
}

export default CircleChart;
