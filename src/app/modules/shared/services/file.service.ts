import { Injectable } from "@angular/core"
import imageCompression from "browser-image-compression"
import { MessageService } from "./message.service"
import { environment } from "../../../../environments/environment"

export const COMPRESSOR_OPTIONS = {
  maxSizeMB: 0.4,
  maxWidthOrHeight: 1000,
  useWebWorker: true,
}

@Injectable({
  providedIn: "root",
})
export class FileService {
  constructor(private message: MessageService) {}

  async compress(file: File) {
    console.log(`originalFile size ${file.size / 1024 / 1024} MB`)
    try {
      const compressed = await imageCompression(file, COMPRESSOR_OPTIONS)
      console.log(`compressedFile size ${compressed.size / 1024 / 1024} MB`)
      return compressed
    } catch (e) {
      this.message.openSnackbar("The file is not an image")
      return null
    }
  }

  async getJsonAsset(path: string): Promise<Record<string, any>> {
    try {
      const json = await (
        await fetch(`${environment.baseUrl}/assets${path}`)
      ).json()
      return json
    } catch (e) {
      console.warn(e)
      return {}
    }
  }
}
