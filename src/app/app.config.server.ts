import { mergeApplicationConfig, ApplicationConfig } from "@angular/core"
import { provideServerRendering } from "@angular/platform-server"
import { provideConfig } from "./app.config"

const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering()],
}

export async function provideServerConfig() {
  const appConfig = await provideConfig()
  return mergeApplicationConfig(appConfig, serverConfig)
}
