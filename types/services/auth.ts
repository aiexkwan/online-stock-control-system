/**
 * 認證服務類型定義
 */

export interface UserData {
  id: string;
  name: string;
  department: string;
  permissions: {
    qc: boolean;
    receive: boolean;
    void: boolean;
    view: boolean;
    resume: boolean;
    report: boolean;
  };
}

export interface RawUserDataFromDB {
  id: string;
  name: string;
  department: string;
  password?: string | null;
  first_login?: boolean | null;
  qc?: boolean | null;
  receive?: boolean | null;
  void?: boolean | null;
  view?: boolean | null;
  resume?: boolean | null;
  report?: boolean | null;
}

export interface AuthenticateResult {
  success: boolean;
  user?: UserData;
  isFirstLogin?: boolean;
  isTemporaryLogin?: boolean;
  error?: string;
}
