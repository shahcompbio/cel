import React, { Component } from 'react';
import Chart from './Chart'
import './App.css';

class App extends Component {

  constructor(props) {

    super(props);
    this.state = {data: null};  // initial state

  }

  componentDidMount() {

    async function fetchUrl(url, arr, callback) {
      if (url == null) {
        callback(arr);
      } else {
        fetch(url)
        .then(function(response) {
          return response.json();
        })
        .then(response => {
          const jsonArr = Object.values(response.results);
          // console.log(jsonArr)
          fetchUrl(response.next, [...arr, ...jsonArr], callback);
        })
      }
    }


    function processLibs(arr) {
      let list = [];

      for (let i = 0; i < arr.length; i++) {
        if (arr[i].num_sublibraries > 0) {
          const libObj = {
            "name": arr[i].pool_id, 
            "sample": arr[i].sample.sample_id, 
            "size": arr[i].num_sublibraries
          }

        list.push(libObj);
        }
      }

      return list
    }

    const url = "http://colossus.bcgsc.ca/api/library/?format=json";
    fetchUrl(url, [], (arr) => this.setState({data: processLibs(arr)}));

  }


  render() {
    return (
      <div className="App">
        <Chart data={this.state.data}/>
      </div>
    );
  }
}

export default App;

