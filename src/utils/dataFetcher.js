import * as d3 from "d3";

const getData = callback => {
  const url = "http://colossus.bcgsc.ca/api/library/?format=json";
  fetchUrl(url, [], arr => {
    const libraries = processLibs(arr);
    const samples = sampleFilter(libraries);
    const data = {
      library: nestedNotation(libraries),
      samples: samples,
      stats: {
        cellCount: getCellCount(libraries),
        libraryCount: libraries.length,
        libraryDates: addLibraryDates(libraries, samples)
      }
    };
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
  const dummyDate = libraryDates[libraryDates.length - 1];
  dummyDate.seq = getDayAfterLastSeq(libraryDates[libraryDates.length - 1]);
  return [...libraryDates, dummyDate];
}
function getDayAfterLastSeq(lastSeqDay) {
  var day = lastSeqDay.seq;
  day.setTime(day.getTime() + 48 * 60 * 60 * 1000);
  return day;
}

function getCellCount(data) {
  return data.reduce((sum, lib) => sum + lib.size, 0);
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

export default getData;
