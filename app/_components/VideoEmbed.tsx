import { toEmbedSrc, detectProvider } from "@/lib/video";

/** Responsive 16:9 third-party embed (YouTube/Rumble/Vimeo). Falls back to a
 *  link for non-embeddable URLs (e.g. an X post). Reuses the .live-player box. */
export default function VideoEmbed({ url, title }: { url: string; title?: string }) {
  const src = toEmbedSrc(url);
  if (!src) {
    return (
      <div className="live-player">
        <div className="live-player__offline">
          <span className="live-player__status">▼ WATCH ON {detectProvider(url).toUpperCase()}</span>
          <a className="btn btn--outline btn--sm" href={url} target="_blank" rel="noopener">Open Stream →</a>
        </div>
      </div>
    );
  }
  return (
    <div className="live-player">
      <iframe
        src={src}
        title={title ?? "Video"}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
