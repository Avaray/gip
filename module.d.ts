declare module "gip" {
  /**
   * Configuration options for the GIP module.
   */
  interface Options {
    /**
     * An array of custom "IP echo" service URLs to use for resolving the IP address.
     * These will be merged with the built-in services.
     */
    services?: string[];

    /**
     * The number of matching IP addresses required from different services before
     * returning a successful result. A higher number increases reliability but may take longer.
     * @default 3
     */
    ensure?: number;

    /**
     * Global timeout in milliseconds for the entire IP resolution process.
     * @default 10000
     */
    timeout?: number;

    /**
     * If true, errors from failed service requests will be printed to stderr.
     * @default true
     */
    verbose?: boolean;

    /**
     * The type of IP address to retrieve.
     * - `ipv4`: Forces DNS resolution to IPv4 (`family: 4`).
     * - `ipv6`: Forces DNS resolution to IPv6 (`family: 6`).
     * - `automatic`: Uses both lists and accepts whichever IP version resolves first.
     * @default "automatic"
     */
    type?: "ipv4" | "ipv6" | "automatic";
  }

  /**
   * Retrieves your real public IPv4 or IPv6 address.
   *
   * @param options - Optional configuration object.
   * @returns A promise that resolves to the validated IP address as a string.
   * @throws If no valid IP address can be resolved within the timeout, or if ensure count is not met.
   */
  export default function gip(options?: Options): Promise<string>;
}
