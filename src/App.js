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


    function sortLibs(arr) {
      let dict = {};
      for (let i = 0; i < arr.length; i++) {
        const patientId = arr[i].sample.anonymous_patient_id;
        const sampleId = arr[i].sample.sample_id;

        if (!dict.hasOwnProperty(patientId)) {
          dict[patientId] = [];
        }

        if (!dict[patientId].hasOwnProperty(sampleId)) {
          dict[patientId][sampleId] = [];
        }

        const libObj = { "name": arr[i].pool_id, "num_sublibraries": arr[i].num_sublibraries, "level": "library", "size": 1};
        dict[patientId][sampleId].push(libObj);  // push the object
      }

      // console.log(dict)

      return dict;
    }


    function hierarchize(arr) {
      let sortedLibs = sortLibs(arr);

      // now convert it into a format that d3 likes
      // result must be an object representing the root node
      const patientList = []; 

      for (let patient in sortedLibs) {
        const obj = {};
        obj.name = patient;
        obj.type = "patient";

        // TODO: refactor this double for-loop
        let samples = [];
        for (let key in sortedLibs[patient]) {
          const sampleObj = {"name": key, "children": sortedLibs[patient][key], "level": "sample"}
          sampleObj.nLibs = sortedLibs[patient][key].length;
          samples.push(sampleObj);
        }

        obj.children = samples;
        obj.nSamples = obj.children.length;

        patientList.push(obj);
      }

      // console.log(patientList)

      return {"name": "samples", "children": patientList}
    }


  // const url = "http://colossus.bcgsc.ca/api/sample/?format=json";
  const url = "http://colossus.bcgsc.ca/api/library/?format=json";
  fetchUrl(url, [], (arr) => this.setState({data: hierarchize(arr)}));

  }


  render() {
    // console.log(this.state);
    // <Chart data={this.state.data}/> 
    return (
      <div className="App">
        <Chart data={this.state.data}/>
      </div>
    );
  }
}

export default App;

