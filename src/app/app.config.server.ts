import { provideServerRendering } from '@angular/ssr';
import { mergeApplicationConfig, ApplicationConfig } from "@angular/core"
import { provideConfig } from "./app.config"

const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering()],
}

export async function provideServerConfig() {
  const appConfig = await provideConfig()
  return mergeApplicationConfig(appConfig, serverConfig)
}
