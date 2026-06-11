import FolioBar from "./FolioBar";

export default function SiteChrome({children, header, footer}: any) { return <>{header}<FolioBar />{children}{footer}</>; }