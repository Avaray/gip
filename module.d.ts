declare module "gip" {
  interface Options {
    services?: string[];
    ensure?: number;
    timeout?: number;
    verbose?: boolean;
    type?: "ipv4" | "ipv6" | "automatic";
  }
  export default function gip(options?: Options): Promise<string>;
}
