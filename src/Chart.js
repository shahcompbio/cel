import React, { Component } from 'react'
import * as d3 from 'd3'
import { select } from 'd3';

class Chart extends Component {
  static defaultProps = { width: 1500, height: 1000 };

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
    const data = this.props.data,
          node = select(this.node), 
          width = node.attr('width'),
          height = node.attr('height'),
          transitionDur = 500;

    // tooltip box
    const div = d3.select('body').append('div')
      .attr('class', 'tooltip');


    // create an array of samples
    const samples = [];
    data.forEach(function(d) {
      if (!samples.includes(d.sample)) {
        samples.push(d.sample);
      }
    });

    
    const m = samples.length;

    var color = d3.scaleSequential()
      .domain([0, m])
      .interpolator(d3.interpolateRainbow);

    // convert the data into a format that d3.hierarchy likes
    const nested = d3.nest()
      .key(function(d) { return d.sample })
      .entries(data)
      
    // change from "key" and "values" to "name" and "children"
    const mapped = nested.map(function(d) { return {'name': d.key, 'children': d.values } });

    // now create the root node
    const r = d3.hierarchy({'name': 'root', 'children': mapped})
      .sum(function(d) { return d.size })
      .sort(function(a, b) { return a.value - b.value })


    const pack = d3.pack()
      .size([width, height])

    const nodes = pack(r).descendants().filter(function(d) {return d.depth === 2});  // only retain nodes of max depth

    const clusters = new Array(m);
    nodes.forEach(function(d) {
      const i = samples.indexOf(d.data.sample)
      // console.log(i)
      if (!clusters[i] || (d.r > clusters[i].r)) {
        clusters[i] = d;
      }
    })


    d3.forceSimulation(nodes)
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('charge', d3.forceManyBody().strength(5))
      .force('collision', d3.forceCollide().radius(function(d) { return d.r }))
      .force('cluster', clustering)
      .force('x', d3.forceX().x(function(d) { return samples.indexOf(d.data.sample) * 10})) 
      .on('tick', ticked);  // enables you to get the state of the layout when it has changed


    function clustering(alpha) {
      nodes.forEach(function(d) {
        const cluster = clusters[samples.indexOf(d.data.sample)];
        if (cluster === d) return;
        var x = d.x - cluster.x,
            y = d.y - cluster.y,
            l = Math.sqrt(x * x + y * y),
            r = d.r + cluster.r;
        if (l !== r) {
          l = (l - r) / l * alpha;
          d.x -= x *= l;
          d.y -= y *= l;
          cluster.x += x;
          cluster.y += y;
        }  
      });
    }

    
    function ticked() {
      const u = node.selectAll('circle')
        .data(nodes)
        .attr('r', function(d) { return d.r })
        .style('fill', function(d) { return color(samples.indexOf(d.data.sample)) })
        .on('mouseover', showDetail)
        .on('mouseout', hideDetail);

      u.enter()
        .append('circle')
        .merge(u)
        .attr('cx', function(d) { return d.x } )
        .attr('cy', function(d) { return d.y } )

      u.exit().remove()
    }


    function showDetail(d, i) {
      console.log(this)
      d3.select(this).classed("hover", true)
        .transition().duration(transitionDur);
      
      div.classed("hover", true)
        .transition().duration(transitionDur);

      div.html('<b>sample</b>: ' +  d.data.sample + '<br/> <b>library</b>: ' + d.data.name + '<br /> <b>num_sublibraries</b>: ' + d.data.size)
        .style('left', (d3.event.pageX) + 'px')
        .style('top', (d3.event.pageY) + 'px');
    }


    function hideDetail(d, i) {
      d3.select(this).classed("hover", false)
        .transition().duration(transitionDur);

      div.classed("hover", false)
        .transition().duration(transitionDur);
    }

  }



  render() {
  	if (this.props.data === null) {
  		return null
  	}

	return (
		<svg ref={node => this.node = node} width={this.props.width} height={this.props.height}>
	    </svg>
	);

  }
}


export default Chart