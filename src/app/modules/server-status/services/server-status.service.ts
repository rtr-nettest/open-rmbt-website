import { HttpClient } from "@angular/common/http"
import { Injectable } from "@angular/core"
import { environment } from "../../../../environments/environment"
import { IServerStatus } from "../interfaces/server-status.interface"

@Injectable({
  providedIn: "root",
})
export class ServerStatusService {
  constructor(private readonly http: HttpClient) {}

  getServerStatus() {
    return this.http.get<IServerStatus[]>(
      `${environment.api.baseUrl}/RMBTControlServer/testServerStatus`
    )
  }
}
