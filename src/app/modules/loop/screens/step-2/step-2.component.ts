import { Component, inject, OnInit } from "@angular/core"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { MatButtonModule } from "@angular/material/button"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatInputModule } from "@angular/material/input"
import { MatRadioModule } from "@angular/material/radio"
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { LoopStoreService } from "../../store/loop-store.service"
import { Router } from "@angular/router"
import { ILoopDataFormControls } from "../../interfaces/loop-data-form-controls.interface"
import { ECertifiedSteps } from "../../../certified/constants/certified-steps.enum"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { environment } from "../../../../../environments/environment"
import { CertifiedStoreService } from "../../../certified/store/certified-store.service"
import { CertifiedBreadcrumbsComponent } from "../../../certified/components/certified-breadcrumbs/certified-breadcrumbs.component"
import { MainContentComponent } from "../../../shared/components/main-content/main-content.component"

@Component({
  selector: "app-step-2",
  imports: [
    CertifiedBreadcrumbsComponent,
    BreadcrumbsComponent,
    HeaderComponent,
    MainContentComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    ReactiveFormsModule,
    TopNavComponent,
    TranslatePipe,
    FooterComponent,
  ],
  templateUrl: "./step-2.component.html",
  styleUrl: "./step-2.component.scss",
})
export class Step2Component extends SeoComponent implements OnInit {
  form?: FormGroup<ILoopDataFormControls>
  minTestsAllowed = environment.loopModeDefaults.min_tests
  minTestIntervalMinutes = environment.loopModeDefaults.min_delay
  maxTestsAllowed = environment.loopModeDefaults.max_tests
  maxTestIntervalMinutes = environment.loopModeDefaults.max_delay

  private readonly certifiedStore = inject(CertifiedStoreService)
  private readonly fb = inject(FormBuilder)
  private readonly router = inject(Router)
  private readonly store = inject(LoopStoreService)

  get breadcrumbs() {
    return this.store.breadcrumbs
  }

  ngOnInit(): void {
    if (
      this.store.activeBreadcrumbIndex() == null &&
      this.certifiedStore.activeBreadcrumbIndex() == null
    ) {
      this.router.navigate([this.i18nStore.activeLang, ERoutes.LOOP_1])
      return
    }
    this.store.activeBreadcrumbIndex.set(ECertifiedSteps.DATA)
    this.form = this.fb.group({
      maxTestsAllowed: new FormControl(this.store.maxTestsAllowed(), {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.min(this.minTestsAllowed),
          Validators.max(this.maxTestsAllowed),
        ],
      }),
      testIntervalMinutes: new FormControl(this.store.testIntervalMinutes(), {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.min(this.minTestIntervalMinutes),
          Validators.max(this.maxTestIntervalMinutes),
        ],
      }),
    })
  }

  onTestStart() {
    if (!this.form?.valid) return
    this.store.maxTestsAllowed.set(this.form.controls.maxTestsAllowed.value)
    this.store.testIntervalMinutes.set(
      this.form.controls.testIntervalMinutes.value,
    )
    this.router.navigate([this.i18nStore.activeLang, ERoutes.LOOP_3])
  }
}
