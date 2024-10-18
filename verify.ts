import type { Context, NextFunction } from "grammy";
import { channelId, groupId } from "./mod.ts";

export const verify = async (ctx: Context, next: NextFunction) => {
  if (ctx.chat && [groupId, channelId].includes(ctx.chat.id)) {
    await next();
  }
};
