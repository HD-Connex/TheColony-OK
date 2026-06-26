import { toEmbedSrc, detectProvider } from "@/lib/video";

/** Responsive 16:9 third-party embed (YouTube/Rumble/Vimeo). Falls back to a
 *  link for non-embeddable URLs (e.g. an X post). Reuses the .live-player box. */
export default function VideoEmbed({
  url,
  title,
  bare = false,
}: {
  url: string;
  title?: string;
  /** Skip outer .live-player wrapper when parent already provides the box. */
  bare?: boolean;
}) {
  const src = toEmbedSrc(url);
  const offline = (
    <div className="live-player__offline">
      <span className="live-player__status">▼ WATCH ON {detectProvider(url).toUpperCase()}</span>
      <a className="btn btn--outline btn--sm" href={url} target="_blank" rel="noopener">
        Open Stream →
      </a>
    </div>
  );
  const iframe = (
    <iframe
      src={src!}
      title={title ?? "Video"}
      // bare = the primary above-the-fold stage (e.g. /live 24/7): load eagerly so
      // the main content isn't deferred. Non-bare embeds stay lazy.
      loading={bare ? "eager" : "lazy"}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      allowFullScreen
      sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
      referrerPolicy="no-referrer"
    />
  );

  if (!src) {
    return bare ? offline : <div className="live-player">{offline}</div>;
  }
  return bare ? iframe : <div className="live-player">{iframe}</div>;
}
