import React, { Component } from "react";
import getData from "./utils/dataFetcher.js";
import Counter from "./counter/Counter.js";
import Chart from "./Chart/Chart.js";
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
        <Chart
          stats={this.state.data.stats}
          library={this.state.data.library}
          samples={this.state.data.samples}
          endAnimationTriggered={false}
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
