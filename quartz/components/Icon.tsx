import { JSX, createElement } from "preact";

export function iconToSVG(iconData: [string, Record<string, any>][], size: number = 16) {
  const elements = iconData.map(([tag, attrs], index) => {
    // Convert kebab-case attributes to camelCase for JSX
    const jsxAttrs = Object.entries(attrs).reduce((acc, [key, value]) => {
      const jsxKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      acc[jsxKey] = value;
      return acc;
    }, {} as Record<string, any>);

    jsxAttrs.key = index;
    
    // Create element directly using the tag name
    return createElement(tag, jsxAttrs);
  });

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      class="lucide-icon"
    >
      {elements}
    </svg>
  );
}
