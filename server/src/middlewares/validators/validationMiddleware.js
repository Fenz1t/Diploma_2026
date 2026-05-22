const { validationResult } = require("express-validator");

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors = errors.array().map((err) => ({
      field: err.param,
      message: err.msg, // Здесь уже будет "Email уже используется"
      location: err.location,
    }));

    // Берем первое сообщение об ошибке для общего message
    const firstErrorMessage = formattedErrors[0]?.message || "Validation error";

    // Либо можно собрать все ошибки в одну строку:
    // const allErrors = formattedErrors.map(e => e.message).join(", ");

    res.status(400).json({
      success: false,
      message: firstErrorMessage, // Теперь будет конкретная ошибка
      errors: formattedErrors,
    });
  };
};

module.exports = validate;
