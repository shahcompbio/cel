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
          fetchUrl(response.next, [...arr, ...jsonArr], callback);
        })
      }
    }

    function sortSamples(arr) {
      // takes an array of sample objects
      // returns a json object where patients are keys, 
      // and values are a list of samples that belong to that patient

      let patientDict = {};
      for (let i = 0; i < arr.length; i++) {
        const patientId = arr[i].anonymous_patient_id;

        if (!patientDict.hasOwnProperty(patientId)) {
          patientDict[patientId] = [];
        }

        // modify the sample object to make things easier for d3
        arr[i].name = arr[i].sample_id; 
        arr[i].size = 1;  // placeholder which seems to let pack do its thing and hence render the chart

        patientDict[patientId].push(arr[i]);  // push the object
      }

      return patientDict;
    }


    function countSampleIds(arr) {
      // an array of sample objects
      let sampleList = [];
      for (var sample in arr) {
        if (!(sample.sample_id in sampleList)) {
          sampleList.push(sample.sample_id);
        }
      }

      return sampleList.length;
    }


    function hierarchize(arr) {
      let sortedSamples = sortSamples(arr);

      // now convert it into a format that d3 likes
      // result must be an object representing the root node
      const patientList = []; 

      for (var patient in sortedSamples) {
        const obj = {};
        obj.name = patient;
        obj.children = sortedSamples[patient];
        obj.nSamples = obj.children.length;

        // check of number of objects associated with patient is the same as the number of
        // sample IDs associated with the patient
        // if (obj.children.length === countSampleIds(obj.children)) {
        //   console.log("MATCH for " + patient);
        // } else {
        //   console.log("NO MATCH for " + patient)
        // }

        patientList.push(obj);
      }

      return {"name": "samples", "children": patientList}
    }


    const url = "http://colossus.bcgsc.ca/api/sample/?format=json";
    fetchUrl(url, [], (arr) => this.setState({data: hierarchize(arr)}));

  }

  render() {
    // console.log(this.state);
    return (
      <div className="App">
        <Chart data={this.state.data}/> 
      </div>
    );
  }
}

export default App;

