import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { DefendersModule } from "./defenders/defenders.module";
import { PlacesModule } from "./places/places.module";
import { AuthModule } from "./auth/auth.module";
import { MuseumModule } from "./museum/museum.module";
import { ArchiveModule } from "./archive/archive.module";
import { ModerationModule } from "./moderation/moderation.module";
import { SubmissionsModule } from "./submissions/submissions.module";
import { MediaModule } from "./media/media.module";
import { SiteModule } from "./site/site.module";
import { AuditModule } from "./audit/audit.module";
import { UsersModule } from "./users/users.module";
import { NewsModule } from "./news/news.module";
import { SettingsModule } from "./settings/settings.module";

@Module({
  imports: [
    // Базовий ліміт на всі запити; на вході (логін) — суворіший,
    // див. @Throttle в auth.controller.
    ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 120 }]),
    AuthModule,
    DefendersModule,
    PlacesModule,
    MuseumModule,
    ArchiveModule,
    ModerationModule,
    SubmissionsModule,
    MediaModule,
    SiteModule,
    AuditModule,
    UsersModule,
    NewsModule,
    SettingsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
