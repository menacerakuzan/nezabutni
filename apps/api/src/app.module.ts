import { Module } from "@nestjs/common";
import { DefendersModule } from "./defenders/defenders.module";
import { PlacesModule } from "./places/places.module";
import { AuthModule } from "./auth/auth.module";
import { MuseumModule } from "./museum/museum.module";
import { ArchiveModule } from "./archive/archive.module";
import { ModerationModule } from "./moderation/moderation.module";
import { SubmissionsModule } from "./submissions/submissions.module";

@Module({
  imports: [
    AuthModule,
    DefendersModule,
    PlacesModule,
    MuseumModule,
    ArchiveModule,
    ModerationModule,
    SubmissionsModule,
  ],
})
export class AppModule {}
