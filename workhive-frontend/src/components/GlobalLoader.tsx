import Bee from "./Bee"

const GlobalLoader = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl transition-all duration-500">
      <div className="relative">
        <Bee />
        
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-max">
          <p className="text-xl font-bold tracking-widest text-black animate-pulse uppercase">
            Entering the Hive...
          </p>
        </div>
      </div>
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[400px] h-[400px] bg-primary/20 blur-[100px] rounded-full animate-pulse" />
      
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-1 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary animate-[loader-progress_2s_ease-in-out_infinite]" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loader-progress {
          0% { width: 0%; left: 0%; }
          50% { width: 100%; left: 0%; }
          100% { width: 0%; left: 100%; }
        }
      `}} />
    </div>
  )
}

export default GlobalLoader
