import { Component, OnInit } from "@angular/core"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { MatButtonModule } from "@angular/material/button"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { BreadcrumbsComponent as CertifiedBreadcrumbs } from "../../components/breadcrumbs/breadcrumbs.component"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { Router } from "@angular/router"
import { CertifiedStoreService } from "../../store/certified-store.service"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { ESteps } from "../../constants/steps.enum"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { Title } from "@angular/platform-browser"
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms"
import {
  ICertifiedDataForm,
  ICertifiedDataFormControls,
} from "../../interfaces/certified-data-form.interface"
import { TestStore } from "../../../test/store/test.store"
import { map, takeUntil } from "rxjs"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatInputModule } from "@angular/material/input"
import { MatRadioModule } from "@angular/material/radio"

@Component({
  selector: "app-step-2",
  standalone: true,
  imports: [
    BreadcrumbsComponent,
    CertifiedBreadcrumbs,
    HeaderComponent,
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
  form?: FormGroup<ICertifiedDataFormControls>

  get nextStepAvailable() {
    return this.store.nextStepAvailable
  }

  get testStartAvailable() {
    return this.store.testStartAvailable
  }

  constructor(
    ts: Title,
    i18nStore: I18nStore,
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly store: CertifiedStoreService,
    private readonly testStore: TestStore
  ) {
    super(ts, i18nStore)
  }

  ngOnInit(): void {
    this.store.activeBreadcrumbIndex.set(ESteps.DATA)
    const savedForm = this.testStore.certifiedDataForm$.value
    this.form = this.fb.group({
      titlePrepend: new FormControl(savedForm?.titlePrepend || ""),
      firstName: new FormControl(savedForm?.firstName || "", {
        nonNullable: true,
        validators: Validators.required,
      }),
      lastName: new FormControl(savedForm?.lastName || "", {
        nonNullable: true,
        validators: Validators.required,
      }),
      titleAppend: new FormControl(savedForm?.titleAppend || ""),
      address: new FormControl(savedForm?.address || "", {
        nonNullable: true,
        validators: Validators.required,
      }),
      isFirstCycle: new FormControl<boolean>(savedForm?.isFirstCycle || true, {
        nonNullable: true,
        validators: Validators.required,
      }),
    })
    this.form.valueChanges
      .pipe(
        map((f) => {
          if (this.form?.valid) {
            this.onFormChange(f as ICertifiedDataForm)
          } else {
            this.onFormChange(null)
          }
        }),
        takeUntil(this.destroyed$)
      )
      .subscribe()
  }

  onNext() {
    this.router.navigate([this.i18nStore.activeLang, ERoutes.CERTIFIED_3])
  }

  onTestStart() {
    this.store.activeBreadcrumbIndex.set(ESteps.MEASUREMENT)
    this.router.navigate([this.i18nStore.activeLang, ERoutes.CERTIFIED_TEST])
  }

  private onFormChange(value: ICertifiedDataForm | null) {
    if (value) {
      this.store.isDataFormValid.set(true)
      if (!value.isFirstCycle) {
        this.store.isReady.set(true)
      } else {
        this.store.isReady.set(false)
      }
    } else {
      this.store.isDataFormValid.set(false)
      this.store.isReady.set(false)
    }
    this.testStore.certifiedDataForm$.next(value)
  }
}
