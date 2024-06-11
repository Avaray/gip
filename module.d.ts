declare module 'gip' {
  type Services = string[];
  export default function gip(customServices?: Services): Promise<string>;
}
