const validate = require("./validationMiddleware");
const common = require("./commonValidator");
const position = require("./positionValidator");
const project = require("./projectValidator");

module.exports = {
  validate,
  common,
  position,
  project
};
