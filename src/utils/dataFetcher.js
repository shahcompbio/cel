import * as d3 from "d3";

const getData = callback => {
  const url = "http://colossus.bcgsc.ca/api/library/?format=json";
  fetchUrl(url, [], arr => {
    const libraries = processLibs(arr);
    const samples = sampleFilter(libraries);
    const data = {
      library: packNodes(nestedNotation(libraries)),
      samples: samples,
      stats: {
        cellCount: getCellCount(libraries),
        libraryCount: libraries.length,
        libraryMonthRange: getMonthRange(libraries),
        libraryDates: addLibraryDates(libraries, samples)
      }
    };
    data.stats["libraryMonthDates"] = getLibraryMonthStats(
      data.stats.libraryDates
    );
    callback(data);
  });
};

async function fetchUrl(url, arr, callback) {
  if (url == null) {
    callback(arr);
  } else {
    fetch(url)
      .then(response => response.json())
      .then(response => {
        const jsonArr = Object.values(response.results);
        fetchUrl(response.next, [...arr, ...jsonArr], callback);
      });
  }
}

function processLibs(data) {
  var parseTime = d3.timeParse("%Y-%m-%d");
  return data
    .filter(hit => hit.dlpsequencing_set.length > 0)
    .filter(hit => hit.num_sublibraries > 0)
    .map(filterData => ({
      id: filterData.id,
      library: filterData.pool_id,
      sample: filterData.sample.sample_id,
      size: filterData.num_sublibraries,
      seq: parseTime(filterData.dlpsequencing_set[0].submission_date)
    }));
}

function sampleFilter(data) {
  return data.reduce((result, hit) => {
    return !result.includes(hit.sample) ? [...result, hit.sample] : result;
  }, []);
}

function addLibraryDates(data, samples) {
  //Sort by date and add index with accumulative cellCount
  const libraryDates = data
    .map(hit => ({ index: samples.indexOf(hit.sample), ...hit }))
    .sort((a, b) => a.seq - b.seq)
    .reduce(
      (result, hit) => [
        ...result,
        {
          accCellCount:
            result.length == 0
              ? hit.size
              : hit.size + result[result.length - 1].accCellCount,
          ...hit
        }
      ],
      []
    );

  return libraryDates;
}
function getMonthRange(data) {
  data.sort(function(a, b) {
    return a.seq - b.seq;
  });
  return (
    12 *
      (data[data.length - 1].seq.getFullYear() -
        1 -
        data[0].seq.getFullYear()) +
    12 -
    data[0].seq.getMonth() +
    data[data.length - 1].seq.getMonth()
  );
}

function getCellCount(data) {
  return data.reduce((sum, lib) => sum + lib.size, 0);
}

const pack = d3
  .pack()
  .size([window.innerWidth * 0.9, window.innerHeight * 0.8]);
function packNodes(libraries) {
  return pack(libraries)
    .descendants()
    .filter(d => d.depth === 2)
    .sort((a, b) => a.data.seq - b.data.seq);
}

function nestedNotation(data) {
  const nested = d3
    .nest()
    .key(d => d.sample)
    .entries(data)
    .map(d => ({ name: d.key, children: d.values }));

  return d3
    .hierarchy({ name: "root", children: nested })
    .sum(function(d) {
      return d.size;
    })
    .sort(function(a, b) {
      return a.data.seq - b.data.seq;
    });
}

function getLibraryMonthStats(libraryData) {
  //const chosen = (({ accCellCount, seq }) => ({ accCellCount, seq }))(
  //  libraryData
  //  );
  const timeFormat = d3.timeFormat("%B-%Y");
  var reducedArray = [];
  const chosen = libraryData
    .map(library =>
      (({ accCellCount, seq }) => ({ accCellCount, seq }))(library)
    )
    .map(
      library => ({
        count: library.accCellCount,
        month: timeFormat(library.seq)
      }),
      []
    );
  /*  .each(hit => {
      var index;
      if (finalArray.length === 0) {
        index = 0;
      } else if (finalArray[finalArray.length - 1].month === hit.month) {
        index = finalArray.length - 1;
      } else {
        index = finalArray.length;
      }
      finalArray[index] = hit;
    }, []);
  console.log(chosen);*/
}

export default getData;
