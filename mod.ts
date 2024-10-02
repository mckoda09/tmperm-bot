import { Bot } from "grammy";
import { genPostText } from "./utils.ts";
import { setPost, setWork, updatePost } from "./tasks.ts";
import { setOut } from "./tasks.ts";
import { deleteTask } from "./tasks.ts";

export const bot = new Bot(Deno.env.get("BOT_TOKEN") || "");
export const kv = await Deno.openKv();

export const channelId = Number(Deno.env.get("CHANNEL_ID"));
export const groupId = Number(Deno.env.get("GROUP_ID"));

await bot.api.setMyCommands([]);

bot.chatType("channel").command("post", async (ctx) => {
  if (ctx.chat.id != channelId) return;
  await ctx.deleteMessage();

  const post = await ctx.reply(await genPostText(), {
    disable_notification: true,
    parse_mode: "HTML",
  });
  await setPost(post.message_id);
});

bot.chatType("channel").on("channel_post", async (ctx) => {
  if (channelId != ctx.chat.id) return;
  if (!ctx.channelPost.caption) return;

  await setWork(
    ctx.channelPost.message_id,
    ctx.channelPost.caption,
    new Date(),
  );
  await updatePost();
});

bot
  .chatType("supergroup")
  .hears(["готов", "Готов", "На выдачу", "на выдачу"], async (ctx) => {
    if (ctx.chat.id != groupId) return;
    if (!ctx.message.reply_to_message) return;
    if (!ctx.message.reply_to_message.is_automatic_forward) return;
    if (!ctx.message.reply_to_message.forward_origin) return;
    if (ctx.message.reply_to_message.forward_origin.type != "channel") return;
    if (!ctx.message.reply_to_message.caption) return;

    await setOut(
      ctx.message.reply_to_message.forward_origin.message_id,
      ctx.message.reply_to_message.caption,
    );
    await updatePost();
    await ctx.react("👌");
  });

bot.chatType("supergroup").hears(["выдан", "Выдан"], async (ctx) => {
  if (ctx.chat.id != groupId) return;
  if (!ctx.message.reply_to_message) return;
  if (!ctx.message.reply_to_message.is_automatic_forward) return;
  if (!ctx.message.reply_to_message.forward_origin) return;
  if (ctx.message.reply_to_message.forward_origin.type != "channel") return;
  if (!ctx.message.reply_to_message.caption) return;

  await deleteTask(ctx.message.reply_to_message.forward_origin.message_id);
  await updatePost();
  await ctx.react("👌");
});

bot.chatType("supergroup").hears(["в работу", "В работу"], async (ctx) => {
  if (ctx.chat.id != groupId) return;
  if (!ctx.message.reply_to_message) return;
  if (!ctx.message.reply_to_message.is_automatic_forward) return;
  if (!ctx.message.reply_to_message.forward_origin) return;
  if (ctx.message.reply_to_message.forward_origin.type != "channel") return;
  if (!ctx.message.reply_to_message.caption) return;

  await setWork(
    ctx.message.reply_to_message.forward_origin.message_id,
    ctx.message.reply_to_message.caption,
    new Date(),
  );
  await updatePost();
  await ctx.react("👌");
});

bot.chatType("supergroup").hears(["обновить", "Обновить"], async (ctx) => {
  if (ctx.chat.id != groupId) return;

  await updatePost();
  await ctx.react("👌");
});

bot.chatType("supergroup").on("message:text", async (ctx) => {
  if (ctx.chat.id != groupId) return;
  if (!ctx.message.text.toLowerCase().startsWith("убрать")) return;

  try {
    const deleteLink = ctx.message.text.split(" ")[1];
    const deleteId = deleteLink.split("/").pop();

    await deleteTask(Number(deleteId));

    await updatePost();
    await ctx.react("👌");
  } catch {
    await ctx.react("🤷");
  }
});

bot.catch((error) => console.error(error.message));
