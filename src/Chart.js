import React, { Component } from 'react'
import * as d3 from 'd3'
import { select } from 'd3';

class Chart extends Component {
  static defaultProps = {width: 1000, height: 1000};

  componentDidMount() {
  	if (this.props.data !== null) {
  		this.createChart()
  	}
  }

  componentDidUpdate() {
  	if (this.props.data !== null) {
  		this.createChart()
  	}
  }


  createChart() {

  	const node = select(this.node); // node of this component
    	const diameter = node.attr("width")

    const data = this.props.data;
  	const rootNode = d3.hierarchy(data)
  		.sum(function(d) { return d.size; })
  		.sort(function(a, b) { return b.value - a.value });


    // console.log(rootNode)

  	let pack = d3.pack()
  	    .size([diameter - 4, diameter - 4])
  	    .padding(6);

  	const nodeObj = node.selectAll(".node")
  		.data(pack(rootNode).descendants())
  		.enter().append("g")
  			.attr("id", function(d) { return d.data.name })
        .attr("class", function(d) { 
          return (d.depth === 1 ? "patient" : d.depth === 2 ? "sample" : "library")
        })
    		.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    d3.selectAll("#samples").remove()  // remove the large circle at the back

    var color = d3.scaleLinear()
      .domain([-1, 5])
      .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
      .interpolate(d3.interpolateHcl);

    nodeObj.append("circle")
      .attr("r", function(d) { return d.r })
      .style("fill", function(d) { return color(d.depth); });

    node.selectAll(".patient")
      .on("mouseover", mouseOverPatient)
      .on("mouseout", handleMouseOut);

    node.selectAll(".sample")
      .on("mouseover", mouseOverSample)
      .on("mouseout", handleMouseOut);

    // node.selectAll(".library")
    //   .on("mouseover", mouseOverLib)
    //   .on("mouseout", handleMouseOut)


    // define div for the tooltip
    const div = d3.select("body").append("div")
        .attr("class", "tooltip")


    // handle mouse events
    function handleMouseOver(selection, text) {
      // animate circle itself
      selection.select("circle")
        .transition()
          .duration(800)
        .style("stroke-opacity", .9)
        .attr("r", function(d) { return d.r + 5});

      // animate the tooltip box
      div.transition()
        .duration(800)
        .style("opacity", .9);

      div.html(text)
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY) + "px");
    }


    function handleMouseOut(d, i) {
      d3.select(this).select("circle")
        .transition()
          .duration(1000)
        .style("stroke-opacity", 0) 
        .attr("r", function(d) { return d.r} )

      div.transition()
        .duration(800)
        .style("opacity", 0)

    }


    function mouseOverPatient(d, i) {
      handleMouseOver(d3.select(this), "<b>patient id</b>: " + d.data.name + "<br/> <b>n samples</b>: " + d.data.nSamples);
    }

    function mouseOverSample(d, i) {
      handleMouseOver(d3.select(this), "<b>sample id</b>: " + d.data.name + "<br/> <b>n libraries</b>: " + d.data.nLibs);
    }

  }




  render() {
  	if (this.props.data === null) {
  		return null
  	}


	// <svg width="400" height="400"></svg>

	return (
		<svg ref={node => this.node = node} width={this.props.width} height={this.props.height}>
	    </svg>
	);

  }
}


export default Chart