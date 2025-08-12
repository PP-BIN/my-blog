const levels = ["debug", "info", "warn", "error"];
const currentLevel = process.env.LOG_LEVEL || "debug";
const isProd = process.env.NODE_ENV === "production";

function shouldLog(level) {
  return (
    !isProd && levels.indexOf(level) >= levels.indexOf(currentLevel)
  );
}

function log(level, ...args) {
  if (shouldLog(level)) {
    const method = console[level] ? level : "log";
    console[method](...args);
  }
}

const logger = {
  debug: (...args) => log("debug", ...args),
  info: (...args) => log("info", ...args),
  warn: (...args) => log("warn", ...args),
  error: (...args) => log("error", ...args),
};

export default logger;
