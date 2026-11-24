export default function LogoCaveira({ size = 36 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Logo Caveira"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M50 8C26.5 8 13 22.8 13 43.5C13 54.8 17.8 62.8 25.5 67.5L28.5 90C28.8 92.2 30.7 93.5 32.9 93.5H67.1C69.3 93.5 71.2 92.2 71.5 90L74.5 67.5C82.2 62.8 87 54.8 87 43.5C87 22.8 73.5 8 50 8Z"
        fill="#f4f4f5"
        stroke="#27272a"
        strokeWidth="4"
      />
      <circle cx="24" cy="28" r="2.2" fill="#09090b" />
      <circle cx="31" cy="20" r="1.5" fill="#09090b" />
      <circle cx="72" cy="24" r="2" fill="#09090b" />
      <circle cx="66" cy="33" r="1.4" fill="#09090b" />
      <path
        d="M23 44L43 50L39 58L22 53L23 44Z"
        fill="#09090b"
      />
      <path
        d="M77 44L57 50L61 58L78 53L77 44Z"
        fill="#09090b"
      />
      <path
        d="M50 53L45.5 64H54.5L50 53Z"
        fill="#09090b"
      />
      <rect x="37" y="71" width="4.5" height="18" rx="2" fill="#09090b" />
      <rect x="47.75" y="71" width="4.5" height="18" rx="2" fill="#09090b" />
      <rect x="58.5" y="71" width="4.5" height="18" rx="2" fill="#09090b" />
    </svg>
  );
}