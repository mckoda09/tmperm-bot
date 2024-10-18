import { Composer } from "grammy";
import { listPosts, setList } from "./db.ts";
import { channelId } from "./mod.ts";
import { getList } from "./db.ts";
import { bot } from "./mod.ts";

export const listComposer = new Composer();

// List init command
listComposer.chatType("channel").command("list", async (ctx) => {
  await setList(ctx.msgId);
  await ctx.editMessageText(await generateListText(), { parse_mode: "HTML" });
});

// List names
const listEnum = {
  work: "🛠️ В работе",
  out: "📤 На выдаче",
  recent: "🕒 Недавно выданные",
};

// Generate list names
const generateListText = async () => {
  const posts = await listPosts();
  const { work, out, recent } = Object.groupBy(posts, (x) => x.status);

  const text = [work, out, recent].map((list) =>
    list
      ? listEnum[list[0].status] + "\n" +
        list.map((e, i) =>
          `${i + 1}. ${
            e.createdAt.toLocaleDateString("ru", {
              timeZone: "Asia/Yekaterinburg",
              day: "numeric",
              month: "short",
            })
          } <a href="https://t.me/c/${
            channelId.toString().slice(3)
          }/${e.id}">${e.caption}</a>`
        ).join("\n")
      : ""
  ).filter((text) => text.length).join("\n\n");

  return text.length ? text : "Заказ-нарядов нет.";
};

// Update the list
export const updateList = async () => {
  const msgId = await getList();
  if (!msgId) return;

  await bot.api.editMessageText(channelId, msgId, await generateListText(), {
    parse_mode: "HTML",
  });
};
