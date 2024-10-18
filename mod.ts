import { Bot } from "grammy";
import { verify } from "./verify.ts";
import { deletePost, getPostData, setPostData } from "./db.ts";
import {
  generateKeyboard,
  generateText,
  keyboardComposer,
} from "./keyboard.ts";
import { listComposer, updateList } from "./list.ts";

// Init main objects
export const bot = new Bot(Deno.env.get("BOT_TOKEN") || "");
export const kv = await Deno.openKv();

// Import some env
export const channelId = Number(Deno.env.get("CHANNEL_ID"));
export const groupId = Number(Deno.env.get("GROUP_ID"));

// Add update command to list of my commands
await bot.api.setMyCommands([
  { command: "update", description: "Обновить список заказ-нарядов" },
]);

// Work only in my channel and group
bot.use(verify);

// On post in channel -> set post
bot.chatType("channel").on("channel_post:caption", async (ctx) => {
  await setPostData(ctx.channelPost.message_id, {
    caption: ctx.channelPost.caption,
    status: "work",
    createdAt: new Date(),
  });
  await updateList();
});

// On post in group -> add buttons
bot.chatType("supergroup").on(":is_automatic_forward", async (ctx) => {
  const forward = ctx.message.forward_origin;
  if (!forward) return;
  if (forward.type != "channel") return;

  const postData = await getPostData(forward.message_id);
  if (!postData) return;

  const reply_markup = generateKeyboard(
    forward.message_id,
    postData.status,
  );

  await ctx.reply(generateText(postData.status), {
    reply_parameters: { message_id: ctx.msgId },
    reply_markup,
  });
});

// Update command (updates list (really))
bot.chatType("supergroup").command("update", async (ctx) => {
  try {
    await updateList();
    await ctx.react("👍");
  } catch {
    await ctx.react("🌚");
  }
});

// Other composers
bot.use(keyboardComposer);
bot.use(listComposer);

// Post deletion listener
kv.listenQueue(async (postId: number) => {
  const post = await getPostData(postId);
  if (post?.status != "recent") return;

  await deletePost(postId);
  await updateList();
});

// Graceful catch
bot.catch((error) => console.error(error.message));
