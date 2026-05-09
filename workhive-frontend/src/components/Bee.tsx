const Bee = () => {
  return (
    <div className="relative w-64 h-64 animate-float group cursor-pointer">
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-2xl transition-transform duration-500 group-hover:scale-110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Wings */}
        <ellipse
          cx="70" cy="80" rx="30" ry="15"
          className="fill-primary/20 stroke-primary/40 stroke-2 animate-flap origin-right"
          style={{ transformOrigin: '90px 80px' }}
        />
        <ellipse
          cx="130" cy="80" rx="30" ry="15"
          className="fill-primary/20 stroke-primary/40 stroke-2 animate-flap origin-left"
          style={{ transformOrigin: '110px 80px', animationDelay: '0.05s' }}
        />
        
        {/* Body */}
        <rect x="75" y="90" width="50" height="70" rx="25" className="fill-primary stroke-foreground stroke-2" />
        
        {/* Stripes */}
        <rect x="75" y="110" width="50" height="10" className="fill-foreground/80" />
        <rect x="75" y="130" width="50" height="10" className="fill-foreground/80" />
        
        {/* Eyes */}
        <circle cx="88" cy="105" r="3" className="fill-foreground" />
        <circle cx="112" cy="105" r="3" className="fill-foreground" />
        
        {/* Antennae */}
        <path d="M90 90 Q85 70 75 75" className="stroke-foreground stroke-2" strokeLinecap="round" />
        <path d="M110 90 Q115 70 125 75" className="stroke-foreground stroke-2" strokeLinecap="round" />
      </svg>
      
      {/* Glow effect */}
      <div className="absolute inset-0 bg-primary/20 blur-3xl -z-10 rounded-full scale-75 group-hover:scale-100 transition-transform duration-700" />
    </div>
  )
}

export default Bee
