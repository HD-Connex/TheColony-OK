import React from 'react';

export default function SiteChrome({ header, footer, children }: { header?: React.ReactNode; footer?: React.ReactNode; children: React.ReactNode }) {
  return <>
    {header}
    <main>{children}</main>
    {footer}
  </>;
}
