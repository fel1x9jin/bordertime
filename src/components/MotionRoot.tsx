"use client";

import type { ReactNode } from "react";
import { LazyMotion, MotionConfig, domMax } from "motion/react";
import { EASE } from "./motion";

export default function MotionRoot({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.24, ease: EASE }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
