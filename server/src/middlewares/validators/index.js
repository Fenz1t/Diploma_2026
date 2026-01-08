const validate = require("./validationMiddleware");
const common = require("./commonValidator");
const position = require("./positionValidator");

module.exports = {
  validate,
  common,
  position,
};
