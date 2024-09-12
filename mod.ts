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

  await kv.delete(["inwork", entry.value]);
  await bot.api.deleteMessage(groupId, entry.value);
});

bot.hears(["Вернуть", "вернуть"], async (ctx) => {
  if (ctx.chat.id.toString() != commentsId) return;
  if (!ctx.message) return;
  if (!ctx.message.reply_to_message) return;
  if (!ctx.message.reply_to_message.forward_origin) return;
  if (ctx.message.reply_to_message.forward_origin.type != "channel") return;

  const message = await ctx.api.forwardMessage(
    groupId,
    channelId,
    ctx.message.reply_to_message.forward_origin.message_id,
  );
  await kv.set(
    ["message", ctx.message.reply_to_message.forward_origin.message_id],
    message.message_id,
  );
  await kv.set(["inwork", message.message_id], true);
});

bot.chatType("channel").on("channel_post", async (ctx) => {
  if (ctx.chat.id.toString() != channelId) return;

  const message = await ctx.forwardMessage(groupId);
  await kv.set(["message", ctx.channelPost.message_id], message.message_id);
  await kv.set(["inwork", message.message_id], true);
});

async function updatePosts() {
  for await (const entry of kv.list<number>({ prefix: ["inwork"] })) {
    const message = await bot.api.forwardMessage(
      groupId,
      groupId,
      entry.key[1] as number,
      {
        disable_notification: true,
      },
    );
    await bot.api.deleteMessage(groupId, entry.key[1] as number);
    await kv.delete(entry.key);

    if (!message.forward_origin) continue;
    if (message.forward_origin.type != "channel") continue;

    await kv.set(
      ["message", message.forward_origin.message_id],
      message.message_id,
    );
    await kv.set(["inwork", message.message_id], true);
  }
}

Deno.cron("Update in work", "0 22 * * *", async () => {
  await updatePosts();
});

bot.catch((error) => console.error(error.message));
