export class Province {
  id: string;
  name: string;
}

export class Municipality {
  id: string;
  name: string;
  provinceId: string;
  provinceName: string;
}

// How users, homes, and service areas show a municipality.
export class MunicipalitySummary {
  id: string;
  name: string;
  provinceName: string;
}
