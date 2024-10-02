import { channelId } from "./mod.ts";
import { listTasks } from "./tasks.ts";

export const genPostText = async () => {
  const tasks = await listTasks();
  if (!tasks.length) return "Заказ-нарядов нет.";
  const work = tasks.filter((task) => task.value.status == "work");
  const out = tasks.filter((task) => task.value.status == "out");

  return (
    "<b>В работе:</b>\n" +
    (work.length
      ? work
        .map(
          (task, i) =>
            `${i + 1}. <a href="https://t.me/c/${
              channelId.toString().slice(4)
            }/${task.key[1].toString()}">${task.value.text}</a> (${
              task.value.date
                ? task.value.date.toLocaleDateString("ru", {
                  day: "numeric",
                  month: "short",
                  timeZone: "Asia/Yekaterinburg",
                })
                : "???"
            })`,
        )
        .join("\n")
      : "Заказ-нарядов в работе нет.") +
    "\n\n<b>На выдачу:</b>\n" +
    (out.length
      ? out
        .map(
          (task, i) =>
            `${i + 1}. <a href="https://t.me/c/${
              channelId.toString().slice(4)
            }/${task.key[1].toString()}">${task.value.text}</a> (${
              task.value.date
                ? task.value.date.toLocaleDateString("ru", {
                  day: "numeric",
                  month: "short",
                  timeZone: "Asia/Yekaterinburg",
                })
                : "???"
            })`,
        )
        .join("\n")
      : "Заказ-нарядов на выдачу нет.")
  );
};
