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
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
