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
      stats = this.props.stats,
      node = select(this.node),
      dim = this.props.windowDim,
      margin = this.props.margin,
      xScale = this.props.xScale,
      initializeSvg = this.props.initializeSvg.bind(this),
      initializeXaxis = this.props.initializeXaxis.bind(this),
      hideElement = this.props.hideElement.bind(this),
      showElement = this.props.showElement.bind(this),
      colossusUrl = "http://colossus.bcgsc.ca/dlp/library/";

    var endAnimationFlag = false;

    const MutationObserver =
      window.MutationObserver ||
      window.WebKitMutationObserver ||
      window.MozMutationObserver;

    var mutationListener = setMutationListener();

    const mainSvg = initializeSvg(".CircleChart");

    const tooltip = initializeTooltip();
    const color = initializeColors(samples.length);

    const pack = d3.pack().size([dim.width, dim.height]);
    const nodes = packNodes(libraries);
    const clusters = getClusters();

    const pointData = splitLineGraph(color, nodes);

    const updatedNodes = nodes.map((d, i) => {
      return { p1: pointData[i].p1, ...d };
    });

    drawSegements(pointData);
    startLineAnimation();
    appendSortToggle();
    forceSimulation();

    function forceSimulation() {
      d3
        .forceSimulation(updatedNodes)
        .force("center", d3.forceCenter(dim.width / 2, dim.height / 2))
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
        .on("tick", ticked)
        .on("end", function() {
          if (!endAnimationFlag) {
            mutationListener.disconnect();
            startCircleAnimation();
          }
        });
    }

    function getClusters() {
      const clusters = new Array(samples.length);
      nodes.forEach(function(d) {
        const i = samples.indexOf(d.data.sample);
        if (!clusters[i] || d.r > clusters[i].r) {
          clusters[i] = d;
        }
      });
      return clusters;
    }

    function packNodes(libraries) {
      return pack(libraries)
        .descendants()
        .filter(d => d.depth === 2)
        .sort(function(a, b) {
          return a.data.seq - b.data.seq;
        });
    }

    function appendSortToggle() {
      initializeXaxis(mainSvg);
      d3
        .select(".CircleChart .xAxis")
        .attr(
          "transform",
          "translate(" +
            margin.left +
            "," +
            (4 * dim.height / 5 + margin.top * 2.5) +
            ")"
        );

      d3
        .select(".App")
        .append("div")
        .style("padding-left", margin.left / 4 + "px")
        .style("padding-top", dim.height / 4 + "px")
        .style("float", "left")
        .classed("toggles", true)
        .html(
          "<text>Order By Date</text><br>\
          <label class='switch'> \
            <input type='checkbox'>\
              <span class='slider round'></span>\
          </label>\
        "
        )
        .select(".slider")
        .on("click", sortByDate);

      hideElement(".CircleChart .xAxis");
      hideElement(".toggles");
    }

    function sortByDate() {
      if (!d3.select(this).classed("date-toggled")) {
        showElement(".CircleChart .xAxis");
        var vertPos = 0;
        var heightSpacer = 30;
        var baseY = 4 * dim.height / 5 + margin.top;
        d3
          .selectAll("circle")
          .transition()
          .attr("r", 11)
          .attr("cx", function(d, i) {
            var date = new Date(d.data.seq);
            return xScale(date.setDate(1));
          })
          .attr("cy", function(d, i) {
            var previous = d3.selectAll("circle").data()[i - 1];
            if (previous === undefined) {
              return baseY;
            } else if (previous.data.seq.getMonth() === d.data.seq.getMonth()) {
              return baseY - heightSpacer * ++vertPos;
            } else {
              vertPos = 0;
              return baseY;
            }
          })
          .transition();
      } else {
        hideElement(".CircleChart .xAxis");
        goToEndAnimation();
      }
      d3
        .select(this)
        .classed("date-toggled", !d3.select(this).classed("date-toggled"));
    }

    function setMutationListener() {
      var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (
            mutation.type === "attributes" &&
            mutation.target.classList.value.indexOf("clicked") !== -1
          ) {
            endAnimationFlag = true;
            goToEndAnimation();
            observer.disconnect();
          }
        });
      });

      var lineChart = d3.selectAll(".LineChart .xAxis").node();
      observer.observe(lineChart, {
        attributes: true
      });
      return observer;
    }

    function clustering(alpha) {
      return nodes.map(node => {
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
    function removeLineChartContent() {
      d3
        .selectAll(".LineChart, .Counter")
        .transition()
        .remove();
    }

    function goToEndAnimation() {
      d3
        .selectAll("circle")
        .transition()
        .style("opacity", 1)
        .transition()
        .attr("cx", function(d, i) {
          return d.x;
        })
        .attr("cy", function(d, i) {
          return d.y;
        })
        .transition()
        .duration(1000)
        .attr("r", function(d) {
          return d.r;
        })
        .on("end", function() {
          d3
            .select(this)
            .on("mouseover", showDetail)
            .on("mouseout", hideDetail);
        });
      removeLineChartContent();
      showElement(".toggles");
    }

    function startCircleAnimation() {
      d3
        .selectAll("circle")
        .transition()
        .delay(7000)
        .duration(200)
        .style("opacity", 1)
        .transition()
        .delay(function(d, i) {
          return i * 10 + 500;
        })
        .duration(1000)
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
        })
        .on("end", function() {
          d3
            .select(this)
            .on("mouseover", showDetail)
            .on("mouseout", hideDetail);

          removeLineChartContent();
          showElement(".toggles");
        });
    }

    function ticked() {
      const tickedChart = node
        .selectAll("circle")
        .data(updatedNodes)
        .style("fill", function(d, i) {
          return color(samples.indexOf(d.data.sample));
        });

      tickedChart
        .enter()
        .append("a")
        .attr("href", function(d) {
          return colossusUrl + d.data.id;
        })
        .attr("target", "_blank")
        .append("circle")
        .attr("class", "circles")
        .attr("id", function(d) {
          return d.data.id;
        })
        .merge(tickedChart)
        .attr("r", function(d) {
          return endAnimationFlag ? d.r : 2;
        })
        .attr("cx", function(d) {
          return endAnimationFlag ? d.x : d.p1.x;
        })
        .attr("cy", function(d) {
          return endAnimationFlag ? d.y : d.p1.y;
        })
        .attr(
          "transform",
          "translate(" +
            dim.screenWidth / 15 +
            "," +
            dim.screenHeight / 15 +
            ")"
        )
        .style("opacity", function() {
          if (endAnimationFlag) {
            return 1;
          } else {
            return 0;
          }
        });

      tickedChart.exit().remove();
    }

    function showDetail(d, i) {
      d3.select(this).classed("hover", true);

      tooltip.classed("hover", true);

      tooltip
        .html(
          "<b>Sample</b>: " +
            d.data.sample +
            "<br/> <b>Library</b>: " +
            d.data.library +
            "<br /> <b>Total Cells</b>: " +
            d.data.size +
            "<br /> <b>Seq Date</b>: " +
            d.data.seq
        )
        .style("left", d3.event.pageX + "px")
        .style("top", d3.event.pageY + "px");
    }

    function hideDetail(d, i) {
      d3.select(this).classed("hover", false);

      tooltip
        .classed("hover", false)
        .style("left", "0px")
        .style("top", "0px");
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

    function splitLineGraph(color, updatedNodes) {
      var linePath = d3.select(".line").node();
      var pathLength = linePath.getTotalLength();
      var segementedLines = [];

      for (var i = 0; i < stats.libraryCount; i++) {
        var p1 = linePath.getPointAtLength(
          pathLength * (i / stats.libraryCount)
        );
        var p2 = linePath.getPointAtLength(
          pathLength * ((i + 1) / stats.libraryCount)
        );

        var angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
        var libName = stats.libraryDates[i].library;
        var colour = color(samples.indexOf(stats.libraryDates[i].sample));

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

    function drawSegements(segementedLines) {
      var sep = d3
        .selectAll(".CircleChart")
        .append("g")
        .attr("class", "sep")
        .attr("width", dim.screenWidth)
        .attr("height", dim.screenHeight)
        .attr(
          "transform",
          "translate(" +
            dim.screenWidth / 15 +
            "," +
            dim.screenHeight / 15 +
            ")"
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
        .attr("stroke-width", "5px")
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
        .delay(8000)
        .style("opacity", 1)
        .transition()
        .delay(2000)
        .duration(2000)
        .attr("x2", function(d, i) {
          return d.p1.x;
        })
        .attr("y2", function(d, i) {
          return d.p1.y;
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
        width={this.props.windowDim.width}
        height={this.props.windowDim.height}
      />
    );
  }
}

export default CircleChart;
