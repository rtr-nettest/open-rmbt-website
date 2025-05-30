import { Component, OnInit, signal } from "@angular/core"
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
import { ECertifiedSteps } from "../../constants/certified-steps.enum"
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
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatButtonModule } from "@angular/material/button"
import { MatInputModule } from "@angular/material/input"
import { NgFor, NgIf } from "@angular/common"
import { MatIconModule } from "@angular/material/icon"
import { MatCheckboxModule } from "@angular/material/checkbox"
import { CertifiedBreadcrumbsComponent } from "../../../shared/components/certified-breadcrumbs/certified-breadcrumbs.component"
import { FooterComponent } from "../../../shared/components/footer/footer.component"

@Component({
  selector: "app-step-3",
  imports: [
    BreadcrumbsComponent,
    CertifiedBreadcrumbsComponent,
    HeaderComponent,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    NgFor,
    NgIf,
    ReactiveFormsModule,
    TopNavComponent,
    TranslatePipe,
    FooterComponent,
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
  disabled = signal(true)

  get breadcrumbs() {
    return this.store.breadcrumbs
  }

  get testStartAvailable() {
    return this.store.testStartAvailable
  }

  constructor(
    ts: Title,
    i18nStore: I18nStore,
    private readonly fb: FormBuilder,
    private readonly fs: FileService,
    private readonly router: Router,
    private readonly store: CertifiedStoreService
  ) {
    super(ts, i18nStore)
  }

  ngOnInit(): void {
    if (this.store.activeBreadcrumbIndex() == null) {
      this.router.navigate([this.i18nStore.activeLang, ERoutes.CERTIFIED_1])
      return
    }
    if (!this.store.dataForm()) {
      this.router.navigate([this.i18nStore.activeLang, ERoutes.CERTIFIED_2])
    } else {
      this.store.activeBreadcrumbIndex.set(ECertifiedSteps.ENVIRONMENT)
      this.initForm()
    }
  }

  private initForm() {
    const savedForm = this.store.envForm()
    this.form = this.fb.group({
      locationType: new FormArray<FormControl<boolean>>(
        Object.values(ECertifiedLocationType).map(
          (_, i) =>
            new FormControl(!!savedForm?.locationType[i], {
              nonNullable: true,
            })
        )
      ),
      locationTypeOther: new FormControl(savedForm?.locationTypeOther || ""),
      typeText: new FormControl(savedForm?.typeText || ""),
      testDevice: new FormControl(savedForm?.testDevice || ""),
    })
    this.toggleLocationTypeOther(true)
    this.form.valueChanges
      .pipe(
        map((f) => {
          if (!f.locationType?.some((lt) => !!lt)) {
            this.disabled.set(true)
            this.onFormChange(null)
            return
          }
          if (f.locationType[4]) {
            this.disabled.set(!f.locationTypeOther)
            this.onFormChange(null)
            return
          }
          this.disabled.set(false)
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
    this.router.navigate([this.i18nStore.activeLang, ERoutes.CERTIFIED_4])
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
    this.store.envForm.set(value)
  }
}
