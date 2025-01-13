import { Component, OnInit } from "@angular/core"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import {
  ECertifiedLocationType,
  ICertifiedEnvForm,
  ICertifiedEnvFormControls,
} from "../../interfaces/certified-env-form.interface"
import { Title } from "@angular/platform-browser"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { TestStore } from "../../../test/store/test.store"
import { CertifiedStoreService } from "../../store/certified-store.service"
import { Router } from "@angular/router"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { map, take, takeUntil } from "rxjs"
import { ESteps } from "../../constants/steps.enum"
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms"
import { v4 } from "uuid"
import { FileService } from "../../../shared/services/file.service"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { BreadcrumbsComponent as CertifiedBreadcrumbs } from "../../components/breadcrumbs/breadcrumbs.component"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatButtonModule } from "@angular/material/button"
import { MatInputModule } from "@angular/material/input"
import { NgFor, NgIf } from "@angular/common"
import { MatIconModule } from "@angular/material/icon"
import { MatCheckboxModule } from "@angular/material/checkbox"

@Component({
  selector: "app-step-3",
  standalone: true,
  imports: [
    HeaderComponent,
    TopNavComponent,
    CertifiedBreadcrumbs,
    BreadcrumbsComponent,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    NgFor,
    NgIf,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: "./step-3.component.html",
  styleUrl: "./step-3.component.scss",
})
export class Step3Component extends SeoComponent implements OnInit {
  form?: FormGroup<ICertifiedEnvFormControls>
  locationValues = Object.values(ECertifiedLocationType)
  locationNames = [
    "Apartment building",
    "Single-family home",
    "Urban area",
    "Rural area",
    "Other",
  ]
  fileIds = [v4()]
  files: { [key: string]: File } = {}

  get testStartAvailable() {
    return this.store.testStartAvailable
  }

  constructor(
    ts: Title,
    i18nStore: I18nStore,
    private readonly fb: FormBuilder,
    private readonly fs: FileService,
    private readonly router: Router,
    private readonly store: CertifiedStoreService,
    private readonly testStore: TestStore
  ) {
    super(ts, i18nStore)
  }

  ngOnInit(): void {
    this.testStore.certifiedDataForm$.pipe(take(1)).subscribe((f) => {
      if (!f) {
        this.router.navigate([this.i18nStore.activeLang, ERoutes.CERTIFIED_2])
      } else {
        this.store.activeBreadcrumbIndex.set(ESteps.ENVIRONMENT)
        this.initForm()
      }
    })
  }

  private initForm() {
    const savedForm = this.testStore.certifiedEnvForm$.value
    this.form = this.fb.group({
      locationType: new FormArray<FormControl<boolean>>(
        Object.values(ECertifiedLocationType).map(
          (_, i) =>
            new FormControl(!!savedForm?.locationType[i], {
              nonNullable: true,
            })
        )
      ),
      locationTypeOther: new FormControl(
        savedForm?.locationTypeOther || "",
        Validators.required
      ),
      typeText: new FormControl(savedForm?.typeText || ""),
      testDevice: new FormControl(savedForm?.testDevice || ""),
    })
    this.toggleLocationTypeOther(true)
    this.form.valueChanges
      .pipe(
        map((f) => {
          if (!f.locationType?.some((lt) => !!lt)) {
            this.form?.markAsPristine()
            this.onFormChange(null)
            return
          }
          if (this.form?.valid) {
            const locationType =
              f.locationType?.reduce(
                (acc, lt, i) => (lt ? [...acc, this.locationValues[i]] : acc),
                [] as ECertifiedLocationType[]
              ) || []
            const formValue: ICertifiedEnvForm = {
              ...f,
              testPictures: this.files,
              locationType,
            }
            this.onFormChange(formValue)
          } else {
            this.onFormChange(null)
          }
        }),
        takeUntil(this.destroyed$)
      )
      .subscribe()
  }

  async onFileSelected(event: Event, fileId: string) {
    const file = (event.target as HTMLInputElement).files![0]
    const compressed = await this.fs.compress(file)
    if (compressed) {
      if (!Object.hasOwn(this.files, fileId)) {
        this.fileIds.push(v4())
      }
      this.files[fileId] = compressed
    }
  }

  onFileUploadClick(uuid: string) {
    document.getElementById(uuid)?.click()
  }

  onDeleteFile(uuid: string) {
    delete this.files[uuid]
    if (this.fileIds.length > 1) {
      const uuidIndex = this.fileIds.findIndex((fileId) => fileId === uuid)
      this.fileIds.splice(uuidIndex, 1)
    }
  }

  onTestStart() {
    this.store.activeBreadcrumbIndex.set(ESteps.MEASUREMENT)
    this.router.navigate([this.i18nStore.activeLang, ERoutes.CERTIFIED_TEST])
  }

  toggleLocationTypeOther(isEnabled: boolean) {
    if (isEnabled) {
      this.form?.controls.locationTypeOther.disable()
    } else {
      this.form?.controls.locationTypeOther.enable()
    }
  }

  private onFormChange(value: ICertifiedEnvForm | null) {
    if (value) {
      this.store.isEnvFormValid.set(true)
      this.store.isReady.set(true)
    } else {
      this.store.isEnvFormValid.set(false)
      this.store.isReady.set(false)
    }
    this.testStore.certifiedEnvForm$.next(value)
  }
}
