import * as yup from "yup";
import { PROJECT_STATUSES } from "../constants/projectStatus";

export const projectSchema = yup.object({
  name: yup
    .string()
    .required("Название проекта обязательно")
    .min(3, "Минимум 3 символа")
    .max(200, "Максимум 200 символов")
    .trim(),

  description: yup
    .string()
    .max(1000, "Максимум 1000 символов")
    .nullable()
    .optional()
    .default(""),

  status: yup
    .string()
    .oneOf(Object.values(PROJECT_STATUSES), "Некорректный статус проекта")
    .required("Статус обязателен")
    .default(PROJECT_STATUSES.PLANNED),

  start_date: yup
    .mixed()
    .nullable()
    .test("is-valid-date-or-null", "Некорректная дата", (value) => {
      // Если значение null, undefined или пустая строка - разрешаем
      if (!value || value === "") return true;

      // Проверяем, является ли значение валидной датой
      const date = new Date(value);
      return !isNaN(date.getTime());
    })
    .transform((value, originalValue) => {
      // Преобразуем пустые строки в null
      if (originalValue === "" || originalValue === null) {
        return null;
      }
      return value;
    }),

  end_date: yup
    .mixed()
    .nullable()
    .test("is-valid-date-or-null", "Некорректная дата", (value) => {
      // Если значение null, undefined или пустая строка - разрешаем
      if (!value || value === "") return true;

      // Проверяем, является ли значение валидной датой
      const date = new Date(value);
      return !isNaN(date.getTime());
    })
    .transform((value, originalValue) => {
      // Преобразуем пустые строки в null
      if (originalValue === "" || originalValue === null) {
        return null;
      }
      return value;
    })
    .test(
      "is-after-start",
      "Дата завершения должна быть позже даты начала",
      function (value) {
        const { start_date } = this.parent;

        // Если обе даты null или пустые - проверка не требуется
        if ((!start_date || start_date === "") && (!value || value === "")) {
          return true;
        }

        // Если есть только дата начала или только дата завершения
        if (!start_date || start_date === "" || !value || value === "") {
          return true;
        }

        const startDate = new Date(start_date);
        const endDate = new Date(value);

        // Проверяем, что дата завершения не раньше даты начала
        return endDate >= startDate;
      },
    ),
});
