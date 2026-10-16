'use client';
import React, { ReactNode } from 'react';
import { motion, HTMLMotionProps, useReducedMotion } from 'framer-motion';
import { cn, playGlassChime } from '@/lib/utils';
import './workspace-button.css';
interface LiquidButtonProps extends Omit<HTMLMotionProps<'button'>,'children'>{children:ReactNode;variant?:'primary'|'glass'|'emerald'|'amber'|'danger'|'ghost';size?:'sm'|'md'|'lg';icon?:ReactNode;soundEffect?:'click'|'success'|'alert'|'timer';className?:string;}
export function LiquidButton({children,variant='glass',size='md',icon,soundEffect='click',className,onClick,disabled,...props}:LiquidButtonProps){const reduced=useReducedMotion();return <motion.button type="button" data-variant={variant} data-size={size} className={cn('workspace-button',className)} disabled={disabled} whileHover={disabled||reduced?undefined:{y:-1}} whileTap={disabled||reduced?undefined:{scale:.985}} transition={{duration:reduced?0:.16,ease:[.22,1,.36,1]}} onClick={event=>{if(disabled)return;playGlassChime(soundEffect);onClick?.(event);}} {...props}>{icon&&<span className="workspace-button-icon">{icon}</span>}<span className="workspace-button-label">{children}</span></motion.button>;}
