import { Component, inject, OnInit, signal } from "@angular/core"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import {
  ECertifiedLocationType,
  ICertifiedEnvForm,
  ICertifiedEnvFormControls,
} from "../../interfaces/certified-env-form.interface"
import { CertifiedStoreService } from "../../store/certified-store.service"
import { Router } from "@angular/router"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { map, takeUntil } from "rxjs"
import { ECertifiedSteps } from "../../constants/certified-steps.enum"
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
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

import { MatIconModule } from "@angular/material/icon"
import { MatCheckboxModule } from "@angular/material/checkbox"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { CertifiedBreadcrumbsComponent } from "../../components/certified-breadcrumbs/certified-breadcrumbs.component"
import { LoopStoreService } from "../../../loop/store/loop-store.service"
import { environment } from "../../../../../environments/environment"
import { MainStore } from "../../../shared/store/main.store"
import { MainContentComponent } from "../../../shared/components/main-content/main-content.component"

@Component({
  selector: "app-step-3",
  imports: [
    BreadcrumbsComponent,
    CertifiedBreadcrumbsComponent,
    HeaderComponent,
    MainContentComponent,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
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
  loopStore = inject(LoopStoreService)
  fileIds = [v4()]
  disabled = signal(true)

  private readonly fb = inject(FormBuilder)
  private readonly fs = inject(FileService)
  private readonly mainStore = inject(MainStore)
  private readonly router = inject(Router)
  private readonly store = inject(CertifiedStoreService)

  get breadcrumbs() {
    return this.store.breadcrumbs
  }

  get files() {
    return this.store.envForm()?.testPictures ?? {}
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
            }),
        ),
      ),
      locationTypeOther: new FormControl({
        value: savedForm?.locationTypeOther || "",
        disabled: !savedForm?.locationType[4],
      }),
      typeText: new FormControl(savedForm?.typeText || ""),
      testDevice: new FormControl(savedForm?.testDevice || ""),
      testPictures: new FormControl(savedForm?.testPictures || this.files),
    })
    this.form.controls.locationType.valueChanges
      .pipe(map(this.onCheckboxChange.bind(this)), takeUntil(this.destroyed$))
      .subscribe()
    this.form.controls.locationTypeOther.valueChanges
      .pipe(
        map(this.onLocationTypeOtherChange.bind(this)),
        takeUntil(this.destroyed$),
      )
      .subscribe()
    this.form.controls.typeText.valueChanges
      .pipe(
        map(() => this.onFormChange()),
        takeUntil(this.destroyed$),
      )
      .subscribe()
    this.form.controls.testDevice.valueChanges
      .pipe(
        map(() => this.onFormChange()),
        takeUntil(this.destroyed$),
      )
      .subscribe()
    this.onCheckboxChange(this.form.controls.locationType.value)
    this.onLocationTypeOtherChange(this.form.controls.locationTypeOther.value)
    this.initFiles()
  }

  private initFiles() {
    if (Object.keys(this.files).length) {
      this.fileIds = []
      for (const fileId in this.files) {
        this.fileIds.push(fileId)
      }
      this.fileIds.push(v4())
    }
  }

  private onLocationTypeOtherChange = (locationTypeOther: string | null) => {
    if (!this.form?.controls.locationType.value[4]) {
      return
    }
    this.disabled.set(!locationTypeOther)
    this.onFormChange()
  }

  private onCheckboxChange = (boxes: boolean[]) => {
    if (boxes.some(Boolean)) {
      let isDisabled = false
      if (boxes[4]) {
        this.form?.controls.locationTypeOther.enable()
        isDisabled = !this.form?.controls.locationTypeOther.value
      } else {
        this.form?.controls.locationTypeOther.disable()
      }
      this.disabled.set(isDisabled)
    } else {
      this.disabled.set(true)
      this.form?.controls.locationTypeOther.disable()
    }
    this.onFormChange()
  }

  async onFileSelected(event: Event, fileId: string) {
    this.mainStore.inProgress$.next(true)
    const file = (event.target as HTMLInputElement).files![0]
    const compressed = await this.fs.compress(file)
    if (compressed) {
      if (!Object.hasOwn(this.files, fileId)) {
        // add a new file field
        this.fileIds.push(v4())
      }
      this.store.addFile(fileId, compressed)
    }
    this.mainStore.inProgress$.next(false)
  }

  onFileUploadClick(uuid: string) {
    document.getElementById(uuid)?.click()
  }

  onDeleteFile(uuid: string) {
    this.store.deleteFile(uuid)
    if (this.fileIds.length > 1) {
      const uuidIndex = this.fileIds.findIndex((fileId) => fileId === uuid)
      this.fileIds.splice(uuidIndex, 1)
    }
  }

  onTestStart() {
    const envForm = this.store.envForm()!
    this.store.envForm.set({
      ...envForm,
      locationTypeOther: this.form?.controls.locationTypeOther.disabled
        ? null
        : envForm.locationTypeOther,
    })
    this.loopStore.testIntervalMinutes.set(
      environment.certifiedDefaults.default_delay,
    )
    this.router.navigate([this.i18nStore.activeLang, ERoutes.CERTIFIED_4])
  }

  private onFormChange() {
    const value = this.form?.getRawValue() as ICertifiedEnvForm
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
