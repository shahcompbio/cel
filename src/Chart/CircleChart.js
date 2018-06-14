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
      goToEndAnimation = this.props.goToEndAnimation.bind(this),
      initializeSvg = this.props.initializeSvg.bind(this),
      initializeXaxis = this.props.initializeXaxis.bind(this),
      hideDetail = this.props.hideDetail.bind(this),
      hideElement = this.props.hideElement.bind(this),
      showElement = this.props.showElement.bind(this),
      initializeEndClick = this.props.initializeEndClick.bind(this),
      colossusUrl = "http://colossus.bcgsc.ca/dlp/library/";

    const mainSvg = initializeSvg(".CircleChart");

    initializeTooltip();
    const color = initializeColors(samples.length);

    const clusters = getClusters();

    const pointData = splitLineGraph(color, libraries);

    const updatedNodes = libraries.map((d, i) => {
      return { p1: pointData[i].p1, ...d };
    });

    const simulation = forceSimulation(updatedNodes);
    initializeEndClick();

    drawSegements(pointData);
    startLineAnimation();
    appendSwitchViewsButtons();
    appendSortToggle();

    d3.timeout(function() {
      for (
        var i = 0,
          n = Math.ceil(
            Math.log(simulation.alphaMin()) /
              Math.log(1 - simulation.alphaDecay())
          );
        i < n;
        ++i
      ) {
        simulation.tick();
      }
    });

    function forceSimulation(updatedData) {
      return d3
        .forceSimulation(updatedData)
        .force("center", d3.forceCenter(dim.width / 2, dim.height / 2))
        .force("charge", null)
        .force(
          "collision",
          d3.forceCollide().radius(function(d) {
            return d.r + 2;
          })
        )
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
        .force("cluster", clustering)
        .on("tick", function() {
          ticked(updatedData);
        })
        .on("end", function() {
          goToEndAnimation(false);
        });
    }

    function getClusters() {
      const clusters = new Array(samples.length);
      libraries.forEach(function(d) {
        const i = samples.indexOf(d.data.sample);
        if (!clusters[i] || d.r > clusters[i].r) {
          clusters[i] = d;
        }
      });
      return clusters;
    }

    function appendSwitchViewsButtons() {
      d3
        .select(".App")
        .append("div")
        .classed("switchViews", true)
        .classed("circleView", true)
        .style("margin-top", dim.height / 3 + "px")
        .text(">")
        .on("mousedown", function() {
          d3
            .select(this)
            .classed("circleView", !d3.select(this).classed("circleView"));
          hideDetail();
          d3.selectAll(".pulse ellipse").style("opacity", 0);
          toggleViews();
        })
        .style("opacity", 0);
    }

    function toggleViews() {
      if (d3.select(".switchViews").classed("circleView")) {
        //Show the circle chart
        showElement(".CircleChart");
        showElement(".toggles");
        d3.select(".CircleChart").style("pointer-events", "all");
        //Hide the line chart
        hideElement(
          ".LineChart .xAxis, .LineChart text, .LineChart .yAxis,.LineChart .line, .focusMarker"
        );
      } else {
        //Show the line chart
        showElement(
          ".LineChart .xAxis, .LineChart text, .LineChart .yAxis,.LineChart .line, .focusMarker"
        );
        //Hide the circle chart
        d3.select(".CircleChart").style("pointer-events", "none");
        hideElement(".CircleChart");
        hideElement(".toggles");
      }
    }
    function appendSortToggle() {
      initSortContainers();
      initializeXaxis(mainSvg);

      addOrderlSlider("Order by Date", "Date", sortByDate);
      addOrderlSlider("Select a Sample", "Sample", sortBySample);

      addSupplementarySortElements();
      d3.select(".orderBySample .switch input").attr("disabled", "");
      hideElement(".CircleChart .xAxis");
      hideElement(".toggles");
    }

    function addSupplementarySortElements() {
      //Move the xAxis for ordered by date
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
      //Append a list of unique samples for ordered by sample name
      var sampleToggle = d3
        .select(".orderBySample")
        .append("div")
        .style("height", dim.height / 3 + "px")
        .classed("uniqueSampleDiv", true)
        .append("ul")
        .classed("uniqueSampleList", true);

      sampleToggle
        .selectAll(".uniqueSampleList")
        .data(getUniqueSamples())
        .enter()
        .append("li")
        .html(d => d)
        .on("click", selectSample)
        .on("mouseover", function() {
          var sampleName = d3.select(this).text();
          hoverFilterSample(true, sampleName);
        })
        .on("mouseout", function() {
          var sampleName = d3.select(this).text();
          hoverFilterSample(false, sampleName);
        });
    }
    function hoverFilterSample(isMouseOverEvent, highlightedSample) {
      //Grey out everything that isn't chosen
      d3
        .selectAll(".CircleChart circle:not(.sample-" + highlightedSample + ")")
        .classed("greyedOutHoverSample", isMouseOverEvent);

      var hoveredCircleSelection = d3.selectAll(
        ".CircleChart .sample-" + highlightedSample
      );

      //Remove previous grey from choosen sample
      hoveredCircleSelection.classed("greyedOutCircle", false);

      //If hover out go back to original state
      if (
        !isMouseOverEvent &&
        hoveredCircleSelection.classed("unselectedSample")
      ) {
        hoveredCircleSelection.classed("greyedOutCircle", true);
      }
    }

    function selectSample(d) {
      //Change the status of the selected sample
      d3.selectAll(".uniqueSampleList li").filter(sample => {
        if (d3.select(this).text() === d) {
          var sampleFilterStatus = d3
            .select(this)
            .classed("chosenSampleFilter");
          d3.select(this).classed("chosenSampleFilter", !sampleFilterStatus);
        }
      });
      //Get all the chosen samples
      var allChosenSamples = [];
      var chosenSamples = d3
          .selectAll(".uniqueSampleList .chosenSampleFilter")
          .each(element => {
            allChosenSamples.push(element);
          }, []),
        allUniqueSamples = [];

      //If there is 1+ chosen samples
      if (allChosenSamples.length > 0) {
        d3.select(".orderBySample").classed("sample-toggled", true);
        var allSamples = d3.selectAll(".uniqueSampleList li");
        allSamples.each(element => {
          allUniqueSamples.push(element);
        });

        allUniqueSamples.map(sample => {
          //Higlight or colour grey according to what is chosen
          d3
            .selectAll(".CircleChart .sample-" + sample)
            .classed("greyedOutCircle", function() {
              return allChosenSamples.indexOf(sample) === -1;
            })
            .classed("unselectedSample", function() {
              return allChosenSamples.indexOf(sample) === -1;
            });
        });

        //Colour title blue
        d3.select(".orderBySample text").classed("filterSelected", true);

        //Move the sample switch to on and allow ability to turn off
        d3
          .select(".orderBySample .switch input")
          .attr("checked", "")
          .attr("disabled", null);
      } else {
        d3
          .selectAll("circle")
          .classed("greyedOutCircle", false)
          .classed("unselectedSample", false);

        //Turn sample switch off and remove blue highlight colour
        d3.select(".orderBySample").classed("sample-toggled", false);
        d3.select(".orderBySample text").classed("filterSelected", false);
        d3
          .select(".orderBySample .switch input")
          .attr("checked", null)
          .attr("disabled", "");
      }
    }

    function initSortContainers() {
      d3
        .select(".App")
        .append("div")
        .classed("toggles", true)
        .style("margin-top", dim.width / 8 + "px")
        .style("margin-left", dim.height / 18 + "px")
        .style("float", "left");
    }
    function getUniqueSamples() {
      return samples.filter(
        (sample, index, self) => self.indexOf(sample) === index
      );
    }
    function addOrderlSlider(title, className, onClick) {
      d3
        .select(".toggles")
        .append("div")
        .style("margin-bottom", "30px")
        .classed("orderBy" + className, true)
        .html(
          "<br>\
                <label class='switch'> \
                  <input type='checkbox'>\
                    <span class='slider round'></span>\
                </label>\
                <text class='orderBy" +
            className +
            "Text'>" +
            title +
            "</text>"
        )
        .select(".slider")
        .on("click", onClick);
    }

    function sortBySample() {
      //Toggling the select sample switch
      if (!d3.select(this).classed("sample-toggled")) {
        d3.select(".orderBySample text").classed("filterSelected", false);
        d3
          .select(".orderBySample .switch input")
          .attr("checked", null)
          .attr("disabled", "");

        d3
          .selectAll(".uniqueSampleList li")
          .classed("chosenSampleFilter", false);
        d3
          .selectAll("circle")
          .classed("greyedOutCircle", false)
          .classed("unselectedSample", false);
      }
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
        d3.select(".orderByDate text").classed("filterSelected", true);
      } else {
        d3.select(".orderByDate text").classed("filterSelected", false);
        hideElement(".CircleChart .xAxis");
        goToEndAnimation(true);
      }
      d3
        .select(this)
        .classed("date-toggled", !d3.select(this).classed("date-toggled"));
    }

    function clustering(alpha) {
      return libraries.map(node => {
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

    function ticked(updatedData) {
      const tickedChart = appendColourToCircleNodes(updatedData, node);
      var endAnimation = d3.select(".LineChart").classed("clicked");
      tickedChart
        .enter()
        .append("a")
        .attr("href", function(d) {
          return colossusUrl + d.data.id;
        })
        .attr("target", "_blank")
        .append("circle")
        .attr("class", "circles")
        .attr("class", function(d) {
          return "sample-" + d.data.sample;
        })
        .attr("id", function(d) {
          return "library-" + d.data.id;
        })
        .merge(tickedChart)
        .attr("r", function(d) {
          return endAnimation ? d.r : 2;
        })
        .attr("cx", function(d) {
          return endAnimation ? d.x : d.p1.x;
        })
        .attr("cy", function(d) {
          return endAnimation ? d.y : d.p1.y;
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
          if (endAnimation) {
            return 1;
          } else {
            return 0;
          }
        });

      tickedChart.exit().remove();
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

    function appendColourToCircleNodes(updatedData, node) {
      return node
        .selectAll("circle")
        .data(updatedData)
        .style("fill", function(d, i) {
          return color(samples.indexOf(d.data.sample));
        });
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
