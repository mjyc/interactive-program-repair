const logger = require("./logger");

const checkComputeOverlapInputs = (t1, t2) => {
  if (t1.length < 2 || t2.length < 1) {
    throw new Error(
      `t1.length < 2 || t2.length < 1; t1.length=${t1.length} t2.length=${t2.length}`
    );
  } else if (t1[0].stamp !== t2[0].stamp) {
    throw new Error(
      `t1[0].stamp !== t2[0].stamp; t1[0].stamp=${t1[0].stamp} t2[0].stamp=${t2[0].stamp}`
    );
  } else if (t1[t1.length - 1].stamp < t2[t2.length - 1].stamp) {
    throw new Error(
      `t1[t1.length-1].stamp < t2[t2.length-1].stamp; t1[t1.length-1].stamp=${t1[t1.length - 1].stamp} t2[t2.length-1].stamp=${t2[t2.length - 1].stamp}`
    );
  }
};

const discretizeTrace = (trace, interval) => {
  if (trace.length < 1) return [];

  const arr = [];
  let prev = null;
  for (let i = 0; i < trace.length; i++) {
    const stamp = Math.floor(trace[i].stamp / interval) * interval;
    if (prev !== stamp) {
      arr.push({ stamp, value: trace[i].value });
    }
    prev = stamp;
  }
  let i = 0;
  let stamp = arr[0].stamp;
  let arr2 = [];
  i += 1;
  while (i < arr.length) {
    arr2.push({ stamp, value: arr[i - 1].value });
    stamp += interval;
    if (stamp >= arr[i].stamp) {
      i += 1;
    }
  }
  // ignores the last event!
  // arr2.push({ stamp, value: arr[i - 1].value }); // add the last event
  return arr2;
};

const computeOverlap = (trace1, trace2, { binSize = 1 } = {}) => {
  let tr1 = trace1.slice(0);
  if (trace1[trace1.length - 1].stamp < trace2[trace2.length - 1].stamp) {
    logger.debug(`trace1[trace1.length - 1].stamp < trace2[trace2.length - 1].stamp; trace1[trace1.length - 1].stamp=${trace1[trace1.length - 1].stamp} trace2[trace2.length - 1].stamp=${trace2[trace2.length - 1].stamp}
      `);
    tr1 = trace1.concat({
      stamp: trace2[trace2.length - 1].stamp,
      value: trace1[trace1.length - 1].value
    });
  }
  let tr2 = trace2.slice(0);
  if (trace1[trace1.length - 1].stamp > trace2[trace2.length - 1].stamp) {
    logger.debug(`trace1[trace1.length - 1].stamp > trace2[trace2.length - 1].stamp; trace1[trace1.length - 1].stamp=${trace1[trace1.length - 1].stamp} trace2[trace2.length - 1].stamp=${trace2[trace2.length - 1].stamp}
      `);
    tr2 = trace2.concat({
      stamp: trace1[trace1.length - 1].stamp,
      value: trace2[trace2.length - 1].value
    });
  }
  checkComputeOverlapInputs(tr1, tr2);
  tr1 = discretizeTrace(tr1, binSize);
  tr2 = discretizeTrace(tr2, binSize);
  const overlap = tr1.reduce((prev, v, i) => {
    return v.value === tr2[i].value ? prev + 1 : prev;
  }, 0);
  return overlap / tr1.length;
};

// https://stackoverflow.com/questions/23318037/size-of-json-object-in-kbs-mbs
const memorySizeOf = obj => {
  let bytes = 0;

  const sizeOf = o => {
    if (o !== null && o !== undefined) {
      switch (typeof o) {
        case "number":
          bytes += 8;
          break;
        case "string":
          bytes += o.length * 2;
          break;
        case "boolean":
          bytes += 4;
          break;
        case "object":
          var className = Object.prototype.toString.call(o).slice(8, -1);
          if (className === "Object" || className === "Array") {
            for (var key in o) {
              if (!o.hasOwnProperty(key)) continue;
              sizeOf(o[key]);
            }
          } else {
            return (bytes += o.toString().length * 2);
          }
          break;
      }
    }
    return bytes;
  };

  return sizeOf(obj);
};

module.exports = {
  checkComputeOverlapInputs,
  discretizeTrace,
  computeOverlap,
  memorySizeOf
};
