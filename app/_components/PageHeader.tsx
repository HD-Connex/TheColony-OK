"use client";

import React from "react";
import MotionReveal from "./motion/MotionReveal";

interface Props {
  eyebrow: string;
  title: string;
  lede?: React.ReactNode;
}

export default function PageHeader({ eyebrow, title, lede }: Props) {
  return (
    <MotionReveal>
      <header className="page-header">
        <p className="page-header__eyebrow">{eyebrow}</p>
        <h1 className="page-header__title">{title}</h1>
        {lede && <p className="page-header__lede">{lede}</p>}
      </header>
    </MotionReveal>
  );
}