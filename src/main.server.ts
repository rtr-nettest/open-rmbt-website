import { bootstrapApplication } from "@angular/platform-browser"
import { AppComponent } from "./app/app.component"
import { provideServerConfig } from "./app/app.config.server"

const bootstrap = () =>
  provideServerConfig().then((config) =>
    bootstrapApplication(AppComponent, config)
  )

export default bootstrap
