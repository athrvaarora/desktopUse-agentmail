export function Logo() {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="300" 
      height="50" 
      viewBox="0 0 1200 400" 
      role="img" 
      aria-label="Desktop.use logo"
      className="h-10 w-auto"
    >
      <text 
        x="50%" 
        y="50%" 
        textAnchor="middle" 
        dominantBaseline="middle" 
        fontSize="140" 
        fontWeight="800" 
        fontFamily="Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" 
        letterSpacing="2"
      >
        <tspan fill="#FF3B8A">Desktop</tspan>
        <tspan fill="#FFFFFF">.use</tspan>
      </text>
    </svg>
  );
}
