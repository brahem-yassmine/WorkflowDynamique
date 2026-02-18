// globals.d.ts ou dans types/globals.d.ts
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}