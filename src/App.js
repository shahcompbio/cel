import React, { Component } from "react";
import getData from "./utils/dataFetcher.js";
import CircleChart from "./circleChart/Chart.js";
import LineChart from "./lineChart/Chart.js";
import Counter from "./counter/Counter.js";
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null
    };
  }

  componentDidMount() {
    const dataCallback = data => {
      this.setState({ data });
    };
    getData(dataCallback);
  }

  render() {
    return this.state.data === null ? null : (
      <div className="App">
        <LineChart stats={this.state.data.stats} />
        <CircleChart
          library={this.state.data.library}
          samples={this.state.data.samples}
          stats={this.state.data.stats}
        />
        <Counter
          className="Counter"
          library={this.state.data.library}
          samples={this.state.data.samples}
          stats={this.state.data.stats}
        />
      </div>
    );
  }
}

export default App;
