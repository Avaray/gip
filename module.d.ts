declare module "gip" {
  interface Options {
    services?: string[];
    ensure?: number;
  }
  export default function gip(options?: Options): Promise<string | null>;
}
