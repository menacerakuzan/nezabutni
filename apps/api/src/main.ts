import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import helmet from "helmet";
import compression from "compression";
import { AppModule } from "./app.module";
import { config } from "./config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      // Портрети й тайли віддаються з інших доменів
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: config.isProd ? undefined : false,
    })
  );
  app.use(compression());

  // Жодного origin: true — лише явний список доменів
  app.enableCors({
    origin: config.cors.origins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  });

  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  if (config.isProd) {
    // За проксі Railway rate-limit має бачити справжній IP клієнта
    app.getHttpAdapter().getInstance().set("trust proxy", 1);
  }

  await app.listen(config.port, "0.0.0.0");
  Logger.log(
    `Меморіал API :${config.port}/api/v1 · CORS: ${config.cors.origins.join(", ") || "(порожньо)"}`,
    "Bootstrap"
  );
}

bootstrap();
