function iconToSVG(iconData, size = 16) {
  const svgElements = iconData.map(([tag, attrs], index) => {
    const svgAttrs = Object.entries(attrs).reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
    svgAttrs.key = index;
    let attrsString = Object.entries(svgAttrs)
      .map(([key, value]) => `${key}="${value}"`)
      .join(" ");
    return `<${tag} ${attrsString}></${tag}>`;
  });

  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${size}"
      height="${size}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide-icon"
    >
      ${svgElements.join("")}
    </svg>
  `;
 }
