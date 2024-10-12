import { bot, channelId, kv } from "./mod.ts";

export type OrderStatus = "work" | "out" | "recent";

export interface OrderData {
  status: OrderStatus;
  caption: string;
  createdAt: Date;
  messageId: number;
}

export const postKey = () => ["post"];
export const orderKey = (id: number) => ["order", id];
export const phantomKey = (id: number) => ["phantom", id];

export const createOrder = async (id: number, caption: string) => {
  const data: OrderData = {
    status: "work",
    caption,
    messageId: id,
    createdAt: new Date(),
  };
  await kv.set(orderKey(id), data);
};
export const setOrderStatus = async (id: number, status: OrderStatus) => {
  const order = await kv.get<OrderData>(orderKey(id));
  if (!order.value) return;
  await kv.atomic()
    .check(order)
    .set(orderKey(id), { ...order.value, status })
    .commit();
};
export const requestOrderDelete = async (id: number) => {
  await kv.enqueue({ type: "delete", id }, { delay: 3 * 24 * 60 * 60 * 1000 });
};
export const deleteOrder = async (id: number) => {
  const order = await kv.get<OrderData>(orderKey(id));
  await kv.atomic()
    .check(order)
    .delete(orderKey(id))
    .set(phantomKey(id), order.value)
    .commit();
};
export const resetOrderDate = async (id: number) => {
  const order = await kv.get<OrderData>(orderKey(id));
  await kv.atomic()
    .check(order)
    .set(orderKey(id), { ...order.value, createdAt: new Date() })
    .commit();
};

export const updatePost = async () => {
  const postId = await getPost();
  if (!postId) return;

  await bot.api.editMessageText(channelId, postId, await genPostText(), {
    parse_mode: "HTML",
  });
};
export const setPost = async (messageId: number) => {
  await kv.set(postKey(), messageId);
};
export const getPost = async () => {
  return (await kv.get<number>(postKey())).value;
};
export const genPostText = async () => {
  const tasks = await Array.fromAsync(
    kv.list<OrderData>({ prefix: ["order"] }),
    (e) => e.value,
  );

  const workTasks = tasks.filter((task) => task.status == "work");
  const outTasks = tasks.filter((task) => task.status == "out");
  const recentTasks = tasks.filter((task) => task.status == "recent");

  const workText = "<b>В работе</b>\n" +
    workTasks.map((t, i) =>
      `${i + 1}. ${
        t.createdAt.toLocaleDateString("ru", {
          timeZone: "Asia/Yekaterinburg",
          day: "numeric",
          month: "short",
        }) || "???"
      } <a href="https://t.me/c/${
        channelId.toString().slice(3)
      }/${t.messageId}">${t.caption}</a>`
    ).join("\n");

  const outText = "<b>На выдаче</b>\n" +
    outTasks.map((t, i) =>
      `${i + 1}. ${
        t.createdAt.toLocaleDateString("ru", {
          timeZone: "Asia/Yekaterinburg",
          day: "numeric",
          month: "short",
        }) || "???"
      } <a href="https://t.me/c/${
        channelId.toString().slice(3)
      }/${t.messageId}">${t.caption}</a>`
    ).join("\n");

  const recentText = "<b>Недавние</b>\n" +
    recentTasks.map((t, i) =>
      `${i + 1}. ${
        t.createdAt.toLocaleDateString("ru", {
          timeZone: "Asia/Yekaterinburg",
          day: "numeric",
          month: "short",
        }) || "???"
      } <a href="https://t.me/c/${
        channelId.toString().slice(3)
      }/${t.messageId}">${t.caption}</a>`
    ).join("\n");

  const notNullTexts = [
    [workTasks, workText],
    [outTasks, outText],
    [recentTasks, recentText],
  ].filter((e) => e[0].length).map((e) => e[1]);

  return notNullTexts.length
    ? notNullTexts.join("\n\n")
    : "Заказ-нарядов ещё нет.";
};
