'use client';
import { useEffect, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';
export function MetricValue({ value }: { value: string }) {
  const reduced = useReducedMotion();
  const [display,setDisplay] = useState(value);
  useEffect(()=>{
    if(reduced){setDisplay(value);return;}
    const decimals=value.includes('.')?1:0;
    const animation=animate(0,Number(value),{duration:1.15,delay:.15,ease:[.22,1,.36,1],onUpdate:number=>setDisplay(number.toFixed(decimals).padStart(value.length,'0'))});
    return()=>animation.stop();
  },[value,reduced]);
  return <span className="at-count-value" aria-label={value}>{display}</span>;
}
