import { Bot } from "grammy";
import {
  createOrder,
  deleteOrder,
  type OrderData,
  orderKey,
  resetOrderDate,
  setPost,
  updatePost,
} from "./order.ts";
import { setOrderStatus } from "./order.ts";
import { requestOrderDelete } from "./order.ts";

export const bot = new Bot(Deno.env.get("BOT_TOKEN") || "");
export const kv = await Deno.openKv();

export const channelId = Number(Deno.env.get("CHANNEL_ID"));
export const groupId = Number(Deno.env.get("GROUP_ID"));

bot.chatType("channel").command("post", async (ctx) => {
  if (ctx.chat.id != channelId) return;

  await setPost(ctx.channelPost.message_id);
  await updatePost();
});

bot.chatType("channel").on("channel_post:caption", async (ctx) => {
  if (ctx.chat.id != channelId) return;

  await createOrder(ctx.channelPost.message_id, ctx.channelPost.caption);
  await updatePost();
});

bot.chatType("supergroup").hears(["Обновить", "обновить"], async (ctx) => {
  if (ctx.chat.id != groupId) return;

  try {
    await updatePost();
    await ctx.react("👍");
  } catch {
    await ctx.react("😐");
  }
});

bot.chatType("supergroup").hears(["сбросить", "Сбросить"], async (ctx) => {
  if (ctx.chat.id != groupId) return;
  if (!ctx.message.reply_to_message) return;
  if (!ctx.message.reply_to_message.is_automatic_forward) return;
  if (!ctx.message.reply_to_message.forward_origin) return;
  if (ctx.message.reply_to_message.forward_origin.type != "channel") return;
  if (ctx.message.reply_to_message.forward_origin.chat.id != channelId) return;

  await resetOrderDate(ctx.message.reply_to_message.forward_origin.message_id);
  await updatePost();
  await ctx.react("👍");
});

bot.chatType("supergroup").hears(
  ["готов", "Готов", "на выдачу", "На выдачу"],
  async (ctx) => {
    if (ctx.chat.id != groupId) return;
    if (!ctx.message.reply_to_message) return;
    if (!ctx.message.reply_to_message.is_automatic_forward) return;
    if (!ctx.message.reply_to_message.forward_origin) return;
    if (ctx.message.reply_to_message.forward_origin.type != "channel") return;
    if (
      ctx.message.reply_to_message.forward_origin.chat.id != channelId
    ) return;

    await setOrderStatus(
      ctx.message.reply_to_message.forward_origin.message_id,
      "out",
    );
    await updatePost();
    await ctx.react("👍");
  },
);

bot.chatType("supergroup").hears(
  ["в работу", "В работу"],
  async (ctx) => {
    if (ctx.chat.id != groupId) return;
    if (!ctx.message.reply_to_message) return;
    if (!ctx.message.reply_to_message.is_automatic_forward) return;
    if (!ctx.message.reply_to_message.forward_origin) return;
    if (ctx.message.reply_to_message.forward_origin.type != "channel") return;
    if (
      ctx.message.reply_to_message.forward_origin.chat.id != channelId
    ) return;

    await setOrderStatus(
      ctx.message.reply_to_message.forward_origin.message_id,
      "work",
    );
    await updatePost();
    await ctx.react("👍");
  },
);

bot.chatType("supergroup").hears(
  ["выдан", "Выдан", "Выдал", "выдал"],
  async (ctx) => {
    if (ctx.chat.id != groupId) return;
    if (!ctx.message.reply_to_message) return;
    if (!ctx.message.reply_to_message.is_automatic_forward) return;
    if (!ctx.message.reply_to_message.forward_origin) return;
    if (ctx.message.reply_to_message.forward_origin.type != "channel") return;
    if (
      ctx.message.reply_to_message.forward_origin.chat.id != channelId
    ) return;

    await setOrderStatus(
      ctx.message.reply_to_message.forward_origin.message_id,
      "recent",
    );
    await requestOrderDelete(
      ctx.message.reply_to_message.forward_origin.message_id,
    );
    await updatePost();
    await ctx.react("👍");
  },
);

bot.chatType("supergroup").hears(/^(?:у|У)брать .*/, async (ctx) => {
  if (ctx.chat.id != groupId) return;
  if (!ctx.message.text) return;
  try {
    await deleteOrder(Number(ctx.message.text.split(" ")[1].split("/").pop()));
    await updatePost();
    await ctx.react("👍");
  } catch {
    await ctx.react("😐");
  }
});

kv.listenQueue(async (value: { type: "delete"; id: number }) => {
  if (value.type != "delete") return;

  const order = await kv.get<OrderData>(orderKey(value.id));
  if (order.value?.status != "recent") return;

  await deleteOrder(value.id);
  await updatePost();
});

bot.catch((error) => console.error(error.message));
