import { bootstrapApplication } from "@angular/platform-browser"
import { provideConfig } from "./app/app.config"
import { AppComponent } from "./app/app.component"

provideConfig().then((appConfig) =>
  bootstrapApplication(AppComponent, appConfig).catch((err) =>
    console.error(err)
  )
)
