declare module "gip" {
  interface Options {
    services?: string[];
    ensure?: number;
    verbose?: boolean;
  }
  export default function gip(options?: Options): Promise<string | null>;
}
