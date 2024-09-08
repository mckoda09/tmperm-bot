import { Bot } from "grammy";

const channelId = Deno.env.get("CHANNEL_ID") || "";
const groupId = Deno.env.get("GROUP_ID") || "";
const commentsId = Deno.env.get("COMMENTS_ID") || "";

export const bot = new Bot(Deno.env.get("BOT_TOKEN") || "");
const kv = await Deno.openKv();

bot.hears(["Готов", "готов"], async (ctx) => {
  if (ctx.chat.id.toString() != commentsId) return;
  if (!ctx.message) return;
  if (!ctx.message.reply_to_message) return;
  if (!ctx.message.reply_to_message.forward_origin) return;
  if (ctx.message.reply_to_message.forward_origin.type != "channel") return;

  const entry = await kv.get<number>([
    "message",
    ctx.message.reply_to_message.forward_origin.message_id,
  ]);
  if (!entry.value) return;

  await bot.api.deleteMessage(groupId, entry.value);
});

bot.chatType("channel").on("channel_post", async (ctx) => {
  if (ctx.chat.id.toString() != channelId) return;

  const message = await ctx.forwardMessage(groupId);
  await kv.set(["message", ctx.channelPost.message_id], message.message_id);
});

bot.catch((error) => console.error(error.message));
