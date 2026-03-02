import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./EnvelopeAnimation.css";

export default function EnvelopeAnimation({ 
  children, preview = false, guestName = "", envelopeColor = "#54392d", canvasProps = null, onOpenComplete 
}) {
  const [phase, setPhase] = useState(preview ? "extracted" : "closed"); 
  const [windowDims, setWindowDims] = useState({ w: 1000, h: 800 });
  
  useEffect(() => {
    setWindowDims({ w: window.innerWidth, h: window.innerHeight });
    const handleResize = () => setWindowDims({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const envBg = envelopeColor === "#111111" ? "#4a3328" : envelopeColor;

  const handleClick = () => {
    if (phase === "closed") {
      setPhase("flap_open"); 
      setTimeout(() => {
        setPhase("extracting"); 
        setTimeout(() => {
          setPhase("extracted"); 
          setTimeout(() => {
             if (onOpenComplete) onOpenComplete();
          }, 800);
        }, 800); 
      }, 800);
    }
  };

  const fallbackLiner = "url('/minimal_pink_liner.png')";

  return (
    <div className={`paperless-wrapper ${phase}`}>
       <div 
         className="envelope-hero"
         onClick={handleClick}
       >
         <motion.div 
           className="envelope-3d-scene"
           initial={{ y: 0 }}
           animate={{ y: phase === "extracted" ? windowDims.h * 0.05 : (phase === "flap_open" || phase === "extracting" ? 20 : 0) }}
           transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }} 
         >
           
           {/* BACK OF ENVELOPE */}
           <div className="envelope-back" style={{ backgroundColor: envBg }}>
             <div className="envelope-back-liner" style={{ backgroundImage: fallbackLiner }}></div>
             <motion.div 
               className="envelope-dynamic-shadow"
               initial={{ opacity: 0, scaleY: 0 }}
               animate={{ 
                 opacity: phase === "flap_open" ? 0.35 : (phase === "closed" ? 0 : 0.08),
                 scaleY: phase === "flap_open" ? 1 : 0.4
               }}
               transition={{ duration: 0.8, ease: "easeInOut" }}
             />
           </div>
           
           {/* INVITATION CARD */}
           <div 
             className={`envelope-card-wrapper phase-${phase}`}
             style={{ zIndex: phase === "extracted" ? 8 : 3 }}
           >
             <motion.div className="envelope-card-content"
               initial={{ y: "0%", scale: 1, rotateZ: -90 }}
               animate={{ 
                 y: phase === "extracted" ? "-15%" : (phase === "extracting" ? "-120%" : "0%"),
                 scale: 1,
                 rotateZ: phase === "extracted" ? 0 : -90
                }}
               transition={{ duration: phase === "extracted" ? 1.2 : 0.8, ease: "easeInOut" }}
             >
               <div className="envelope-card-scaler">
                  {children}
               </div>
             </motion.div>
           </div>

           {/* FRONT OF ENVELOPE (POCKET) */}
           <div className="envelope-front">
              <div className="envelope-pocket" style={{ backgroundColor: envBg }}></div>
              <div className="envelope-pocket-left" style={{ backgroundColor: envBg }}></div>
              <div className="envelope-pocket-right" style={{ backgroundColor: envBg }}></div>
              
              {/* TRUE CAST SHADOW: Proiettata sulla busta, sotto l'aletta */}
              <motion.div 
                className="envelope-flap-cast-shadow"
                initial={{ opacity: 0.5, filter: "blur(2.5px)" }}
                animate={{ 
                  opacity: phase !== "closed" ? 0 : 0.5,
                  filter: phase !== "closed" ? "blur(30px)" : "blur(2.5px)",
                  y: phase !== "closed" ? 15 : 0
                }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              >
                <div className="envelope-flap-shadow-shape" />
              </motion.div>

              {/* Livello Ombra Separata per Aletta Inferiore (Safe Path) */}
              <div className="envelope-pocket-bottom-shadow-container">
                <div className="envelope-pocket-bottom-shadow-shape" />
              </div>
              <div className="envelope-pocket-bottom" style={{ backgroundColor: envBg }}></div>

               <AnimatePresence>
                {phase === "closed" && guestName && (
                   <motion.div className="envelope-guest-name" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                     {guestName}
                   </motion.div>
                )}
              </AnimatePresence>
           </div>

           {/* TOP FLAP */}
           <motion.div
             className="envelope-flap-wrapper"
             initial={{ rotateX: 0 }}
             animate={{ rotateX: phase !== "closed" ? 180 : 0 }}
             transition={{ duration: 0.8, ease: "easeInOut" }}
             style={{ zIndex: (phase === "closed" || phase === "flap_open") ? 6 : 2 }}
           >
             <div className="envelope-flap-outer" style={{ backgroundColor: envBg }} />
             {/* The interior liner with texture offset effect */}
             <div className="envelope-flap-inner">
               <div className="envelope-flap-inner-bg" style={{ backgroundColor: envBg }}></div>
               <div className="envelope-flap-inner-texture" style={{ backgroundImage: fallbackLiner }}></div>
               <div className="envelope-flap-hinge-shadow"></div>
             </div>
           </motion.div>

           <AnimatePresence>
             {phase === "closed" && (
               <motion.div className="envelope-hint" exit={{ opacity: 0 }} animate={{y:[0,-5,0]}} transition={{repeat:Infinity,duration:2}}>
                 Tocca la busta per aprire
               </motion.div>
             )}
           </AnimatePresence>
           
         </motion.div>
       </div>
    </div>
  );
}
