declare module 'upyun' {
  interface Service {
    constructor(bucket: string, operator: string, password: string)
  }

  interface Client {
    constructor(service: Service)
    putFile(path: string, buffer: Buffer): Promise<boolean | any>
    deleteFile(path: string): Promise<boolean>
    listDir(path: string, options?: any): Promise<any>
    usage(path?: string): Promise<number>
  }

  export class Service implements Service {
    constructor(bucket: string, operator: string, password: string)
  }

  export class Client implements Client {
    constructor(service: Service)
    putFile(path: string, buffer: Buffer): Promise<boolean | any>
    deleteFile(path: string): Promise<boolean>
    listDir(path: string, options?: any): Promise<any>
    usage(path?: string): Promise<number>
  }
}
