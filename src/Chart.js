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

  	let pack = d3.pack()
  	    .size([diameter - 4, diameter - 4])
  	    .padding(15);

  	const nodeObj = node.selectAll(".node")
  		.data(pack(rootNode).descendants())
  		.enter().append("g")
  			.attr("id", function(d) { return d.data.name })
  			.attr("class", function(d) { 
  				return (d.children ? "node" : "leaf"); })
        		.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    d3.selectAll("#samples").remove()  // remove the large circle at the back

    nodeObj.append("circle")
      .attr("r", function(d) { return d.r })

    node.selectAll(".node")
      .on("mouseover", mouseOverNode)
      .on("mouseout", mouseOutNode);

    node.selectAll(".leaf")
      .on("mouseover", mouseOverLeaf)
      .on("mouseout", mouseOutLeaf);


    // define div for the tooltip
    const div = d3.select("body").append("div")
        .attr("class", "tooltip")


    function mouseOverNode(d, i) {
      console.log(d);
      d3.select(this).select("circle")
        .transition()
          .duration(800)
        .style("stroke-opacity", .9)
        .attr("r", function(d) {return d.r + 8})

      div.transition()
        .duration(800)
        .style("opacity", .9)

      div.html("<b>patient id</b>:  " + d.data.name + "<br/>" + "<b>n samples</b>: " + d.data.nSamples)
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY) + "px")
        // .style("height", "50px")

    }

    function mouseOutNode(d, i) {
      d3.select(this).select("circle")
        .transition()
          .duration(1000)
        .style("stroke-opacity", 0) 
        .attr("r", function(d) {return d.r})

      div.transition()
        .duration(800)
        .style("opacity", 0);
    }

    function mouseOverLeaf(d, i) {
      d3.select(this).select("circle")
        .style("stroke-opacity", .9)
        .attr("r", function(d) {return d.r + 5});

      div.transition()
        .duration(800)
        .style("opacity", .9)

      div.html("<b>sample id</b>: " + d.data.name)
        .style("left", (d3.event.pageX) + "px")
        .style("right", (d3.event.pageY) + "px")
    }

    function mouseOutLeaf(d, i) {
      d3.select(this).select("circle")
        .style("stroke-opacity", 0)
        .attr("r", function(d) {return d.r});

      div.transition()
        .transition(800)
        .style("opacity", 0);
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