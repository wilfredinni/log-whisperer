const startWithDatePattern = new RegExp(
  "^(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2},\\d{3}.*$)",
  "gm"
);
const logLevelPattern = new RegExp(/(INFO|ERROR|DEBUG|WARNING)/);

const datePattern = new RegExp(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3})/);

export { startWithDatePattern, logLevelPattern, datePattern };
